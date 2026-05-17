// Typed HTTP client for all DJI Cloud API calls.
// All requests go through the Next.js proxy at /api/dji/... — never directly to the DJI server.
//
// Usage:
//   import { djiRequest } from '@/lib/dji/client';
//   const devices = await djiRequest.get<DJIDevice[]>(DJI_URLS.devices.list(workspaceId));

import axios, { AxiosError } from 'axios';
import { getToken } from './token-store';

// DJI API response envelope — every endpoint wraps its payload in this shape
export interface DJIApiResponse<T> {
  code: number;    // 0 = success, anything else = error
  message: string;
  data?: T;
}

// Typed error so callers can branch on error.code (401 → re-login, 502 → offline, etc.)
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
 * Core request function — attaches auth token, routes through the proxy, unwraps the DJI envelope.
 *
 * @param method  - HTTP verb
 * @param path    - DJI API path (no base URL — proxy adds `/api/dji/` prefix automatically)
 * @param data    - Request body (axios serialises to JSON automatically)
 * @param retried - Internal flag: prevents infinite retry loops on 401
 */
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: unknown,
  retried = false
): Promise<T> {
  const token = getToken();

  // All DJI paths are forwarded through the Next.js proxy — strip any leading slash first
  const proxyPath = `/api/dji/${path.replace(/^\//, '')}`;

  try {
    const res = await axios.request<DJIApiResponse<T>>({
      method,
      url: proxyPath,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-auth-token': token } : {}),
      },
    });

    const envelope = res.data;

    // DJI signals errors via code !== 0 even on HTTP 200
    if (envelope.code !== 0) {
      throw new DJIApiError(envelope.code, envelope.message ?? 'Request failed');
    }

    return envelope.data as T;
  } catch (err) {
    // 401 → silent token refresh, then replay once
    if (err instanceof AxiosError && err.response?.status === 401 && !retried) {
      try {
        const { refreshOmniWatchToken } = await import('@/lib/dji/auth-api');
        await refreshOmniWatchToken();
        return request<T>(method, path, data, true);
      } catch {
        throw new DJIApiError(401, 'Session expired. Please sign in again.');
      }
    }

    // Re-throw DJIApiError as-is (from the envelope check above)
    if (err instanceof DJIApiError) throw err;

    // Surface axios HTTP errors with a clean message
    if (err instanceof AxiosError && err.response) {
      throw new DJIApiError(err.response.status, err.message);
    }

    throw err;
  }
}

// Public API — four methods matching every HTTP verb the DJI server uses
export const djiRequest = {
  get: <T>(path: string) =>
    request<T>('GET', path),

  post: <T>(path: string, body?: unknown) =>
    request<T>('POST', path, body ?? {}),

  put: <T>(path: string, body?: unknown) =>
    request<T>('PUT', path, body ?? {}),

  delete: <T>(path: string, body?: unknown) =>
    request<T>('DELETE', path, body),
};
