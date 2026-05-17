// Auth API for the OmniWatch Auth Backend.
// Uses the local Next.js proxy at /api/auth to avoid browser CORS restrictions.

const AUTH_BASE = '/api/auth';

export interface LoginData {
  username: string;
  user_id: string;
  workspace_id: string;
  user_type: number;
  mqtt_username: string;
  mqtt_password: string;
  access_token: string;
  mqtt_addr: string;
}

export interface AuthLoginResponse {
  code: number;
  message: string;
  data: LoginData;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Auth request failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const authApi = {
  login: (email: string, pin: string) =>
    post<AuthLoginResponse>('/login', { email, pin }),

  refreshToken: () =>
    post<{ access_token: string }>('/token/refresh'),
};
