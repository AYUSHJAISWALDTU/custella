import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initI18n } from '@/i18n';

// The shell's own screens (offline, retry) are translated. The web app inside handles
// its own strings.
initI18n();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#12142B' } }}
      />
    </SafeAreaProvider>
  );
}
