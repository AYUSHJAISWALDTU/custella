import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { INJECTED_JS } from '@/shell/injected';
import { Button, Screen, Text, colors, spacing } from '@/ui';

/**
 * The live app. The QR codes printed on a shop's cards encode this exact origin, so the
 * shell must load it rather than a bundled copy — a local copy would drift, and any card
 * it generated would point somewhere a customer's phone could not reach.
 */
const APP_URL = 'https://ayushjaiswaldtu.github.io/custella/';

/** Schemes the web app hands off to the phone rather than handling itself. */
const NATIVE_SCHEMES = ['tel:', 'mailto:', 'sms:', 'whatsapp:', 'intent:'];

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Hermes has no Buffer, and atob is not guaranteed, so decode base64 by hand. */
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array((clean.length * 3) >> 2);
  let acc = 0;
  let bits = 0;
  let p = 0;
  for (let i = 0; i < clean.length; i++) {
    acc = (acc << 6) | B64.indexOf(clean[i]!);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[p++] = (acc >> bits) & 0xff;
    }
  }
  return out.subarray(0, p);
}

export default function ShellScreen() {
  const ref = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const canGoBack = useRef(false);

  // Android's hardware back must move back through the app's own history. A shell that
  // exits to the home screen on the first back press is the clearest tell that something
  // is "just a website in a box".
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack.current) {
          ref.current?.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [])
  );

  /** Blob downloads arrive here as base64 because a WebView cannot save files itself. */
  const onMessage = useCallback(async (event: { nativeEvent: { data: string } }) => {
    let msg: { type?: string; name?: string; dataUrl?: string };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type !== 'download' || !msg.dataUrl) return;

    const name = (msg.name || 'custella.xlsx').replace(/[^\w.\-]/g, '_');
    try {
      const dir = new Directory(Paths.cache, 'exports');
      if (!dir.exists) dir.create({ intermediates: true });
      const file = new File(dir, name);
      file.create({ overwrite: true });
      // write() takes bytes, so the base64 payload is decoded rather than written as text —
      // writing it as a string would produce a corrupt .xlsx that Excel refuses to open.
      file.write(base64ToBytes(msg.dataUrl.slice(msg.dataUrl.indexOf(',') + 1)));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
    } catch {
      Alert.alert('Could not save the sheet', 'Please try the download again.');
    }
  }, []);

  /** Phone numbers, email and WhatsApp leave the WebView and open the real app. */
  const onShouldStart = useCallback((req: WebViewNavigation) => {
    const url = req.url || '';
    if (NATIVE_SCHEMES.some((s) => url.startsWith(s))) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  }, []);

  if (failed) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text variant="h2" center>
            Can&apos;t reach Custella
          </Text>
          <Text variant="body" color="textSecondary" center style={styles.body}>
            Your phone has no internet right now. Nothing has been lost — everything already
            saved is safe on the server.
          </Text>
          <Button
            label="Try again"
            size="primary"
            style={styles.retry}
            onPress={() => {
              setFailed(false);
              setLoading(true);
              ref.current?.reload();
            }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <WebView
        ref={ref}
        source={{ uri: APP_URL }}
        injectedJavaScript={INJECTED_JS}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStart}
        onNavigationStateChange={(nav) => {
          canGoBack.current = nav.canGoBack;
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
        onHttpError={({ nativeEvent }) => {
          // A 404 on the app shell means the deploy is broken; a 5xx usually means the
          // database is paused. Both deserve the native screen, not a white page.
          if (nativeEvent.statusCode >= 500 || nativeEvent.statusCode === 404) {
            setLoading(false);
            setFailed(true);
          }
        }}
        // The Excel export and the QR images need these.
        javaScriptEnabled
        domStorageEnabled
        // Keeps the sign-in session across app restarts.
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        pullToRefreshEnabled
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        style={styles.web}
      />
      {loading && (
        <View style={styles.splash} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#12142B' },
  web: { flex: 1, backgroundColor: '#12142B' },
  splash: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12142B',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  body: { marginTop: spacing.sm, maxWidth: 320 },
  retry: { marginTop: spacing.xl, alignSelf: 'stretch' },
});
