import { API_BASE } from "@/lib/api";

/**
 * Base URL for API requests, e.g. "http://192.168.1.5:5000/api".
 *
 * Management screens append their own section path (e.g.
 * `${API_BASE_URL}/management/dashboard`), matching the backend mount at
 * `/api/management` (see backend/server.js). Derived from the single shared
 * API configuration in `src/lib/api.ts`.
 */
export const API_BASE_URL = API_BASE;
