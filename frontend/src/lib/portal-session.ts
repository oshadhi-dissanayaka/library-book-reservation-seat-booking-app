import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearAuthSession,
  loadAuthSession,
} from '@/lib/auth-session';
import { currentStudentId } from '@/lib/student-identity';

/**
 * Portal session adapter.
 *
 * Authentication itself now lives in src/lib/auth-session.ts (JWT + user from
 * the backend). This module keeps the pre-existing API used by the Home screen
 * and the splash/onboarding flow so no Member 1-4 screen had to change shape:
 *
 *   getPortalSession()    -> the signed-in student/academic-staff identity
 *   clearPortalSession()  -> sign out (clears the auth session)
 *   portalBackendId()     -> the patron/student id stamped on reservations
 *                            (authenticated institutional id when signed in,
 *                             else the legacy shared dev identity)
 *
 * Onboarding flags (libconnect_onboarding_complete) still live here.
 */

const ONBOARDING_KEY = 'libconnect_onboarding_complete';

export type PortalRole = 'student' | 'academic_staff';

export type PortalSession = {
  id: string;
  displayName: string;
  role: PortalRole;
};

/** True once the user finished the onboarding screens. */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    // A failed write only means onboarding shows again next launch.
  }
}

/** Dev helper - clears the onboarding flag (see the splash screen's dev tap). */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // Ignore storage failures during a dev reset.
  }
}

/**
 * The signed-in student/academic-staff session, or null when nobody is signed
 * in (or a privileged staff/management session is active instead).
 */
export async function getPortalSession(): Promise<PortalSession | null> {
  const session = await loadAuthSession();
  if (!session) return null;
  const { user } = session;
  if (user.role !== 'student' && user.role !== 'academic_staff') return null;
  if (!user.institutionalId) return null;
  return {
    id: user.institutionalId,
    displayName: user.name || user.institutionalId,
    role: user.role,
  };
}

/** Sign out - clears the stored auth session (token + user). */
export async function clearPortalSession(): Promise<void> {
  await clearAuthSession();
}

/**
 * The backend patron/student id stamped on reservations. The authenticated
 * institutional id is used whenever a user is signed in, so seat and book
 * reservations always belong to the signed-in student/academic staff member.
 * Falls back to the legacy shared dev identity only when signed out.
 */
export function portalBackendId(): string {
  return currentStudentId();
}
