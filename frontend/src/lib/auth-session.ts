import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Single session helper for the whole app (token + user).
 *
 * Shape persisted in AsyncStorage (key `libconnect_auth_session`):
 *   { token, user: { institutionalId, name, email, role }, mustChangePassword? }
 *
 * - No password (or password hash) is ever persisted.
 * - An in-memory cache keeps `getCurrentUser()` usable synchronously from
 *   screens/helpers (seat/book reservations need the patron id during render),
 *   while `loadAuthSession()` warms the cache from storage (splash screen).
 */

export type AuthRole = 'student' | 'academic_staff' | 'library_staff' | 'management';

export type AuthUser = {
  institutionalId: string;
  name: string;
  email: string;
  role: AuthRole;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  mustChangePassword?: boolean;
};

/** Route each role lands on after login / app relaunch. */
export type AuthHomeRoute = '/home' | '/staff' | '/management/library-overview';

const SESSION_KEY = 'libconnect_auth_session';

const AUTH_ROLES: AuthRole[] = ['student', 'academic_staff', 'library_staff', 'management'];

// `undefined` = not read from storage yet, `null` = no valid session.
let cachedSession: AuthSession | null | undefined;

function parseSession(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    const token = record.token;
    const user = record.user as Record<string, unknown> | undefined;
    if (typeof token !== 'string' || token.length === 0) return null;
    if (!user || typeof user !== 'object') return null;
    if (typeof user.institutionalId !== 'string' || user.institutionalId.length === 0) return null;
    if (typeof user.name !== 'string') return null;
    if (typeof user.email !== 'string') return null;
    const role = user.role as AuthRole;
    if (!AUTH_ROLES.includes(role)) return null;
    return {
      token,
      user: {
        institutionalId: user.institutionalId,
        name: user.name,
        email: user.email,
        role,
      },
      mustChangePassword: Boolean(record.mustChangePassword),
    };
  } catch {
    return null; // corrupt payload -> treated as signed out
  }
}

/** Reads (and caches) the persisted session. Safe to call many times. */
export async function loadAuthSession(): Promise<AuthSession | null> {
  if (cachedSession !== undefined) return cachedSession;
  try {
    cachedSession = parseSession(await AsyncStorage.getItem(SESSION_KEY));
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

/** Synchronous cached session - `null` until `loadAuthSession()` has run. */
export function getAuthSession(): AuthSession | null {
  return cachedSession ?? null;
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  cachedSession = session;
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // The session simply will not persist; the user can sign in again.
  }
}

export async function clearAuthSession(): Promise<void> {
  cachedSession = null;
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage failures on sign-out.
  }
}

export function getAuthToken(): string | null {
  return cachedSession?.token ?? null;
}

export function getCurrentUser(): AuthUser | null {
  return cachedSession?.user ?? null;
}

export function isAuthenticated(): boolean {
  return Boolean(cachedSession);
}

/** Role -> destination route (login success and app relaunch both use this). */
export function homeRouteForRole(role: AuthRole): AuthHomeRoute {
  switch (role) {
    case 'library_staff':
      return '/staff';
    case 'management':
      return '/management/library-overview';
    case 'academic_staff':
    case 'student':
    default:
      return '/home';
  }
}

/** Authorization headers for protected calls (management/staff endpoints). */
export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
