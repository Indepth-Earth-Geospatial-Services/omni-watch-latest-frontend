import { NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_DETECTION_SOCKET_URL || 'http://136.116.89.216';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/streams`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { detail: `Backend returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { detail: 'Failed to reach AI detection backend.' },
      { status: 503 }
    );
  }
}
