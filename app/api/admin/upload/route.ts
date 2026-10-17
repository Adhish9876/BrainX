import { NextResponse } from 'next/server';
import { createUpload, MAX_UPLOAD_BYTES, UploadError, uploadDir, uploadUrl } from '@/lib/uploads';
import { guardMutation, jsonError, jsonNoStore, requireSession } from '../_shared';
import { BodyTooLargeError, readLimitedBody } from '@/lib/request-body';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const guard = guardMutation(request);
  if (guard) return guard;

  const session = requireSession(request);
  if (session instanceof NextResponse) return session;

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength && declaredLength > MAX_UPLOAD_BYTES + 1024 * 1024) {
    return jsonError(413, 'payload_too_large', 'file too large');
  }

  let form: FormData;
  try {
    const bytes = await readLimitedBody(request, MAX_UPLOAD_BYTES + 1024 * 1024);
    form = await new Response(new Uint8Array(bytes), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
  } catch (error) {
    if (error instanceof BodyTooLargeError) return jsonError(413, 'payload_too_large', 'file too large');
    return jsonError(400, 'bad_request', 'expected multipart form data');
  }

  const file = form.get('file');
  if (!file || typeof file === 'string' || typeof (file as Blob).arrayBuffer !== 'function') {
    return jsonError(400, 'bad_request', 'file field is required');
  }

  const blob = file as File;
  if (blob.size > MAX_UPLOAD_BYTES) {
    return jsonError(413, 'payload_too_large', 'file too large');
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await blob.arrayBuffer());
  } catch {
    return jsonError(400, 'bad_request', 'could not read uploaded file');
  }

  try {
    const record = await createUpload({
      dir: uploadDir(),
      sessionId: session.payload.sid,
      originalName: blob.name || 'upload',
      declaredType: blob.type,
      buffer,
    });
    return jsonNoStore({
      url: uploadUrl(record.token),
      token: record.token,
      width: record.width,
      height: record.height,
      size: record.size,
    });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.status, 'invalid_upload', error.message);
    console.error('[upload] unexpected failure:', error);
    return jsonError(500, 'upload_failed', 'failed to store upload');
  }
}
