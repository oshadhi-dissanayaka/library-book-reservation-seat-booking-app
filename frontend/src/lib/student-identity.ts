/**
 * Student / patron identity used by the Member 2 seat workflows
 * (WF-09 - WF-15) and every screen that queries reservations.
 *
 * Since authentication landed, the signed-in user's institutional id is the
 * source of truth (src/lib/auth-session.ts): `currentStudentId()` returns it
 * synchronously from the in-memory session cache.
 *
 * The legacy shared development identity (EXPO_PUBLIC_STUDENT_ID / the
 * backend's "demo-student") is kept ONLY as a signed-out fallback so any
 * reservation data created before authentication still resolves somewhere.
 */
import { getCurrentUser } from '@/lib/auth-session';
import Constants from 'expo-constants';

const configuredStudentId = (process.env.EXPO_PUBLIC_STUDENT_ID || '')
  .trim();

/** Signed-out fallback id (legacy shared development identity). */
export const CURRENT_STUDENT_ID: string =
  configuredStudentId !== '' ? configuredStudentId : 'demo-student';

/**
 * The id stamped on every seat reservation this app creates and the id every
 * "my reservations" query is scoped to. Prefers the authenticated user.
 */
export function currentStudentId(): string {
  const user = getCurrentUser();
  return user?.institutionalId ? user.institutionalId : CURRENT_STUDENT_ID;
}

/** Same value as a function, for call sites that prefer an accessor. */
export function getCurrentStudentId(): string {
  return currentStudentId();
}

/**
 * Query-string fragment used by the Member 2 screens so every list request
 * is scoped to this student, e.g. `?studentId=IT23846586&status=active`.
 */
export function studentIdQuery(): string {
  return `studentId=${encodeURIComponent(currentStudentId())}`;
}

// Referenced so the Expo config plugin keeps the constant reachable in dev.
export const STUDENT_ID_SOURCE = Constants.expoConfig?.extra
  ? 'expo-extra'
  : 'env-or-default';
