// OmniWatch Auth API — all requests go through the Next.js proxy at /api/auth
// which forwards to http://34.35.12.123:8002/api/v1/auth/<path>

import { setToken, clearToken, getToken } from '@/lib/config/token-store';

// Decode the `exp` claim from a JWT and return seconds until expiry.
// No signature verification — we only need the lifetime for scheduling.
function jwtExpiresIn(token: string): number | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return undefined;
    const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
    console.log(`[auth] JWT expires in ${secondsLeft}s (exp: ${new Date(payload.exp * 1000).toISOString()})`);
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
}

export interface MeResponse {
  principal_id: string;
  principal_type: string;
  org_id: string;
  workspace_id: string;
}

// ─── Internal fetch wrapper ───────────────────────────────────────────────────

const PROXY = '/api/auth';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${PROXY}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  // Parse the OmniWatch envelope — server always returns JSON even on errors
  const envelope: OmniWatchEnvelope<T> = await res.json().catch(() => ({
    code: res.status,
    message: res.statusText,
    data: undefined,
  }));

  if (envelope.code !== 0) {
    const detail = (envelope.data as Record<string, unknown> | undefined)?.detail;
    throw new Error(String(detail ?? envelope.message ?? `Auth request failed: ${res.status}`));
  }

  return envelope.data as T;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const authApi = {
  // POST /api/v1/auth/login
  login: async (email: string, pin: string): Promise<AuthTokenResponse> => {
    console.log('[auth] login → POST /api/auth/login', { email });
    const data = await request<AuthTokenResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, pin }),
    });
    console.log('[auth] login ✓ — access_token received, workspace_id:', data.workspace_id);
    const expiresIn = jwtExpiresIn(data.access_token);
    setToken(data.access_token, expiresIn);
    console.log('[auth] access_token stored in localStorage (key: dji_auth_token)');
    return data;
  },

  // POST /api/v1/auth/logout
  logout: async (): Promise<void> => {
    console.log('[auth] logout → POST /api/auth/logout');
    try {
      await request<void>('/logout', { method: 'POST' });
    } finally {
      clearToken();
      console.log('[auth] logout ✓ — token cleared');
    }
  },

  // GET /api/v1/auth/me
  me: async (): Promise<MeResponse> => {
    console.log('[auth] me → GET /api/auth/me');
    const data = await request<MeResponse>('/me', { method: 'GET' });
    console.log('[auth] me ✓ —', data);
    return data;
  },

  // POST /api/v1/auth/token/refresh
  refreshToken: async (): Promise<AuthTokenResponse> => {
    console.log('[auth] refreshToken → POST /api/auth/token/refresh');
    const data = await request<AuthTokenResponse>('/token/refresh', { method: 'POST' });
    const expiresIn = jwtExpiresIn(data.access_token);
    setToken(data.access_token, expiresIn);
    console.log('[auth] refreshToken ✓ — new access_token stored');
    return data;
  },
};

// Named export for the lazy import in client.ts 401 auto-retry
export async function refreshOmniWatchToken(): Promise<void> {
  await authApi.refreshToken();
}
