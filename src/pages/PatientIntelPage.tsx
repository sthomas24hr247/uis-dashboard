import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Users, AlertTriangle, Clock, Activity, TrendingDown, Calendar,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

type Tier = 'critical' | 'high' | 'moderate' | 'low' | string;

interface Prediction {
  patient_id: string;
  first_name: string;
  last_name: string;
  attrition_risk_score: number | null;
  attrition_risk_tier: Tier | null;
  attrition_factors: string | null;
  cancel_risk_score: number | null;
  cancel_risk_tier: Tier | null;
  cancel_risk_factors: string | null;
  days_since_last_visit: number | null;
  predicted_next_visit: string | null;
}

const tierColor: Record<string, string> = {
  critical: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  high: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  moderate: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  low: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
};

function pct(n: number | null): string {
  if (n === null || n === undefined) return '—';
  const v = n <= 1 ? n * 100 : n;
  return `${Math.round(v)}%`;
}

// Render the JSON factors as readable chips
function factorChips(raw: string | null): { label: string; value: string }[] {
  if (!raw) return [];
  try {
    const o = JSON.parse(raw);
    const out: { label: string; value: string }[] = [];
    if (o.days_since_last_visit !== undefined) out.push({ label: 'Days since visit', value: String(o.days_since_last_visit) });
    if (o.visits !== undefined) out.push({ label: 'Visits', value: String(o.visits) });
    if (o.appts !== undefined) out.push({ label: 'Appointments', value: String(o.appts) });
    if (o.cancels !== undefined) out.push({ label: 'Cancellations', value: String(o.cancels) });
    if (o.engagement !== undefined) out.push({ label: 'Engagement', value: (o.engagement * 100).toFixed(0) + '%' });
    if (o.recency !== undefined) out.push({ label: 'Recency', value: (o.recency * 100).toFixed(0) + '%' });
    return out;
  } catch { return []; }
}

export default function PatientIntelPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [rows, setRows] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Tier | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/predictions/patients?limit=300`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setRows(d.predictions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const summary = useMemo(() => {
    const s = { critical: 0, high: 0, moderate: 0, low: 0, total: rows.length };
    rows.forEach(r => {
      const t = (r.attrition_risk_tier || '').toLowerCase();
      if (t in s) (s as any)[t]++;
    });
    return s;
  }, [rows]);

  const filtered = useMemo(() => {
    const list = filter === 'all' ? rows : rows.filter(r => (r.attrition_risk_tier || '').toLowerCase() === filter);
    return [...list].sort((a, b) => (b.attrition_risk_score ?? 0) - (a.attrition_risk_score ?? 0));
  }, [rows, filter]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-500" /> Patient Intelligence
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Patients ranked by attrition risk — with the signals driving each score
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Scored', value: summary.total, color: 'text-slate-700 dark:text-slate-200', icon: Activity },
          { label: 'Critical', value: summary.critical, color: 'text-red-600 dark:text-red-400', icon: AlertTriangle },
          { label: 'High', value: summary.high, color: 'text-orange-600 dark:text-orange-400', icon: TrendingDown },
          { label: 'Moderate', value: summary.moderate, color: 'text-amber-600 dark:text-amber-400', icon: Clock },
          { label: 'Low', value: summary.low, color: 'text-emerald-600 dark:text-emerald-400', icon: Users },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><c.icon className={`w-4 h-4 ${c.color}`} /><span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{c.label}</span></div>
            <div className={`text-2xl font-bold ${c.color}`}>{loading ? '—' : c.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'critical', 'high', 'moderate', 'low'].map(t => (
          <button key={t} onClick={() => setFilter(t as any)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${filter === t ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Patient list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading patient intelligence…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No patients in this risk tier.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(r => {
              const tier = (r.attrition_risk_tier || 'low').toLowerCase();
              const isOpen = expanded === r.patient_id;
              return (
                <div key={r.patient_id}>
                  <button onClick={() => setExpanded(isOpen ? null : r.patient_id)} className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white truncate">{r.first_name} {r.last_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> {r.days_since_last_visit ?? '—'} days since last visit</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400">Cancel risk</div>
                      <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">{pct(r.cancel_risk_score)}</div>
                    </div>
                    <div className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold ${tierColor[tier] || tierColor.low}`}>
                      {pct(r.attrition_risk_score)} <span className="text-xs font-medium capitalize opacity-80">{tier}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 bg-slate-50 dark:bg-slate-900/30">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 pt-2">Attrition signals</div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {factorChips(r.attrition_factors).map((f, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">{f.label}:</span> <span className="font-semibold">{f.value}</span>
                          </span>
                        ))}
                        {factorChips(r.attrition_factors).length === 0 && <span className="text-xs text-slate-400">No signal detail available.</span>}
                      </div>
                      {r.predicted_next_visit && (
                        <div className="text-xs text-slate-500">Predicted next visit: <span className="font-medium text-slate-700 dark:text-slate-300">{r.predicted_next_visit}</span></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
