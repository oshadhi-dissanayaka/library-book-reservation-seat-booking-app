/**
 * Centralized student identity for the Member 2 seat workflows (WF-09–WF-15).
 *
 * Milestone 03 has no student authentication, so every seat reservation is
 * owned by ONE development identity. This module is the single source of
 * truth — no screen or controller hardcodes an id any more.
 *
 * Override without editing code (frontend/.env):
 *   EXPO_PUBLIC_STUDENT_ID=IT20240001
 *
 * The default keeps the existing backend/demo value ("demo-student") so
 * reservations created before this module existed stay visible in
 * My Reservations and Notifications.
 */
import Constants from "expo-constants";

const configuredStudentId = (process.env.EXPO_PUBLIC_STUDENT_ID || "")
  .trim();

/** The id stamped on every seat reservation this app creates. */
export const CURRENT_STUDENT_ID: string =
  configuredStudentId !== "" ? configuredStudentId : "demo-student";

/** Same value as a function, for call sites that prefer an accessor. */
export function getCurrentStudentId(): string {
  return CURRENT_STUDENT_ID;
}

/**
 * Query-string fragment used by the Member 2 screens so every list request
 * is scoped to this student, e.g. `?studentId=demo-student&status=active`.
 */
export function studentIdQuery(): string {
  return `studentId=${encodeURIComponent(CURRENT_STUDENT_ID)}`;
}

// Referenced so the Expo config plugin keeps the constant reachable in dev.
export const STUDENT_ID_SOURCE = Constants.expoConfig?.extra
  ? "expo-extra"
  : "env-or-default";
