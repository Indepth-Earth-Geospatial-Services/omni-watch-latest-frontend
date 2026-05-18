// OmniWatch General Proxy — forwards non-auth OmniWatch traffic (projects, teams, workspaces)
// to the backend at /api/v1/<path>.  The /api/auth proxy handles auth endpoints separately.

import { NextRequest, NextResponse } from 'next/server';
import { DJI_CONFIG } from '@/lib/config/config';

const BASE_URL = DJI_CONFIG.OMNIWATCH_API_URL;

const HOP_BY_HOP = new Set(['host', 'connection', 'transfer-encoding', 'keep-alive', 'upgrade']);

async function forwardRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const segments = path.join('/');
  const { search } = new URL(request.url);
  // Always append trailing slash — Django 301-redirects paths without one,
  // and fetch() downgrades POST→GET on redirect, breaking mutations.
  const targetUrl = `${BASE_URL}/api/v1/${segments}/${search}`;

  const forwardedHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) forwardedHeaders[key] = value;
  });
  forwardedHeaders['host'] = new URL(BASE_URL).host;

  try {
    // DELETE and GET/HEAD must not carry a body — some backends reject them
    const NO_BODY = ['GET', 'HEAD', 'DELETE'];
    const body = NO_BODY.includes(request.method) ? undefined : await request.text();

    console.log(`[OmniWatch Proxy] → ${request.method} ${targetUrl}`);

    const res = await fetch(targetUrl, { method: request.method, headers: forwardedHeaders, body });

    console.log(`[OmniWatch Proxy] ← ${res.status}`);

    // 204 No Content — must not include a body in the response
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const text = await res.text();

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', res.headers.get('Content-Type') ?? 'application/json');

    const setCookies: string[] =
      typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : res.headers.get('set-cookie')
          ? [res.headers.get('set-cookie')!]
          : [];

    for (const cookie of setCookies) {
      responseHeaders.append('Set-Cookie', cookie);
    }

    return new NextResponse(text, { status: res.status, headers: responseHeaders });
  } catch (error) {
    console.error('[OmniWatch Proxy] Error:', error);
    return NextResponse.json({ detail: 'Failed to reach OmniWatch server.' }, { status: 503 });
  }
}

export const GET = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  forwardRequest(req, ctx);
export const POST = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  forwardRequest(req, ctx);
export const PUT = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  forwardRequest(req, ctx);
export const PATCH = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  forwardRequest(req, ctx);
export const DELETE = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  forwardRequest(req, ctx);
