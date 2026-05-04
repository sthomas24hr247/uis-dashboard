// Drop this component into SettingsPage.tsx
// Add import: import { TeamMemberPasswordReset } from './TeamMemberPasswordReset';
// Then use <TeamMemberPasswordReset userId={user.id} userName={user.name} token={token} /> 
// next to each user row in the team members table

import { useState } from 'react';
import { KeyRound, X, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

interface Props {
  userId: string;
  userName: string;
  userEmail: string;
  token: string | null;
}

export function TeamMemberPasswordReset({ userId, userName, userEmail, token }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'choose' | 'manual' | 'email' | 'done'>('choose');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const reset = () => {
    setMode('choose');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
    setLoading(false);
  };

  const handleClose = () => { setOpen(false); setTimeout(reset, 300); };

  const handleManualReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setSuccessMsg(`Password for ${userName} has been updated.`);
      setMode('done');
    } catch (err: any) {
      setError(err.message || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReset = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send email');
      }
      setSuccessMsg(`Reset link sent to ${userEmail}.`);
      setMode('done');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pw: string) => {
    if (!pw) return null;
    if (pw.length < 8) return { label: 'Too short', color: 'bg-red-400', width: '25%' };
    let score = 0;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-amber-400', width: '40%' };
    if (score === 2) return { label: 'Fair', color: 'bg-yellow-400', width: '60%' };
    if (score === 3) return { label: 'Strong', color: 'bg-emerald-400', width: '80%' };
    return { label: 'Very strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = passwordStrength(newPassword);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-teal-600 border border-slate-200 dark:border-slate-600 hover:border-teal-300 rounded-lg transition-all dark:hover:border-teal-500 dark:hover:text-teal-400"
        title="Reset password"
      >
        <KeyRound className="w-3.5 h-3.5" />
        <span>Reset PW</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && handleClose()}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative z-10 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">Reset Password</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{userName} · {userEmail}</div>
                </div>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DONE STATE */}
            {mode === 'done' && (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Success</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{successMsg}</p>
                <button onClick={handleClose} className="px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
                  Done
                </button>
              </div>
            )}

            {/* CHOOSE MODE */}
            {mode === 'choose' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">How would you like to reset the password?</p>
                
                <button
                  onClick={() => setMode('manual')}
                  className="w-full flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-teal-300 dark:hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-all text-left group"
                >
                  <KeyRound className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400">Set password manually</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Directly set a new password for this user — ideal for demo accounts or when the user can't access email.</div>
                  </div>
                </button>

                <button
                  onClick={handleEmailReset}
                  disabled={loading}
                  className="w-full flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left group disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 text-blue-500 mt-0.5 animate-spin flex-shrink-0" /> : 
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  }
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Send reset email</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Send a secure reset link to {userEmail}. Link expires in 1 hour.</div>
                  </div>
                </button>

                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              </div>
            )}

            {/* MANUAL RESET FORM */}
            {mode === 'manual' && (
              <form onSubmit={handleManualReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white pr-10"
                      placeholder="Minimum 8 characters"
                      autoFocus
                      required
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {strength && (
                    <div className="mt-2">
                      <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{strength.label}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white transition-colors ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-300 dark:border-red-500'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                    placeholder="Repeat password"
                    required
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setMode('choose'); setError(''); setNewPassword(''); setConfirmPassword(''); }}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Set Password'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
}
