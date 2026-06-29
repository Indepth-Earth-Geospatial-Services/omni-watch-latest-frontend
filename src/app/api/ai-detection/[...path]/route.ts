// AI Detection Proxy — forwards alert requests to the AI detection backend at 136.116.89.216:3000.
// This backend serves alerts with presigned image URLs.

import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_AI_DETECTION_SOCKET_URL ?? 'http://136.116.89.216:3000';

const HOP_BY_HOP = new Set(['host', 'connection', 'transfer-encoding', 'keep-alive', 'upgrade']);

async function forwardRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const segments = path.join('/');
  const { search } = new URL(request.url);
  const targetUrl = `${BASE_URL}/api/${segments}/${search}`;

  const forwardedHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) forwardedHeaders[key] = value;
  });
  forwardedHeaders['host'] = new URL(BASE_URL).host;

  try {
    const NO_BODY = ['GET', 'HEAD', 'DELETE'];
    const body = NO_BODY.includes(request.method) ? undefined : await request.text();

    const res = await fetch(targetUrl, { method: request.method, headers: forwardedHeaders, body });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const text = await res.text();

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', res.headers.get('Content-Type') ?? 'application/json');

    return new NextResponse(text, { status: res.status, headers: responseHeaders });
  } catch (error) {
    return NextResponse.json({ detail: 'Failed to reach AI detection server.' }, { status: 503 });
  }
}

export const GET = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  forwardRequest(req, ctx);
export const POST = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  forwardRequest(req, ctx);
export const PATCH = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  forwardRequest(req, ctx);
export const DELETE = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  forwardRequest(req, ctx);
