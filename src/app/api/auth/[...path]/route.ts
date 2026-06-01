// Auth Proxy Route Handler — forwards all Django Auth API traffic from the browser to the Auth server.
//
// Why this exists:
//   - Browsers block direct cross-origin requests to the Auth server (CORS)
//   - All auth-related calls (login, me, refresh) share this handler

import { NextRequest, NextResponse } from 'next/server';
import { DJI_CONFIG } from '@/lib/config/config';

// The Auth Backend URL from our central config
const AUTH_BASE_URL = DJI_CONFIG.OMNIWATCH_API_URL;

const HOP_BY_HOP_HEADERS = new Set([
  'host',
  'connection',
  'transfer-encoding',
  'keep-alive',
  'upgrade',
]);

async function forwardRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const segments = path.join('/');

  const { search } = new URL(request.url);
  const targetUrl = `${AUTH_BASE_URL}/api/v1/auth/${segments}${search}`;

  const forwardedHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      forwardedHeaders[key] = value;
    }
  });

  // Explicitly set the Host header to match the target server
  try {
    const targetHost = new URL(AUTH_BASE_URL).host;
    forwardedHeaders['host'] = targetHost;

    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text();

    console.log(`[Auth Proxy] → ${request.method} ${targetUrl}`);
    console.log(`[Auth Proxy] Request body:`, body);

    // Use redirect:'manual' so we can detect Django 301s and re-send as the
    // original method. The default behaviour follows 301 and downgrades
    // POST→GET, which causes Django to return 403 on endpoints like /logout.
    let authResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardedHeaders,
      body,
      redirect: 'manual',
    });

    // Django adds a trailing slash and 301s if the path is missing it.
    // Re-send the original method to the redirect location instead of
    // letting fetch silently downgrade POST→GET.
    if ((authResponse.status === 301 || authResponse.status === 302) && body !== undefined) {
      const location = authResponse.headers.get('location');
      if (location) {
        console.log(`[Auth Proxy] 301 → re-POST to ${location}`);
        authResponse = await fetch(location, {
          method: request.method,
          headers: forwardedHeaders,
          body,
        });
      }
    } else if (authResponse.status === 301 || authResponse.status === 302) {
      // GET redirect — follow normally
      const location = authResponse.headers.get('location');
      if (location) {
        authResponse = await fetch(location, { method: 'GET', headers: forwardedHeaders });
      }
    }

    const responseText = await authResponse.text();
    console.log(`[Auth Proxy] ← ${authResponse.status} from ${targetUrl}`);
    console.log(`[Auth Proxy] Response body:`, responseText.substring(0, 500));

    // Build response headers — forward Content-Type plus all Set-Cookie headers.
    // Set-Cookie must be forwarded so the browser stores the HttpOnly refresh token
    // cookie issued by OmniWatch on login. Without it, token refresh always fails.
    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      authResponse.headers.get('Content-Type') ?? 'application/json'
    );

    // getSetCookie() returns each Set-Cookie value as a separate string (Node 18+),
    // avoiding the multi-cookie join bug in headers.get('set-cookie').
    const setCookies: string[] =
      typeof authResponse.headers.getSetCookie === 'function'
        ? authResponse.headers.getSetCookie()
        : authResponse.headers.get('set-cookie')
          ? [authResponse.headers.get('set-cookie')!]
          : [];

    console.log(`[Auth Proxy] Set-Cookie headers:`, setCookies);

    for (const cookie of setCookies) {
      // Strip Domain so the browser stores the cookie for THIS origin (Next.js app),
      // not the backend IP. Without this, the browser scopes the cookie to the backend
      // domain and never sends it on /api/auth/* requests — causing "Refresh token missing".
      const rewritten = cookie.replace(/;\s*domain=[^;]*/gi, '');
      responseHeaders.append('Set-Cookie', rewritten);
    }

    return new NextResponse(responseText, {
      status: authResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Auth Proxy Error:', error);
    return NextResponse.json(
      {
        code: 503,
        message: 'Failed to reach Auth server. Check that the Django backend is running.',
      },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}
