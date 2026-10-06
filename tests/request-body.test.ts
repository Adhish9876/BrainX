import { expect, it } from 'vitest';
import { BodyTooLargeError, readLimitedBody } from '../lib/request-body';

it('reads a bounded request', async () => {
  const req = new Request('http://localhost', { method: 'POST', body: 'hello' });
  expect((await readLimitedBody(req, 5)).toString()).toBe('hello');
});

it('rejects oversized chunked requests without trusting Content-Length', async () => {
  const body = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(4)); c.enqueue(new Uint8Array(4)); c.close(); } });
  const req = new Request('http://localhost', { method: 'POST', body, duplex: 'half' } as RequestInit);
  await expect(readLimitedBody(req, 6)).rejects.toBeInstanceOf(BodyTooLargeError);
});

it('rejects an oversized declared body before consuming it', async () => {
  const req = new Request('http://localhost', { method: 'POST', headers: { 'Content-Length': '100' }, body: 'hello' });
  await expect(readLimitedBody(req, 6)).rejects.toBeInstanceOf(BodyTooLargeError);
});
