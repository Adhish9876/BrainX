import { cookiesSecure, serializeClearCookie } from '@/lib/auth';
import { guardMutation, jsonNoStore } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const guard = guardMutation(request);
  if (guard) return guard;

  const response = jsonNoStore({ authenticated: false });
  response.headers.append('Set-Cookie', serializeClearCookie({ secure: cookiesSecure() }));
  return response;
}
