import { NextResponse } from 'next/server';
import { deleteUpload, isUploadToken, readUpload, uploadDir } from '@/lib/uploads';
import { guardMutation, jsonError, jsonNoStore, requireSession } from '../../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = requireSession(request);
  if (session instanceof NextResponse) return session;

  const { token } = await context.params;
  if (!isUploadToken(token)) return jsonError(404, 'not_found', 'upload not found');

  const loaded = await readUpload(uploadDir(), token, Date.now());
  if (!loaded || loaded.record.sessionId !== session.payload.sid) {
    return jsonError(404, 'not_found', 'upload not found');
  }

  return new NextResponse(new Uint8Array(loaded.data), {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
      'Content-Length': String(loaded.data.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const guard = guardMutation(request);
  if (guard) return guard;

  const session = requireSession(request);
  if (session instanceof NextResponse) return session;

  const { token } = await context.params;
  if (!isUploadToken(token)) return jsonError(404, 'not_found', 'upload not found');

  const loaded = await readUpload(uploadDir(), token, Date.now());
  if (loaded && loaded.record.sessionId === session.payload.sid) {
    await deleteUpload(uploadDir(), token);
  }
  return jsonNoStore({ deleted: true });
}
