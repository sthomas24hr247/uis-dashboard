// src/pages/ClaimsLoginPage.tsx
// Standalone login for claims.uishealth.com

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, FileText, TrendingUp, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ClaimsLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupData, setSignupData] = useState({
    practiceName: '', contactName: '', email: '', pms: ''
  });

  const handleSignupRequest = async () => {
    if (!signupData.practiceName || !signupData.email || !signupData.contactName) {
      setSignupError('Please fill in practice name, contact name, and email.');
      return;
    }
    setSignupLoading(true);
    setSignupError('');
    try {
      // Send to GHL via API or directly via email fallback
      const r = await fetch('https://api.uishealth.com/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signupData,
          product: 'Claims Recovery Standalone',
          source: 'claims.uishealth.com',
        }),
      });
      if (!r.ok && r.status !== 200) throw new Error('API error');
      setSignupSuccess(true);
    } catch {
      // Fallback — open email
      window.location.href = `mailto:sales@uishealth.com?subject=Claims Recovery Access Request&body=Practice: ${signupData.practiceName}%0AContact: ${signupData.contactName}%0AEmail: ${signupData.email}%0APMS: ${signupData.pms}`;
      setSignupSuccess(true);
    } finally {
      setSignupLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/claims');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-600/8 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm font-mono">UIS</span>
          </div>
          <div>
            <div className="text-white font-semibold text-lg leading-tight">UIS Health</div>
            <div className="text-teal-400 text-xs font-medium">Claims Recovery</div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
            <span className="text-teal-400 text-xs font-medium">Denti-Cal Claims Intelligence</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Recover denied claims<br />
            <span className="text-teal-400">faster than ever.</span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm">
            AI-powered SOAP narrative generation, automated denial analysis, and one-click provider sign-off — built specifically for Denti-Cal GA claims.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              { icon: FileText, text: 'Auto-generate compliant SOAP narratives for any denied GA claim' },
              { icon: Shield, text: 'ARC code analysis with corrective action pre-loaded for every denial' },
              { icon: TrendingUp, text: 'Bulk process your entire backlog — upload CSV, sign once, submit all' },
              { icon: CheckCircle, text: 'Works with Open Dental, Dentrix, Eaglesoft, or any PMS export' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-500/10 border border-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat */}
        <div className="relative z-10 flex gap-8">
          {[
            { value: '$76.82', label: 'Avg. per recovered claim' },
            { value: '90 days', label: 'Appeal window — act now' },
            { value: '5 min', label: 'Avg. narrative generation' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-teal-400 font-bold text-lg">{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs font-mono">UIS</span>
            </div>
            <div>
              <div className="text-white font-semibold">UIS Health</div>
              <div className="text-teal-400 text-xs">Claims Recovery</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400 text-sm">Sign in to your Claims Recovery account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="billing@yourpractice.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:bg-white/8 transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <a href="mailto:support@uishealth.com" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:bg-white/8 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <span className="text-red-400 text-xs">⚠</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-900/30 text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-slate-500 text-xs">New to Claims Recovery?</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Signup form */}
          {!showSignup ? (
            <button
              onClick={() => setShowSignup(true)}
              className="w-full flex items-center justify-center py-3 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-teal-500/30 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-all"
            >
              Request access for your practice
            </button>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-white">Request Access</p>
                <button onClick={() => setShowSignup(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
              </div>
              <input
                type="text"
                placeholder="Practice name"
                value={signupData.practiceName}
                onChange={e => setSignupData(p => ({ ...p, practiceName: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 text-sm"
              />
              <input
                type="text"
                placeholder="Contact name"
                value={signupData.contactName}
                onChange={e => setSignupData(p => ({ ...p, contactName: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 text-sm"
              />
              <input
                type="email"
                placeholder="Work email"
                value={signupData.email}
                onChange={e => setSignupData(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 text-sm"
              />
              <select
                value={signupData.pms}
                onChange={e => setSignupData(p => ({ ...p, pms: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-slate-300 focus:outline-none focus:border-teal-500 text-sm"
              >
                <option value="">Practice Management System</option>
                <option>Open Dental</option>
                <option>Dentrix</option>
                <option>Dentrix Ascend</option>
                <option>Eaglesoft</option>
                <option>ClearDent</option>
                <option>Curve</option>
                <option>Other</option>
              </select>
              {signupError && <p className="text-red-400 text-xs">{signupError}</p>}
              {signupSuccess ? (
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg px-4 py-3 text-center">
                  <p className="text-teal-400 text-sm font-medium">✅ Request received!</p>
                  <p className="text-slate-400 text-xs mt-1">We'll reach out within 1 business day.</p>
                </div>
              ) : (
                <button
                  onClick={handleSignupRequest}
                  disabled={signupLoading}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  {signupLoading ? 'Sending...' : 'Submit Request'}
                </button>
              )}
            </div>
          )}

          <p className="text-center text-slate-500 text-xs mt-6 leading-relaxed">
            By signing in, you agree to our{' '}
            <a href="https://uishealth.com/compliance" target="_blank" className="text-teal-400 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="https://uishealth.com/compliance" target="_blank" className="text-teal-400 hover:underline">Privacy Policy</a>.
            <br />HIPAA-compliant · SOC 2 in progress
          </p>
        </div>
      </div>
    </div>
  );
}
