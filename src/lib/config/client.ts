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
// data carries the raw envelope.data so callers can recover partial results (e.g. 513003 stream URL)
export class DJIApiError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'DJIApiError';
  }
}

const DJI_BASE_URL = process.env.NEXT_PUBLIC_DJI_API_URL?.replace(/\/$/, '') ?? '';

// DJI "soft-success" codes — the request succeeded and data is usable, but code !== 0.
// 513003: "stream already started" — the response still carries a valid WHEP URL in data.url.
const SOFT_SUCCESS_CODES = new Set([513003]);

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

    // DJI signals errors via code !== 0 even on HTTP 200.
    // Some codes are "soft-success" — the operation completed and data is valid.
    if (envelope.code !== 0 && !SOFT_SUCCESS_CODES.has(envelope.code)) {
      throw new DJIApiError(envelope.code ?? -1, envelope.message ?? 'Request failed', envelope.data);
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

/**
 * Core request function for FormData uploads — does NOT set Content-Type
 * so axios can automatically set `multipart/form-data` with the correct boundary.
 */
async function requestForm<T>(
  method: 'POST',
  path: string,
  formData: FormData,
  retried = false
): Promise<T> {
  const token = getToken();
  const directUrl = `${DJI_BASE_URL}/${path.replace(/^\//, '')}`;

  try {
    const res = await axios.request<DJIApiResponse<T>>({
      method,
      url: directUrl,
      data: formData,
      headers: {
        ...(token ? { 'x-auth-token': token } : {}),
      },
    });

    const envelope = res.data;

    if (envelope.code !== 0 && !SOFT_SUCCESS_CODES.has(envelope.code)) {
      throw new DJIApiError(envelope.code ?? -1, envelope.message ?? 'Request failed', envelope.data);
    }

    return envelope.data as T;
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 401 && !retried) {
      try {
        const { authApi } = await import('@/services/authservice-layer/auth-api');
        await authApi.refreshToken();
        return requestForm<T>(method, path, formData, true);
      } catch {
        throw new DJIApiError(401, 'Session expired. Please sign in again.');
      }
    }

    if (err instanceof DJIApiError) throw err;

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

  /** Posts FormData (multipart/form-data) — lets axios set the Content-Type boundary automatically. */
  postForm: <T>(path: string, formData: FormData) => requestForm<T>('POST', path, formData),

  /** Fetches a binary resource (ArrayBuffer) — no DJI envelope unwrapping. */
  getBinary: (path: string) => requestBinary(path),
};
