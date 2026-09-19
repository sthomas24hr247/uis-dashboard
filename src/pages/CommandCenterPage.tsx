import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Users, TrendingDown, Activity, AlertTriangle, ArrowRight,
  Shield, Target, RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

const PRACTICE_ID = '65f84018-7f64-423a-82ce-805384130a66';

function fmtMoney(n: number | null | undefined, k = false): string {
  if (n === null || n === undefined) return '—';
  if (k && Math.abs(n) >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
function pct(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const v = n <= 1 ? n * 100 : n;
  return Math.round(v) + '%';
}

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gap, setGap] = useState<any>(null);
  const [preds, setPreds] = useState<any>(null);
  const [practice, setPractice] = useState<any>(null);
  const [churnAlerts, setChurnAlerts] = useState<any[]>([]);
  const [stalledAlerts, setStalledAlerts] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [gapRes, predRes, practiceRes, churnRes, stalledRes] = await Promise.all([
          apiFetch('/api/outcome-gap/summary'),
          apiFetch('/api/predictions/summary'),
          apiFetch('/api/dashboard/practice-summary'),
          apiFetch(`/api/predictions/patients?limit=50`),
          apiFetch(`/api/outcome-gap/stalled?practice_id=${PRACTICE_ID}&min_days=1`),
        ]);
        const gapData = await gapRes.json().catch(() => null);
        const predData = await predRes.json().catch(() => null);
        const practiceData = await practiceRes.json().catch(() => null);
        const churnData = await churnRes.json().catch(() => ({ predictions: [] }));
        const stalledData = await stalledRes.json().catch(() => ({ stalled: [] }));
        if (!alive) return;
        setGap(gapData);
        setPreds(predData);
        setPractice(practiceData?.offices?.[0] || null);
        const churn = (churnData.predictions || [])
          .filter((p: any) => p.attrition_risk_score != null)
          .sort((a: any, b: any) => (b.attrition_risk_score || 0) - (a.attrition_risk_score || 0))
          .slice(0, 5);
        setChurnAlerts(churn);
        const stalled = (stalledData.stalled || [])
          .sort((a: any, b: any) => (b.plan_value || 0) - (a.plan_value || 0))
          .slice(0, 5);
        setStalledAlerts(stalled);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  const revenueAtRisk = gap?.total_leaked_value ?? null;
  const atRiskPatients = preds?.high_attrition_risk ?? null;
  const collectionRate = practice ? (100 - (gap?.overall_gap_pct ?? 0)) : null;
  const activePatients = practice?.activePatients ?? null;
  const qci = practice?.qciScore ?? null;
  const recoverable = gap ? (gap.total_leaked_value) : null;
  const stalledCount = gap?.leaked_episodes ?? stalledAlerts.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Executive Command Center</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {practice?.name || 'PoshPearl Family Dental Studio'}{practice?.location ? ` · ${practice.location}` : ' · Yucaipa, CA'} · Dentrix Ascend · Connected
          </p>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Revenue at Risk" value={fmtMoney(revenueAtRisk)} sub="Recoverable treatment gap" color="text-red-600 dark:text-red-400" loading={loading} />
        <MetricCard icon={Users} label="At-Risk Patients" value={atRiskPatients?.toString() ?? '—'} sub="High attrition risk" color="text-amber-600 dark:text-amber-400" loading={loading} />
        <MetricCard icon={TrendingDown} label="Collection Rate" value={pct(collectionRate)} sub="Collected ÷ planned" color="text-emerald-600 dark:text-emerald-400" loading={loading} />
        <MetricCard icon={Activity} label="Active Patients" value={activePatients?.toLocaleString() ?? '—'} sub={qci ? `QCI ${qci}` : 'Practice-wide'} color="text-blue-600 dark:text-blue-400" loading={loading} />
      </div>

      {/* Signal snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SignalCard icon={Target} title="Recoverable Revenue" value={fmtMoney(recoverable)} detail={`${gap?.leaked_episodes ?? '—'} treatment episodes leaked`} action="Revenue Recovery" onClick={() => navigate('/outcome-gap/classified')} loading={loading} />
        <SignalCard icon={Users} title="Patient Attrition" value={atRiskPatients ? `${atRiskPatients} at risk` : '—'} detail={preds ? `of ${preds.total_patients?.toLocaleString()} scored patients` : ''} action="Patient Intel" onClick={() => navigate('/patient-intel')} loading={loading} />
        <SignalCard icon={TrendingDown} title="Treatment Leakage" value={stalledCount ? `${stalledCount.toLocaleString()} stalled` : '—'} detail={gap ? `${gap.overall_gap_pct}% outcome gap` : ''} action="Outcome Gap" onClick={() => navigate('/outcome-gap')} loading={loading} />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Churn alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Patients Most at Risk</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? <div className="p-6 text-center text-slate-400 text-sm">Loading…</div> :
             churnAlerts.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">No at-risk patients found.</div> :
             churnAlerts.map((p, i) => (
              <button key={i} onClick={() => navigate('/patient-intel')} className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{p.first_name} {p.last_name}</div>
                  <div className="text-xs text-slate-400">{p.days_since_last_visit ?? '—'} days since last visit</div>
                </div>
                <div className="px-2.5 py-1 rounded-lg text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">{pct(p.attrition_risk_score)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Stalled treatment alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Highest-Value Stalled Treatment</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? <div className="p-6 text-center text-slate-400 text-sm">Loading…</div> :
             stalledAlerts.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">No stalled treatment found.</div> :
             stalledAlerts.map((e, i) => (
              <button key={i} onClick={() => navigate('/outcome-gap/classified')} className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{e.first_name} {e.last_name}</div>
                  <div className="text-xs text-slate-400">Stalled at {e.stalled_at_stage} · {e.days_stalled ?? '—'} days</div>
                </div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{fmtMoney(e.plan_value)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">Live practice intelligence for {practice?.name || 'PoshPearl Family Dental Studio'}. Figures update as data syncs from your practice management system.</p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color, loading }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${color}`} /><span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span></div>
      <div className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  );
}

function SignalCard({ icon: Icon, title, value, detail, action, onClick, loading }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4 text-teal-500" /><span className="text-sm font-semibold text-slate-800 dark:text-white">{title}</span></div>
      <div className="text-xl font-bold text-slate-900 dark:text-white">{loading ? '—' : value}</div>
      <div className="text-xs text-slate-400 mt-1 flex-1">{detail}</div>
      <button onClick={onClick} className="mt-3 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">{action} <ArrowRight className="w-3 h-3" /></button>
    </div>
  );
}
