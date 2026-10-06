'use client';

import * as React from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { ApiError, getContent, type RemoteContent } from './lib/api';

interface AdminContentLoaderProps {
  onLogout: () => void;
  render: (data: RemoteContent) => React.ReactNode;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: RemoteContent };

/**
 * Loads the committed content once, guarding against expired sessions. The
 * working editor is only mounted with real data, never a fabricated default.
 */
export function AdminContentLoader({ onLogout, render }: AdminContentLoaderProps) {
  const [state, setState] = React.useState<LoadState>({ status: 'loading' });

  const load = React.useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const data = await getContent();
      setState({ status: 'ready', data });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onLogout();
        return;
      }
      setState({
        status: 'error',
        message:
          error instanceof ApiError
            ? 'The server could not load the content. Please try again.'
            : 'Could not reach the server. Check your connection and try again.',
      });
    }
  }, [onLogout]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="size-4 animate-spin" />
          Loading content…
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
        <Alert variant="destructive" className="max-w-md">
          <TriangleAlert />
          <AlertTitle>Content unavailable</AlertTitle>
          <AlertDescription>
            <p>{state.message}</p>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Try again
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onLogout}>
                Sign out
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{render(state.data)}</>;
}
