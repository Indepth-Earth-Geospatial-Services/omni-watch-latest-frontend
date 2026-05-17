"use client";

// AuthProvider — wraps the entire app and answers one question from any component:
// "Is there a logged-in user, and who are they?"
//
// Lifecycle:
//   1. On mount → check localStorage for an existing valid token
//   2. Token found → call GET /manage/api/v1/users/current to restore the session
//   3. Token missing/expired → user = null → middleware redirects to /sign-in
//   4. After login → user state set, proactive refresh timer scheduled
//   5. Timer fires 60s before expiry → silently exchanges token → reschedules

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { loginDJI, logoutDJI, refreshDJIToken } from '@/lib/dji/auth-api';
import { djiRequest } from '@/lib/dji/client';
import { DJI_CONFIG } from '@/lib/dji/config';
import { clearToken, getToken } from '@/lib/dji/token-store';
import type { CurrentUser } from '@/lib/types';

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** The authenticated user profile, or null when not signed in */
  user: CurrentUser | null;
  /** Shorthand for user !== null */
  isAuthenticated: boolean;
  /** True while the provider is checking an existing token on first load */
  isLoading: boolean;
  /** Error message from the last failed login attempt */
  loginError: string | null;
  /** Call this from the sign-in form — throws on bad credentials */
  login: (username: string, password: string) => Promise<void>;
  /** Clears the token and resets all state — call from any Sign Out button */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // useRef for the timer so clearing/rescheduling it never triggers a re-render
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch the current user profile from the DJI server ──────────────────
  // Called on mount (to restore session) and after a successful login
  const fetchCurrentUser = useCallback(async (): Promise<boolean> => {
    try {
      const data = await djiRequest.get<CurrentUser>(
        `${DJI_CONFIG.MANAGE}/users/current`
      );
      setUser(data);
      return true;
    } catch {
      // Token was invalid or the server rejected it — clear everything
      clearToken();
      setUser(null);
      return false;
    }
  }, []);

  // ── Schedule a proactive token refresh ──────────────────────────────────
  // Fires 60 seconds before the token expires so the user never hits a 401
  // mid-action. After a successful refresh it reschedules itself.
  const scheduleRefresh = useCallback((expiresInSeconds = 3600) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const delay = Math.max((expiresInSeconds - 60) * 1000, 30_000); // minimum 30s

    refreshTimerRef.current = setTimeout(async () => {
      try {
        await refreshDJIToken();
        // DJI server doesn't always return expires_in on refresh — default to 1 hour
        scheduleRefresh(3600);
      } catch {
        // Refresh failed (server offline, token already revoked) — force re-login
        setUser(null);
      }
    }, delay);
  }, []);

  // ── On mount: restore session if a token already exists ─────────────────
  useEffect(() => {
    const token = getToken();

    if (token) {
      // Check for dev-mode auto-login user data first to avoid extra requests
      const savedUser = localStorage.getItem('user');
      if (savedUser && process.env.NEXT_PUBLIC_AUTO_LOGIN_ENABLED === 'true') {
        setUser(JSON.parse(savedUser));
        scheduleRefresh();
        setIsLoading(false);
        return;
      }

      fetchCurrentUser().then((ok) => {
        if (ok) scheduleRefresh();
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    // Clean up the refresh timer when the provider unmounts
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [fetchCurrentUser, scheduleRefresh]);

  // ── login ────────────────────────────────────────────────────────────────
  // Called by the sign-in form. loginDJI stores the token, then we fetch
  // the current user so every component immediately has the full profile.
  const login = useCallback(
    async (username: string, password: string) => {
      setLoginError(null);
      try {
        const response = await loginDJI(username, password);
        await fetchCurrentUser();
        scheduleRefresh(response.expires_in ?? 3600);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setLoginError(message);
        throw err; // re-throw so the form can also react (e.g. stop its loading spinner)
      }
    },
    [fetchCurrentUser, scheduleRefresh]
  );

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    logoutDJI();
    setUser(null);
    setLoginError(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, loginError, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the auth context from any client component.
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be called inside <AuthProvider>. Check your Providers tree.');
  }
  return ctx;
}
