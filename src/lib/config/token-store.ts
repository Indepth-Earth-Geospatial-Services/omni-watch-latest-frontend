// JWT token storage with two-layer persistence:
//   - localStorage  → holds the real token + expiry, read by client.ts for API requests
//   - Cookie signal → holds "true" so Next.js middleware can check auth state on the Edge
//
// 🛡️ Security Analyst Note:
// While this two-layer approach is functional, storing the raw JWT in localStorage
// makes it accessible to any XSS vulnerabilities. A more secure, best-practice approach
// would be to store the token exclusively in an HttpOnly, Secure, SameSite=Strict cookie
// and have your Next.js API proxy automatically attach it to DJI requests, preventing
// client-side JavaScript from ever accessing the raw token.

const StorageKeys = {
  TOKEN: 'dji_auth_token',
  EXPIRES: 'dji_token_expires',
} as const;

// -----------------------------------------------------------------------------
// Core Utilities (Modularity & DRY)
// -----------------------------------------------------------------------------

const isSSR = () => typeof window === 'undefined';

const LocalStorageUtils = {
  get: (key: string): string | null => (isSSR() ? null : localStorage.getItem(key)),
  set: (key: string, value: string): void => {
    if (!isSSR()) localStorage.setItem(key, value);
  },
  remove: (key: string): void => {
    if (!isSSR()) localStorage.removeItem(key);
  },
};

const CookieUtils = {
  setStrictSignal: (key: string, maxAge: number): void => {
    if (!isSSR()) {
      document.cookie = `${key}=true; path=/; max-age=${maxAge}; SameSite=Strict`;
    }
  },
  clearSignal: (key: string): void => {
    if (!isSSR()) {
      document.cookie = `${key}=; path=/; max-age=0; SameSite=Strict`;
    }
  },
};

const getExpiryTime = (): number | null => {
  const expiry = LocalStorageUtils.get(StorageKeys.EXPIRES);
  return expiry ? parseInt(expiry, 10) : null;
};

// -----------------------------------------------------------------------------
// Public Token API
// -----------------------------------------------------------------------------

/**
 * Returns the stored JWT, or null if missing / expired.
 * Automatically cleans up an expired token.
 */
export function getToken(): string | null {
  const expiryTime = getExpiryTime();
  
  if (expiryTime && Date.now() > expiryTime) {
    clearToken(); // token has expired — remove it rather than returning a dead token
    return null;
  }

  return LocalStorageUtils.get(StorageKeys.TOKEN);
}

/**
 * Persists the JWT from a successful login or token refresh.
 * @param token     - The raw JWT string returned by the DJI server
 * @param expiresIn - Lifetime in seconds (e.g. 3600 for 1 hour). Optional but strongly recommended.
 */
export function setToken(token: string, expiresIn?: number): void {
  LocalStorageUtils.set(StorageKeys.TOKEN, token);

  const maxAge = expiresIn ?? 3600;

  if (expiresIn) {
    // Store absolute expiry timestamp so getToken() can compare against Date.now()
    LocalStorageUtils.set(StorageKeys.EXPIRES, String(Date.now() + expiresIn * 1000));
  }

  // Cookie signal for Next.js middleware
  CookieUtils.setStrictSignal(StorageKeys.TOKEN, maxAge);
}

/**
 * Clears the token from both localStorage and the cookie.
 * Called on logout or when a 401 cannot be recovered.
 */
export function clearToken(): void {
  LocalStorageUtils.remove(StorageKeys.TOKEN);
  LocalStorageUtils.remove(StorageKeys.EXPIRES);
  CookieUtils.clearSignal(StorageKeys.TOKEN);
}

/**
 * Returns true if the token will expire within `thresholdSeconds` seconds.
 * Used by AuthProvider to schedule a proactive refresh before the token goes stale.
 * @param thresholdSeconds - Default 60 (refresh 1 minute before expiry)
 */
export function isTokenExpiringSoon(thresholdSeconds = 60): boolean {
  const expiryTime = getExpiryTime();
  if (!expiryTime) return false;

  return Date.now() > expiryTime - thresholdSeconds * 1000;
}

/** Returns seconds until the stored token expires, or null if unknown. */
export function getTokenExpiresInSeconds(): number | null {
  const expiryTime = getExpiryTime();
  if (!expiryTime) return null;
  return Math.max((expiryTime - Date.now()) / 1000, 0);
}
