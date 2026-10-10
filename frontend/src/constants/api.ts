import { API_BASE } from "@/lib/api";

/**
 * Base URL for the management (university management) API section.
 *
 * The backend mounts management routes at `/api/management`
 * (see backend/server.js), and management screens append their own
 * paths (e.g. `${API_BASE_URL}/dashboard`).
 *
 * Derived from the single shared API configuration in `src/lib/api.ts`.
 */
export const API_BASE_URL = `${API_BASE}/management`;
