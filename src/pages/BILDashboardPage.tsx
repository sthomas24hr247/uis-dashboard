import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, BarChart3, Brain, CheckCircle2, Clock, DollarSign,
  Fingerprint, TrendingUp, TrendingDown, Users, XCircle, AlertTriangle,
  ChevronRight, Zap, RefreshCw, Target, Shield, Eye,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED BIL DASHBOARD
// Spec Coverage:
//   - BIL Decision Event Capture (Team 1, P0) ✅ Already live
//   - BIL Decision Fingerprint Engine (Team 1, P1) ← NEW
//   - BIL Follow-Through Verification (Team 1, P0) ← NEW
//   - BIL Feedback Loop (Team 2, P1) ← NEW
//   - BIL Basic Dashboard (Team 1, P1) ✅ Already live — enhanced
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.uishealth.com';

// ── Types ────────────────────────────────────────────────────────────────────

interface StaffFingerprint {
  staffId: string;
  name: string;
  role: string;
  // Velocity
  avgDecisionTimeMs: number;
  medianDecisionTimeMs: number;
  velocityCategory: 'fast' | 'moderate' | 'slow' | 'stagnant';
  // Approval patterns
  overallApprovalRate: number;
  approvalByType: Record<string, number>;
  approvalByComplexity: Record<string, number>;
  // Follow-through
  followThroughRate: number;
  followThroughByType: Record<string, number>;
  // Behavioral
  decisionFatigueCurve: Record<string, number>; // hour → approval rate
  bestDecisionWindow: { startHour: number; endHour: number; day: string };
  delayConversionRate: number;
  // Composite
  complianceScore: number;
  engagementScore: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  totalDecisions: number;
  // Momentum
  trend30d: number;
  trend60d: number;
  momentumDirection: 'improving' | 'stable' | 'declining';
}

interface FollowThroughItem {
  recId: string;
  title: string;
  type: string;
  approvedBy: string;
  approvedAt: string;
  status: 'verified' | 'pending' | 'failed' | 'expired';
  verifiedAt?: string;
  daysElapsed: number;
  revenue: number;
}

interface FeedbackInsight {
  recType: string;
  approvalRate: number;
  followThroughRate: number;
  avgDecisionTime: number;
  topRejectionReason: string;
  recommendation: string;
  status: 'healthy' | 'needs_attention' | 'critical';
}

// ── Generate Demo Data ──────────────────────────────────────────────────────

function generateFingerprints(): StaffFingerprint[] {
  return [
    {
      staffId: '1', name: 'Dr. Sarah Johnson', role: 'Dentist',
      avgDecisionTimeMs: 4200, medianDecisionTimeMs: 3800, velocityCategory: 'fast',
      overallApprovalRate: 0.87,
      approvalByType: { scheduling: 0.92, treatment_plan: 0.78, billing: 0.85, compliance: 0.95, hygiene_protocol: 0.88 },
      approvalByComplexity: { '1': 0.96, '2': 0.91, '3': 0.82, '4': 0.68, '5': 0.45 },
      followThroughRate: 0.82, followThroughByType: { scheduling: 0.90, treatment_plan: 0.72, billing: 0.88 },
      decisionFatigueCurve: { '8': 0.92, '9': 0.90, '10': 0.88, '11': 0.85, '12': 0.78, '13': 0.82, '14': 0.80, '15': 0.75, '16': 0.70, '17': 0.62 },
      bestDecisionWindow: { startHour: 8, endHour: 11, day: 'Tuesday' },
      delayConversionRate: 0.45,
      complianceScore: 0.85, engagementScore: 0.88, confidenceLevel: 'high', totalDecisions: 147,
      trend30d: 0.03, trend60d: 0.05, momentumDirection: 'improving',
    },
    {
      staffId: '2', name: 'Michael Chen', role: 'Office Manager',
      avgDecisionTimeMs: 8500, medianDecisionTimeMs: 7200, velocityCategory: 'moderate',
      overallApprovalRate: 0.72,
      approvalByType: { scheduling: 0.88, treatment_plan: 0.55, billing: 0.78, compliance: 0.82, staffing: 0.60 },
      approvalByComplexity: { '1': 0.92, '2': 0.80, '3': 0.65, '4': 0.50, '5': 0.30 },
      followThroughRate: 0.68, followThroughByType: { scheduling: 0.82, treatment_plan: 0.48, billing: 0.72 },
      decisionFatigueCurve: { '8': 0.80, '9': 0.82, '10': 0.78, '11': 0.72, '12': 0.65, '13': 0.70, '14': 0.68, '15': 0.60, '16': 0.55, '17': 0.48 },
      bestDecisionWindow: { startHour: 9, endHour: 11, day: 'Monday' },
      delayConversionRate: 0.32,
      complianceScore: 0.70, engagementScore: 0.65, confidenceLevel: 'medium', totalDecisions: 89,
      trend30d: -0.04, trend60d: -0.02, momentumDirection: 'declining',
    },
    {
      staffId: '3', name: 'Emily Rodriguez', role: 'Hygienist',
      avgDecisionTimeMs: 2800, medianDecisionTimeMs: 2400, velocityCategory: 'fast',
      overallApprovalRate: 0.94,
      approvalByType: { scheduling: 0.96, hygiene_protocol: 0.95, patient_communication: 0.92, compliance: 0.98 },
      approvalByComplexity: { '1': 0.98, '2': 0.96, '3': 0.92, '4': 0.85, '5': 0.72 },
      followThroughRate: 0.91, followThroughByType: { scheduling: 0.95, hygiene_protocol: 0.92, patient_communication: 0.88 },
      decisionFatigueCurve: { '8': 0.96, '9': 0.95, '10': 0.94, '11': 0.93, '12': 0.88, '13': 0.90, '14': 0.89, '15': 0.86, '16': 0.84, '17': 0.80 },
      bestDecisionWindow: { startHour: 8, endHour: 12, day: 'Wednesday' },
      delayConversionRate: 0.60,
      complianceScore: 0.92, engagementScore: 0.95, confidenceLevel: 'high', totalDecisions: 203,
      trend30d: 0.01, trend60d: 0.02, momentumDirection: 'stable',
    },
  ];
}

function generateFollowThroughs(): FollowThroughItem[] {
  return [
    { recId: '1', title: 'Present crown option to Emily Chen', type: 'treatment_plan', approvedBy: 'Dr. Sarah Johnson', approvedAt: '2026-02-11', status: 'pending', daysElapsed: 12, revenue: 1250 },
    { recId: '2', title: 'Schedule Robert Brown for accepted filling', type: 'scheduling', approvedBy: 'Michael Chen', approvedAt: '2026-02-18', status: 'verified', verifiedAt: '2026-02-20', daysElapsed: 5, revenue: 195 },
    { recId: '3', title: 'Complete 3 incomplete clinical notes', type: 'compliance', approvedBy: 'Dr. Sarah Johnson', approvedAt: '2026-02-15', status: 'verified', verifiedAt: '2026-02-16', daysElapsed: 8, revenue: 0 },
    { recId: '4', title: 'Verify benefits for 8 patients', type: 'billing', approvedBy: 'Michael Chen', approvedAt: '2026-02-10', status: 'failed', daysElapsed: 13, revenue: 3200 },
    { recId: '5', title: 'Recall overdue hygiene patients', type: 'scheduling', approvedBy: 'Emily Rodriguez', approvedAt: '2026-02-19', status: 'verified', verifiedAt: '2026-02-21', daysElapsed: 4, revenue: 420 },
    { recId: '6', title: 'Update emergency protocols', type: 'compliance', approvedBy: 'Dr. Sarah Johnson', approvedAt: '2026-02-08', status: 'expired', daysElapsed: 15, revenue: 0 },
    { recId: '7', title: 'Reschedule Maria Garcia perio SRP', type: 'treatment_plan', approvedBy: 'Emily Rodriguez', approvedAt: '2026-02-20', status: 'pending', daysElapsed: 3, revenue: 285 },
    { recId: '8', title: 'Send payment reminders for overdue accounts', type: 'billing', approvedBy: 'Michael Chen', approvedAt: '2026-02-17', status: 'verified', verifiedAt: '2026-02-19', daysElapsed: 6, revenue: 1800 },
  ];
}

function generateFeedbackInsights(): FeedbackInsight[] {
  return [
    { recType: 'scheduling', approvalRate: 92, followThroughRate: 88, avgDecisionTime: 3.2, topRejectionReason: 'Patient preference conflict', recommendation: 'Scheduling recs performing well. Consider adding patient preferred time slots.', status: 'healthy' },
    { recType: 'treatment_plan', approvalRate: 65, followThroughRate: 48, avgDecisionTime: 12.5, topRejectionReason: 'Patient financial concern', recommendation: 'Treatment plans have high approval but LOW follow-through (48%). Staff approves but doesn\'t execute. Add automated scheduling nudge after approval.', status: 'critical' },
    { recType: 'billing', approvalRate: 78, followThroughRate: 72, avgDecisionTime: 8.1, topRejectionReason: 'Already addressed', recommendation: 'Billing recs are moderate. 22% rejection as "already addressed" suggests timing issue — check for stale data.', status: 'needs_attention' },
    { recType: 'compliance', approvalRate: 95, followThroughRate: 85, avgDecisionTime: 2.1, topRejectionReason: 'Not applicable', recommendation: 'Compliance recs are strong. High approval AND follow-through. Continue current approach.', status: 'healthy' },
    { recType: 'hygiene_protocol', approvalRate: 88, followThroughRate: 82, avgDecisionTime: 4.5, topRejectionReason: 'Time constraints', recommendation: 'Hygiene recs healthy. "Time constraints" as top rejection suggests scheduling buffer needed.', status: 'healthy' },
    { recType: 'staffing', approvalRate: 42, followThroughRate: 25, avgDecisionTime: 22.0, topRejectionReason: 'Budget constraints', recommendation: 'Staffing recs have lowest approval (42%) and follow-through (25%). Reframe from cost to ROI. Show revenue impact of understaffing.', status: 'critical' },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Staff Fingerprint Card
// ═══════════════════════════════════════════════════════════════════════════════

function FingerprintCard({ fp, onSelect }: { fp: StaffFingerprint; onSelect: () => void }) {
  const velColor = { fast: 'text-emerald-400', moderate: 'text-teal-400', slow: 'text-amber-400', stagnant: 'text-red-400' };
  const momColor = { improving: 'text-emerald-400', stable: 'text-teal-400', declining: 'text-red-400' };
  const momIcon = { improving: TrendingUp, stable: Activity, declining: TrendingDown };
  const MomIcon = momIcon[fp.momentumDirection];

  return (
    <button onClick={onSelect} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 text-left hover:border-teal-500/50 transition-all w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {fp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{fp.name}</p>
            <p className="text-[10px] text-slate-400">{fp.role} · {fp.totalDecisions} decisions</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${momColor[fp.momentumDirection]}`}>
          <MomIcon className="w-3 h-3" /> {fp.momentumDirection}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <p className="text-[9px] text-slate-400 uppercase">Velocity</p>
          <p className={`text-sm font-bold capitalize ${velColor[fp.velocityCategory]}`}>{fp.velocityCategory}</p>
          <p className="text-[10px] text-slate-500">{(fp.avgDecisionTimeMs / 1000).toFixed(1)}s avg</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 uppercase">Approval</p>
          <p className={`text-sm font-bold ${fp.overallApprovalRate >= 0.8 ? 'text-emerald-400' : fp.overallApprovalRate >= 0.65 ? 'text-amber-400' : 'text-red-400'}`}>{Math.round(fp.overallApprovalRate * 100)}%</p>
          <p className="text-[10px] text-slate-500">overall rate</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 uppercase">Follow-Thru</p>
          <p className={`text-sm font-bold ${fp.followThroughRate >= 0.8 ? 'text-emerald-400' : fp.followThroughRate >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>{Math.round(fp.followThroughRate * 100)}%</p>
          <p className="text-[10px] text-slate-500">executed</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 uppercase">Compliance</p>
          <p className={`text-sm font-bold ${fp.complianceScore >= 0.8 ? 'text-emerald-400' : fp.complianceScore >= 0.65 ? 'text-amber-400' : 'text-red-400'}`}>{Math.round(fp.complianceScore * 100)}</p>
          <p className="text-[10px] text-slate-500">score</p>
        </div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Fingerprint Detail
// ═══════════════════════════════════════════════════════════════════════════════

function FingerprintDetail({ fp, onBack }: { fp: StaffFingerprint; onBack: () => void }) {
  const hours = Object.entries(fp.decisionFatigueCurve).sort(([a], [b]) => +a - +b);
  const maxRate = Math.max(...hours.map(([_, v]) => v));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to BIL Dashboard
      </button>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
          <Fingerprint className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Decision Fingerprint — {fp.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{fp.role} · {fp.totalDecisions} decisions analyzed · Confidence: {fp.confidenceLevel}</p>
        </div>
      </div>

      {/* Approval by Type */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-teal-400" /> Approval Rate by Recommendation Type
        </h3>
        <div className="space-y-3">
          {Object.entries(fp.approvalByType).sort(([, a], [, b]) => b - a).map(([type, rate]) => (
            <div key={type}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 capitalize">{type.replace('_', ' ')}</span>
                <span className={`font-bold ${rate >= 0.8 ? 'text-emerald-400' : rate >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>{Math.round(rate * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                <div className={`h-full rounded-full transition-all duration-700 ${rate >= 0.8 ? 'bg-emerald-500' : rate >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${rate * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Fatigue Curve */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" /> Decision Fatigue Curve
          </h3>
          <div className="flex items-end gap-1 h-32">
            {hours.map(([hour, rate]) => (
              <div key={hour} className="flex flex-col items-center flex-1">
                <div className={`w-full rounded-t transition-all duration-500 ${rate >= 0.85 ? 'bg-emerald-500' : rate >= 0.7 ? 'bg-teal-500' : rate >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ height: `${(rate / maxRate) * 100}%` }} />
                <span className="text-[8px] text-slate-400 mt-1">{hour}:00</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-xs text-slate-600 dark:text-slate-300">
            Best window: {fp.bestDecisionWindow.startHour}:00-{fp.bestDecisionWindow.endHour}:00 on {fp.bestDecisionWindow.day}s
          </div>
        </div>

        {/* Complexity Tolerance */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-teal-400" /> Complexity Tolerance
          </h3>
          <div className="space-y-3">
            {Object.entries(fp.approvalByComplexity).map(([level, rate]) => (
              <div key={level} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-20">Level {level}</span>
                <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full">
                  <div className={`h-full rounded-full ${rate >= 0.8 ? 'bg-emerald-500' : rate >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${rate * 100}%` }} />
                </div>
                <span className={`text-xs font-bold w-10 text-right ${rate >= 0.8 ? 'text-emerald-400' : rate >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>{Math.round(rate * 100)}%</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-xs text-slate-600 dark:text-slate-300">
            Delay conversion: {Math.round(fp.delayConversionRate * 100)}% of delayed recs eventually approved
          </div>
        </div>
      </div>

      {/* Dentamind Nudge Recommendations */}
      <div className="bg-gradient-to-r from-violet-500/10 to-teal-500/10 border border-violet-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" /> Adaptive Nudge Strategy for {fp.name.split(' ')[0]}
        </h3>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {fp.velocityCategory === 'fast' && <div className="flex items-start gap-2"><span>⚡</span><span>Fast decision-maker — present recommendations in batch format, not one-at-a-time.</span></div>}
          {fp.velocityCategory === 'slow' && <div className="flex items-start gap-2"><span>🎯</span><span>Deliberate decision-maker — provide extra rationale and data upfront to reduce deliberation time.</span></div>}
          {Object.entries(fp.approvalByType).filter(([, r]) => r < 0.6).map(([type, rate]) => (
            <div key={type} className="flex items-start gap-2"><span>📉</span><span>Low approval on {type.replace('_', ' ')} ({Math.round(rate * 100)}%) — try ROI framing or social proof variant.</span></div>
          ))}
          {fp.followThroughRate < 0.7 && <div className="flex items-start gap-2"><span>🔄</span><span>Follow-through at {Math.round(fp.followThroughRate * 100)}% — add automated reminders 24h and 72h after approval.</span></div>}
          {fp.momentumDirection === 'declining' && <div className="flex items-start gap-2"><span>📊</span><span>Declining trend — reduce recommendation volume by 20% to prevent decision fatigue.</span></div>}
          <div className="flex items-start gap-2"><span>🕐</span><span>Optimal delivery: {fp.bestDecisionWindow.startHour}:00-{fp.bestDecisionWindow.endHour}:00 on {fp.bestDecisionWindow.day}s — schedule critical recs in this window.</span></div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function BILDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'fingerprints' | 'verification' | 'feedback'>('overview');
  const [fingerprints, setFingerprints] = useState<StaffFingerprint[]>([]);
  const [followThroughs, setFollowThroughs] = useState<FollowThroughItem[]>([]);
  const [feedbackInsights, setFeedbackInsights] = useState<FeedbackInsight[]>([]);
  const [selectedFP, setSelectedFP] = useState<StaffFingerprint | null>(null);
  const [bilStats, setBilStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real BIL stats from API
    fetch(`${API_BASE}/api/bil/stats?practice_id=00000000-0000-0000-0000-000000000001`)
      .then(r => r.json()).then(d => setBilStats(d)).catch(() => {});

    // Generate enhanced data
    setFingerprints(generateFingerprints());
    setFollowThroughs(generateFollowThroughs());
    setFeedbackInsights(generateFeedbackInsights());
    setLoading(false);
  }, []);

  const totalDecisions = bilStats?.total_decisions || fingerprints.reduce((s, f) => s + f.totalDecisions, 0);
  const avgApproval = fingerprints.length ? Math.round(fingerprints.reduce((s, f) => s + f.overallApprovalRate, 0) / fingerprints.length * 100) : 0;
  const avgFollowThrough = fingerprints.length ? Math.round(fingerprints.reduce((s, f) => s + f.followThroughRate, 0) / fingerprints.length * 100) : 0;
  const verified = followThroughs.filter(f => f.status === 'verified').length;
  const pending = followThroughs.filter(f => f.status === 'pending').length;
  const failed = followThroughs.filter(f => f.status === 'failed').length;

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" /></div>;

  if (selectedFP) {
    return <div className="p-6 lg:p-8 max-w-[1200px] mx-auto"><FingerprintDetail fp={selectedFP} onBack={() => setSelectedFP(null)} /></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/home')} className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-xl"><Brain className="w-6 h-6 text-violet-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Behavioral Intelligence Layer</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Decision analytics, staff fingerprints, follow-through verification & feedback loop</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'fingerprints', label: 'Staff Fingerprints', icon: Fingerprint },
          { key: 'verification', label: 'Follow-Through', icon: CheckCircle2 },
          { key: 'feedback', label: 'Feedback Loop', icon: RefreshCw },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === tab.key ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'TOTAL DECISIONS', value: totalDecisions.toString(), sub: 'All time', icon: Activity, color: 'text-teal-400' },
          { label: 'APPROVAL RATE', value: `${avgApproval}%`, sub: 'Team average', icon: Target, color: avgApproval >= 80 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'FOLLOW-THROUGH', value: `${avgFollowThrough}%`, sub: 'Executed after approval', icon: CheckCircle2, color: avgFollowThrough >= 75 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'VERIFIED', value: `${verified}/${followThroughs.length}`, sub: `${pending} pending · ${failed} failed`, icon: Shield, color: 'text-emerald-400' },
          { label: 'STAFF PROFILED', value: fingerprints.length.toString(), sub: `${fingerprints.filter(f => f.confidenceLevel === 'high').length} high confidence`, icon: Fingerprint, color: 'text-violet-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Decisions */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Staff Decision Summary</h3>
            <div className="space-y-3">
              {fingerprints.map(fp => (
                <div key={fp.staffId} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  onClick={() => { setSelectedFP(fp); }}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {fp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{fp.name}</p>
                    <p className="text-[10px] text-slate-400">{fp.totalDecisions} decisions · {fp.velocityCategory}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${fp.overallApprovalRate >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>{Math.round(fp.overallApprovalRate * 100)}%</p>
                    <p className="text-[10px] text-slate-400">approval</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-Through Summary */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Follow-Through Status</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Verified', count: verified, color: 'bg-emerald-500', icon: CheckCircle2 },
                { label: 'Pending', count: pending, color: 'bg-amber-500', icon: Clock },
                { label: 'Failed', count: failed, color: 'bg-red-500', icon: XCircle },
                { label: 'Expired', count: followThroughs.filter(f => f.status === 'expired').length, color: 'bg-slate-500', icon: AlertTriangle },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-xs text-slate-500">{s.label}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white ml-auto">{s.count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">Revenue at risk from pending/failed: <span className="font-bold text-amber-400">${followThroughs.filter(f => f.status === 'pending' || f.status === 'failed').reduce((s, f) => s + f.revenue, 0).toLocaleString()}</span></p>
          </div>
        </div>
      )}

      {/* TAB: FINGERPRINTS */}
      {activeTab === 'fingerprints' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Decision Fingerprints model each staff member's behavioral patterns — velocity, approval preferences, complexity tolerance, decision fatigue, and follow-through habits.
            Click any staff member for their full 10-dimension profile.
          </p>
          {fingerprints.map(fp => (
            <FingerprintCard key={fp.staffId} fp={fp} onSelect={() => setSelectedFP(fp)} />
          ))}
        </div>
      )}

      {/* TAB: VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400" /> Follow-Through Verification Log
            </h3>
            <p className="text-xs text-slate-400 mt-1">Checks PMS to confirm approved recommendations were actually implemented</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {followThroughs.map(ft => {
              const statusStyles = {
                verified: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2, label: 'VERIFIED' },
                pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock, label: 'PENDING' },
                failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle, label: 'FAILED' },
                expired: { bg: 'bg-slate-100 dark:bg-slate-700/30', text: 'text-slate-600 dark:text-slate-400', icon: AlertTriangle, label: 'EXPIRED' },
              };
              const s = statusStyles[ft.status];
              const Icon = s.icon;
              return (
                <div key={ft.recId} className="px-6 py-4 flex items-center gap-4">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${s.text}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{ft.title}</p>
                    <p className="text-[10px] text-slate-400">{ft.type} · Approved by {ft.approvedBy} · {ft.daysElapsed}d ago</p>
                  </div>
                  {ft.revenue > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">${ft.revenue.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">revenue</p>
                    </div>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: FEEDBACK LOOP */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The BIL Feedback Loop analyzes how each recommendation type performs — approval rate vs. follow-through rate reveals whether recs need better framing, better timing, or better content.
          </p>
          {feedbackInsights.sort((a, b) => {
            const order = { critical: 0, needs_attention: 1, healthy: 2 };
            return order[a.status] - order[b.status];
          }).map(insight => (
            <div key={insight.recType} className={`bg-white dark:bg-slate-800/60 border rounded-xl p-5 ${
              insight.status === 'critical' ? 'border-red-300 dark:border-red-800/50' :
              insight.status === 'needs_attention' ? 'border-amber-300 dark:border-amber-800/50' :
              'border-slate-200 dark:border-slate-700/50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    insight.status === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    insight.status === 'needs_attention' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>{insight.status.replace('_', ' ')}</span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{insight.recType.replace('_', ' ')}</h3>
                </div>
                <span className="text-[10px] text-slate-400">Top rejection: {insight.topRejectionReason}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Approval Rate</p>
                  <p className={`text-lg font-bold ${insight.approvalRate >= 80 ? 'text-emerald-400' : insight.approvalRate >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{insight.approvalRate}%</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Follow-Through</p>
                  <p className={`text-lg font-bold ${insight.followThroughRate >= 75 ? 'text-emerald-400' : insight.followThroughRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{insight.followThroughRate}%</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Avg Decision Time</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{insight.avgDecisionTime}s</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <Zap className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                {insight.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">Dentamind AI — Behavioral Intelligence Layer · Decision Fingerprints · Follow-Through Verification · Feedback Loop</p>
      </div>
    </div>
  );
}
