# Removing DJI API Proxy — Migration Guide

This document outlines how to remove the temporary DJI API proxy when your backend team implements HTTPS/WSS support.

## Overview

The proxy was implemented as a **temporary solution** to fix Mixed Content errors on HTTPS deployments (Vercel). Once the backend supports HTTPS/WSS, these changes should be reverted.

---

## Step 1: Environment Variables

### Update `.env`

**Remove or set to `false`:**
```env
# BEFORE (current)
NEXT_PUBLIC_USE_DJI_PROXY=true

# AFTER (after backend implements HTTPS)
NEXT_PUBLIC_USE_DJI_PROXY=false
```

Or simply delete the line entirely since the default is `false`.

---

## Step 2: Delete the Proxy File

**Delete this entire file and folder:**
```
src/app/api/dji/[...path]/route.ts
```

This file contains the HTTP proxy that routes requests through Next.js server-side.

### Command to delete:
```bash
rm -r src/app/api/dji
```

---

## Step 3: Revert `src/lib/config/client.ts`

### Replace the following code:

**CURRENT CODE (lines 1-36):**
```typescript
// Typed HTTP client for all DJI Cloud API calls.
//
// HTTPS deployments (Vercel) use /api/dji proxy to avoid Mixed Content errors.
// Localhost development uses direct backend connection (CORS is open).
//
// To disable the proxy when backend implements HTTPS:
//   1. Set NEXT_PUBLIC_USE_DJI_PROXY=false in .env
//   2. Delete src/app/api/dji/[...path]/route.ts
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

// Detect if we should use the proxy (on HTTPS, unless explicitly disabled)
const isSecureDeployment = typeof window !== 'undefined' && window.location.protocol === 'https:';
const useProxy = process.env.NEXT_PUBLIC_USE_DJI_PROXY !== 'false';
const DJI_BASE_URL = isSecureDeployment && useProxy 
  ? '/api/dji'
  : process.env.NEXT_PUBLIC_DJI_API_URL?.replace(/\/$/, '') ?? '';
```

**REPLACE WITH:**
```typescript
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
```

---

## Step 4: Revert `src/lib/config/config.ts`

### Replace the following code:

**CURRENT CODE (lines 1-20):**
```typescript
// Single source of truth for all OmniWatch & DJI Cloud configuration.
// No other file should call process.env directly for these variables.

// Helper to convert HTTP URL to WS/WSS URL
const toWsUrl = (url: string) => {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  return url.replace(/^https?/, isSecure ? 'wss' : 'ws');
};

const OMNIWATCH_API_URL = process.env.NEXT_PUBLIC_OMNIWATCH_API_URL ?? 'http://34.35.12.123:8000';
const DJI_API_URL = process.env.NEXT_PUBLIC_DJI_API_URL ?? 'http://35.222.89.171:6789';

export const DJI_CONFIG = {
  // DJI Cloud API Base
  BASE_URL: DJI_API_URL,

  // OmniWatch API Base (REST)
  OMNIWATCH_API_URL,

  // WebSocket Endpoint
  // On HTTPS deployments: converts to wss:// (requires backend to support WSS or add WSS proxy)
  // On HTTP deployments: converts to ws://
  WS_URL: `${toWsUrl(DJI_API_URL)}/api/v1/ws`,
```

**REPLACE WITH:**
```typescript
// Single source of truth for all OmniWatch & DJI Cloud configuration.
// No other file should call process.env directly for these variables.

// Helper to convert an HTTP URL to a WS URL
const toWsUrl = (url: string) => url.replace(/^http/, 'ws');

const OMNIWATCH_API_URL = process.env.NEXT_PUBLIC_OMNIWATCH_API_URL ?? 'http://34.35.12.123:8000';
const DJI_API_URL = process.env.NEXT_PUBLIC_DJI_API_URL ?? 'http://35.222.89.171:6789';

export const DJI_CONFIG = {
  // DJI Cloud API Base
  BASE_URL: DJI_API_URL,

  // OmniWatch API Base (REST)
  OMNIWATCH_API_URL,

  // OmniWatch WebSocket Endpoint (Unified endpoint derived strictly from docs)
  WS_URL: `${toWsUrl(DJI_API_URL)}/api/v1/ws`,
```

### Also remove this line from the config object (around line 40):

**REMOVE:**
```typescript
  // TEMPORARY: Use /api/dji HTTP proxy on HTTPS deployments
  // When backend implements HTTPS, set NEXT_PUBLIC_USE_DJI_PROXY=false
  USE_DJI_PROXY: process.env.NEXT_PUBLIC_USE_DJI_PROXY !== 'false',
```

---

## Step 5: Verify Backend URLs

Once the backend implements HTTPS/WSS, ensure your environment variables point to the secure endpoints:

### Update `.env` for production:

```env
# BEFORE (HTTP backend)
NEXT_PUBLIC_DJI_API_URL=http://35.222.89.171:6789
NEXT_PUBLIC_TELEMETRY_SOCKET_URL=http://35.222.89.171:6789

# AFTER (HTTPS/WSS backend)
NEXT_PUBLIC_DJI_API_URL=https://35.222.89.171:6789
NEXT_PUBLIC_TELEMETRY_SOCKET_URL=https://35.222.89.171:6789
```

---

## Step 6: Test the Changes

1. **Build the application:**
   ```bash
   pnpm build
   ```

2. **Run development server:**
   ```bash
   pnpm dev
   ```

3. **Test on Vercel:**
   - Push changes to your branch
   - Vercel will auto-deploy
   - Open DevTools → Console
   - Verify no Mixed Content errors

---

## Checklist

- [ ] Set `NEXT_PUBLIC_USE_DJI_PROXY=false` in `.env`
- [ ] Delete `src/app/api/dji/[...path]/route.ts`
- [ ] Revert `src/lib/config/client.ts` to use direct DJI_BASE_URL
- [ ] Revert `src/lib/config/config.ts` to use simple `toWsUrl` converter
- [ ] Update backend URLs to HTTPS/WSS in `.env`
- [ ] Run `pnpm build` and verify no errors
- [ ] Test on local dev server
- [ ] Deploy to Vercel and verify no Mixed Content errors

---

## Files Modified

This guide covers reverting changes made to:
- `.env`
- `src/lib/config/client.ts`
- `src/lib/config/config.ts`
- `src/app/api/dji/[...path]/route.ts` (entire file to delete)

---

## Need Help?

If you encounter any issues after removing the proxy:
1. Check browser console for CORS or connection errors
2. Verify the backend is accessible at the new HTTPS/WSS URLs
3. Ensure auth tokens are being transmitted correctly
4. Check that WebSocket connections are using `wss://` protocol

