import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Building2, Users, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface PortfolioBenchmarks {
  meta: {
    practiceCount: number;
    totalPatients: number;
    windowDays: number;
    generatedAt: string;
    dataSource: string;
  };
  portfolio: {
    avgCancelRiskPct: number;
    avgAttritionRiskPct: number;
    avgCollectionRate: number;
    avgProductionPerPractice: number;
    totalLeakedRevenue: number;
    avgDaysStalled: number;
    highRiskPatientRate: number;
  };
  industry: {
    noShowRate: { industry: number; top25: number; top10: number };
    collectionRate: { industry: number; top25: number; top10: number };
    newPatientRate: { industry: number; top25: number; top10: number };
    treatmentAcceptance: { industry: number; top25: number; top10: number };
    recallCompliance: { industry: number; top25: number; top10: number };
    revenuePerPatient: { industry: number; top25: number; top10: number };
  };
  currentPractice: {
    patientCount: number;
    cancelRiskPct: number;
    attritionRiskPct: number;
    highRiskPatients: number;
    portfolioRank: number | null;
    portfolioTotal: number;
    vsPortfolioAvg: { cancelRisk: string };
    industryPercentile: { cancelRisk: string; collectionRate: string };
  } | null;
  insights: string[];
}

function BenchmarkBar({ value, industry, top25, top10, lowerIsBetter = false, label, format = 'pct' }: {
  value: number; industry: number; top25: number; top10: number;
  lowerIsBetter?: boolean; label: string; format?: 'pct' | 'dollar' | 'days';
}) {
  const max = lowerIsBetter ? industry * 1.5 : top10 * 1.1;
  const pct = Math.min(100, (value / max) * 100);
  const industryPct = Math.min(100, (industry / max) * 100);
  const top25Pct = Math.min(100, (top25 / max) * 100);

  const isGood = lowerIsBetter ? value <= industry : value >= industry;
  const isGreat = lowerIsBetter ? value <= top25 : value >= top25;

  const color = isGreat ? 'bg-emerald-500' : isGood ? 'bg-teal-500' : 'bg-amber-500';

  const fmt = (v: number) => {
    if (format === 'pct') return `${(v * 100).toFixed(1)}%`;
    if (format === 'dollar') return `$${v.toLocaleString()}`;
    if (format === 'days') return `${v.toFixed(0)}d`;
    return `${v}`;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${isGreat ? 'text-emerald-600 dark:text-emerald-400' : isGood ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {fmt(value)}
          </span>
          {isGreat ? <TrendingUp className="w-3 h-3 text-emerald-500" /> :
           isGood  ? <Minus className="w-3 h-3 text-teal-500" /> :
                     <TrendingDown className="w-3 h-3 text-amber-500" />}
        </div>
      </div>
      <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-visible">
        {/* Industry marker */}
        <div className="absolute top-[-3px] w-0.5 h-[14px] bg-slate-400 dark:bg-slate-500 z-10"
          style={{ left: `${industryPct}%` }} title={`Industry avg: ${fmt(industry)}`} />
        {/* Top 25% marker */}
        <div className="absolute top-[-3px] w-0.5 h-[14px] bg-teal-400 z-10"
          style={{ left: `${top25Pct}%` }} title={`Top 25%: ${fmt(top25)}`} />
        {/* Value bar */}
        <div className={`absolute top-0 left-0 h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-[9px] text-slate-400">
        <span>Industry avg: {fmt(industry)}</span>
        <span className="text-teal-500">Top 25%: {fmt(top25)}</span>
        <span className="text-emerald-500">Top 10%: {fmt(top10)}</span>
      </div>
    </div>
  );
}

export default function MARVAPortfolioBenchmarks() {
  const [data, setData] = useState<PortfolioBenchmarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('uis_token') || '';
    fetch('https://api.uishealth.com/api/marva/portfolio-benchmarks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-teal-500 mr-2" />
      <span className="text-sm text-slate-500">Loading portfolio benchmarks...</span>
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400">
      <AlertTriangle className="w-4 h-4" /> {error || 'Failed to load benchmarks'}
    </div>
  );

  const cp = data.currentPractice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Portfolio Intelligence</h3>
          <p className="text-xs text-slate-500 mt-0.5">{data.meta.dataSource} · Last {data.meta.windowDays} days</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-black text-teal-600">{data.meta.practiceCount}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Practices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-teal-600">{data.meta.totalPatients.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Patients Scored</div>
          </div>
        </div>
      </div>

      {/* Your Practice vs Portfolio */}
      {cp && (
        <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">Your Practice</span>
            {cp.portfolioRank && (
              <span className="ml-auto text-[10px] font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full">
                #{cp.portfolioRank} of {cp.portfolioTotal} practices
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Cancel Risk</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{cp.cancelRiskPct.toFixed(1)}%</div>
              <div className={`text-[10px] font-semibold mt-0.5 ${cp.vsPortfolioAvg.cancelRisk.startsWith('-') ? 'text-emerald-600' : 'text-amber-600'}`}>
                {cp.vsPortfolioAvg.cancelRisk} vs portfolio avg
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{cp.industryPercentile.cancelRisk} vs industry</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">High-Risk Patients</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{cp.highRiskPatients}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">of {cp.patientCount} scored patients</div>
            </div>
          </div>
        </div>
      )}

      {/* Industry Benchmarks */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Industry Benchmarks</span>
          <span className="text-[10px] text-slate-400 ml-auto">ADA HPI + FOCUS Investment Banking</span>
        </div>

        <BenchmarkBar
          value={data.industry.noShowRate.industry}
          industry={data.industry.noShowRate.industry}
          top25={data.industry.noShowRate.top25}
          top10={data.industry.noShowRate.top10}
          lowerIsBetter
          label="No-Show / Cancel Rate"
          format="pct"
        />
        <BenchmarkBar
          value={data.industry.collectionRate.industry}
          industry={data.industry.collectionRate.industry}
          top25={data.industry.collectionRate.top25}
          top10={data.industry.collectionRate.top10}
          label="Collections Rate"
          format="pct"
        />
        <BenchmarkBar
          value={data.industry.treatmentAcceptance.industry}
          industry={data.industry.treatmentAcceptance.industry}
          top25={data.industry.treatmentAcceptance.top25}
          top10={data.industry.treatmentAcceptance.top10}
          label="Treatment Acceptance Rate"
          format="pct"
        />
        <BenchmarkBar
          value={data.industry.recallCompliance.industry}
          industry={data.industry.recallCompliance.industry}
          top25={data.industry.recallCompliance.top25}
          top10={data.industry.recallCompliance.top10}
          label="Recall Compliance"
          format="pct"
        />
        <BenchmarkBar
          value={data.industry.revenuePerPatient.industry}
          industry={data.industry.revenuePerPatient.industry}
          top25={data.industry.revenuePerPatient.top25}
          top10={data.industry.revenuePerPatient.top10}
          label="Revenue per Active Patient"
          format="dollar"
        />
      </div>

      {/* Portfolio Stats */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Portfolio Overview</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Avg Cancel Risk', value: `${data.portfolio.avgCancelRiskPct.toFixed(1)}%` },
            { label: 'Avg Collection Rate', value: `${data.portfolio.avgCollectionRate.toFixed(1)}%` },
            { label: 'High-Risk Patient Rate', value: `${data.portfolio.highRiskPatientRate.toFixed(1)}%` },
            { label: 'Revenue Leaked (90d)', value: `$${(data.portfolio.totalLeakedRevenue / 1000).toFixed(0)}K` },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{stat.label}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="space-y-2">
        {data.insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
            {insight}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 text-center">
        Portfolio intelligence compounds with every connected practice.
        At 50+ practices, MARVA can cite specific cross-practice precedents for every recommendation.
      </p>
    </div>
  );
}
