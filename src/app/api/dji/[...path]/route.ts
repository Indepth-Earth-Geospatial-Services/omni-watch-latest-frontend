/**
 * DJI API Proxy — TEMPORARY SOLUTION FOR MIXED CONTENT ERRORS
 * 
 * This proxy exists only because the backend is HTTP-only. When the backend
 * implements HTTPS/WSS, this route can be safely deleted.
 * 
 * To disable:
 *   1. Set NEXT_PUBLIC_USE_DJI_PROXY=false in .env
 *   2. Delete this entire file/folder
 *   3. Revert changes to src/lib/config/client.ts
 * 
 * Flow:
 *   Browser (HTTPS) → /api/dji/manage/api/v1/devices/...
 *   → Node.js server (can make HTTP requests)
 *   → DJI backend (http://35.222.89.171:6789)
 *   → Response back over HTTPS to browser
 */

import { NextRequest, NextResponse } from 'next/server';

const DJI_BASE_URL = process.env.NEXT_PUBLIC_DJI_API_URL?.replace(/\/$/, '') ?? 'http://35.222.89.171:6789';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const queryString = request.nextUrl.search;
  const url = `${DJI_BASE_URL}/${pathStr}${queryString}`;

  try {
    const token = request.headers.get('x-auth-token') || '';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error(`[DJI Proxy] GET ${url} failed:`, error);
    return NextResponse.json(
      { error: 'Failed to proxy DJI request' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const url = `${DJI_BASE_URL}/${pathStr}`;
  const body = await request.json().catch(() => ({}));

  try {
    const token = request.headers.get('x-auth-token') || '';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[DJI Proxy] POST ${url} failed:`, error);
    return NextResponse.json(
      { error: 'Failed to proxy DJI request' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const url = `${DJI_BASE_URL}/${pathStr}`;
  const body = await request.json().catch(() => ({}));

  try {
    const token = request.headers.get('x-auth-token') || '';

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[DJI Proxy] PUT ${url} failed:`, error);
    return NextResponse.json(
      { error: 'Failed to proxy DJI request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const url = `${DJI_BASE_URL}/${pathStr}`;

  try {
    const token = request.headers.get('x-auth-token') || '';

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[DJI Proxy] DELETE ${url} failed:`, error);
    return NextResponse.json(
      { error: 'Failed to proxy DJI request' },
      { status: 500 }
    );
  }
}
