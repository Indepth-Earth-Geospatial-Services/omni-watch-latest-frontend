// OmniWatch Auth API — all requests go through the Next.js proxy at /api/auth
// which forwards to http://34.35.12.123:8002/api/v1/auth/<path>

import axios, { AxiosError } from 'axios';
import { setToken, clearToken, getToken } from '@/lib/config/token-store';

// Decode the `exp` claim from a JWT and return seconds until expiry.
// No signature verification — we only need the lifetime for scheduling.
function jwtExpiresIn(token: string): number | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return undefined;
    const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
    return Math.max(secondsLeft, 0);
  } catch {
    return undefined;
  }
}

// ─── Response shapes ──────────────────────────────────────────────────────────

// Every OmniWatch endpoint wraps its payload in this envelope — code 0 = success.
interface OmniWatchEnvelope<T> {
  code: number;
  message: string;
  data?: T;
}

// Actual fields returned by POST /api/v1/auth/login (matches server response exactly)
export interface AuthTokenResponse {
  username: string;
  user_id: string;
  workspace_id: string;
  user_type: number;
  mqtt_username: string;
  mqtt_password: string;
  access_token: string;
  role: string;
}

export interface MeResponse {
  principal_id: string;
  principal_type: string;
  org_id: string;
  workspace_id: string;
}

// ─── Internal axios wrapper (aligned with auth-service.ts pattern) ────────────

const PROXY = '/api/auth';

/**
 * Shared axios wrapper for all auth endpoints.
 *
 * Previously used native `fetch` — migrated to axios so every HTTP call in the
 * app uses the same client, same error handling, and same JSON parsing logic.
 *
 * @param method - HTTP verb
 * @param path   - Auth API path (e.g. "/login", "/me", "/token/refresh")
 * @param data   - Request body (axios serialises to JSON automatically)
 */
async function request<T>(method: 'GET' | 'POST', path: string, data?: unknown): Promise<T> {
  const token = getToken();

  try {
    const res = await axios.request<OmniWatchEnvelope<T>>({
      method,
      url: `${PROXY}${path}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const envelope = res.data;

    // OmniWatch signals errors via code !== 0 even on HTTP 200
    if (envelope.code !== 0) {
      const detail = (envelope.data as Record<string, unknown> | undefined)?.detail;
      throw new Error(String(detail ?? envelope.message ?? `Auth request failed: ${res.status}`));
    }

    return envelope.data as T;
  } catch (err) {
    // Re-throw our own envelope errors as-is
    if (err instanceof Error && !(err instanceof AxiosError)) throw err;

    // Surface axios HTTP errors (4xx/5xx) with the server's detail message
    if (err instanceof AxiosError && err.response) {
      const envelope = err.response.data as OmniWatchEnvelope<unknown> | undefined;
      const detail = (envelope?.data as Record<string, unknown> | undefined)?.detail;
      throw new Error(
        String(detail ?? envelope?.message ?? `Auth request failed: ${err.response.status}`)
      );
    }

    throw err;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const authApi = {
  // POST /api/v1/auth/login
  login: async (email: string, pin: string): Promise<AuthTokenResponse> => {
    console.log('[auth] login → POST /api/auth/login', { email });
    const data = await request<AuthTokenResponse>('POST', '/login', { email, pin });
    console.log('[auth] login ✓ — access_token received, workspace_id:', data.workspace_id);
    const expiresIn = jwtExpiresIn(data.access_token);
    setToken(data.access_token, expiresIn);
    return data;
  },

  // POST /api/v1/auth/logout
  logout: async (): Promise<void> => {
    try {
      await request<void>('POST', '/logout');
    } finally {
      clearToken();
    }
  },

  // GET /api/v1/auth/me
  me: async (): Promise<MeResponse> => {
    console.log('[auth] me → GET /api/auth/me');
    const data = await request<MeResponse>('GET', '/me');
    console.log('[auth] me ✓ —', data);
    return data;
  },

  // POST /api/v1/auth/token/refresh
  refreshToken: async (): Promise<AuthTokenResponse> => {
    console.log('[auth] refreshToken → POST /api/auth/token/refresh');
    const data = await request<AuthTokenResponse>('POST', '/token/refresh');
    const expiresIn = jwtExpiresIn(data.access_token);
    setToken(data.access_token, expiresIn);
    return data;
  },
};

// Named export for the lazy import in client.ts 401 auto-retry
export async function refreshOmniWatchToken(): Promise<void> {
  await authApi.refreshToken();
}
