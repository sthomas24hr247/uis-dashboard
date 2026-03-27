import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const BOOT_STEPS = [
  { id: 'kernel',   label: 'INITIALIZING UIS KERNEL v4.2.1',        duration: 700  },
  { id: 'pms',      label: 'SCANNING PMS CONNECTIONS',               duration: 900  },
  { id: 'ai',       label: 'SYNCING AI ENGINE',                      duration: 1200 },
  { id: 'data',     label: 'LOADING PRACTICE DATA',                  duration: 600  },
  { id: 'security', label: 'VERIFYING SECURITY PROTOCOLS',           duration: 500  },
  { id: 'ready',    label: 'SYSTEM READY',                           duration: 400  },
];

const AI_LINES = [
  'Claim Denial Model ........... v3.7 LOADED',
  'Attrition Predictor .......... v2.4 LOADED',
  'Schedule Optimizer ........... v1.9 LOADED',
  'Dentamind AI .................. v5.1 LOADED',
];

export default function LoginPage() {
  const [phase, setPhase] = useState<'boot' | 'login'>('boot');
  const [bootStep, setBootStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [aiLines, setAiLines] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [loginVisible, setLoginVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const animStartRef = useRef(Date.now());

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const totalDuration = BOOT_STEPS.reduce((s, step) => s + step.duration, 0);
    animStartRef.current = Date.now();
    let stepIndex = 0;
    let elapsed = 0;

    const runStep = () => {
      if (stepIndex >= BOOT_STEPS.length) {
        setProgress(100);
        setTimeout(() => {
          setPhase('login');
          setTimeout(() => { setLoginVisible(true); setTimeout(() => inputRef.current?.focus(), 400); }, 150);
        }, 400);
        return;
      }
      const step = BOOT_STEPS[stepIndex];
      setBootStep(stepIndex);

      if (step.id === 'ai') {
        let lineIdx = 0;
        const delay = step.duration / (AI_LINES.length + 1);
        AI_LINES.forEach((_, i) => {
          setTimeout(() => setAiLines(prev => [...prev, AI_LINES[i]]), delay * (i + 1));
        });
      }

      const stepElapsed = elapsed;
      const tick = setInterval(() => {
        const now = Date.now() - animStartRef.current;
        const frac = Math.min((now - stepElapsed) / step.duration, 1);
        setProgress(((stepElapsed + frac * step.duration) / totalDuration) * 100);
      }, 16);

      setTimeout(() => {
        clearInterval(tick);
        setCompletedSteps(prev => [...prev, step.id]);
        elapsed += step.duration;
        stepIndex++;
        runStep();
      }, step.duration);
    };

    runStep();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const now = new Date().toISOString().slice(0, 19).replace('T', ' // ');

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex items-center justify-center overflow-hidden relative" style={{ fontFamily: "'JetBrains Mono', monospace" }}>

      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(0,229,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.5) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      {/* Corner labels */}
      <div className="absolute top-4 left-6 text-[10px] text-cyan-500/50 tracking-widest">UIS KERNEL v4.2.1 // CLASSIFIED</div>
      <div className="absolute top-4 right-6 text-[10px] text-cyan-500/50 tracking-widest">{now}</div>
      <div className="absolute bottom-4 left-6 text-[10px] text-slate-700 tracking-widest">UNIFIED INTELLIGENCE SYSTEM // ENTERPRISE EDITION</div>
      <div className="absolute bottom-4 right-6 text-[10px] text-slate-700 tracking-widest">ENCRYPTED // HIPAA COMPLIANT // SOC 2</div>

      {/* ── BOOT PHASE ── */}
      {phase === 'boot' && (
        <div className="w-full max-w-2xl px-8" style={{ animation: 'fadeIn 0.5s ease forwards' }}>
          {/* Logo */}
          <div className="flex items-center justify-center gap-5 mb-10">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
              <span className="text-3xl font-black text-cyan-400">U</span>
              <div className="absolute inset-0 rounded-2xl border border-cyan-400/30" style={{ animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }} />
            </div>
            <div>
              <div className="text-3xl font-black tracking-[0.15em] text-white">UIS HEALTH</div>
              <div className="text-[11px] tracking-[0.35em] text-cyan-500/60 mt-1">UNIFIED INTELLIGENCE SYSTEM</div>
            </div>
          </div>

          {/* Boot card */}
          <div className="border border-cyan-500/20 rounded-xl bg-black/50 backdrop-blur-sm p-6">
            <div className="flex items-start justify-between mb-1">
              <div className="text-[11px] tracking-[0.2em] text-cyan-400">SYSTEM BOOT SEQUENCE</div>
              <div className="text-right">
                <div className="text-3xl font-black text-cyan-400 leading-none">587</div>
                <div className="text-[9px] tracking-widest text-slate-500 mt-0.5">PRACTICES</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 mb-5">
              <div className="h-[3px] bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-75" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-slate-600 tracking-widest">PROGRESS</span>
                <span className="text-[9px] text-cyan-500 tabular-nums">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2.5">
              {BOOT_STEPS.slice(0, bootStep).map(step => (
                <div key={step.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-sm border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-sm bg-cyan-400" />
                    </div>
                    <span className="text-[11px] text-slate-400 tracking-wider">{step.label}</span>
                  </div>
                  <span className="text-[9px] text-cyan-700 tracking-widest">COMPLETE</span>
                </div>
              ))}

              {/* Active step */}
              {bootStep < BOOT_STEPS.length && (
                <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ animation: 'pulse 1s ease-in-out infinite' }} />
                    <span className="text-[11px] text-cyan-300 tracking-wider font-bold">{BOOT_STEPS[bootStep]?.label}</span>
                  </div>
                  {BOOT_STEPS[bootStep]?.id === 'ai' && (
                    <div className="ml-4 space-y-1.5">
                      <div className="h-[2px] bg-slate-800 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${(aiLines.length / AI_LINES.length) * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-500 tracking-wider mb-1">Loading predictive models and training data</div>
                      {aiLines.map((line, i) => (
                        <div key={i} className="text-[10px] text-cyan-700/90 tracking-wider" style={{ animation: 'fadeIn 0.3s ease forwards' }}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-5 text-[10px] text-slate-700 tracking-widest">587 / 600 PRACTICES ONLINE</div>
        </div>
      )}

      {/* ── LOGIN PHASE ── */}
      {phase === 'login' && (
        <div className="w-full max-w-md px-6" style={{ transition: 'opacity 0.7s ease, transform 0.7s ease', opacity: loginVisible ? 1 : 0, transform: loginVisible ? 'translateY(0)' : 'translateY(24px)' }}>
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <span className="text-2xl font-black text-cyan-400">U</span>
            </div>
            <div>
              <div className="text-xl font-black tracking-[0.15em] text-white">UIS HEALTH</div>
              <div className="text-[10px] tracking-[0.3em] text-cyan-500/60">UNIFIED INTELLIGENCE SYSTEM</div>
            </div>
          </div>

          {/* Auth card */}
          <div className="border border-cyan-500/20 rounded-xl bg-black/60 backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span className="text-[10px] tracking-[0.2em] text-cyan-400">AUTHENTICATION REQUIRED</span>
            </div>
            <div className="text-[10px] text-slate-600 tracking-widest mb-6">AUTHORIZED PERSONNEL ONLY // HIPAA PROTECTED</div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="border border-red-500/30 bg-red-500/10 text-red-400 px-3 py-2.5 rounded-lg text-[11px] tracking-wider">
                  ⚠ {error.toUpperCase()}
                </div>
              )}

              <div>
                <label className="block text-[10px] tracking-[0.25em] text-slate-400 mb-2">OPERATOR EMAIL</label>
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-500/60 text-white text-sm px-4 py-3 rounded-lg outline-none transition-colors placeholder:text-slate-700 tracking-wider"
                  style={{ fontFamily: 'inherit' }}
                  placeholder="operator@uishealth.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.25em] text-slate-400 mb-2">ACCESS CODE</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-500/60 text-white text-sm px-4 py-3 rounded-lg outline-none transition-colors placeholder:text-slate-700 tracking-widest pr-11"
                    style={{ fontFamily: 'inherit' }}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 hover:border-cyan-500/70 text-cyan-400 text-[11px] tracking-[0.3em] font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> AUTHENTICATING...</>
                ) : (
                  '⬡  AUTHENTICATE & ENTER'
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-700 tracking-widest">DEMO ACCESS</span>
              <button
                onClick={() => { setEmail('claims-demo@uishealth.com'); setPassword('ClaimsDemo2026!'); }}
                className="text-[10px] text-cyan-700 hover:text-cyan-400 tracking-widest transition-colors"
              >
                USE DEMO CREDENTIALS →
              </button>
            </div>
          </div>

          <div className="text-center mt-5 text-[10px] text-slate-700 tracking-widest">
            © 2026 MY IT COPILOT, LLC // UIS HEALTH
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ping { 75%, 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
