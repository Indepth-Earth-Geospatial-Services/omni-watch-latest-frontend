import { NextRequest, NextResponse } from 'next/server';

const DJI_BASE_URL = process.env.NEXT_PUBLIC_DJI_API_URL?.replace(/\/$/, '') ?? '';
const MEDIA_VERSION = process.env.NEXT_PUBLIC_MEDIA_VERSION ?? '/media/api/v1';

/**
 * Media preview proxy — returns the image inline for previewing in the browser.
 * Same flow as download but sets Content-Disposition: inline instead of attachment.
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
    const token = request.headers.get('x-auth-token') ?? '';
    const djiUrl = `${DJI_BASE_URL}${MEDIA_VERSION}/files/${workspaceId}/file/${fileId}/url`;

    const djiRes = await fetch(djiUrl, {
      headers: { 'x-auth-token': token },
    });

    if (!djiRes.ok) {
      const body = await djiRes.text().catch(() => '');
      console.error(`[media/preview] DJI API ${djiRes.status} for file ${fileId}:`, body);
      return NextResponse.json(
        { error: `DJI API returned ${djiRes.status}`, details: body },
        { status: djiRes.status }
      );
    }

    const envelope = await djiRes.json();

    if (envelope.code !== 0) {
      console.error(`[media/preview] DJI error code ${envelope.code} for file ${fileId}:`, envelope.message);
      return NextResponse.json(
        { error: envelope.message || 'DJI API error', code: envelope.code },
        { status: 502 }
      );
    }

    const fileUrl = envelope.data?.url;
    if (!fileUrl) {
      console.error(`[media/preview] No URL in DJI response for file ${fileId}:`, JSON.stringify(envelope));
      return NextResponse.json(
        { error: 'No download URL in DJI response' },
        { status: 502 }
      );
    }

    const fileRes = await fetch(fileUrl);

    if (!fileRes.ok) {
      const gcsBody = await fileRes.text().catch(() => '');
      console.error(`[media/preview] GCS ${fileRes.status} for file ${fileId}:`, gcsBody);
      return NextResponse.json(
        {
          error: `File not available (GCS ${fileRes.status})`,
          details: gcsBody || 'The file may not exist in cloud storage or the download link has expired.',
        },
        { status: fileRes.status }
      );
    }

    const fileName = searchParams.get('fileName') || 'preview';
    const contentType = fileRes.headers.get('content-type') ?? 'application/octet-stream';

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Content-Disposition', `inline; filename="${fileName}"`);
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(fileRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[media/preview] Failed for file ${fileId}:`, message);
    return NextResponse.json(
      { error: `Preview failed: ${message}` },
      { status: 500 }
    );
  }
}
