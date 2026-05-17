// Auth Proxy Route Handler — forwards all Django Auth API traffic from the browser to the Auth server.
//
// Why this exists:
//   - Browsers block direct cross-origin requests to the Auth server (CORS)
//   - All auth-related calls (login, me, refresh) share this handler

import { NextRequest, NextResponse } from 'next/server';
import { DJI_CONFIG } from '@/lib/dji/config';

// The Auth Backend URL from our central config
const AUTH_BASE_URL = DJI_CONFIG.OMNIWATCH_API_URL;

const HOP_BY_HOP_HEADERS = new Set(['host', 'connection', 'transfer-encoding', 'keep-alive', 'upgrade']);

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
    
    const body = ['GET', 'HEAD'].includes(request.method)
      ? undefined
      : await request.text();

    console.log(`[Auth Proxy] → ${request.method} ${targetUrl}`);
    console.log(`[Auth Proxy] Request body:`, body);

    const authResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardedHeaders,
      body,
    });

    const responseText = await authResponse.text();
    console.log(`[Auth Proxy] ← ${authResponse.status} from ${targetUrl}`);
    console.log(`[Auth Proxy] Response body:`, responseText.substring(0, 500));

    return new NextResponse(responseText, {
      status: authResponse.status,
      headers: {
        'Content-Type': authResponse.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('Auth Proxy Error:', error);
    return NextResponse.json(
      { code: 503, message: 'Failed to reach Auth server. Check that the Django backend is running.' },
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(request, context);
}
