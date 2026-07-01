'use client';

// AuthProvider — wraps the entire app and answers one question from any component:
// "Is there a logged-in user, and who are they?"
//
// Lifecycle:
//   1. On mount → check in-memory token OR try to restore via refresh cookie
//   2. Token in memory → call GET /api/auth/me (Loctiva) to restore the session
//   3. Token lost (page refresh) but session exists → refreshToken() → restore
//   4. No session at all → user = null → middleware redirects to /sign-in
//   5. After login → user state set, proactive refresh timer scheduled
//   6. Timer fires 60s before expiry → silently exchanges token → reschedules

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { authApi } from '@/services/authservice-layer/auth-api';
import {
  clearToken,
  getToken,
  getTokenExpiresInSeconds,
  hasSession,
} from '@/lib/config/token-store';
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
  login: (email: string, pin: string) => Promise<void>;
  /** Clears the token and resets all state — call from any Sign Out button */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loginDataRef = useRef<{
    role: string;
    username: string;
    user_id: string;
    user_type: number;
    mqtt_username: string;
    mqtt_password: string;
  } | null>(null);

  // ── Fetch the current user profile via Loctiva /me ────────────────────
  // Uses the Loctiva auth endpoint — never calls the DJI Cloud server.
  const fetchCurrentUser = useCallback(async (): Promise<boolean> => {
    try {
      const me = await authApi.me();
      const ld = loginDataRef.current;
      setUser({
        user_id: ld?.user_id || me.principal_id,
        username: ld?.username || '',
        user_type: ld?.user_type ?? 0,
        mqtt_username: ld?.mqtt_username || '',
        mqtt_password: ld?.mqtt_password || '',
        mqtt_client_id: '',
        workspace_id: me.workspace_id,
        workspace_name: '',
        workspace_description: '',
        role: ld?.role || 'operator',
      });
      return true;
    } catch {
      clearToken();
      setUser(null);
      return false;
    }
  }, []);

  // ── Schedule a proactive token refresh ──────────────────────────────────
  const scheduleRefresh = useCallback((expiresInSeconds = 3600) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const delay = Math.max((expiresInSeconds - 60) * 1000, 30_000);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        await authApi.refreshToken();
        scheduleRefresh(getTokenExpiresInSeconds() ?? 3600);
      } catch {
        setUser(null);
      }
    }, delay);
  }, []);

  // ── On mount: restore session ───────────────────────────────────────────
  // The JWT is stored in memory (not localStorage), so after a page refresh
  // it's gone. We detect this via hasSession() which checks if an expiry
  // timestamp exists in localStorage. If it does, we call refreshToken()
  // which uses the HttpOnly refresh cookie (from Django) to get a new
  // access token transparently.
  useEffect(() => {
    const token = getToken();
    const sessionExists = hasSession();

    if (token) {
      fetchCurrentUser().then((ok) => {
        if (ok) scheduleRefresh(getTokenExpiresInSeconds() ?? 3600);
        setIsLoading(false);
      });
    } else if (sessionExists) {
      // Page was refreshed — token lost from memory but a session existed before.
      // Try to restore it using the HttpOnly refresh cookie from Django.
      authApi
        .refreshToken()
        .then(() => fetchCurrentUser())
        .then((ok) => {
          if (ok) scheduleRefresh(getTokenExpiresInSeconds() ?? 3600);
          setIsLoading(false);
        })
        .catch(() => {
          clearToken();
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [fetchCurrentUser, scheduleRefresh]);

  // ── login ────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, pin: string) => {
      setLoginError(null);
      try {
        const loginResponse = await authApi.login(email, pin);
        loginDataRef.current = {
          role: loginResponse.role,
          username: loginResponse.username,
          user_id: loginResponse.user_id,
          user_type: loginResponse.user_type,
          mqtt_username: loginResponse.mqtt_username,
          mqtt_password: loginResponse.mqtt_password,
        };
        await fetchCurrentUser();
        scheduleRefresh(getTokenExpiresInSeconds() ?? 3600);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setLoginError(message);
        throw err;
      }
    },
    [fetchCurrentUser, scheduleRefresh]
  );

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken(); // clear immediately so protected routes redirect without waiting for the API
    authApi.logout().catch(() => {});
    setUser(null);
    setLoginError(null);
    loginDataRef.current = null;
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be called inside <AuthProvider>. Check your Providers tree.');
  }
  return ctx;
}
