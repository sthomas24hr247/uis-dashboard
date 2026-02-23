import { useState, useEffect } from 'react';
import {
  Lightbulb, CheckCircle2, XCircle, Clock, ChevronRight, RefreshCw,
  Loader2, AlertTriangle, DollarSign, Timer, Shield, TrendingUp,
  Sparkles, Zap, Target, Users,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';
const PRACTICE_ID = '00000000-0000-0000-0000-000000000001';

interface Recommendation {
  id: string;
  type: string;
  subtype: string;
  title: string;
  description: string;
  rationale: string;
  complexity: number;
  estimated_revenue: number;
  estimated_cost: number;
  estimated_time_minutes: number;
  confidence_score: number;
  priority: string;
  target_roles: string;
  status: string;
  generated_at: string;
}

interface BILSummary {
  total_decisions: number;
  approved: number;
  rejected: number;
  delayed: number;
  approval_rate: number;
  follow_through_rate: number;
  avg_decision_time_ms: number;
  total_estimated_revenue: number;
  approved_revenue: number;
}

const typeIcons: Record<string, any> = {
  scheduling: Clock,
  treatment_plan: Target,
  billing: DollarSign,
  hygiene_protocol: Shield,
  patient_communication: Users,
  staffing: Users,
  compliance: Shield,
  marketing: TrendingUp,
  equipment: Zap,
};

const typeColors: Record<string, string> = {
  scheduling: 'from-blue-500 to-cyan-500',
  treatment_plan: 'from-purple-500 to-pink-500',
  billing: 'from-emerald-500 to-green-500',
  hygiene_protocol: 'from-teal-500 to-cyan-500',
  patient_communication: 'from-amber-500 to-orange-500',
  staffing: 'from-indigo-500 to-purple-500',
  compliance: 'from-red-500 to-rose-500',
  marketing: 'from-pink-500 to-rose-500',
  equipment: 'from-slate-500 to-zinc-500',
};

const priorityStyles: Record<string, string> = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  low: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
};

function useRecommendationsData() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [bilSummary, setBilSummary] = useState<BILSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recsRes, bilRes] = await Promise.all([
        fetch(`${API_URL}/api/recommendations/active?practice_id=${PRACTICE_ID}`),
        fetch(`${API_URL}/api/bil/summary`),
      ]);
      const recsData = await recsRes.json();
      const bilData = await bilRes.json();
      setRecs(recsData.recommendations || []);
      setBilSummary(bilData.summary?.[0] || null);
    } catch (err) {
      console.error('[Recommendations] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  return { recs, bilSummary, loading, refresh: fetchData };
}

// Track which recs have been acted on in this session
function useDecisionState() {
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const recordDecision = async (rec: Recommendation, decision: string, rejectionCode?: string) => {
    setSubmitting(rec.id);
    const now = new Date().toISOString();
    try {
      const staffUser = JSON.parse(localStorage.getItem('uis_user') || '{}');
      await fetch(`${API_URL}/api/bil/decision-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_id: rec.id,
          practice_id: PRACTICE_ID,
          staff_member_id: staffUser.userId || 'A383D78B-677B-4C1F-9C9C-77918895CB22',
          decision,
          presented_at: rec.generated_at,
          decision_at: now,
          device_type: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop',
          rec_type: rec.type,
          rec_subtype: rec.subtype,
          rec_complexity: rec.complexity,
          rec_estimated_revenue: rec.estimated_revenue,
          rec_priority: rec.priority,
          rejection_reason_code: rejectionCode || null,
        }),
      });
      setDecisions(prev => ({ ...prev, [rec.id]: decision }));
    } catch (err) {
      console.error('[BIL] Decision error:', err);
    } finally {
      setSubmitting(null);
    }
  };

  return { decisions, submitting, recordDecision };
}

function RecCard({ rec, decision, submitting, onDecision }: {
  rec: Recommendation;
  decision?: string;
  submitting: boolean;
  onDecision: (decision: string, rejectionCode?: string) => void;
}) {
  const [showRejectReasons, setShowRejectReasons] = useState(false);
  const Icon = typeIcons[rec.type] || Lightbulb;
  const gradient = typeColors[rec.type] || 'from-slate-500 to-zinc-500';
  const roles = (() => { try { return JSON.parse(rec.target_roles || '[]'); } catch { return []; } })();

  const isActedOn = !!decision;

  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-800/80 border transition-all duration-300 ${
      isActedOn
        ? decision === 'approved'
          ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-900/10'
          : decision === 'rejected'
          ? 'border-red-300 dark:border-red-700/60 opacity-60'
          : 'border-amber-300 dark:border-amber-700/60'
        : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
    }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border ${priorityStyles[rec.priority] || priorityStyles.medium}`}>
                {rec.priority.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{rec.type.replace('_', ' ')}</span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{rec.title}</h3>
          </div>
        </div>

        {/* Description */}
        {rec.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{rec.description}</p>
        )}

        {/* Rationale */}
        {rec.rationale && (
          <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/30">
            <Sparkles className="w-3.5 h-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{rec.rationale}</p>
          </div>
        )}

        {/* Metrics row */}
        <div className="flex items-center gap-4 mb-4">
          {rec.estimated_revenue > 0 && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                +${rec.estimated_revenue.toLocaleString()}
              </span>
            </div>
          )}
          {rec.estimated_time_minutes > 0 && (
            <div className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{rec.estimated_time_minutes}min</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1,2,3,4,5].map(n => (
                <div key={n} className={`w-1.5 h-4 rounded-full mx-px ${n <= rec.complexity ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
              ))}
            </div>
            <span className="text-[10px] text-slate-400">complexity</span>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] text-slate-400">{Math.round(rec.confidence_score * 100)}% confidence</span>
          </div>
        </div>

        {/* Roles */}
        {roles.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {roles.map((r: string) => (
              <span key={r} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 capitalize">
                {r.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons or Decision state */}
        {isActedOn ? (
          <div className={`flex items-center gap-2 p-3 rounded-xl ${
            decision === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
            decision === 'rejected' ? 'bg-red-50 dark:bg-red-900/20' :
            'bg-amber-50 dark:bg-amber-900/20'
          }`}>
            {decision === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {decision === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
            {decision === 'delayed' && <Clock className="w-4 h-4 text-amber-500" />}
            <span className={`text-xs font-semibold capitalize ${
              decision === 'approved' ? 'text-emerald-600 dark:text-emerald-400' :
              decision === 'rejected' ? 'text-red-600 dark:text-red-400' :
              'text-amber-600 dark:text-amber-400'
            }`}>
              {decision === 'approved' ? 'Approved — tracked in BIL' :
               decision === 'rejected' ? 'Rejected — logged' :
               'Delayed — will revisit'}
            </span>
          </div>
        ) : showRejectReasons ? (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-500 tracking-wider">REASON FOR REJECTION:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { code: 'too_complex', label: 'Too Complex' },
                { code: 'no_budget', label: 'No Budget' },
                { code: 'not_priority', label: 'Not a Priority' },
                { code: 'disagree', label: 'Disagree' },
                { code: 'other', label: 'Other' },
              ].map(reason => (
                <button key={reason.code} onClick={() => { onDecision('rejected', reason.code); setShowRejectReasons(false); }}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 text-slate-600 dark:text-slate-300 transition-colors">
                  {reason.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowRejectReasons(false)} className="text-[10px] text-slate-400 hover:text-slate-600 mt-1">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => onDecision('approved')} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Approve
            </button>
            <button onClick={() => setShowRejectReasons(true)} disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50">
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
            <button onClick={() => onDecision('delayed')} disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50">
              <Clock className="w-3.5 h-3.5" />
              Delay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const { recs, bilSummary, loading, refresh } = useRecommendationsData();
  const { decisions, submitting, recordDecision } = useDecisionState();
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = filterType === 'all' ? recs : recs.filter(r => r.type === filterType);
  const types = [...new Set(recs.map(r => r.type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Recommendations</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">Review and act on Dentamind intelligence</p>
          </div>
        </div>
        <button onClick={refresh} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* BIL Stats */}
      {bilSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">DECISIONS</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{bilSummary.total_decisions}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">APPROVAL RATE</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{bilSummary.approval_rate}%</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">AVG DECISION TIME</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{(bilSummary.avg_decision_time_ms / 1000).toFixed(1)}s</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 mb-1">APPROVED REVENUE</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${bilSummary.approved_revenue?.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
            filterType === 'all' ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}>
          All ({recs.length})
        </button>
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap capitalize ${
              filterType === t ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}>
            {t.replace('_', ' ')} ({recs.filter(r => r.type === t).length})
          </button>
        ))}
      </div>

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(rec => (
          <RecCard
            key={rec.id}
            rec={rec}
            decision={decisions[rec.id]}
            submitting={submitting === rec.id}
            onDecision={(d, code) => recordDecision(rec, d, code)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No pending recommendations in this category.</p>
        </div>
      )}

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">Dentamind AI — Behavioral Intelligence Layer · Live Data</p>
      </div>
    </div>
  );
}
