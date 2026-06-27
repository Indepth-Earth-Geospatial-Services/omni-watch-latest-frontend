import { NextRequest, NextResponse } from 'next/server';

const DJI_BASE_URL = process.env.NEXT_PUBLIC_DJI_API_URL?.replace(/\/$/, '') ?? '';

/**
 * Media download proxy — solves CORS by fetching the pre-signed GCS URL server-side.
 *
 * Flow:
 *   1. Browser calls /api/media/download?workspaceId=...&fileId=...
 *   2. This route calls DJI API to get the pre-signed URL
 *   3. Fetches the file from GCS server-side (no CORS)
 *   4. Streams the binary back to the browser
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const fileId = searchParams.get('fileId');

  if (!workspaceId || !fileId) {
    return NextResponse.json(
      { error: 'Missing workspaceId or fileId' },
      { status: 400 }
    );
  }

  try {
    // Step 1: Get pre-signed URL from DJI API
    const token = request.headers.get('x-auth-token') ?? '';
    const djiUrl = `${DJI_BASE_URL}/media/api/v1/files/${workspaceId}/file/${fileId}/url`;

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

    // DJI wraps responses in { code, message, data }
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
    const fileName = searchParams.get('fileName') || 'download';
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
