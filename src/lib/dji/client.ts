// Typed HTTP client for all DJI Cloud API calls.
// All requests go through the Next.js proxy at /api/dji/... — never directly to the DJI server.
//
// Usage:
//   import { djiRequest } from '@/lib/dji/client';
//   const devices = await djiRequest.get<DJIDevice[]>(`${DJI_CONFIG.MANAGE}/devices/...`);

import { getToken } from './token-store';

// DJI API response envelope — every endpoint returns this shape
export interface DJIApiResponse<T> {
  code: number; // 0 = success, anything else = error
  message: string;
  data?: T;
}

// Typed error so callers can check error.code for specific handling (401 → login, 502 → offline)
export class DJIApiError extends Error {
  constructor(
    public readonly code: number,
    message: string
  ) {
    super(message);
    this.name = 'DJIApiError';
  }
}

/**
 * Core request function — attaches JWT, calls the proxy, unwraps the DJI envelope.
 * @param path    - DJI API path, e.g. "/manage/api/v1/login" (no base URL — proxy adds it)
 * @param options - Standard fetch RequestInit (method, body, extra headers)
 * @param retried - Internal flag: true = already attempted one token refresh, do not retry again
 */
async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Only attach the auth header when a valid token exists
    ...(token ? { 'x-auth-token': token } : {}),
    // Caller-supplied headers (e.g. custom Content-Type for file uploads) take precedence
    ...((options.headers as Record<string, string>) ?? {}),
  };

  // All DJI paths are forwarded through the proxy — strip any leading slash first
  const proxyPath = `/api/dji/${path.replace(/^\//, '')}`;

  const response = await fetch(proxyPath, { ...options, headers });

  // 401 → try a silent token refresh once, then replay the original request
  if (response.status === 401 && !retried) {
    try {
      const { refreshOmniWatchToken } = await import('@/lib/dji/auth-api');
      await refreshOmniWatchToken();
      return request<T>(path, options, true); // retried = true — will not retry again
    } catch {
      throw new DJIApiError(401, 'Session expired. Please sign in again.');
    }
  }

  // Parse the DJI response envelope
  const json: DJIApiResponse<T> = await response.json();

  if (json.code !== 0) {
    throw new DJIApiError(json.code, json.message ?? 'Request failed');
  }

  return json.data as T;
}

// Public API — four methods matching every HTTP verb the DJI server uses
export const djiRequest = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body ?? {}),
    }),

  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'DELETE',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
};
