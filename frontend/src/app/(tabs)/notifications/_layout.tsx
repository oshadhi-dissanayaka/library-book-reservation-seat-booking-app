import { Stack } from 'expo-router';

/**
 * Nested stack for the Notifications route inside the tabs navigator.
 *
 * Keeps `notifications` a proper child route of (tabs) so the
 * `Tabs.Screen name="notifications"` declaration in app-tabs resolves.
 */
export default function NotificationsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
