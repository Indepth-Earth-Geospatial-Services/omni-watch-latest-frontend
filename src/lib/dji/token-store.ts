// JWT token storage with two-layer persistence:
//   - localStorage  → holds the real token + expiry, read by client.ts for API requests
//   - Cookie signal → holds "true" so Next.js middleware can check auth state on the Edge

const TOKEN_KEY = 'dji_auth_token';
const EXPIRES_KEY = 'dji_token_expires';

/**
 * Returns the stored JWT, or null if missing / expired.
 * Automatically cleans up an expired token.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null; // SSR guard — localStorage unavailable on server

  const expiry = localStorage.getItem(EXPIRES_KEY);
  if (expiry && Date.now() > parseInt(expiry, 10)) {
    clearToken(); // token has expired — remove it rather than returning a dead token
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Persists the JWT from a successful login or token refresh.
 * @param token     - The raw JWT string returned by the DJI server
 * @param expiresIn - Lifetime in seconds (e.g. 3600 for 1 hour). Optional but strongly recommended.
 */
export function setToken(token: string, expiresIn?: number): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(TOKEN_KEY, token);

  if (expiresIn) {
    // Store absolute expiry timestamp so getToken() can compare against Date.now()
    localStorage.setItem(EXPIRES_KEY, String(Date.now() + expiresIn * 1000));
  }

  // Cookie signal for Next.js middleware (value is "true", NOT the token itself)
  // SameSite=Strict prevents it from being sent on cross-site requests (CSRF protection)
  const maxAge = expiresIn ?? 3600;
  document.cookie = `${TOKEN_KEY}=true; path=/; max-age=${maxAge}; SameSite=Strict`;
}

/**
 * Clears the token from both localStorage and the cookie.
 * Called on logout or when a 401 cannot be recovered.
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);

  // Expire the cookie immediately by setting max-age=0
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict`;
}

/**
 * Returns true if the token will expire within `thresholdSeconds` seconds.
 * Used by AuthProvider to schedule a proactive refresh before the token goes stale.
 * @param thresholdSeconds - Default 60 (refresh 1 minute before expiry)
 */
export function isTokenExpiringSoon(thresholdSeconds = 60): boolean {
  if (typeof window === 'undefined') return false;

  const expiry = localStorage.getItem(EXPIRES_KEY);
  if (!expiry) return false;

  return Date.now() > parseInt(expiry, 10) - thresholdSeconds * 1000;
}
