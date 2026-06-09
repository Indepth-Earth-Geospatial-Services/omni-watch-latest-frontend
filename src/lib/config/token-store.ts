// 🛡️ Secure token storage — JWT held in-memory only, never in localStorage.
//
// Architecture:
//   - In-memory variable  → holds the actual JWT, used by client.ts and auth-api.ts
//   - localStorage         → holds ONLY the expiry timestamp (not sensitive)
//   - Cookie signal        → holds "true" so Next.js middleware can check auth state on the Edge
//
// Why in-memory instead of localStorage:
//   localStorage is accessible to any XSS vulnerability via localStorage.getItem().
//   An in-memory module variable cannot be read by a simple XSS payload — the attacker
//   would need to hook into the module system or intercept network requests, which is
//   significantly harder.
//
// Page refresh behaviour:
//   On refresh, the in-memory token is lost. AuthProvider detects this via hasSession()
//   (checks if an expiry timestamp exists in localStorage) and calls authApi.refreshToken()
//   which uses the HttpOnly refresh cookie (set by Django) to obtain a new access token.
//   The user's session is restored transparently.

const StorageKeys = {
  EXPIRES: 'dji_token_expires',
  SIGNAL: 'dji_auth_token',
} as const;

// ─── In-memory token store ───────────────────────────────────────────────────
// The raw JWT lives here — never in localStorage, never in a JS-readable cookie.

let inMemoryToken: string | null = null;

// ─── Core Utilities ──────────────────────────────────────────────────────────

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
 * Returns the in-memory JWT, or null if missing / expired.
 * After a page refresh the token is lost — AuthProvider calls refreshToken()
 * to restore it using the HttpOnly refresh cookie.
 */
export function getToken(): string | null {
  const expiryTime = getExpiryTime();

  if (expiryTime && Date.now() > expiryTime) {
    clearToken(); // token has expired — clean up
    return null;
  }

  return inMemoryToken;
}

/**
 * Stores the JWT in memory (never localStorage) after a successful login or token refresh.
 *
 * @param token     - The raw JWT string returned by the OmniWatch server
 * @param expiresIn - Lifetime in seconds (e.g. 3600 for 1 hour). Optional but strongly recommended.
 */
export function setToken(token: string, expiresIn?: number): void {
  // Store JWT in memory only — this is the key security improvement
  inMemoryToken = token;

  const maxAge = expiresIn ?? 3600;

  if (expiresIn) {
    // Store absolute expiry timestamp so getToken() can detect expiration
    // and AuthProvider can schedule proactive refresh.
    // This is NOT sensitive — it's just a number (e.g. 1717500000000).
    LocalStorageUtils.set(StorageKeys.EXPIRES, String(Date.now() + expiresIn * 1000));
  }

  // Cookie signal for Next.js Edge middleware — still needed because middleware
  // runs before any client-side JS and can't access in-memory variables.
  CookieUtils.setStrictSignal(StorageKeys.SIGNAL, maxAge);
}

/**
 * Clears the in-memory token, expiry, and signal cookie.
 * Called on logout or when a 401 cannot be recovered.
 */
export function clearToken(): void {
  inMemoryToken = null;
  LocalStorageUtils.remove(StorageKeys.EXPIRES);
  CookieUtils.clearSignal(StorageKeys.SIGNAL);
}

/**
 * Returns true if a session was previously established (expiry timestamp exists).
 * Used by AuthProvider on mount to decide whether to attempt a token refresh
 * after a page refresh has wiped the in-memory token.
 *
 * Note: This does NOT guarantee the session is still valid — the refresh cookie
 * may have expired. AuthProvider handles that case by catching the refresh error
 * and redirecting to sign-in.
 */
export function hasSession(): boolean {
  return getExpiryTime() !== null;
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
