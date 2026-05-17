// OmniWatch Auth API — all requests go through the Next.js proxy at /api/auth
// which forwards to http://34.35.12.123:8002/api/v1/auth/<path>

import { setToken, clearToken, getToken } from '@/lib/config/token-store';

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
    const data = await request<AuthTokenResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, pin }),
    });
    setToken(data.access_token);
    return data;
  },

  // POST /api/v1/auth/logout
  logout: async (): Promise<void> => {
    try {
      await request<void>('/logout', { method: 'POST' });
    } finally {
      clearToken();
    }
  },

  // GET /api/v1/auth/me
  me: (): Promise<MeResponse> =>
    request<MeResponse>('/me', { method: 'GET' }),

  // POST /api/v1/auth/token/refresh
  refreshToken: async (): Promise<AuthTokenResponse> => {
    const data = await request<AuthTokenResponse>('/token/refresh', { method: 'POST' });
    setToken(data.access_token);
    return data;
  },
};

// Named export for the lazy import in client.ts 401 auto-retry
export async function refreshOmniWatchToken(): Promise<void> {
  await authApi.refreshToken();
}
