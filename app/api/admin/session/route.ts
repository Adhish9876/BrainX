import { jsonNoStore, maybeRenewSession, readSession } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = readSession(request);
  if (!session) return jsonNoStore({ authenticated: false });
  return maybeRenewSession(jsonNoStore({ authenticated: true }), session);
}
