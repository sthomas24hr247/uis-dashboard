import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target, Percent,
  Phone, CalendarPlus, Mail, ChevronRight, Activity, Loader2, RefreshCw,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';
const PRACTICE_ID = '00000000-0000-0000-0000-000000000001';

interface FunnelStage { stage: string; count: number; value?: number; }
interface FunnelData { funnel: FunnelStage[]; total_episodes: number; total_plan_value: number; total_collected: number; total_leaked: number; overall_gap_pct: string; }
interface LeakageItem { leak_stage: string; leak_reason: string; episodes: number; total_leaked_value: number; avg_leaked_value: number; }
interface StalledEpisode { id: string; patient_id: string; ai_finding_type: string; plan_value: number; current_stage: string; stalled_at_stage: string; days_stalled: number; diagnosis_code: string; }

function useOutcomeGapData() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [leakageData, setLeakageData] = useState<LeakageItem[]>([]);
  const [stalledData, setStalledData] = useState<StalledEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [funnelRes, leakageRes, stalledRes] = await Promise.all([
        fetch(`${API_URL}/api/outcome-gap/funnel?practice_id=${PRACTICE_ID}`),
        fetch(`${API_URL}/api/outcome-gap/leakage?practice_id=${PRACTICE_ID}`),
        fetch(`${API_URL}/api/outcome-gap/stalled?practice_id=${PRACTICE_ID}&min_days=1`),
      ]);
      setFunnelData(await funnelRes.json());
      setLeakageData((await leakageRes.json()).leakage || []);
      setStalledData((await stalledRes.json()).stalled || []);
    } catch (err) {
      setError('Failed to load outcome gap data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  return { funnelData, leakageData, stalledData, loading, error, refresh: fetchData };
}

function StatCard({ label, value, subtitle, trend, up, variant }: {
  label: string; value: string; subtitle: string; trend?: string; up?: boolean; variant: string;
}) {
  const isSuccess = variant === 'success';
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
      <p className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 mb-3">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className={`text-3xl font-bold ${isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{value}</span>
        {trend && (
          <span className={`flex items-center gap-1 text-sm font-medium ${up ? 'text-red-500' : 'text-emerald-500'}`}>
            {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}{trend}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{subtitle}</p>
    </div>
  );
}

function RevenueFunnel({ funnel }: { funnel: FunnelStage[] }) {
  const maxCount = Math.max(...funnel.map(s => s.count || 0), 1);
  const colors = ['bg-blue-500','bg-blue-400','bg-teal-500','bg-teal-400','bg-emerald-500','bg-yellow-500','bg-orange-400','bg-orange-500','bg-red-500'];
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Revenue Funnel</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Episode flow from detection to collection</p>
        </div>
        <span className="text-sm text-slate-400 dark:text-slate-500">Live Data</span>
      </div>
      <div className="space-y-2.5">
        {funnel.map((step, i) => {
          const prevCount = i > 0 ? (funnel[i - 1].count || 0) : 0;
          const drop = i > 0 && prevCount > 0 ? Math.round(((step.count - prevCount) / prevCount) * 100) : null;
          return (
            <div key={step.stage} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 w-20 text-right flex-shrink-0">{step.stage}</span>
              <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700/50 rounded-lg overflow-hidden relative">
                <div className={`h-full ${colors[i] || 'bg-slate-500'} rounded-lg transition-all duration-500 flex items-center px-3`}
                  style={{ width: `${Math.max(((step.count || 0) / maxCount) * 100, 4)}%` }}>
                  <span className="text-xs font-bold text-white drop-shadow-sm">{step.count || 0}</span>
                </div>
              </div>
              {step.value !== undefined ? (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-16 text-right flex-shrink-0">
                  ${step.value >= 1000 ? `${(step.value / 1000).toFixed(1)}K` : step.value}
                </span>
              ) : <span className="w-16 flex-shrink-0" />}
              <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${
                drop === null ? 'text-transparent' : Math.abs(drop) >= 20 ? 'text-red-500' : 'text-orange-500'
              }`}>{drop !== null ? `${drop}%` : '—'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GapBreakdownPanel({ leakage }: { leakage: LeakageItem[] }) {
  const colors = ['bg-red-500','bg-orange-400','bg-amber-400','bg-rose-400','bg-blue-400','bg-teal-500','bg-slate-400'];
  const byStage: Record<string, number> = {};
  leakage.forEach(l => {
    const label = l.leak_stage ? `${l.leak_stage.charAt(0).toUpperCase() + l.leak_stage.slice(1)} Gap` : 'Unknown';
    byStage[label] = (byStage[label] || 0) + (l.total_leaked_value || 0);
  });
  const gaps = Object.entries(byStage).map(([type, amount], i) => ({ type, amount, color: colors[i % colors.length] })).sort((a, b) => b.amount - a.amount);
  const total = gaps.reduce((s, g) => s + g.amount, 0);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
      <h3 className="font-bold text-slate-900 dark:text-white mb-1">Gap Breakdown</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Revenue lost by gap type {total > 0 ? `— $${total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total} total` : ''}
      </p>
      {gaps.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Target className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No leakage data yet</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex h-5 rounded-full overflow-hidden mb-5">
            {gaps.map((g) => (
              <div key={g.type} className={`${g.color} transition-all`} style={{ width: `${total > 0 ? (g.amount / total) * 100 : 0}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {gaps.map((g) => (
              <div key={g.type} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${g.color} flex-shrink-0`} />
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{g.type}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-auto">
                  ${g.amount >= 1000 ? `${(g.amount / 1000).toFixed(1)}K` : g.amount}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StalledEpisodesTable({ stalled }: { stalled: StalledEpisode[] }) {
  const getPriorityFromDays = (days: number) => {
    if (days >= 14) return 'CRITICAL';
    if (days >= 7) return 'HIGH';
    if (days >= 3) return 'MEDIUM';
    return 'LOW';
  };
  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'CRITICAL': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50';
      case 'HIGH': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
      case 'MEDIUM': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      default: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
    }
  };
  const getGapType = (stage: string) => {
    const map: Record<string, string> = { detected: 'Diagnosis Gap', diagnosed: 'Planning Gap', planned: 'Presentation Gap', presented: 'Acceptance Gap', accepted: 'Scheduling Gap', scheduled: 'Attendance Gap', attended: 'Completion Gap', completed: 'Collection Gap' };
    return map[stage] || 'Unknown Gap';
  };
  const sorted = [...stalled].sort((a, b) => (b.days_stalled || 0) - (a.days_stalled || 0));

  if (sorted.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
        <h3 className="font-bold text-slate-900 dark:text-white mb-1">Priority Actions</h3>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Target className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No stalled episodes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Priority Actions</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{sorted.length} stalled episodes requiring attention</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">PRIORITY</th>
              <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">FINDING</th>
              <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">GAP TYPE</th>
              <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">STALLED AT</th>
              <th className="text-right text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">DAYS</th>
              <th className="text-right text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">$ AT RISK</th>
              <th className="text-right text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const priority = getPriorityFromDays(row.days_stalled || 0);
              return (
                <tr key={row.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 pr-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border ${getPriorityStyle(priority)}`}>{priority}</span>
                  </td>
                  <td className="py-4 pr-4"><span className="font-semibold text-sm text-slate-900 dark:text-white">{row.ai_finding_type || 'Unknown'}</span></td>
                  <td className="py-4 pr-4"><span className="text-sm text-slate-600 dark:text-slate-300">{getGapType(row.stalled_at_stage)}</span></td>
                  <td className="py-4 pr-4"><span className="text-sm text-slate-500 dark:text-slate-400 capitalize">{row.stalled_at_stage}</span></td>
                  <td className="py-4 pr-4 text-right">
                    <span className={`text-sm font-medium ${(row.days_stalled || 0) >= 10 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{row.days_stalled || 0}d</span>
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{row.plan_value ? `$${row.plan_value.toLocaleString()}` : '—'}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><Phone className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><CalendarPlus className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><Mail className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OutcomeGapPage() {
  const { funnelData, leakageData, stalledData, loading, error, refresh } = useOutcomeGapData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Loading Outcome Gap data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-medium">{error}</p>
          <button onClick={refresh} className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium">Try Again</button>
        </div>
      </div>
    );
  }

  const funnel = funnelData?.funnel || [];
  const totalPlan = funnelData?.total_plan_value || 0;
  const totalCollected = funnelData?.total_collected || 0;
  const totalLeaked = funnelData?.total_leaked || 0;
  const gapPct = funnelData?.overall_gap_pct || '0';
  const totalEpisodes = funnelData?.total_episodes || 0;
  const stalledCount = stalledData.length;
  const collectionRate = totalPlan > 0 ? ((totalCollected / totalPlan) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20 dark:shadow-rose-500/10">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Outcome Gap Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">Track every dollar from AI detection to collection</p>
          </div>
        </div>
        <button onClick={refresh} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="OUTCOME GAP" value={`${gapPct}%`} subtitle={`$${totalLeaked >= 1000 ? `${(totalLeaked / 1000).toFixed(1)}K` : totalLeaked} leaked`} variant="danger" />
        <StatCard label="TOTAL PLAN VALUE" value={`$${totalPlan >= 1000 ? `${(totalPlan / 1000).toFixed(1)}K` : totalPlan}`} subtitle={`${totalEpisodes} treatment episodes`} variant="danger" />
        <StatCard label="STALLED EPISODES" value={stalledCount.toString()} subtitle="Requiring intervention" variant={stalledCount > 0 ? 'danger' : 'success'} />
        <StatCard label="COLLECTION RATE" value={`${collectionRate}%`} subtitle={`$${totalCollected >= 1000 ? `${(totalCollected / 1000).toFixed(1)}K` : totalCollected} collected`} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RevenueFunnel funnel={funnel} /></div>
        <GapBreakdownPanel leakage={leakageData} />
      </div>

      <StalledEpisodesTable stalled={stalledData} />

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">Dentamind AI — Outcome Gap Intelligence Engine · Live Data</p>
      </div>
    </div>
  );
}
