import { Stack } from 'expo-router';

/**
 * Nested stack for the Reading Room workflow.
 *
 * The root tabs navigator only registers the routes listed in app-tabs, so this
 * stack keeps the deeper route /reading-rooms/[id]/seats (WF-10) reachable
 * inside the "Reading Rooms" tab.
 */
export default function ReadingRoomsLayout() {
  // The WF screens have their own headers/back buttons, so hide the native one.
  return <Stack screenOptions={{ headerShown: false }} />;
}
