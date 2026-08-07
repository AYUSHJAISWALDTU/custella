import { Stack } from 'expo-router';

/**
 * Signed-in area. Phase 2 adds the session guard here: if there is no local session,
 * redirect to `(auth)/phone`. The guard reads local state only — an expired Supabase
 * token must never sign the user out, or the app would break offline. See DECISIONS.md.
 */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
