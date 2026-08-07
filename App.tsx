import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const CUSTELLA_URL = 'https://ayushjaiswaldtu.github.io/custella/';

export default function App() {
  const webView = useRef<WebView>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#12142B" />
      <WebView
        ref={webView}
        source={{ uri: CUSTELLA_URL }}
        style={styles.webView}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.centered}>
            <ActivityIndicator color="#5A3FC0" size="large" />
            <Text style={styles.loadingText}>Loading Custella…</Text>
          </View>
        )}
        renderError={(_domain, _code, description) => (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Could not open Custella</Text>
            <Text style={styles.errorText}>{description}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => webView.current?.reload()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}
        onShouldStartLoadWithRequest={(request) => {
          if (request.url.startsWith('tel:') || request.url.startsWith('mailto:')) {
            void Linking.openURL(request.url);
            return false;
          }

          return true;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12142B',
  },
  webView: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  centered: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#F2F4F8',
  },
  loadingText: {
    marginTop: 14,
    color: '#6B7288',
    fontSize: 15,
  },
  errorTitle: {
    color: '#12142B',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#6B7288',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 46,
    marginTop: 20,
    paddingHorizontal: 22,
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#5A3FC0',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
