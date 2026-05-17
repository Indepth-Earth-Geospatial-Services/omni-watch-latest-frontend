// OmniWatch Auth API — all requests go through the Next.js proxy at /api/auth
// which forwards to http://34.35.12.123:8002/api/v1/auth/<path>

import { setToken, clearToken, getToken } from '@/lib/dji/token-store';

// ─── Response shapes (from Swagger) ──────────────────────────────────────────

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
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
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(String(body.detail ?? `Auth request failed: ${res.status}`));
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
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

  // POST /api/v1/auth/logout — revokes the HttpOnly refresh token cookie
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

  // POST /api/v1/auth/token/refresh — browser sends HttpOnly cookie automatically
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
