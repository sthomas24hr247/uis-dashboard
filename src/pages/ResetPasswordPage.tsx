// src/pages/ResetPasswordPage.tsx
// Public page for one-time links: new-account setup (team invites) and password resets.
// Posts the link's token and the new password to /api/auth/reset-password.

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const API_BASE: string = (import.meta as any).env?.VITE_API_URL || 'https://api.uishealth.com';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) { setError('This link is missing its code. Ask your administrator for a new link.'); return; }
    if (password.length < 8) { setError('Use at least 8 characters.'); return; }
    if (password !== confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      const res = await fetch(API_BASE + '/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'This link could not be used. Ask your administrator for a new link.'); return; }
      setDone(true);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b0f] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-xl border border-cyan-800 bg-cyan-950/40 flex items-center justify-center text-cyan-300 text-2xl font-bold">U</div>
          <div>
            <div className="text-white text-xl font-bold tracking-widest">UIS HEALTH</div>
            <div className="text-cyan-600 text-[11px] tracking-[0.2em]">UNIFIED INTELLIGENCE SYSTEM</div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-900/60 bg-black/60 p-8">
          {done ? (
            <div className="text-center space-y-4">
              <h1 className="text-cyan-300 text-lg font-semibold">Your password is set</h1>
              <p className="text-slate-300 text-sm">You can now sign in with your email and new password.</p>
              <Link to="/login" className="inline-block mt-2 px-5 py-2.5 rounded-lg border border-cyan-700 text-cyan-300 hover:bg-cyan-950/50 text-sm font-semibold">
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div>
                <h1 className="text-cyan-300 text-lg font-semibold">Set your password</h1>
                <p className="text-slate-400 text-sm mt-1">Choose a password with at least 8 characters. This link works once.</p>
              </div>

              {error && (
                <div role="alert" className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
              )}

              <div>
                <label htmlFor="new-password" className="block text-xs tracking-widest text-slate-300 mb-2">NEW PASSWORD</label>
                <input id="new-password" type={show ? 'text' : 'password'} autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs tracking-widest text-slate-300 mb-2">CONFIRM PASSWORD</label>
                <input id="confirm-password" type={show ? 'text' : 'password'} autoComplete="new-password"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-300 select-none">
                <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} />
                Show passwords
              </label>

              <button type="submit" disabled={busy}
                className="w-full rounded-lg border border-cyan-700 bg-cyan-950/40 py-3 text-cyan-300 font-semibold tracking-widest hover:bg-cyan-900/40 disabled:opacity-50">
                {busy ? 'SAVING...' : 'SET PASSWORD'}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-xs text-cyan-600 hover:text-cyan-400 tracking-widest">BACK TO SIGN IN</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
