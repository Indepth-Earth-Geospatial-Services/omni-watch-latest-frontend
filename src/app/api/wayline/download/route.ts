import { NextRequest, NextResponse } from 'next/server';

const DJI_BASE_URL = process.env.NEXT_PUBLIC_DJI_API_URL?.replace(/\/$/, '') ?? '';

/**
 * Wayline download proxy — fetches the KMZ file from DJI server-side (avoids CORS).
 * The DJI /waylines/{id}/url endpoint returns the file directly as binary,
 * NOT a JSON envelope.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const waylineId = searchParams.get('waylineId');

  if (!workspaceId || !waylineId) {
    return NextResponse.json(
      { error: 'Missing workspaceId or waylineId' },
      { status: 400 }
    );
  }

  if (!DJI_BASE_URL) {
    return NextResponse.json(
      { error: 'DJI API URL not configured' },
      { status: 500 }
    );
  }

  try {
    const token = request.headers.get('x-auth-token') ?? '';

    if (!token) {
      return NextResponse.json(
        { error: 'No auth token provided' },
        { status: 401 }
      );
    }

    // The DJI endpoint returns the KMZ binary directly (not JSON)
    const djiUrl = `${DJI_BASE_URL}/wayline/api/v1/workspaces/${workspaceId}/waylines/${waylineId}/url`;

    const djiRes = await fetch(djiUrl, {
      headers: { 'x-auth-token': token },
    });

    if (!djiRes.ok) {
      const errText = await djiRes.text().catch(() => 'unknown');
      return NextResponse.json(
        { error: `DJI API returned ${djiRes.status}` },
        { status: djiRes.status }
      );
    }

    // Stream the binary KMZ back to the browser
    const fileName = searchParams.get('fileName') || 'wayline.kmz';
    const contentType = djiRes.headers.get('content-type') ?? 'application/octet-stream';

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Content-Disposition', `attachment; filename="${fileName}"`);

    return new NextResponse(djiRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Download failed: ${message}` },
      { status: 500 }
    );
  }
}
