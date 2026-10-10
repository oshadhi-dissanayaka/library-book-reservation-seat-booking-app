import { API_BASE } from '@/lib/api';
import {
  AuthRole,
  AuthSession,
  AuthUser,
  loadAuthSession,
  saveAuthSession,
} from '@/lib/auth-session';

/**
 * Thin API layer for the authentication endpoints
 * (POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me, ...).
 * Every function throws `Error(message)` with the backend's user-facing
 * message so screens can display it directly.
 */

export type SignupInput = {
  institutionalId: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Extract<AuthRole, 'student' | 'academic_staff'>;
};

export type LoginInput = {
  institutionalId: string;
  password: string;
  role?: AuthRole;
};

export type ApprovedIdentity = {
  institutionalId: string;
  name: string;
  email: string;
  role: Extract<AuthRole, 'student' | 'academic_staff'>;
  active: boolean;
  registered: boolean;
};

type SessionResponse = {
  token: string;
  user: AuthUser;
  mustChangePassword?: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the library server. Check your network and API URL.');
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;
  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status}).`);
  }
  return payload as T;
}

function toSession(payload: SessionResponse): AuthSession {
  return {
    token: payload.token,
    user: payload.user,
    mustChangePassword: Boolean(payload.mustChangePassword),
  };
}

/** Self-signup for students + academic staff (validated server-side). */
export async function signUp(input: SignupInput): Promise<AuthSession> {
  const payload = await request<SessionResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const session = toSession(payload);
  await saveAuthSession(session);
  return session;
}

/** Institutional ID + password login for all four roles. */
export async function signIn(input: LoginInput): Promise<AuthSession> {
  const payload = await request<SessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const session = toSession(payload);
  await saveAuthSession(session);
  return session;
}

/** Revalidates the stored token and refreshes the cached session user. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const session = await loadAuthSession();
  if (!session) return null;
  try {
    const payload = await request<{ user: AuthUser }>('/auth/me', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const updated: AuthSession = { ...session, user: payload.user };
    await saveAuthSession(updated);
    return payload.user;
  } catch {
    return session.user;
  }
}

/** Approved-identity lookup used by the signup form (name/email auto-fill). */
export async function fetchApprovedIdentity(
  institutionalId: string
): Promise<ApprovedIdentity | null> {
  try {
    const payload = await request<{ identity: ApprovedIdentity }>(
      `/auth/identity/${encodeURIComponent(institutionalId)}`
    );
    return payload.identity;
  } catch (error) {
    if (error instanceof Error && /not recognized/i.test(error.message)) return null;
    throw error;
  }
}
