import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';

import { Banner, Button, Card, TextField } from '../components/ui';
import { formatApiError, useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { token, login } = useAuth();
  const [email, setEmail] = useState('superadmin@otelapps.test');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-100 to-page px-4">
      <Card className="w-full max-w-md p-8 shadow-md">
        <form onSubmit={onSubmit}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
            HQ
          </div>
          <p className="mt-5 text-sm font-medium text-muted">OtelApps</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">HQ</h1>
          <p className="mt-2 text-sm text-muted">Přihlášení jen pro superadmina.</p>
          <div className="mt-8 space-y-4">
            <TextField
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
            <TextField
              label="Heslo"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error ? (
            <div className="mt-4">
              <Banner tone="error">{error}</Banner>
            </div>
          ) : null}
          <Button type="submit" disabled={busy} className="mt-6 w-full">
            {busy ? 'Přihlašuji…' : 'Přihlásit'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
