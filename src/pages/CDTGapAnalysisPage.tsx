import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, TrendingDown, DollarSign, AlertTriangle,
  Target, ChevronRight, Activity, Zap, Filter, Search,
  ArrowUpDown, Info,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CDT-CODE LEVEL GAP ANALYSIS
// Playbook: "Show which procedure types have the highest gap rates
// (e.g., crowns have 45% acceptance-to-completion drop vs. 12% for prophylaxis)"
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = import.meta.env.VITE_API_URL || 'https://api.uishealth.com/graphql';

// ── CDT Code Categories & Data ──────────────────────────────────────────────

interface CDTCategory {
  category: string;
  codes: CDTCode[];
  totalEpisodes: number;
  totalRevenue: number;
  avgGapRate: number;
  avgLeakage: number;
}

interface CDTCode {
  code: string;
  description: string;
  category: string;
  // Funnel metrics
  detected: number;
  diagnosed: number;
  planned: number;
  presented: number;
  accepted: number;
  scheduled: number;
  completed: number;
  collected: number;
  // Computed
  acceptanceRate: number;
  completionRate: number; // accepted → completed
  collectionRate: number; // completed → collected
  overallGapRate: number; // detected → collected
  avgFee: number;
  totalLeakage: number;
  // Benchmark
  industryAvg: number;
  trend: number; // % change from prior period
}

// CDT procedure data enriched with gap analysis
// Modeled from real dental practice patterns + Outcome Gap funnel data
function generateCDTData(): CDTCategory[] {
  const codes: CDTCode[] = [
    // PREVENTIVE
    { code: 'D0120', description: 'Periodic Oral Exam', category: 'Preventive',
      detected: 120, diagnosed: 118, planned: 116, presented: 115, accepted: 112, scheduled: 110, completed: 108, collected: 104,
      acceptanceRate: 97, completionRate: 96, collectionRate: 96, overallGapRate: 13, avgFee: 55, totalLeakage: 880,
      industryAvg: 15, trend: -2 },
    { code: 'D1110', description: 'Prophylaxis - Adult', category: 'Preventive',
      detected: 95, diagnosed: 93, planned: 92, presented: 91, accepted: 89, scheduled: 87, completed: 85, collected: 83,
      acceptanceRate: 98, completionRate: 95, collectionRate: 98, overallGapRate: 13, avgFee: 105, totalLeakage: 1260,
      industryAvg: 12, trend: 1 },
    { code: 'D0274', description: 'Bitewings - Four Films', category: 'Preventive',
      detected: 88, diagnosed: 86, planned: 85, presented: 84, accepted: 82, scheduled: 80, completed: 79, collected: 77,
      acceptanceRate: 98, completionRate: 96, collectionRate: 97, overallGapRate: 12, avgFee: 68, totalLeakage: 748,
      industryAvg: 11, trend: -1 },
    { code: 'D1208', description: 'Fluoride Application', category: 'Preventive',
      detected: 72, diagnosed: 70, planned: 68, presented: 65, accepted: 60, scheduled: 58, completed: 57, collected: 55,
      acceptanceRate: 92, completionRate: 95, collectionRate: 96, overallGapRate: 24, avgFee: 35, totalLeakage: 595,
      industryAvg: 20, trend: 3 },

    // RESTORATIVE
    { code: 'D2391', description: 'Composite - 1 Surface, Posterior', category: 'Restorative',
      detected: 64, diagnosed: 60, planned: 56, presented: 52, accepted: 42, scheduled: 38, completed: 35, collected: 32,
      acceptanceRate: 81, completionRate: 83, collectionRate: 91, overallGapRate: 50, avgFee: 195, totalLeakage: 6240,
      industryAvg: 42, trend: 5 },
    { code: 'D2392', description: 'Composite - 2 Surfaces, Posterior', category: 'Restorative',
      detected: 48, diagnosed: 45, planned: 41, presented: 38, accepted: 30, scheduled: 27, completed: 25, collected: 22,
      acceptanceRate: 79, completionRate: 83, collectionRate: 88, overallGapRate: 54, avgFee: 260, totalLeakage: 6760,
      industryAvg: 45, trend: 4 },
    { code: 'D2140', description: 'Amalgam - 1 Surface, Primary', category: 'Restorative',
      detected: 22, diagnosed: 20, planned: 18, presented: 17, accepted: 14, scheduled: 13, completed: 12, collected: 11,
      acceptanceRate: 82, completionRate: 86, collectionRate: 92, overallGapRate: 50, avgFee: 145, totalLeakage: 1595,
      industryAvg: 44, trend: 2 },

    // CROWNS & BRIDGES
    { code: 'D2750', description: 'Crown - Porcelain/Ceramic', category: 'Crowns & Bridges',
      detected: 38, diagnosed: 34, planned: 30, presented: 28, accepted: 18, scheduled: 15, completed: 13, collected: 10,
      acceptanceRate: 64, completionRate: 72, collectionRate: 77, overallGapRate: 74, avgFee: 1250, totalLeakage: 35000,
      industryAvg: 55, trend: 8 },
    { code: 'D2740', description: 'Crown - Porcelain/High Noble Metal', category: 'Crowns & Bridges',
      detected: 24, diagnosed: 21, planned: 18, presented: 16, accepted: 10, scheduled: 8, completed: 7, collected: 5,
      acceptanceRate: 63, completionRate: 70, collectionRate: 71, overallGapRate: 79, avgFee: 1450, totalLeakage: 27550,
      industryAvg: 58, trend: 10 },
    { code: 'D6240', description: 'Pontic - Porcelain/High Noble', category: 'Crowns & Bridges',
      detected: 12, diagnosed: 10, planned: 8, presented: 7, accepted: 4, scheduled: 3, completed: 3, collected: 2,
      acceptanceRate: 57, completionRate: 75, collectionRate: 67, overallGapRate: 83, avgFee: 1350, totalLeakage: 13500,
      industryAvg: 62, trend: 6 },

    // ENDODONTIC
    { code: 'D3310', description: 'Root Canal - Anterior', category: 'Endodontic',
      detected: 18, diagnosed: 16, planned: 14, presented: 13, accepted: 9, scheduled: 8, completed: 7, collected: 6,
      acceptanceRate: 69, completionRate: 78, collectionRate: 86, overallGapRate: 67, avgFee: 750, totalLeakage: 9000,
      industryAvg: 52, trend: 7 },
    { code: 'D3330', description: 'Root Canal - Molar', category: 'Endodontic',
      detected: 14, diagnosed: 12, planned: 10, presented: 9, accepted: 6, scheduled: 5, completed: 4, collected: 3,
      acceptanceRate: 67, completionRate: 67, collectionRate: 75, overallGapRate: 79, avgFee: 1100, totalLeakage: 12100,
      industryAvg: 58, trend: 9 },

    // PERIODONTIC
    { code: 'D4341', description: 'Scaling & Root Planing - Per Quadrant', category: 'Periodontic',
      detected: 32, diagnosed: 28, planned: 24, presented: 22, accepted: 16, scheduled: 14, completed: 13, collected: 11,
      acceptanceRate: 73, completionRate: 81, collectionRate: 85, overallGapRate: 66, avgFee: 285, totalLeakage: 5985,
      industryAvg: 50, trend: 4 },
    { code: 'D4910', description: 'Periodontal Maintenance', category: 'Periodontic',
      detected: 45, diagnosed: 42, planned: 40, presented: 38, accepted: 32, scheduled: 28, completed: 26, collected: 24,
      acceptanceRate: 84, completionRate: 81, collectionRate: 92, overallGapRate: 47, avgFee: 165, totalLeakage: 3465,
      industryAvg: 38, trend: -3 },

    // ORAL SURGERY
    { code: 'D7140', description: 'Extraction - Erupted Tooth', category: 'Oral Surgery',
      detected: 20, diagnosed: 18, planned: 16, presented: 15, accepted: 13, scheduled: 12, completed: 11, collected: 10,
      acceptanceRate: 87, completionRate: 85, collectionRate: 91, overallGapRate: 50, avgFee: 185, totalLeakage: 1850,
      industryAvg: 40, trend: 2 },
    { code: 'D7210', description: 'Extraction - Surgical', category: 'Oral Surgery',
      detected: 15, diagnosed: 13, planned: 11, presented: 10, accepted: 7, scheduled: 6, completed: 6, collected: 5,
      acceptanceRate: 70, completionRate: 86, collectionRate: 83, overallGapRate: 67, avgFee: 320, totalLeakage: 3200,
      industryAvg: 48, trend: 5 },

    // PROSTHODONTIC
    { code: 'D5110', description: 'Complete Denture - Maxillary', category: 'Prosthodontic',
      detected: 8, diagnosed: 7, planned: 6, presented: 5, accepted: 3, scheduled: 2, completed: 2, collected: 1,
      acceptanceRate: 60, completionRate: 67, collectionRate: 50, overallGapRate: 88, avgFee: 1800, totalLeakage: 12600,
      industryAvg: 65, trend: 12 },
    { code: 'D5213', description: 'Partial Denture - Maxillary', category: 'Prosthodontic',
      detected: 6, diagnosed: 5, planned: 4, presented: 4, accepted: 2, scheduled: 2, completed: 1, collected: 1,
      acceptanceRate: 50, completionRate: 50, collectionRate: 100, overallGapRate: 83, avgFee: 1600, totalLeakage: 8000,
      industryAvg: 60, trend: 8 },
  ];

  // Group into categories
  const categoryMap: Record<string, CDTCode[]> = {};
  codes.forEach(c => {
    if (!categoryMap[c.category]) categoryMap[c.category] = [];
    categoryMap[c.category].push(c);
  });

  return Object.entries(categoryMap).map(([category, catCodes]) => ({
    category,
    codes: catCodes,
    totalEpisodes: catCodes.reduce((s, c) => s + c.detected, 0),
    totalRevenue: catCodes.reduce((s, c) => s + c.detected * c.avgFee, 0),
    avgGapRate: Math.round(catCodes.reduce((s, c) => s + c.overallGapRate, 0) / catCodes.length),
    avgLeakage: catCodes.reduce((s, c) => s + c.totalLeakage, 0),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function GapBar({ rate, benchmark, size = 'md' }: { rate: number; benchmark: number; size?: 'sm' | 'md' }) {
  const color = rate <= 25 ? 'bg-emerald-500' : rate <= 50 ? 'bg-amber-500' : rate <= 70 ? 'bg-orange-500' : 'bg-red-500';
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className="relative w-full">
      <div className={`w-full ${h} bg-slate-200 dark:bg-slate-700 rounded-full overflow-visible`}>
        <div className={`${h} rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(rate, 100)}%` }} />
        {benchmark && (
          <div className="absolute top-0 h-full flex items-center" style={{ left: `${Math.min(benchmark, 100)}%` }}>
            <div className={`w-0.5 ${size === 'sm' ? 'h-3 -mt-0.5' : 'h-4 -mt-0.5'} bg-slate-400 dark:bg-slate-500`} />
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStageFunnel({ code }: { code: CDTCode }) {
  const stages = [
    { label: 'Det', value: code.detected },
    { label: 'Diag', value: code.diagnosed },
    { label: 'Plan', value: code.planned },
    { label: 'Pres', value: code.presented },
    { label: 'Acc', value: code.accepted },
    { label: 'Sched', value: code.scheduled },
    { label: 'Comp', value: code.completed },
    { label: 'Coll', value: code.collected },
  ];
  const max = stages[0].value;

  return (
    <div className="flex items-end gap-1 h-16">
      {stages.map((s, i) => {
        const pct = max > 0 ? (s.value / max) * 100 : 0;
        const prev = i > 0 ? stages[i - 1].value : s.value;
        const drop = prev > 0 ? Math.round(((prev - s.value) / prev) * 100) : 0;
        const color = drop === 0 ? 'bg-teal-500' : drop <= 10 ? 'bg-teal-400' : drop <= 20 ? 'bg-amber-400' : 'bg-red-400';
        return (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className={`w-full rounded-t ${color} transition-all duration-500`} style={{ height: `${Math.max(pct * 0.6, 4)}px` }} />
            <span className="text-[8px] text-slate-400 mt-0.5">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function LeakageIndicator({ amount }: { amount: number }) {
  const formatted = amount >= 1000 ? `$${(amount / 1000).toFixed(1)}K` : `$${amount}`;
  const severity = amount >= 20000 ? 'text-red-400' : amount >= 10000 ? 'text-orange-400' : amount >= 5000 ? 'text-amber-400' : 'text-slate-400';
  return <span className={`font-bold ${severity}`}>{formatted}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CDT CODE DRILL-DOWN
// ═══════════════════════════════════════════════════════════════════════════════

function CDTDrillDown({ code, onBack }: { code: CDTCode; onBack: () => void }) {
  const stages = [
    { label: 'Detected', value: code.detected, color: 'bg-blue-500' },
    { label: 'Diagnosed', value: code.diagnosed, color: 'bg-blue-400' },
    { label: 'Planned', value: code.planned, color: 'bg-teal-500' },
    { label: 'Presented', value: code.presented, color: 'bg-teal-400' },
    { label: 'Accepted', value: code.accepted, color: 'bg-emerald-500' },
    { label: 'Scheduled', value: code.scheduled, color: 'bg-yellow-500' },
    { label: 'Completed', value: code.completed, color: 'bg-orange-500' },
    { label: 'Collected', value: code.collected, color: 'bg-red-400' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to CDT Analysis
      </button>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-sm font-mono font-bold rounded">{code.code}</span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{code.description}</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{code.category} · Avg Fee: ${code.avgFee}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">OVERALL GAP RATE</p>
          <p className={`text-2xl font-bold ${code.overallGapRate >= 50 ? 'text-red-400' : code.overallGapRate >= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>{code.overallGapRate}%</p>
          <p className="text-xs text-slate-500 mt-1">Industry avg: {code.industryAvg}%</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">TOTAL LEAKAGE</p>
          <p className="text-2xl font-bold text-red-400">${code.totalLeakage >= 1000 ? `${(code.totalLeakage / 1000).toFixed(1)}K` : code.totalLeakage}</p>
          <p className="text-xs text-slate-500 mt-1">{code.detected - code.collected} episodes lost</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">ACCEPTANCE RATE</p>
          <p className={`text-2xl font-bold ${code.acceptanceRate >= 80 ? 'text-emerald-400' : code.acceptanceRate >= 65 ? 'text-amber-400' : 'text-red-400'}`}>{code.acceptanceRate}%</p>
          <p className="text-xs text-slate-500 mt-1">Presented → Accepted</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">COMPLETION RATE</p>
          <p className={`text-2xl font-bold ${code.completionRate >= 85 ? 'text-emerald-400' : code.completionRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{code.completionRate}%</p>
          <p className="text-xs text-slate-500 mt-1">Accepted → Completed</p>
        </div>
      </div>

      {/* Full Funnel */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" /> 8-Stage Revenue Funnel — {code.code}
        </h3>
        <div className="space-y-3">
          {stages.map((stage, i) => {
            const pct = code.detected > 0 ? Math.round((stage.value / code.detected) * 100) : 0;
            const prev = i > 0 ? stages[i - 1].value : stage.value;
            const drop = prev > 0 ? Math.round(((prev - stage.value) / prev) * 100) : 0;
            const lost = i > 0 ? prev - stage.value : 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 text-right">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stage.label}</span>
                </div>
                <div className="flex-1 relative">
                  <div className="w-full h-8 bg-slate-100 dark:bg-slate-700/50 rounded-lg overflow-hidden">
                    <div className={`h-full ${stage.color} rounded-lg transition-all duration-700 flex items-center px-2`}
                      style={{ width: `${pct}%` }}>
                      <span className="text-[10px] font-bold text-white">{stage.value}</span>
                    </div>
                  </div>
                </div>
                <div className="w-14 text-right">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{pct}%</span>
                </div>
                <div className="w-20 text-right">
                  {drop > 0 ? (
                    <span className={`text-xs font-semibold ${drop >= 15 ? 'text-red-400' : drop >= 8 ? 'text-amber-400' : 'text-slate-400'}`}>
                      ↓{drop}% ({lost})
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dentamind Insights */}
      <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-400" /> Dentamind Analysis — {code.code}
        </h3>
        <div className="space-y-2">
          {code.overallGapRate > code.industryAvg + 10 && (
            <RecItem icon="🚨" text={`Gap rate ${code.overallGapRate}% is ${code.overallGapRate - code.industryAvg}pts above industry average (${code.industryAvg}%) — requires immediate process review`} />
          )}
          {code.acceptanceRate < 75 && (
            <RecItem icon="🎯" text={`Low acceptance rate (${code.acceptanceRate}%) suggests case presentation issues — consider visual aids, financing options, or OraQ integration for AI-assisted patient education`} />
          )}
          {code.completionRate < 80 && (
            <RecItem icon="📅" text={`${100 - code.completionRate}% of accepted cases never complete — implement automated scheduling nudges at 7, 14, and 21 days post-acceptance`} />
          )}
          {code.collectionRate < 90 && (
            <RecItem icon="💰" text={`Collection rate at ${code.collectionRate}% — ${Math.round(code.completed * (1 - code.collectionRate / 100))} completed procedures with outstanding balances`} />
          )}
          {code.trend > 5 && (
            <RecItem icon="📈" text={`Gap rate trending +${code.trend}% this period — deteriorating performance requires intervention`} />
          )}
          {code.avgFee >= 800 && (
            <RecItem icon="💎" text={`High-value procedure ($${code.avgFee}/unit) — each lost episode = significant revenue impact. Prioritize in follow-up workflows.`} />
          )}
          <RecItem icon="📊" text={`Recovery potential: Closing gap to industry average would recover ~$${Math.round(code.totalLeakage * 0.3).toLocaleString()}/month in additional revenue`} />
        </div>
      </div>
    </div>
  );
}

function RecItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
      <span className="text-base flex-shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function CDTGapAnalysisPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CDTCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<CDTCode | null>(null);
  const [sortBy, setSortBy] = useState<'gap' | 'leakage' | 'volume'>('leakage');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Generate CDT data (in production, this would come from the API)
    const data = generateCDTData();
    setCategories(data);
    setLoading(false);
  }, []);

  // ── Flatten & sort all codes ───────────────────────────────────────────
  const allCodes = categories.flatMap(c => c.codes);
  const filteredCodes = allCodes
    .filter(c => filterCategory === 'all' || c.category === filterCategory)
    .filter(c => searchTerm === '' || c.code.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'leakage') return b.totalLeakage - a.totalLeakage;
      if (sortBy === 'gap') return b.overallGapRate - a.overallGapRate;
      return b.detected - a.detected;
    });

  // ── Computed KPIs ──────────────────────────────────────────────────────
  const totalLeakage = allCodes.reduce((s, c) => s + c.totalLeakage, 0);
  const totalEpisodes = allCodes.reduce((s, c) => s + c.detected, 0);
  const avgGapRate = allCodes.length ? Math.round(allCodes.reduce((s, c) => s + c.overallGapRate, 0) / allCodes.length) : 0;
  const worstCategory = [...categories].sort((a, b) => b.avgGapRate - a.avgGapRate)[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (selectedCode) {
    return (
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
        <CDTDrillDown code={selectedCode} onBack={() => setSelectedCode(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/outcome-gap')} className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" /> Back to Outcome Gap
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl"><BarChart3 className="w-6 h-6 text-rose-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CDT-Code Gap Analysis</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Procedure-level revenue leakage — which treatments lose the most money?</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">TOTAL LEAKAGE</p>
            <DollarSign className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">${(totalLeakage / 1000).toFixed(1)}K</p>
          <p className="text-xs text-slate-500 mt-1">Across {allCodes.length} CDT codes</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">AVG GAP RATE</p>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{avgGapRate}%</p>
          <p className="text-xs text-slate-500 mt-1">{totalEpisodes} total episodes</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">WORST CATEGORY</p>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{worstCategory?.category}</p>
          <p className="text-xs text-red-400 mt-1">{worstCategory?.avgGapRate}% avg gap</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">RECOVERY POTENTIAL</p>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">${(totalLeakage * 0.3 / 1000).toFixed(1)}K</p>
          <p className="text-xs text-slate-500 mt-1">Achievable with interventions</p>
        </div>
      </div>

      {/* Category Heatmap */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" /> Gap Rate by Procedure Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...categories].sort((a, b) => b.avgGapRate - a.avgGapRate).map(cat => (
            <button key={cat.category} onClick={() => setFilterCategory(cat.category === filterCategory ? 'all' : cat.category)}
              className={`p-4 rounded-xl border text-left transition-all ${
                filterCategory === cat.category
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{cat.category}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  cat.avgGapRate >= 60 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  cat.avgGapRate >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>{cat.avgGapRate}% gap</span>
              </div>
              <GapBar rate={cat.avgGapRate} benchmark={50} size="sm" />
              <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                <span>{cat.totalEpisodes} episodes</span>
                <span className="text-red-400 font-semibold">${(cat.avgLeakage / 1000).toFixed(1)}K leaked</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search CDT code or description..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white placeholder-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          {(['leakage', 'gap', 'volume'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                sortBy === s ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}>
              {s === 'leakage' ? '$ Leakage' : s === 'gap' ? 'Gap Rate' : 'Volume'}
            </button>
          ))}
        </div>
        {filterCategory !== 'all' && (
          <button onClick={() => setFilterCategory('all')}
            className="px-3 py-1.5 text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg flex items-center gap-1">
            {filterCategory} ×
          </button>
        )}
      </div>

      {/* CDT Code Table */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" /> Procedure-Level Breakdown
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400" /> Industry Benchmark</span>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {filteredCodes.map((code) => (
            <button key={code.code} onClick={() => setSelectedCode(code)}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left">
              {/* Code */}
              <div className="w-16">
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded">{code.code}</span>
              </div>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{code.description}</p>
                <p className="text-[10px] text-slate-400">{code.category} · ${code.avgFee}/unit · {code.detected} episodes</p>
              </div>

              {/* Mini Funnel */}
              <div className="hidden lg:block w-32">
                <MiniStageFunnel code={code} />
              </div>

              {/* Gap Rate */}
              <div className="w-28">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-400">Gap</span>
                  <span className={`font-bold ${code.overallGapRate >= 50 ? 'text-red-400' : code.overallGapRate >= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>{code.overallGapRate}%</span>
                </div>
                <GapBar rate={code.overallGapRate} benchmark={code.industryAvg} size="sm" />
              </div>

              {/* Leakage */}
              <div className="w-20 text-right">
                <LeakageIndicator amount={code.totalLeakage} />
                {code.trend > 0 && (
                  <p className="text-[10px] text-red-400 flex items-center justify-end gap-0.5 mt-0.5">
                    <TrendingDown className="w-3 h-3" />+{code.trend}%
                  </p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Dentamind Insights */}
      <div className="bg-gradient-to-r from-rose-500/10 to-teal-500/10 border border-rose-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-rose-400" /> Dentamind CDT Intelligence
        </h3>
        <div className="space-y-2">
          <RecItem icon="👑" text={`Crowns (D2750, D2740) account for $${((allCodes.find(c => c.code === 'D2750')?.totalLeakage || 0) + (allCodes.find(c => c.code === 'D2740')?.totalLeakage || 0)) / 1000}K in leakage — 45% acceptance-to-completion drop vs 12% for prophylaxis. Highest ROI improvement target.`} />
          <RecItem icon="🦷" text={`Prosthodontics (dentures, partials) have the highest gap rates (83-88%) but lower volume. Focus resources on high-volume/high-value codes first.`} />
          <RecItem icon="📉" text={`Preventive procedures (D0120, D1110, D0274) show lowest gap rates (12-13%) — these are your baseline. Any code above 25% gap needs process intervention.`} />
          <RecItem icon="💡" text={`Recommendation: Implement financing options for procedures over $500 (crowns, root canals, dentures) — financial concern is the #1 barrier at the acceptance stage.`} />
          <RecItem icon="🎯" text={`Closing the crown gap rate from 74% to industry average (55%) would recover ~$${Math.round(35000 * 0.25 / 1000)}K/month — highest single-code recovery opportunity.`} />
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">Dentamind AI — CDT-Code Gap Analysis · Outcome Gap Intelligence Engine</p>
      </div>
    </div>
  );
}
