import { NextRequest, NextResponse } from 'next/server';

const STREAM_BACKEND = 'http://35.222.89.171:6789';

export async function GET(request: NextRequest) {
  const sn = request.nextUrl.searchParams.get('sn');

  if (!sn) {
    return NextResponse.json({ detail: 'Missing "sn" query parameter.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${STREAM_BACKEND}/manage/api/v1/live/streams/url?sn=${sn}`, {
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
      { detail: 'Failed to reach stream backend.' },
      { status: 503 }
    );
  }
}
