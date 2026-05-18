// Proxy Route Handler — forwards all DJI API traffic from the browser to the DJI server.
//
// Why this exists:
//   - Browsers block direct cross-origin requests to http://localhost:6789 (CORS)
//   - The DJI server URL and JWT token are never visible in browser network tabs
//   - All six API prefixes (manage, map, media, storage, wayline, control) share one handler
//
// URL mapping:
//   Browser  →  /api/dji/manage/api/v1/login
//   Proxy    →  http://localhost:6789/manage/api/v1/login

import { NextRequest, NextResponse } from 'next/server';
import { DJI_CONFIG } from '@/lib/config/config';

// Single source of truth — BASE_URL comes from config.ts, not rebuilt here
const DJI_BASE_URL = DJI_CONFIG.BASE_URL;

// Headers that must not be forwarded — they are connection-level, not application-level
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

  // Preserve any query string (?page=1&size=20 etc.)
  const { search } = new URL(request.url);
  const targetUrl = `${DJI_BASE_URL}/${segments}${search}`;

  // Copy all application-level headers, drop hop-by-hop ones
  const forwardedHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      forwardedHeaders[key] = value;
    }
  });

  try {
    // DELETE and GET/HEAD must not carry a body — some backends reject them
    const NO_BODY = ['GET', 'HEAD', 'DELETE'];
    const body = NO_BODY.includes(request.method) ? undefined : await request.text();

    const djResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardedHeaders,
      body,
    });

    const responseText = await djResponse.text();

    return new NextResponse(responseText, {
      status: djResponse.status,
      headers: {
        'Content-Type': djResponse.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch {
    // DJI server is unreachable — return a clean error, never a raw exception stack
    return NextResponse.json(
      { code: 502, message: 'Failed to reach DJI server. Check that the backend is running.' },
      { status: 502 }
    );
  }
}

// Export one handler per HTTP method — Next.js only routes the methods you declare
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
