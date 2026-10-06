'use client';

import * as React from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { getSession } from './lib/api';
import { AdminWorkspace } from './admin-workspace';
import { LoginScreen } from './login-screen';

type SessionState =
  | { status: 'checking' }
  | { status: 'error'; message: string }
  | { status: 'unauthenticated' }
  | { status: 'authenticated' };

/**
 * Entry point for the hidden admin app. It verifies the server session before
 * rendering anything, then shows either the sign-in form or the editor. A
 * failed check is surfaced explicitly — it never assumes a logged-in or
 * logged-out default.
 */
export function AdminApp() {
  const [state, setState] = React.useState<SessionState>({ status: 'checking' });

  const check = React.useCallback(async () => {
    setState({ status: 'checking' });
    try {
      const { authenticated } = await getSession();
      setState(authenticated ? { status: 'authenticated' } : { status: 'unauthenticated' });
    } catch {
      setState({
        status: 'error',
        message: 'Could not reach the server to verify your session. Please try again.',
      });
    }
  }, []);

  React.useEffect(() => {
    void check();
  }, [check]);

  const handleAuthenticated = React.useCallback(
    () => setState({ status: 'authenticated' }),
    [],
  );
  const handleLogout = React.useCallback(
    () => setState({ status: 'unauthenticated' }),
    [],
  );

  if (state.status === 'checking') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="size-4 animate-spin" />
          Checking your session…
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
        <Alert variant="destructive" className="max-w-md">
          <TriangleAlert />
          <AlertTitle>Can’t verify your session</AlertTitle>
          <AlertDescription>
            <p>{state.message}</p>
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => void check()}>
                Try again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (state.status === 'unauthenticated') {
    return <LoginScreen onAuthenticated={handleAuthenticated} />;
  }

  return <AdminWorkspace onLogout={handleLogout} />;
}
