import { Stack } from 'expo-router';

/**
 * Nested stack for the Reservation workflow.
 *
 * The root tabs navigator only registers the routes listed in app-tabs, so this
 * stack keeps the deeper routes reachable inside the "Reservations" tab:
 * /reservations/[id] (WF-14) and /reservations/[id]/confirmation (WF-12).
 */
export default function ReservationsLayout() {
  // The WF screens have their own headers/back buttons, so hide the native one.
  return <Stack screenOptions={{ headerShown: false }} />;
}
