// Authentication functions for the DJI Cloud API.
// All requests go through the Next.js proxy at /api/dji/... — never directly to the DJI server.

import { DJI_CONFIG } from './config';
import { setToken, clearToken, getToken } from './token-store';
import type { LoginResponse, RefreshResponse } from '@/lib/types';

// LoginResponse and RefreshResponse are the canonical types from src/lib/types/auth.ts
// Do not redefine them here — import to keep a single source of truth
export type { LoginResponse, RefreshResponse };

/**
 * Authenticates against the DJI server and stores the returned JWT.
 * Throws a descriptive error on bad credentials or server failure.
 *
 * @param username - DJI workspace username
 * @param password - Plain-text password (sent over HTTPS only — never logged)
 */
export async function loginDJI(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`/api/dji${DJI_CONFIG.MANAGE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, flag: 0 }),
  });

  const json = await response.json();

  // DJI envelope: { code: 0, message: "success", data: { ... } }
  // Any code other than 0 is a failure — surface the server message to the UI
  if (json.code !== 0) {
    throw new Error(json.message ?? 'Login failed');
  }

  const data: LoginResponse = json.data;

  // Persist the token so every subsequent API request can attach it
  setToken(data.access_token, data.expires_in);

  return data;
}

/**
 * Exchanges the current JWT for a fresh one before it expires.
 * Called automatically by AuthProvider ~60 seconds before expiry.
 * On failure clears the token so the user is redirected to sign-in.
 */
export async function refreshDJIToken(): Promise<void> {
  const currentToken = getToken();

  const response = await fetch(`/api/dji${DJI_CONFIG.MANAGE}/token/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // The DJI server uses the current token to identify which session to refresh
      ...(currentToken ? { 'x-auth-token': currentToken } : {}),
    },
  });

  const json = await response.json();

  if (json.code !== 0) {
    clearToken(); // refresh failed — force the user back to sign-in
    throw new Error(json.message ?? 'Token refresh failed');
  }

  const data: RefreshResponse = json.data;
  setToken(data.access_token, data.expires_in);
}

/**
 * Signs the user out locally.
 * The DJI API has no server-side session invalidation — JWTs are stateless.
 * Clearing the token client-side is sufficient; it will expire server-side naturally.
 */
export function logoutDJI(): void {
  clearToken();
}
