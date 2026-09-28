// src/pages/MfaSetupPage.tsx
// Guided two-step sign-in setup, shown at sign-in to anyone who has not set it up yet.
// Uses the 15-minute enrollment pass from sign-in (sessionStorage 'uis_mfa_enroll').
import { useEffect, useState, type FormEvent } from 'react';

const API = (import.meta as any).env?.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

export default function MfaSetupPage() {
  const [qr, setQr] = useState('');
  const [manual, setManual] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pass = (() => { try { return sessionStorage.getItem('uis_mfa_enroll') || ''; } catch { return ''; } })();
  const returnToRaw = new URLSearchParams(window.location.search).get('returnTo') || '/';
  const returnTo = returnToRaw.startsWith('/') && !returnToRaw.startsWith('//') ? returnToRaw : '/';

  useEffect(() => {
    if (!pass) { setError('Your setup session has ended. Please sign in again.'); return; }
    fetch(API + '/api/auth/mfa/enroll/setup', { method: 'POST', headers: { Authorization: 'Bearer ' + pass } })
      .then(async r => {
        const d: any = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || 'Could not start setup. Please sign in again.');
        setQr(d.qrCode); setManual(d.manualEntry);
      })
      .catch(e => setError(e.message));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await fetch(API + '/api/auth/mfa/enroll/verify', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + pass, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const d: any = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'That code did not match. Enter the current code from your app.');
      localStorage.setItem('uis_token', d.token);
      localStorage.setItem('uis_user', JSON.stringify(d.user));
      try { sessionStorage.removeItem('uis_mfa_enroll'); } catch { /* ignore */ }
      window.location.assign(returnTo);
    } catch (err: any) {
      setError(err.message); setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8 text-slate-100">
        <h1 className="text-xl font-semibold">Set up two-step sign-in</h1>
        <p className="mt-2 text-sm text-slate-300">
          To protect patient information, UIS Health requires a code from an authenticator app when you sign in. This takes about two minutes.
        </p>
        <ol className="mt-5 space-y-2 text-sm text-slate-300 list-decimal list-inside">
          <li>Open Microsoft Authenticator or Google Authenticator on your phone.</li>
          <li>Add an account and scan the code below.</li>
          <li>Enter the 6-digit code the app shows.</li>
        </ol>
        <div className="mt-5 flex justify-center">
          {qr
            ? <img src={qr} alt="QR code to add UIS Health to your authenticator app" className="w-48 h-48 rounded-lg bg-white p-2" />
            : <div className="w-48 h-48 rounded-lg bg-slate-800 animate-pulse" aria-hidden="true" />}
        </div>
        {manual && (
          <p className="mt-3 text-xs text-slate-400 text-center break-all">
            Can't scan? Enter this key in the app: <span className="font-mono text-slate-200">{manual}</span>
          </p>
        )}
        <form onSubmit={submit} className="mt-6">
          <label htmlFor="mfa-enroll-code" className="block text-sm font-medium text-slate-200">6-digit code</label>
          <input id="mfa-enroll-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric" autoComplete="one-time-code" maxLength={6} required
            className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-teal-400" />
          {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={busy || code.length !== 6 || !qr}
            className="mt-5 w-full rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
            {busy ? 'Checking...' : 'Finish setup and sign in'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm">
          <a href="/login" className="text-slate-300 hover:text-white underline">Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
