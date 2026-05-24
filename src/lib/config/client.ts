// Typed HTTP client for all DJI Cloud API calls.
// Requests go directly from the browser to the DJI server (CORS is open on that server).
//
// Usage:
//   import { djiRequest } from '@/lib/config/client';
//   const devices = await djiRequest.get<DJIDevice[]>(DJI_URLS.devices.list(workspaceId));

import axios, { AxiosError } from 'axios';
import { getToken } from './token-store';

// DJI API response envelope — every endpoint wraps its payload in this shape
export interface DJIApiResponse<T> {
  code: number; // 0 = success, anything else = error
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

const DJI_BASE_URL = process.env.NEXT_PUBLIC_DJI_API_URL?.replace(/\/$/, '') ?? '';

/**
 * Core request function — attaches auth token, calls the DJI server directly, unwraps the envelope.
 *
 * On 401: silently refreshes the OmniWatch token (which reissues the DJI session token),
 * then replays the request once.
 *
 * @param method  - HTTP verb
 * @param path    - DJI API path (e.g. "/workspaces/:id/devices")
 * @param data    - Request body
 * @param retried - Internal flag: prevents infinite retry on 401
 */
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: unknown,
  retried = false
): Promise<T> {
  const token = getToken();

  const directUrl = `${DJI_BASE_URL}/${path.replace(/^\//, '')}`;

  try {
    const res = await axios.request<DJIApiResponse<T>>({
      method,
      url: directUrl,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-auth-token': token } : {}),
      },
    });

    const envelope = res.data;

    // DJI signals errors via code !== 0 even on HTTP 200
    if (envelope.code !== 0) {
      throw new DJIApiError(envelope.code ?? -1, envelope.message ?? 'Request failed');
    }

    return envelope.data as T;
  } catch (err) {
    // 401 → refresh OmniWatch token (reissues DJI session), then replay once.
    if (err instanceof AxiosError && err.response?.status === 401 && !retried) {
      try {
        const { authApi } = await import('@/services/authservice-layer/auth-api');
        await authApi.refreshToken();
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

/** Downloads a binary file (e.g. KMZ) from a DJI endpoint — bypasses the JSON envelope. */
async function requestBinary(path: string): Promise<ArrayBuffer> {
  const token = getToken();
  const directUrl = `${DJI_BASE_URL}/${path.replace(/^\//, '')}`;
  const res = await axios.get<ArrayBuffer>(directUrl, {
    responseType: 'arraybuffer',
    headers: { ...(token ? { 'x-auth-token': token } : {}) },
  });
  return res.data;
}

// Public API — four methods matching every HTTP verb the DJI server uses
export const djiRequest = {
  get: <T>(path: string) => request<T>('GET', path),

  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),

  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),

  delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),

  /** Fetches a binary resource (ArrayBuffer) — no DJI envelope unwrapping. */
  getBinary: (path: string) => requestBinary(path),
};
