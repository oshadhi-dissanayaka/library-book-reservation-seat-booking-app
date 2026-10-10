import AsyncStorage from '@react-native-async-storage/async-storage';

import { CURRENT_STUDENT_ID } from '@/lib/student-identity';

/**
 * Lightweight student/academic-staff portal session (assignment-safe dev
 * identity — there is no real authentication backend in this milestone).
 *
 * The `id` is ALWAYS the shared development identity from
 * src/lib/student-identity.ts so every Member 2 screen (WF-09–WF-15)
 * keeps working unchanged. `role` only affects the greeting/labels — it
 * never sends Academic Staff to the Library Staff (/staff) interface.
 *
 * Keys (AsyncStorage):
 *   libconnect_onboarding_complete = "true"  — onboarding was seen
 *   libconnect_portal_session      = {"id","displayName","role"}
 */

const ONBOARDING_KEY = 'libconnect_onboarding_complete';
const SESSION_KEY = 'libconnect_portal_session';

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

/** Dev helper — clears the onboarding flag (see the splash screen's dev tap). */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // Ignore storage failures during a dev reset.
  }
}

/**
 * Reads the saved portal session. Returns `null` for a MISSING, CORRUPT, or
 * malformed value so the launch flow safely falls back to /portal. A session
 * only counts as valid when it holds a non-empty string `id` and
 * `displayName`; an unknown `role` is coerced to 'student'.
 */
export async function getPortalSession(): Promise<PortalSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null; // corrupt / non-JSON payload -> /portal
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const record = parsed as Record<string, unknown>;
    if (typeof record.id !== 'string' || record.id.length === 0) return null;
    if (typeof record.displayName !== 'string' || record.displayName.length === 0) return null;

    return {
      id: record.id,
      displayName: record.displayName,
      role: record.role === 'academic_staff' ? 'academic_staff' : 'student',
    };
  } catch {
    return null; // storage read failure -> /portal
  }
}

export async function savePortalSession(session: PortalSession): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // The session simply won't persist; the user can sign in again.
  }
}

export async function clearPortalSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage failures on sign-out.
  }
}

/**
 * The backend patron/student id stamped on seat reservations. Both portal
 * roles share the ONE configured dev identity so WF-09–WF-15 (which query
 * by CURRENT_STUDENT_ID) always see the reservations made from Home.
 */
export function portalBackendId(): string {
  return CURRENT_STUDENT_ID;
}
