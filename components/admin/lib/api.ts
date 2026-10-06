import type { Content } from '@/lib/types';

export interface SessionInfo {
  authenticated: boolean;
}

export interface RemoteContent {
  content: Content;
  sha: string;
}

export interface CommitResult {
  sha: string;
  url: string;
  message: string;
  content?: Content;
}

/** Error carrying the HTTP status and an optional machine code from the API. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Raised when a commit is rejected because the remote revision moved on. */
export class ConflictError extends ApiError {
  constructor(message: string, status = 409, code = 'conflict') {
    super(message, status, code);
    this.name = 'ConflictError';
  }
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function messageFrom(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['message', 'detail']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    const error = record.error;
    if (typeof error === 'string' && error.trim()) return error;
    if (error && typeof error === 'object') {
      const inner = error as Record<string, unknown>;
      if (typeof inner.message === 'string' && inner.message.trim()) {
        return inner.message;
      }
    }
  }
  return fallback;
}

function codeFrom(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.code === 'string') return record.code;
    const error = record.error;
    if (error && typeof error === 'object') {
      const inner = error as Record<string, unknown>;
      if (typeof inner.code === 'string') return inner.code;
    }
  }
  return undefined;
}

/** GET /api/admin/session */
export async function getSession(): Promise<SessionInfo> {
  const res = await fetch('/api/admin/session', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new ApiError(
      messageFrom(payload, 'Could not verify your session.'),
      res.status,
      codeFrom(payload),
    );
  }
  const authenticated =
    payload && typeof payload === 'object' && 'authenticated' in payload
      ? Boolean((payload as Record<string, unknown>).authenticated)
      : false;
  return { authenticated };
}

/** POST /api/admin/login */
export async function login(username: string, password: string): Promise<void> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const payload = await readJson(res);
    throw new ApiError(
      messageFrom(payload, 'Sign in failed.'),
      res.status,
      codeFrom(payload),
    );
  }
}

/** POST /api/admin/logout */
export async function logout(): Promise<void> {
  const res = await fetch('/api/admin/logout', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok && res.status !== 401) {
    const payload = await readJson(res);
    throw new ApiError(
      messageFrom(payload, 'Sign out failed.'),
      res.status,
      codeFrom(payload),
    );
  }
}

/** GET /api/admin/content */
export async function getContent(): Promise<RemoteContent> {
  const res = await fetch('/api/admin/content', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new ApiError(
      messageFrom(payload, 'Could not load content.'),
      res.status,
      codeFrom(payload),
    );
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('content' in payload) ||
    typeof (payload as Record<string, unknown>).sha !== 'string'
  ) {
    throw new ApiError('The server returned an unexpected content response.', 500);
  }
  const record = payload as Record<string, unknown>;
  return { content: record.content as Content, sha: record.sha as string };
}

/** POST /api/admin/commit */
export async function commit(
  content: Content,
  baseSha: string,
): Promise<CommitResult> {
  const res = await fetch('/api/admin/commit', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ content, baseSha }),
  });
  const payload = await readJson(res);

  if (res.status === 409) {
    throw new ConflictError(
      messageFrom(
        payload,
        'Someone published newer changes while you were editing.',
      ),
    );
  }

  if (!res.ok) {
    throw new ApiError(
      messageFrom(payload, 'Publishing failed.'),
      res.status,
      codeFrom(payload),
    );
  }

  const record = (payload ?? {}) as Record<string, unknown>;
  return {
    sha: typeof record.sha === 'string' ? record.sha : '',
    url: typeof record.url === 'string' ? record.url : '',
    content: record.content && typeof record.content === 'object' ? record.content as Content : undefined,
    message:
      typeof record.message === 'string'
        ? record.message
        : 'Changes were committed.',
  };
}

/** POST /api/admin/upload (multipart, field name "file") */
export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    body: form,
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new ApiError(
      messageFrom(payload, 'Upload failed.'),
      res.status,
      codeFrom(payload),
    );
  }
  const record = (payload ?? {}) as Record<string, unknown>;
  if (typeof record.url !== 'string' || !record.url) {
    throw new ApiError('The server did not return an upload URL.', 500);
  }
  return record.url;
}
