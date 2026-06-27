import { NextRequest, NextResponse } from 'next/server';

const DJI_BASE_URL = process.env.NEXT_PUBLIC_DJI_API_URL?.replace(/\/$/, '') ?? '';

/**
 * Wayline download proxy — solves CORS by fetching the pre-signed GCS URL server-side.
 *
 * Flow:
 *   1. Browser calls /api/wayline/download?workspaceId=...&waylineId=...&fileName=...
 *   2. This route calls DJI API to get the pre-signed URL
 *   3. Fetches the file from GCS server-side (no CORS)
 *   4. Streams the binary back to the browser
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

  try {
    const token = request.headers.get('x-auth-token') ?? '';

    // Step 1: Get pre-signed URL from DJI API
    const djiUrl = `${DJI_BASE_URL}/wayline/api/v1/workspaces/${workspaceId}/waylines/${waylineId}/url`;

    const djiRes = await fetch(djiUrl, {
      headers: { 'x-auth-token': token },
    });

    if (!djiRes.ok) {
      return NextResponse.json(
        { error: `DJI API returned ${djiRes.status}` },
        { status: djiRes.status }
      );
    }

    const envelope = await djiRes.json();

    if (envelope.code !== 0) {
      return NextResponse.json(
        { error: envelope.message || 'DJI API error' },
        { status: 502 }
      );
    }

    const fileUrl = envelope.data?.url;
    if (!fileUrl) {
      return NextResponse.json(
        { error: 'No download URL in DJI response' },
        { status: 502 }
      );
    }

    // Step 2: Fetch the file from GCS server-side (no CORS)
    const fileRes = await fetch(fileUrl);

    if (!fileRes.ok) {
      return NextResponse.json(
        { error: `GCS returned ${fileRes.status}` },
        { status: fileRes.status }
      );
    }

    // Step 3: Stream the file back to the browser
    const fileName = searchParams.get('fileName') || 'wayline.kmz';
    const contentType = fileRes.headers.get('content-type') ?? 'application/octet-stream';

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Content-Disposition', `attachment; filename="${fileName}"`);

    return new NextResponse(fileRes.body, {
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
