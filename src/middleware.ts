// Route guard — runs on the Edge before any page renders.
// Previously named middleware.ts; renamed to proxy.ts in Next.js v16.
//
// What it does:
//   - Blocks unauthenticated users from reaching any dashboard route → redirects to /sign-in
//   - Redirects authenticated users away from /sign-in and /sign-up → sends to /dashboard
//   - Lets everything else through (/, /api/dji/*, static assets)
//
// Auth detection:
//   Reads the "dji_auth_token" cookie set by token-store.ts when the user logs in.
//   The real JWT stays in localStorage — the cookie is just a boolean signal the Edge can read.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Every route that requires the user to be signed in
const DASHBOARD_ROUTES = [
  '/dashboard',
  '/live-feed',
  '/geospatial',
  '/incidents',
  '/logs',
  '/reports',
  '/threats',
  '/users',
  '/analytics',
  '/member',
  '/projects',
  '/assets',
  '/flightroutes',
  '/control',
];

// Routes that logged-in users should be bounced away from
const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Presence of this cookie means a valid token was stored by setToken()
  const isAuthenticated = request.cookies.has('dji_auth_token');

  const isDashboardRoute = DASHBOARD_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Unauthenticated user trying to reach the dashboard → send to sign-in
  if (isDashboardRoute && !isAuthenticated) {
    const signInUrl = new URL('/sign-in', request.url);
    // Preserve where they were trying to go so we can redirect back after login
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Already logged-in user hitting the auth pages → send to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // All other routes (/, /api/dji/*, static files) pass through untouched
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
