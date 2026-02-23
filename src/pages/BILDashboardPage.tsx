import { useState, useEffect } from 'react';
import {
  Activity, RefreshCw, Loader2, Users, Clock, CheckCircle2, XCircle,
  TrendingUp, Zap, Target, BarChart3, Brain, Timer, ChevronRight,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';
const PRACTICE_ID = '00000000-0000-0000-0000-000000000001';

interface DecisionEvent {
  id: string;
  recommendation_id: string;
  staff_member_id: string;
  decision: string;
  presented_at: string;
  decision_at: string;
  time_to_decision_ms: number;
  rec_type: string;
  rec_subtype: string;
  rec_complexity: number;
  rec_estimated_revenue: number;
  rec_priority: string;
  rejection_reason_code: string;
  follow_through_status: string;
  device_type: string;
}

interface BILSummary {
  practice_id: string;
  total_decisions: number;
  approved: number;
  rejected: number;
  delayed: number;
  ignored: number;
  approval_rate: number;
  follow_through_rate: number;
  avg_decision_time_ms: number;
  total_estimated_revenue: number;
  approved_revenue: number;
}

export default function BILDashboardPage() {
  const [summary, setSummary] = useState<BILSummary | null>(null);
  const [events, setEvents] = useState<DecisionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, eventsRes] = await Promise.all([
        fetch(`${API_URL}/api/bil/summary`).then(r => r.json()),
        fetch(`${API_URL}/api/bil/decision-events?practice_id=${PRACTICE_ID}`).then(r => r.json()),
      ]);
      setSummary(sumRes.summary?.[0] || null);
      setEvents(eventsRes.events || []);
    } catch (err) {
      console.error('[BIL] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
      </div>
    );
  }

  const decisionColor = (d: string) => {
    switch (d) {
      case 'approved': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'delayed': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-500';
    }
  };

  // Compute per-type breakdown
  const typeBreakdown: Record<string, { total: number; approved: number; revenue: number }> = {};
  events.forEach(e => {
    if (!typeBreakdown[e.rec_type]) typeBreakdown[e.rec_type] = { total: 0, approved: 0, revenue: 0 };
    typeBreakdown[e.rec_type].total++;
    if (e.decision === 'approved') {
      typeBreakdown[e.rec_type].approved++;
      typeBreakdown[e.rec_type].revenue += e.rec_estimated_revenue || 0;
    }
  });

  // Rejection reasons
  const rejReasons: Record<string, number> = {};
  events.filter(e => e.decision === 'rejected' && e.rejection_reason_code).forEach(e => {
    rejReasons[e.rejection_reason_code] = (rejReasons[e.rejection_reason_code] || 0) + 1;
  });

  // Decision speed distribution
  const speedBuckets = { fast: 0, normal: 0, slow: 0, delayed: 0 };
  events.forEach(e => {
    const ms = e.time_to_decision_ms || 0;
    if (ms < 3000) speedBuckets.fast++;
    else if (ms < 10000) speedBuckets.normal++;
    else if (ms < 30000) speedBuckets.slow++;
    else speedBuckets.delayed++;
  });

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Behavioral Intelligence Layer</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">How your team responds to AI recommendations</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* KPI Row */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">TOTAL DECISIONS</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total_decisions}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">APPROVED</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.approved}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">REJECTED</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.rejected}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">APPROVAL RATE</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.approval_rate}%</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">AVG DECISION</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{(summary.avg_decision_time_ms / 1000).toFixed(1)}s</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">APPROVED $</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${summary.approved_revenue?.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Decision by Type */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-500" /> Decisions by Type
          </h3>
          <div className="space-y-3">
            {Object.entries(typeBreakdown).sort((a, b) => b[1].total - a[1].total).map(([type, data]) => {
              const approvalRate = data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 dark:text-slate-300 capitalize">{type.replace('_', ' ')}</span>
                    <span className="text-xs text-slate-400">{data.approved}/{data.total} ({approvalRate}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${approvalRate}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(typeBreakdown).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No decisions yet</p>
            )}
          </div>
        </div>

        {/* Decision Speed */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Timer className="w-4 h-4 text-teal-500" /> Decision Speed
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Fast (<3s)', count: speedBuckets.fast, color: 'bg-emerald-500', desc: 'Instant recognition' },
              { label: 'Normal (3-10s)', count: speedBuckets.normal, color: 'bg-teal-500', desc: 'Quick evaluation' },
              { label: 'Slow (10-30s)', count: speedBuckets.slow, color: 'bg-amber-500', desc: 'Careful consideration' },
              { label: 'Delayed (>30s)', count: speedBuckets.delayed, color: 'bg-red-500', desc: 'Hesitation detected' },
            ].map(bucket => {
              const total = events.length || 1;
              const pct = Math.round((bucket.count / total) * 100);
              return (
                <div key={bucket.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{bucket.label}</span>
                      <span className="text-[10px] text-slate-400 ml-2">{bucket.desc}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{bucket.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${bucket.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rejection Reasons */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" /> Rejection Reasons
          </h3>
          {Object.keys(rejReasons).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(rejReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                  <span className="text-sm text-slate-700 dark:text-slate-200 capitalize">{reason.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No rejections yet!</p>
            </div>
          )}
        </div>
      </div>

      {/* Decision Event Log */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-500" /> Decision Event Log
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 pb-3 pr-4">DECISION</th>
                <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 pb-3 pr-4">TYPE</th>
                <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 pb-3 pr-4">PRIORITY</th>
                <th className="text-right text-[10px] font-bold tracking-widest text-slate-400 pb-3 pr-4">TIME</th>
                <th className="text-right text-[10px] font-bold tracking-widest text-slate-400 pb-3 pr-4">REVENUE</th>
                <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 pb-3 pr-4">REASON</th>
                <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 pb-3">FOLLOW-UP</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 pr-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${decisionColor(e.decision)}`}>
                      {e.decision?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">{e.rec_type?.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-slate-500 capitalize">{e.rec_priority}</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-sm font-mono text-slate-900 dark:text-white">
                      {e.time_to_decision_ms ? `${(e.time_to_decision_ms / 1000).toFixed(1)}s` : '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {e.rec_estimated_revenue ? `$${e.rec_estimated_revenue.toLocaleString()}` : '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-slate-500 capitalize">{e.rejection_reason_code?.replace('_', ' ') || '—'}</span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold ${
                      e.follow_through_status === 'verified' ? 'text-emerald-500' :
                      e.follow_through_status === 'pending' ? 'text-amber-500' : 'text-slate-400'
                    }`}>{e.follow_through_status || '—'}</span>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400">No decision events recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">Dentamind AI — Behavioral Intelligence Layer · Live Data</p>
      </div>
    </div>
  );
}
