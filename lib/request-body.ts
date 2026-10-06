/** Enforce byte limits even for chunked requests without Content-Length. */
export class BodyTooLargeError extends Error {}

export async function readLimitedBody(request: Request, maxBytes: number): Promise<Buffer> {
  const declared = Number(request.headers.get('content-length'));
  if (declared > maxBytes) throw new BodyTooLargeError('Request body is too large');
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new BodyTooLargeError('Request body is too large');
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks, size);
  } finally {
    reader.releaseLock();
  }
}
