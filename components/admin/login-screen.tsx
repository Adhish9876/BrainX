'use client';

import * as React from 'react';
import { Loader2, Lock } from 'lucide-react';

import { ApiError, login } from './lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return 'Invalid username or password.';
    }
    if (error.status === 429) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (error.status >= 500) {
      return 'The server could not complete sign-in. Please try again.';
    }
    return 'Sign-in failed. Please check your details and try again.';
  }
  return 'Could not reach the server. Check your connection and try again.';
}

/** Sign-in form. Never stores or echoes credentials beyond the request. */
export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      setPassword('');
      onAuthenticated();
    } catch (err) {
      setPassword('');
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-lg bg-navy-700 text-white">
            <Lock className="size-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">BrainX Lab admin</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in to manage site content.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="admin-username">Username</Label>
            <Input
              id="admin-username"
              name="username"
              autoComplete="username"
              autoFocus
              required
              value={username}
              disabled={submitting}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={submitting}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Credentials are configured on the server and are never stored in the browser.
        </p>
      </div>
    </div>
  );
}
