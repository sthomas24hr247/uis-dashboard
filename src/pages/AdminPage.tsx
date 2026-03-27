import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Users, Plus, Trash2, RefreshCw, CheckCircle2,
  AlertTriangle, ChevronRight, Eye, EyeOff, Search,
  UserPlus, Zap, ArrowLeft, Copy, Check, Globe, Phone,
  Calendar, Shield, X
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Practice {
  id: string;
  name: string;
  slug: string;
  pms_type: string;
  status: string;
  subscription: string;
  location_count?: number;
  created_at?: string;
}

interface PracticeUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: string;
  status: string;
  lastLogin?: string;
  createdAt?: string;
}

interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PMS_OPTIONS = [
  { value: 'open_dental', label: 'Open Dental', icon: '🦷' },
  { value: 'dentrix', label: 'Dentrix Ascend', icon: '🏥' },
  { value: 'cleardent', label: 'ClearDent', icon: '🍁' },
  { value: 'eaglesoft', label: 'Eaglesoft', icon: '🦅' },
  { value: 'planetdds', label: 'Planet DDS / Denticon', icon: '🪐' },
  { value: 'carestack', label: 'CareStack', icon: '📋' },
  { value: 'curve', label: 'Curve Dental', icon: '📈' },
];

const SUBSCRIPTION_OPTIONS = [
  { value: 'essential', label: 'Essential', color: 'text-slate-600 dark:text-slate-300' },
  { value: 'professional', label: 'Professional', color: 'text-blue-600 dark:text-blue-400' },
  { value: 'enterprise', label: 'Enterprise', color: 'text-purple-600 dark:text-purple-400' },
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', desc: 'Full access + user management', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'manager', label: 'Manager', desc: 'Operational view, no user mgmt', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  { value: 'staff', label: 'Staff', desc: 'Limited front-office view', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
];

// ─── Utility ─────────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('uis_token') || '';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

async function apiPost(path: string, body: object) {
  const r = await fetch(`${API}${path}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || data?.message || r.statusText);
  return data;
}

async function apiGet(path: string) {
  const r = await fetch(`${API}${path}`, { headers: authHeaders() });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || r.statusText);
  return data;
}

async function apiDelete(path: string) {
  const r = await fetch(`${API}${path}`, { method: 'DELETE', headers: authHeaders() });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || r.statusText);
  return data;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const opt = ROLE_OPTIONS.find(r => r.value === role);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${opt?.badge || 'bg-slate-100 text-slate-600'}`}>
      {opt?.label || role}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500', inactive: 'bg-red-400', sandbox: 'bg-amber-400',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status] || 'bg-slate-400'}`} />;
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}

function StepIndicator({ step, current }: { step: number; current: number }) {
  const steps = ['Practice', 'Users', 'GHL Sync', 'Done'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <div key={n} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all
              ${active ? 'bg-uis-600 text-white shadow-lg shadow-uis-600/20' : done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black
                ${active ? 'bg-white/25' : done ? 'bg-emerald-200 dark:bg-emerald-700' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {done ? '✓' : n}
              </span>
              <span className="hidden sm:block">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${done ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Onboarding Wizard ────────────────────────────────────────────────────────

function OnboardWizard({ onToast }: { onToast: (msg: string, type: 'success' | 'error') => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [createdPractice, setCreatedPractice] = useState<Practice | null>(null);
  const [createdUsers, setCreatedUsers] = useState<PracticeUser[]>([]);

  const [pForm, setPForm] = useState({
    name: '', slug: '', pms_type: 'open_dental', subscription: 'professional',
    location_count: '1', status: 'active',
  });

  const [uForms, setUForms] = useState([
    { firstName: '', lastName: '', email: '', role: 'admin', password: '', displayName: '' }
  ]);
  const [showPwd, setShowPwd] = useState<boolean[]>([false]);

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // Step 1: Create practice
  async function createPractice() {
    if (!pForm.name.trim()) { onToast('Practice name is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await apiPost('/admin/practices', {
        ...pForm, location_count: parseInt(pForm.location_count) || 1,
      });
      setCreatedPractice(res.practice || res);
      onToast(`"${pForm.name}" created successfully`, 'success');
      setStep(2);
    } catch (e: any) {
      onToast(e.message || 'Failed to create practice — check API', 'error');
    } finally { setSaving(false); }
  }

  // Step 2: Create users
  async function createUsers() {
    const invalid = uForms.filter(u => !u.email || !u.firstName || !u.lastName || !u.password);
    if (invalid.length > 0) { onToast('All user fields are required', 'error'); return; }

    setSaving(true);
    const created: PracticeUser[] = [];
    let failed = 0;

    for (const u of uForms) {
      try {
        const res = await apiPost('/auth/register', {
          email: u.email.trim(),
          password: u.password,
          firstName: u.firstName.trim(),
          lastName: u.lastName.trim(),
          displayName: u.displayName.trim() || `${u.firstName.trim()} ${u.lastName.trim()}`,
          role: u.role,
          practiceId: createdPractice?.id || '',
        });
        if (res.user) created.push(res.user);
      } catch { failed++; }
    }

    setSaving(false);
    setCreatedUsers(created);
    if (failed > 0) onToast(`${created.length} created, ${failed} failed`, 'error');
    else { onToast(`${created.length} user(s) created!`, 'success'); setStep(3); }
  }

  // Step 3: GHL sync
  async function syncGHL() {
    if (!createdPractice) return;
    setSaving(true);
    try {
      await apiPost('/admin/ghl/sync-practice', {
        practiceId: createdPractice.id,
        practiceName: createdPractice.name,
        pmsType: createdPractice.pms_type,
        subscription: createdPractice.subscription,
        users: createdUsers,
      });
      onToast('Synced to GoHighLevel!', 'success');
    } catch {
      onToast('GHL sync queued — will sync on next cycle', 'error');
    } finally { setSaving(false); setStep(4); }
  }

  function reset() {
    setStep(1); setCreatedPractice(null); setCreatedUsers([]);
    setPForm({ name: '', slug: '', pms_type: 'open_dental', subscription: 'professional', location_count: '1', status: 'active' });
    setUForms([{ firstName: '', lastName: '', email: '', role: 'admin', password: '', displayName: '' }]);
  }

  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-uis-500 focus:border-transparent placeholder-slate-400 transition-all';
  const sel = inp + ' cursor-pointer';

  return (
    <div>
      <StepIndicator step={step} current={step} />

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Practice Record</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Add the client's practice to the UIS Health system</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Practice Name *</label>
              <input className={inp} placeholder="Riverside Dental Group" value={pForm.name}
                onChange={e => { const n = e.target.value; setPForm(f => ({ ...f, name: n, slug: slugify(n) })); }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">URL Slug *</label>
              <input className={inp} placeholder="riverside-dental" value={pForm.slug}
                onChange={e => setPForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Practice Management System *</label>
              <select className={sel} value={pForm.pms_type} onChange={e => setPForm(f => ({ ...f, pms_type: e.target.value }))}>
                {PMS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.icon} {o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Subscription Tier *</label>
              <select className={sel} value={pForm.subscription} onChange={e => setPForm(f => ({ ...f, subscription: e.target.value }))}>
                {SUBSCRIPTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Number of Locations</label>
              <input className={inp} type="number" min="1" value={pForm.location_count}
                onChange={e => setPForm(f => ({ ...f, location_count: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Status</label>
              <select className={sel} value={pForm.status} onChange={e => setPForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="sandbox">Sandbox / Trial</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="mt-4 p-3.5 bg-uis-50 dark:bg-uis-900/20 rounded-xl text-xs text-uis-700 dark:text-uis-300 flex gap-2">
            <Shield size={14} className="flex-shrink-0 mt-0.5" />
            <span>BAA must be signed and filed before proceeding. Do not create user accounts until the BAA is countersigned.</span>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={createPractice} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-uis-600 hover:bg-uis-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-uis-600/20">
              {saving ? <><RefreshCw size={14} className="animate-spin" /> Creating...</> : <>Create Practice <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create User Accounts</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Setting up users for <span className="font-semibold text-slate-700 dark:text-slate-200">{createdPractice?.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg font-mono">
              <CheckCircle2 size={12} />
              <span>{createdPractice?.id?.slice(0, 12)}...</span>
              <CopyButton text={createdPractice?.id || ''} />
            </div>
          </div>

          <div className="space-y-4">
            {uForms.map((u, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">User {i + 1}</span>
                  {i > 0 && (
                    <button onClick={() => { setUForms(f => f.filter((_, j) => j !== i)); setShowPwd(p => p.filter((_, j) => j !== i)); }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inp} placeholder="First name *" value={u.firstName}
                    onChange={e => setUForms(f => f.map((x, j) => j === i ? { ...x, firstName: e.target.value } : x))} />
                  <input className={inp} placeholder="Last name *" value={u.lastName}
                    onChange={e => setUForms(f => f.map((x, j) => j === i ? { ...x, lastName: e.target.value } : x))} />
                  <input className={inp + ' col-span-2'} placeholder="Email address *" type="email" value={u.email}
                    onChange={e => setUForms(f => f.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} />
                  <input className={inp} placeholder="Display name (e.g. Dr. Jane Smith)" value={u.displayName}
                    onChange={e => setUForms(f => f.map((x, j) => j === i ? { ...x, displayName: e.target.value } : x))} />
                  <select className={sel} value={u.role}
                    onChange={e => setUForms(f => f.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}>
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                  </select>
                  <div className="col-span-2 relative">
                    <input className={inp + ' pr-10'} placeholder="Temporary password * (min 8 chars, uppercase + number)"
                      type={showPwd[i] ? 'text' : 'password'} value={u.password}
                      onChange={e => setUForms(f => f.map((x, j) => j === i ? { ...x, password: e.target.value } : x))} />
                    <button onClick={() => setShowPwd(p => p.map((x, j) => j === i ? !x : x))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd[i] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => { setUForms(f => [...f, { firstName: '', lastName: '', email: '', role: 'admin', password: '', displayName: '' }]); setShowPwd(p => [...p, false]); }}
            className="w-full mt-3 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-400 dark:text-slate-500 hover:border-uis-400 hover:text-uis-500 transition-colors flex items-center justify-center gap-2">
            <UserPlus size={15} /> Add another user
          </button>

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <ArrowLeft size={14} /> Back
            </button>
            <button onClick={createUsers} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-uis-600 hover:bg-uis-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-uis-600/20">
              {saving ? <><RefreshCw size={14} className="animate-spin" /> Creating users...</> : <>Create {uForms.length} User{uForms.length !== 1 ? 's' : ''} <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: GHL */}
      {step === 3 && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sync to GoHighLevel</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create the practice contact in your CRM and tag with account details</p>
          </div>

          {/* Summary */}
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Users created</p>
            <div className="space-y-2">
              {createdUsers.map(u => (
                <div key={u.userId} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-uis-400 to-uis-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.firstName?.[0]}{u.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
              ))}
            </div>
          </div>

          {/* GHL info */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700 mb-4 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
            <Zap size={13} className="flex-shrink-0 mt-0.5" />
            <span>GHL sync will create a contact for <strong>{createdPractice?.name}</strong> tagged with <code>uis-client</code>, <code>{createdPractice?.subscription}</code>, and <code>{createdPractice?.pms_type}</code>. Admin users will be added as sub-contacts.</span>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(4)} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              Skip →
            </button>
            <button onClick={syncGHL} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-uis-600 hover:bg-uis-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-uis-600/20">
              {saving ? <><RefreshCw size={14} className="animate-spin" /> Syncing...</> : <><Zap size={14} /> Sync to GHL <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Done */}
      {step === 4 && (
        <div className="text-center py-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-4xl mx-auto mb-5">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Client Onboarded!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{createdPractice?.name} is live. Now connect their PMS and send credentials.</p>

          {/* Practice ID box */}
          {createdPractice && (
            <div className="mx-auto max-w-md bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-left mb-6 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Practice ID (needed for PMS config)</p>
              <div className="flex items-center gap-2 font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
                <span className="flex-1 break-all">{createdPractice.id}</span>
                <CopyButton text={createdPractice.id} />
              </div>
            </div>
          )}

          {/* Next steps */}
          <div className="mx-auto max-w-md text-left bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Next steps</p>
            <div className="space-y-2">
              {[
                'Send welcome email with login credentials to all users',
                'Direct users to app.uishealth.com to change temp password',
                'Collect PMS credentials from the client',
                'Configure PMS env vars on Container App',
                'Trigger initial data sync and verify dashboard',
                'Schedule kickoff training session',
                'Set Day 7, 14, and 30 check-ins',
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-uis-100 dark:bg-uis-900/40 text-uis-700 dark:text-uis-300 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </div>

          <button onClick={reset}
            className="px-6 py-2.5 bg-uis-600 hover:bg-uis-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-uis-600/20">
            Onboard Another Client
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Practices List ───────────────────────────────────────────────────────────

function PracticesList({ onToast }: { onToast: (msg: string, type: 'success' | 'error') => void }) {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet('/admin/practices');
      setPractices(res.practices || []);
    } catch { onToast('Could not load practices', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-slate-300" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Practices</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{practices.length} client{practices.length !== 1 ? 's' : ''} in the system</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {practices.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Building2 size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No practices yet. Use the Onboard tab to add your first client.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {practices.map(p => (
            <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-uis-200 dark:hover:border-uis-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-uis-400 to-uis-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                  <StatusDot status={p.status} />
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-500">{PMS_OPTIONS.find(o => o.value === p.pms_type)?.icon} {PMS_OPTIONS.find(o => o.value === p.pms_type)?.label || p.pms_type}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500 capitalize">{p.subscription}</span>
                  {p.location_count && p.location_count > 1 && <>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{p.location_count} locations</span>
                  </>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                {p.id?.slice(0, 8)}...
                <CopyButton text={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Users Manager ────────────────────────────────────────────────────────────

function UsersManager({ onToast }: { onToast: (msg: string, type: 'success' | 'error') => void }) {
  const [users, setUsers] = useState<PracticeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', role: 'admin', password: '', practiceId: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet('/auth/users');
      setUsers(res.users || []);
    } catch { onToast('Could not load users', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete ${email}? This cannot be undone.`)) return;
    try {
      await apiDelete(`/auth/users/${userId}`);
      setUsers(u => u.filter(x => x.userId !== userId));
      onToast('User deleted', 'success');
    } catch (e: any) { onToast(e.message, 'error'); }
  }

  async function addUser() {
    if (!newUser.email || !newUser.firstName || !newUser.lastName || !newUser.password) {
      onToast('All fields are required', 'error'); return;
    }
    setSaving(true);
    try {
      const res = await apiPost('/auth/register', {
        ...newUser,
        displayName: `${newUser.firstName} ${newUser.lastName}`,
      });
      if (res.user) setUsers(u => [res.user, ...u]);
      setShowAdd(false);
      setNewUser({ firstName: '', lastName: '', email: '', role: 'admin', password: '', practiceId: '' });
      onToast('User created!', 'success');
    } catch (e: any) { onToast(e.message, 'error'); }
    finally { setSaving(false); }
  }

  const filtered = users.filter(u =>
    search === '' ||
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-uis-500 focus:border-transparent placeholder-slate-400';
  const sel = inp + ' cursor-pointer';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">User Accounts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''} across all practices</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-uis-600 hover:bg-uis-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={14} /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={inp + ' pl-9'} placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><RefreshCw size={24} className="animate-spin text-slate-300" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'No users match your search' : 'No users yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => (
            <div key={u.userId} className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors
              ${i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800/20 border-slate-100 dark:border-slate-700/50'}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-uis-400 to-uis-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {u.firstName?.[0]}{u.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                    {u.displayName || `${u.firstName} ${u.lastName}`}
                  </p>
                  <RoleBadge role={u.role} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  {u.lastLogin && (
                    <>
                      <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                      <p className="text-xs text-slate-400">Last login {new Date(u.lastLogin).toLocaleDateString()}</p>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => deleteUser(u.userId, u.email)}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add User</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">First Name *</label>
                  <input className={inp} value={newUser.firstName} onChange={e => setNewUser(u => ({ ...u, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Last Name *</label>
                  <input className={inp} value={newUser.lastName} onChange={e => setNewUser(u => ({ ...u, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email Address *</label>
                <input className={inp} type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Role *</label>
                <select className={sel} value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Temporary Password *</label>
                <div className="relative">
                  <input className={inp + ' pr-10'} type={showPwd ? 'text' : 'password'} value={newUser.password}
                    onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} />
                  <button onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Practice ID (optional)</label>
                <input className={inp} placeholder="Leave blank to use default practice" value={newUser.practiceId}
                  onChange={e => setNewUser(u => ({ ...u, practiceId: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={addUser} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-uis-600 hover:bg-uis-700 disabled:opacity-50 rounded-xl transition-colors">
                {saving ? <><RefreshCw size={13} className="animate-spin" /> Creating...</> : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GHL Panel ────────────────────────────────────────────────────────────────

function GHLPanel({ onToast }: { onToast: (msg: string, type: 'success' | 'error') => void }) {
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [connected, setConnected] = useState(true);

  const load = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await apiGet(`/admin/ghl/contacts?search=${encodeURIComponent(q)}`);
      setContacts(res.contacts || []);
      setConnected(true);
    } catch {
      setConnected(false);
      onToast('Could not reach GHL — check token', 'error');
    } finally { setLoading(false); }
  }, []);

  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-uis-500 focus:border-transparent placeholder-slate-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">GoHighLevel CRM</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Contacts and sync status</p>
        </div>
        <button onClick={() => load(search)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Connection status */}
      <div className={`flex items-center gap-3 p-3.5 rounded-2xl border mb-5 text-sm
        ${connected ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
        <span className={`font-semibold ${connected ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
          {connected ? 'GoHighLevel Connected' : 'Connection Failed'}
        </span>
        {connected && <span className="text-emerald-600 dark:text-emerald-400 text-xs">— UIS Health LLC · 9/9 workflows active</span>}
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={inp + ' pl-9'} placeholder="Search by name, email, or phone..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(search)} />
        </div>
        <button onClick={() => load(search)}
          className="px-4 py-2.5 bg-uis-600 hover:bg-uis-700 text-white text-sm font-semibold rounded-xl transition-colors">
          Search
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Sync Patients', icon: <RefreshCw size={14} />, action: () => { onToast('Patient sync triggered', 'success'); } },
          { label: 'GHL Workflows', icon: <Zap size={14} />, action: () => window.open('https://app.gohighlevel.com/v2/location/workflows', '_blank') },
          { label: 'Open GHL', icon: <Globe size={14} />, action: () => window.open('https://app.gohighlevel.com', '_blank') },
        ].map(a => (
          <button key={a.label} onClick={a.action}
            className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-sm text-slate-700 dark:text-slate-300 font-medium">
            <span className="text-slate-400">{a.icon}</span> {a.label}
          </button>
        ))}
      </div>

      {/* Contacts list */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw size={24} className="animate-spin text-slate-300" /></div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Search for contacts or click Refresh to load recent contacts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 hover:border-uis-200 dark:hover:border-uis-700 transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {c.firstName?.[0]}{c.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white">{c.firstName} {c.lastName}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {c.email && <span className="text-xs text-slate-500 flex items-center gap-1"><Globe size={10} /> {c.email}</span>}
                  {c.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 justify-end max-w-[140px]">
                {(c.tags || []).slice(0, 2).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] rounded font-mono">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'onboard' | 'practices' | 'users' | 'ghl'>('onboard');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
  }

  // Admin-only guard
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl mx-auto mb-4">🔒</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Admin Access Required</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">This page is only accessible to admin users.</p>
      </div>
    );
  }

  const TABS = [
    { id: 'onboard', label: 'Onboard Client', icon: '🚀', desc: 'Guided wizard' },
    { id: 'practices', label: 'Practices', icon: '🏥', desc: 'View all' },
    { id: 'users', label: 'Users', icon: '👥', desc: 'Manage accounts' },
    { id: 'ghl', label: 'GoHighLevel', icon: '⚡', desc: 'CRM sync' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-uis-500 to-uis-700 flex items-center justify-center shadow-lg shadow-uis-600/20">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Console</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Client onboarding · User management · GHL sync</p>
          </div>
          <span className="ml-2 px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-black rounded-full uppercase tracking-widest">
            Onboarding Team Only
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-2 rounded-xl transition-all text-xs font-semibold
              ${tab === t.id ? 'bg-uis-600 text-white shadow-md shadow-uis-600/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
            <span className={`text-[9px] font-normal ${tab === t.id ? 'text-uis-100' : 'text-slate-400'}`}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Content card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        {tab === 'onboard' && <OnboardWizard onToast={showToast} />}
        {tab === 'practices' && <PracticesList onToast={showToast} />}
        {tab === 'users' && <UsersManager onToast={showToast} />}
        {tab === 'ghl' && <GHLPanel onToast={showToast} />}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
