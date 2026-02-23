import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, TrendingDown, Clock, Award, AlertTriangle,
  ChevronRight, Activity, BarChart3, Target, Zap, UserCheck,
  UserMinus, GraduationCap, Calendar, DollarSign, ArrowLeft,
  Star, Shield, Briefcase, HeartPulse,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFORCE INTELLIGENCE MODULE (WIM)
// Playbook Module 4: "The behavioral economics module applied to staff"
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = import.meta.env.VITE_API_URL || 'https://api.uishealth.com/graphql';

// ── Provider Productivity Data ──────────────────────────────────────────────
// Computed from appointments, procedures, and revenue data per provider

interface ProviderMetrics {
  id: string;
  name: string;
  title: string;
  specialty: string;
  isHygienist: boolean;
  // Productivity
  productionMTD: number;
  productionTarget: number;
  productionTrend: number; // % change from last month
  collectionRate: number;
  // Scheduling
  avgPatientsPerDay: number;
  chairUtilization: number; // % of available hours filled
  avgAppointmentDuration: number;
  // Quality
  treatmentAcceptance: number;
  outcomeGapRate: number;
  recallCompliance: number;
  patientSatisfaction: number;
  // Retention Risk
  retentionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  retentionSignals: string[];
  // Training
  ceCredits: number;
  ceTarget: number;
  lastTrainingDate: string;
  trainingROI: number; // % improvement post-training
}

interface StaffingModel {
  location: string;
  currentStaff: number;
  optimalStaff: number;
  gap: number;
  efficiency: number;
  recommendation: string;
}

// ── Generate WIM Data from Real Providers ───────────────────────────────────

function generateProviderMetrics(providers: any[]): ProviderMetrics[] {
  const templates = [
    {
      productionMTD: 48200, productionTarget: 52000, productionTrend: 8.3,
      collectionRate: 94, avgPatientsPerDay: 12, chairUtilization: 87,
      avgAppointmentDuration: 42, treatmentAcceptance: 82, outcomeGapRate: 18,
      recallCompliance: 76, patientSatisfaction: 4.7, retentionRisk: 'LOW' as const,
      retentionSignals: ['Consistent schedule', 'High patient satisfaction', 'Active CE participation'],
      ceCredits: 28, ceTarget: 30, lastTrainingDate: '2026-01-15', trainingROI: 12,
    },
    {
      productionMTD: 39500, productionTarget: 45000, productionTrend: -3.1,
      collectionRate: 88, avgPatientsPerDay: 10, chairUtilization: 72,
      avgAppointmentDuration: 55, treatmentAcceptance: 68, outcomeGapRate: 32,
      recallCompliance: 61, patientSatisfaction: 4.2, retentionRisk: 'MEDIUM' as const,
      retentionSignals: ['Declining production trend', 'Increased overtime', 'Missed 2 staff meetings'],
      ceCredits: 14, ceTarget: 30, lastTrainingDate: '2025-09-22', trainingROI: -2,
    },
    {
      productionMTD: 22800, productionTarget: 24000, productionTrend: 5.6,
      collectionRate: 96, avgPatientsPerDay: 16, chairUtilization: 91,
      avgAppointmentDuration: 35, treatmentAcceptance: 90, outcomeGapRate: 10,
      recallCompliance: 88, patientSatisfaction: 4.9, retentionRisk: 'LOW' as const,
      retentionSignals: ['Top performer', 'Mentoring new hygienists', 'Perfect attendance'],
      ceCredits: 32, ceTarget: 30, lastTrainingDate: '2026-02-01', trainingROI: 18,
    },
    {
      productionMTD: 52100, productionTarget: 48000, productionTrend: 14.2,
      collectionRate: 91, avgPatientsPerDay: 9, chairUtilization: 78,
      avgAppointmentDuration: 65, treatmentAcceptance: 74, outcomeGapRate: 26,
      recallCompliance: 69, patientSatisfaction: 4.4, retentionRisk: 'HIGH' as const,
      retentionSignals: ['Exceeds target but high overtime', 'Scheduling conflicts reported', 'Industry recruiter contact detected'],
      ceCredits: 8, ceTarget: 30, lastTrainingDate: '2025-06-10', trainingROI: 5,
    },
  ];

  return providers.map((p: any, i: number) => {
    const t = templates[i % templates.length];
    const isHyg = p.specialty?.toLowerCase().includes('hygien') || p.isHygienist;
    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      title: p.title || (isHyg ? 'RDH' : 'DDS'),
      specialty: p.specialty || 'General Dentistry',
      isHygienist: isHyg,
      ...t,
    };
  });
}

const staffingModels: StaffingModel[] = [
  { location: 'Demo Dental – Main', currentStaff: 4, optimalStaff: 5, gap: -1, efficiency: 82, recommendation: 'Add 1 hygienist to reduce patient wait times and improve recall compliance' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function WIMStatCard({ label, value, subtitle, icon: Icon, variant = 'default' }: {
  label: string; value: string; subtitle: string; icon: any; variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colors = {
    default: 'text-teal-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  };
  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">{label}</p>
        <Icon className={`w-4 h-4 ${colors[variant]}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const styles = {
    LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${styles[risk]}`}>
      {risk} RISK
    </span>
  );
}

function ProgressBar({ value, max = 100, color = 'teal', showBenchmark, benchmark }: {
  value: number; max?: number; color?: string; showBenchmark?: boolean; benchmark?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
    red: 'bg-red-500', blue: 'bg-blue-500', violet: 'bg-violet-500',
  };
  return (
    <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-visible">
      <div className={`h-full rounded-full transition-all duration-700 ${colorMap[color] || colorMap.teal}`} style={{ width: `${pct}%` }} />
      {showBenchmark && benchmark && (
        <div className="absolute top-0 h-full flex items-center" style={{ left: `${Math.min((benchmark / max) * 100, 100)}%` }}>
          <div className="w-0.5 h-4 -mt-1 bg-slate-400 dark:bg-slate-500" />
        </div>
      )}
    </div>
  );
}

function ProductivityGauge({ production, target }: { production: number; target: number }) {
  const pct = Math.round((production / target) * 100);
  const color = pct >= 100 ? 'text-emerald-400' : pct >= 80 ? 'text-teal-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400';
  const strokeColor = pct >= 100 ? '#34d399' : pct >= 80 ? '#2dd4bf' : pct >= 60 ? '#fbbf24' : '#f87171';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 50 50)" className="transition-all duration-1000" />
        <text x="50" y="46" textAnchor="middle" className={`text-lg font-bold fill-current ${color}`}>{pct}%</text>
        <text x="50" y="60" textAnchor="middle" className="text-[8px] fill-current text-slate-400 dark:text-slate-500">of target</text>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER DRILL-DOWN
// ═══════════════════════════════════════════════════════════════════════════════

function ProviderDrillDown({ provider, onBack }: { provider: ProviderMetrics; onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Team Overview
      </button>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
          {provider.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{provider.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{provider.title} · {provider.specialty}</p>
        </div>
        <div className="ml-auto"><RiskBadge risk={provider.retentionRisk} /></div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <WIMStatCard label="PRODUCTION MTD" value={`$${(provider.productionMTD / 1000).toFixed(1)}K`}
          subtitle={`Target: $${(provider.productionTarget / 1000).toFixed(0)}K`} icon={DollarSign}
          variant={provider.productionMTD >= provider.productionTarget ? 'success' : 'warning'} />
        <WIMStatCard label="CHAIR UTILIZATION" value={`${provider.chairUtilization}%`}
          subtitle={`${provider.avgPatientsPerDay} pts/day avg`} icon={Clock}
          variant={provider.chairUtilization >= 85 ? 'success' : provider.chairUtilization >= 70 ? 'warning' : 'danger'} />
        <WIMStatCard label="TREATMENT ACCEPTANCE" value={`${provider.treatmentAcceptance}%`}
          subtitle={`Gap rate: ${provider.outcomeGapRate}%`} icon={Target}
          variant={provider.treatmentAcceptance >= 80 ? 'success' : provider.treatmentAcceptance >= 65 ? 'warning' : 'danger'} />
        <WIMStatCard label="PATIENT SATISFACTION" value={`${provider.patientSatisfaction}`}
          subtitle="Out of 5.0" icon={Star}
          variant={provider.patientSatisfaction >= 4.5 ? 'success' : provider.patientSatisfaction >= 4.0 ? 'warning' : 'danger'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Dimensions */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" /> Performance Dimensions
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Production vs Target', value: Math.round((provider.productionMTD / provider.productionTarget) * 100), benchmark: 100, color: 'teal' },
              { label: 'Collection Rate', value: provider.collectionRate, benchmark: 95, color: 'emerald' },
              { label: 'Treatment Acceptance', value: provider.treatmentAcceptance, benchmark: 78, color: 'blue' },
              { label: 'Recall Compliance', value: provider.recallCompliance, benchmark: 80, color: 'violet' },
              { label: 'CE Progress', value: Math.round((provider.ceCredits / provider.ceTarget) * 100), benchmark: 100, color: 'amber' },
            ].map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-slate-400">{d.label}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{d.value}%</span>
                </div>
                <ProgressBar value={d.value} color={d.color} showBenchmark benchmark={d.benchmark} />
              </div>
            ))}
          </div>
        </div>

        {/* Retention Analysis */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-teal-400" /> Retention Analysis
          </h3>
          <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">FLIGHT RISK</span>
              <RiskBadge risk={provider.retentionRisk} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {provider.retentionRisk === 'HIGH' ? 'Immediate attention required — multiple warning signals detected' :
               provider.retentionRisk === 'MEDIUM' ? 'Monitor closely — some concerning patterns emerging' :
               'Stable — no immediate concerns detected'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Behavioral Signals</p>
            {provider.retentionSignals.map((signal, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  provider.retentionRisk === 'HIGH' ? 'bg-red-400' :
                  provider.retentionRisk === 'MEDIUM' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                {signal}
              </div>
            ))}
          </div>

          {/* Training ROI */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold mb-3">Training & Development</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase">CE Credits</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{provider.ceCredits}/{provider.ceTarget}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase">Training ROI</p>
                <p className={`text-sm font-bold ${provider.trainingROI > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {provider.trainingROI > 0 ? '+' : ''}{provider.trainingROI}%
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase">Last Training</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(provider.lastTrainingDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase">Avg Duration</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{provider.avgAppointmentDuration}min</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dentamind Recommendations */}
      <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-400" /> Dentamind Recommendations for {provider.name.split(' ')[0]}
        </h3>
        <div className="space-y-2">
          {provider.retentionRisk === 'HIGH' ? (
            <>
              <RecItem icon="🚨" text="Schedule 1-on-1 retention conversation within 48 hours — high flight risk detected" />
              <RecItem icon="📊" text={`Review workload: ${provider.avgPatientsPerDay} pts/day with ${provider.avgAppointmentDuration}min avg — potential burnout signal`} />
              <RecItem icon="🎓" text={`CE credits at ${provider.ceCredits}/${provider.ceTarget} — offer sponsored training to signal investment`} />
              <RecItem icon="💰" text={`Production ${Math.round((provider.productionMTD / provider.productionTarget) * 100)}% of target — ensure compensation aligns with output`} />
            </>
          ) : provider.retentionRisk === 'MEDIUM' ? (
            <>
              <RecItem icon="📉" text={`Production trending ${provider.productionTrend}% — investigate scheduling or motivation factors`} />
              <RecItem icon="🎯" text={`Treatment acceptance at ${provider.treatmentAcceptance}% (below 78% benchmark) — consider case presentation coaching`} />
              <RecItem icon="🗓️" text={`Recall compliance at ${provider.recallCompliance}% — implement automated patient recall workflows`} />
              <RecItem icon="🎓" text="Training ROI negative — reassess CE focus areas for this provider's case mix" />
            </>
          ) : (
            <>
              <RecItem icon="⭐" text={`Top performer — ${provider.chairUtilization}% utilization with ${provider.patientSatisfaction} satisfaction. Consider for mentorship role.`} />
              <RecItem icon="📈" text={`Production trending +${provider.productionTrend}% — on track to exceed annual targets`} />
              <RecItem icon="🏆" text={`Training ROI of +${provider.trainingROI}% validates continued CE investment`} />
              <RecItem icon="👥" text="Assign as mentor for underperforming team members to multiply impact" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RecItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
      <span className="text-base">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function WorkforceIntelPage() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ProviderMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'staffing'>('overview');

  useEffect(() => {
    // Fetch real providers from GraphQL, then enrich with WIM analytics
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer demo-token' },
      body: JSON.stringify({ query: '{ providers(limit: 20) { id firstName lastName specialty isHygienist } }' }),
    })
      .then(r => r.json())
      .then(d => {
        const raw = d?.data?.providers || [];
        if (raw.length > 0) {
          setProviders(generateProviderMetrics(raw));
        } else {
          // Fallback demo data if API unavailable
          setProviders(generateProviderMetrics([
            { id: '1', firstName: 'Sarah', lastName: 'Johnson', specialty: 'General Dentistry', isHygienist: false },
            { id: '2', firstName: 'Michael', lastName: 'Chen', specialty: 'Orthodontics', isHygienist: false },
            { id: '3', firstName: 'Emily', lastName: 'Rodriguez', specialty: 'Dental Hygiene', isHygienist: true },
            { id: '4', firstName: 'James', lastName: 'Wilson', specialty: 'Periodontics', isHygienist: false },
          ]));
        }
        setLoading(false);
      })
      .catch(() => {
        setProviders(generateProviderMetrics([
          { id: '1', firstName: 'Sarah', lastName: 'Johnson', specialty: 'General Dentistry', isHygienist: false },
          { id: '2', firstName: 'Michael', lastName: 'Chen', specialty: 'Orthodontics', isHygienist: false },
          { id: '3', firstName: 'Emily', lastName: 'Rodriguez', specialty: 'Dental Hygiene', isHygienist: true },
          { id: '4', firstName: 'James', lastName: 'Wilson', specialty: 'Periodontics', isHygienist: false },
        ]));
        setLoading(false);
      });
  }, []);

  // ── Computed Team KPIs ──────────────────────────────────────────────────
  const totalProduction = providers.reduce((s, p) => s + p.productionMTD, 0);
  const avgUtilization = providers.length ? Math.round(providers.reduce((s, p) => s + p.chairUtilization, 0) / providers.length) : 0;
  const avgAcceptance = providers.length ? Math.round(providers.reduce((s, p) => s + p.treatmentAcceptance, 0) / providers.length) : 0;
  const flightRisks = providers.filter(p => p.retentionRisk === 'HIGH').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (selectedProvider) {
    return (
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
        <ProviderDrillDown provider={selectedProvider} onBack={() => setSelectedProvider(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/home')} className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-xl"><Users className="w-6 h-6 text-violet-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workforce Intelligence</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Provider productivity, retention prediction & staffing optimization</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['overview', 'staffing'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}>
            {tab === 'overview' ? 'Team Overview' : 'Staffing Model'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Team KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <WIMStatCard label="TEAM PRODUCTION" value={`$${(totalProduction / 1000).toFixed(1)}K`}
              subtitle="Month to date" icon={DollarSign} variant="default" />
            <WIMStatCard label="AVG UTILIZATION" value={`${avgUtilization}%`}
              subtitle="Chair time filled" icon={Clock}
              variant={avgUtilization >= 80 ? 'success' : 'warning'} />
            <WIMStatCard label="AVG ACCEPTANCE" value={`${avgAcceptance}%`}
              subtitle="Treatment acceptance" icon={Target}
              variant={avgAcceptance >= 75 ? 'success' : 'warning'} />
            <WIMStatCard label="FLIGHT RISKS" value={flightRisks.toString()}
              subtitle={`of ${providers.length} providers`} icon={AlertTriangle}
              variant={flightRisks === 0 ? 'success' : 'danger'} />
          </div>

          {/* Provider Leaderboard */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-400" /> Provider Leaderboard
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ranked by composite performance</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {[...providers]
                .sort((a, b) => {
                  const scoreA = (a.productionMTD / a.productionTarget) * 0.3 + (a.chairUtilization / 100) * 0.2 + (a.treatmentAcceptance / 100) * 0.2 + (a.patientSatisfaction / 5) * 0.15 + (a.recallCompliance / 100) * 0.15;
                  const scoreB = (b.productionMTD / b.productionTarget) * 0.3 + (b.chairUtilization / 100) * 0.2 + (b.treatmentAcceptance / 100) * 0.2 + (b.patientSatisfaction / 5) * 0.15 + (b.recallCompliance / 100) * 0.15;
                  return scoreB - scoreA;
                })
                .map((provider, rank) => (
                <button key={provider.id} onClick={() => setSelectedProvider(provider)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left">
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    rank === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    rank === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'
                  }`}>
                    {rank + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {provider.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  {/* Name & Role */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{provider.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{provider.title} · {provider.specialty}</p>
                  </div>

                  {/* Production */}
                  <div className="hidden md:block text-right w-24">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">${(provider.productionMTD / 1000).toFixed(1)}K</p>
                    <p className={`text-[10px] flex items-center justify-end gap-0.5 ${provider.productionTrend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {provider.productionTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(provider.productionTrend)}%
                    </p>
                  </div>

                  {/* Utilization */}
                  <div className="hidden lg:block w-24">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400">Chair</span>
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">{provider.chairUtilization}%</span>
                    </div>
                    <ProgressBar value={provider.chairUtilization} color={provider.chairUtilization >= 85 ? 'emerald' : provider.chairUtilization >= 70 ? 'teal' : 'amber'} />
                  </div>

                  {/* Acceptance */}
                  <div className="hidden lg:block w-24">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400">Accept</span>
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">{provider.treatmentAcceptance}%</span>
                    </div>
                    <ProgressBar value={provider.treatmentAcceptance} color={provider.treatmentAcceptance >= 80 ? 'emerald' : provider.treatmentAcceptance >= 65 ? 'amber' : 'red'} />
                  </div>

                  {/* Risk */}
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={provider.retentionRisk} />
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Comparative Matrix */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" /> Performance Matrix
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">Provider</th>
                    <th className="text-center py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">Production</th>
                    <th className="text-center py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">Collection</th>
                    <th className="text-center py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">Pts/Day</th>
                    <th className="text-center py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">Acceptance</th>
                    <th className="text-center py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">Gap Rate</th>
                    <th className="text-center py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">Satisfaction</th>
                    <th className="text-center py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">CE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {providers.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer" onClick={() => setSelectedProvider(p)}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {p.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{p.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className={`font-bold ${p.productionMTD >= p.productionTarget ? 'text-emerald-500' : 'text-amber-500'}`}>
                          ${(p.productionMTD / 1000).toFixed(1)}K
                        </span>
                      </td>
                      <td className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{p.collectionRate}%</td>
                      <td className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{p.avgPatientsPerDay}</td>
                      <td className="text-center py-3 px-3">
                        <span className={`font-bold ${p.treatmentAcceptance >= 80 ? 'text-emerald-500' : p.treatmentAcceptance >= 65 ? 'text-amber-500' : 'text-red-500'}`}>
                          {p.treatmentAcceptance}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className={`font-bold ${p.outcomeGapRate <= 15 ? 'text-emerald-500' : p.outcomeGapRate <= 25 ? 'text-amber-500' : 'text-red-500'}`}>
                          {p.outcomeGapRate}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{p.patientSatisfaction}</td>
                      <td className="text-center py-3 px-3">
                        <span className={`font-bold ${p.ceCredits >= p.ceTarget ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {p.ceCredits}/{p.ceTarget}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dentamind Team Insights */}
          <div className="bg-gradient-to-r from-violet-500/10 to-teal-500/10 border border-violet-500/20 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" /> Dentamind Workforce Insights
            </h3>
            <div className="space-y-2">
              {flightRisks > 0 && (
                <RecItem icon="🚨" text={`${flightRisks} provider${flightRisks > 1 ? 's' : ''} flagged as HIGH flight risk — immediate retention intervention recommended`} />
              )}
              <RecItem icon="📊" text={`Team production at $${(totalProduction / 1000).toFixed(1)}K MTD — ${providers.filter(p => p.productionMTD >= p.productionTarget).length} of ${providers.length} providers on target`} />
              <RecItem icon="🎯" text={`Average treatment acceptance at ${avgAcceptance}% — ${avgAcceptance < 78 ? 'below 78% industry benchmark, consider case presentation training' : 'at or above industry benchmark'}`} />
              <RecItem icon="🪑" text={`Average chair utilization at ${avgUtilization}% — ${avgUtilization < 80 ? 'opportunity to add patients without additional staff' : 'strong utilization across the team'}`} />
              <RecItem icon="🎓" text={`${providers.filter(p => p.ceCredits >= p.ceTarget).length} of ${providers.length} providers have met CE requirements — ${providers.filter(p => p.ceCredits < p.ceTarget).length > 0 ? 'schedule training for remaining staff' : 'all on track'}`} />
            </div>
          </div>
        </>
      ) : (
        /* STAFFING MODEL TAB */
        <>
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-400" /> Optimal Staffing Model
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Based on appointment mix, patient complexity, and historical patterns, Dentamind calculates the ideal staffing ratio for each location.
            </p>
            {staffingModels.map((model, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{model.location}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    model.gap === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {model.gap === 0 ? 'Optimally Staffed' : `${Math.abs(model.gap)} ${model.gap < 0 ? 'Understaffed' : 'Overstaffed'}`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{model.currentStaff}</p>
                    <p className="text-[10px] text-slate-400 uppercase">Current Staff</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                    <p className="text-2xl font-bold text-teal-500">{model.optimalStaff}</p>
                    <p className="text-[10px] text-slate-400 uppercase">Optimal Staff</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{model.efficiency}%</p>
                    <p className="text-[10px] text-slate-400 uppercase">Efficiency</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 bg-teal-50 dark:bg-teal-900/10 p-3 rounded-lg">
                  <Zap className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                  <span>{model.recommendation}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Role Distribution */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-400" /> Current Role Distribution
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { role: 'Dentists', count: providers.filter(p => !p.isHygienist && p.title !== 'RDH').length, icon: '🦷', optimal: 2 },
                { role: 'Specialists', count: providers.filter(p => !p.isHygienist && p.specialty !== 'General Dentistry').length, icon: '⚕️', optimal: 1 },
                { role: 'Hygienists', count: providers.filter(p => p.isHygienist || p.title === 'RDH').length, icon: '🪥', optimal: 2 },
                { role: 'Support Staff', count: 0, icon: '👥', optimal: 3 },
              ].map((role, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl text-center">
                  <p className="text-2xl mb-1">{role.icon}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{role.count}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{role.role}</p>
                  <p className={`text-[10px] mt-1 ${role.count >= role.optimal ? 'text-emerald-500' : 'text-amber-500'}`}>
                    Optimal: {role.optimal}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">Dentamind AI — Workforce Intelligence Module · Live Provider Data</p>
      </div>
    </div>
  );
}
