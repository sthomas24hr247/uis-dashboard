import { useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target, Percent,
  Phone, CalendarPlus, Mail, ChevronRight, Activity,
} from 'lucide-react';

// ── Mock Data (matches Dentamind Outcome Gap Engine) ──────────────────────

const kpiMetrics = {
  outcomeGap: { label: 'OUTCOME GAP', value: 67, subtitle: '$203K leaked this month', trend: '+3%', up: true, variant: 'danger' },
  atRiskRevenue: { label: 'AT-RISK REVENUE', value: 312000, subtitle: '48 stalled episodes', trend: '-$18K', up: false, variant: 'danger' },
  activeGaps: { label: 'ACTIVE GAPS', value: 127, subtitle: '23 critical, 41 high', trend: '+12', up: true, variant: 'danger' },
  collectionRate: { label: 'COLLECTION RATE', value: 33, subtitle: 'Last 30 days', trend: '-2%', up: false, variant: 'success' },
};

const funnelSteps = [
  { stage: 'Detected', count: 847, revenue: 624000, drop: null, color: 'bg-blue-500' },
  { stage: 'Diagnosed', count: 712, revenue: 524000, drop: -16, color: 'bg-blue-400' },
  { stage: 'Planned', count: 634, revenue: 468000, drop: -11, color: 'bg-teal-500' },
  { stage: 'Presented', count: 580, revenue: 428000, drop: -9, color: 'bg-teal-400' },
  { stage: 'Accepted', count: 392, revenue: 289000, drop: -32, color: 'bg-emerald-500' },
  { stage: 'Scheduled', count: 351, revenue: 259000, drop: -10, color: 'bg-yellow-500' },
  { stage: 'Attended', count: 298, revenue: 220000, drop: -15, color: 'bg-orange-400' },
  { stage: 'Completed', count: 284, revenue: 209000, drop: -5, color: 'bg-orange-500' },
  { stage: 'Billed', count: 271, revenue: 200000, drop: -5, color: 'bg-red-400' },
  { stage: 'Collected', count: 243, revenue: 179000, drop: -10, color: 'bg-red-500' },
];

const gapBreakdown = [
  { type: 'Acceptance Gap', amount: 76000, color: 'bg-red-500' },
  { type: 'Attendance Gap', amount: 24000, color: 'bg-orange-400' },
  { type: 'Scheduling Gap', amount: 18000, color: 'bg-amber-400' },
  { type: 'Diagnosis Gap', amount: 32000, color: 'bg-rose-400' },
  { type: 'Collection Gap', amount: 16000, color: 'bg-blue-400' },
  { type: 'Billing Gap', amount: 12000, color: 'bg-teal-500' },
  { type: 'Other Gaps', amount: 25000, color: 'bg-slate-400' },
];

const revenueTrend = [
  { month: 'Mar', ucr: 280, expected: 200, collected: 155 },
  { month: 'Apr', ucr: 290, expected: 215, collected: 160 },
  { month: 'May', ucr: 295, expected: 205, collected: 150 },
  { month: 'Jun', ucr: 310, expected: 210, collected: 165 },
  { month: 'Jul', ucr: 350, expected: 230, collected: 175 },
  { month: 'Aug', ucr: 330, expected: 220, collected: 170 },
  { month: 'Sep', ucr: 355, expected: 240, collected: 180 },
  { month: 'Oct', ucr: 375, expected: 250, collected: 185 },
  { month: 'Nov', ucr: 340, expected: 225, collected: 180 },
  { month: 'Dec', ucr: 310, expected: 215, collected: 175 },
  { month: 'Jan', ucr: 370, expected: 260, collected: 190 },
  { month: 'Feb', ucr: 400, expected: 270, collected: 185 },
];

const priorityActions = [
  { priority: 'CRITICAL', patient: 'Maria Santos', gapType: 'Acceptance Gap', days: 14, atRisk: 4200, cdt: 'D2750' },
  { priority: 'CRITICAL', patient: 'James Chen', gapType: 'Scheduling Gap', days: 8, atRisk: 3800, cdt: 'D2740' },
  { priority: 'HIGH', patient: 'Sarah Johnson', gapType: 'Attendance Gap', days: 3, atRisk: 2450, cdt: 'D2391' },
  { priority: 'HIGH', patient: 'Robert Kim', gapType: 'Diagnosis Gap', days: 12, atRisk: 1890, cdt: 'D0274' },
  { priority: 'HIGH', patient: 'Lisa Patel', gapType: 'Collection Gap', days: 52, atRisk: 1650, cdt: 'D1110' },
  { priority: 'MEDIUM', patient: 'David Martinez', gapType: 'Billing Gap', days: 3, atRisk: 980, cdt: 'D2391' },
  { priority: 'MEDIUM', patient: 'Emily Nguyen', gapType: 'Acceptance Gap', days: 6, atRisk: 870, cdt: 'D2330' },
  { priority: 'LOW', patient: 'Tom Wilson', gapType: 'Scheduling Gap', days: 2, atRisk: 320, cdt: 'D0120' },
];

// ── Components ────────────────────────────────────────────────────────────

function StatCard({ label, value, subtitle, trend, up, variant }: {
  label: string; value: string; subtitle: string; trend: string; up: boolean; variant: string;
}) {
  const isSuccess = variant === 'success';
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
      <p className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 mb-3">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className={`text-3xl font-bold ${isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {value}
        </span>
        <span className={`flex items-center gap-1 text-sm font-medium ${up ? 'text-red-500' : isSuccess ? 'text-red-500' : 'text-emerald-500'}`}>
          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {trend}
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{subtitle}</p>
    </div>
  );
}

function RevenueFunnel() {
  const maxCount = funnelSteps[0].count;
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Revenue Funnel</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Episode flow from detection to collection</p>
        </div>
        <span className="text-sm text-slate-400 dark:text-slate-500">Last 30 days</span>
      </div>
      <div className="space-y-2.5">
        {funnelSteps.map((step) => (
          <div key={step.stage} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 w-20 text-right flex-shrink-0">{step.stage}</span>
            <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700/50 rounded-lg overflow-hidden relative">
              <div
                className={`h-full ${step.color} rounded-lg transition-all duration-500 flex items-center px-3`}
                style={{ width: `${(step.count / maxCount) * 100}%` }}
              >
                <span className="text-xs font-bold text-white drop-shadow-sm">{step.count}</span>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-14 text-right flex-shrink-0">
              ${(step.revenue / 1000).toFixed(0)}K
            </span>
            <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${
              step.drop === null ? 'text-transparent' :
              Math.abs(step.drop) >= 20 ? 'text-red-500' : 'text-orange-500'
            }`}>
              {step.drop !== null ? `${step.drop}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GapBreakdownPanel() {
  const total = gapBreakdown.reduce((s, g) => s + g.amount, 0);
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
      <h3 className="font-bold text-slate-900 dark:text-white mb-1">Gap Breakdown</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Revenue lost by gap type — ${(total / 1000).toFixed(0)}K total
      </p>
      {/* Stacked bar */}
      <div className="flex h-5 rounded-full overflow-hidden mb-5">
        {gapBreakdown.map((g) => (
          <div
            key={g.type}
            className={`${g.color} transition-all`}
            style={{ width: `${(g.amount / total) * 100}%` }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {gapBreakdown.map((g) => (
          <div key={g.type} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${g.color} flex-shrink-0`} />
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{g.type}</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-auto">
              ${(g.amount / 1000).toFixed(0)}K
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevenueTrendChart() {
  const maxVal = 420;
  const chartHeight = 240;
  const chartWidth = 800;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const toX = (i: number) => padding.left + (i / (revenueTrend.length - 1)) * innerW;
  const toY = (v: number) => padding.top + innerH - (v / maxVal) * innerH;

  const makePath = (key: 'ucr' | 'expected' | 'collected') =>
    revenueTrend.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d[key])}`).join(' ');

  // Area between expected and collected (the outcome gap)
  const areaPath =
    revenueTrend.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.expected)}`).join(' ') +
    revenueTrend.slice().reverse().map((d, i) => `L${toX(revenueTrend.length - 1 - i)},${toY(d.collected)}`).join(' ') + 'Z';

  // Area between UCR and expected
  const gapAreaPath =
    revenueTrend.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.ucr)}`).join(' ') +
    revenueTrend.slice().reverse().map((d, i) => `L${toX(revenueTrend.length - 1 - i)},${toY(d.expected)}`).join(' ') + 'Z';

  const yTicks = [0, 100, 200, 300, 400];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
      <h3 className="font-bold text-slate-900 dark:text-white mb-1">Revenue Trend</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">UCR → Expected → Collected (12 months)</p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: 600 }}>
          {/* Grid */}
          {yTicks.map(v => (
            <g key={v}>
              <line x1={padding.left} y1={toY(v)} x2={chartWidth - padding.right} y2={toY(v)}
                stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="4 4" />
              <text x={padding.left - 8} y={toY(v) + 4} textAnchor="end"
                className="text-[10px] fill-slate-400 dark:fill-slate-500">${v}K</text>
            </g>
          ))}
          {/* Month labels */}
          {revenueTrend.map((d, i) => (
            <text key={d.month} x={toX(i)} y={chartHeight - 5} textAnchor="middle"
              className="text-[10px] fill-slate-400 dark:fill-slate-500">{d.month}</text>
          ))}
          {/* Gap areas */}
          <path d={gapAreaPath} fill="currentColor" className="text-slate-200 dark:text-slate-700" opacity={0.7} />
          <path d={areaPath} fill="currentColor" className="text-slate-300 dark:text-slate-600" opacity={0.5} />
          {/* Lines */}
          <path d={makePath('ucr')} fill="none" stroke="currentColor" className="text-slate-400 dark:text-slate-500"
            strokeWidth={1.5} strokeDasharray="6 4" />
          <path d={makePath('expected')} fill="none" stroke="#06b6d4" strokeWidth={2.5} />
          <path d={makePath('collected')} fill="none" stroke="#10b981" strokeWidth={2.5} />
        </svg>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t-2 border-dashed border-slate-400" />
          <span className="text-xs text-slate-500">UCR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-cyan-500 rounded" />
          <span className="text-xs text-slate-500">Expected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-emerald-500 rounded" />
          <span className="text-xs text-slate-500">Collected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-slate-200 dark:bg-slate-600 rounded-sm opacity-60" />
          <span className="text-xs text-slate-500">Outcome Gap</span>
        </div>
      </div>
    </div>
  );
}

function PriorityActionsTable() {
  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'CRITICAL': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50';
      case 'HIGH': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
      case 'MEDIUM': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'LOW': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Priority Actions</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gaps requiring immediate attention</p>
        </div>
        <button className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">PRIORITY</th>
              <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">PATIENT</th>
              <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">GAP TYPE</th>
              <th className="text-right text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">DAYS</th>
              <th className="text-right text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">$ AT RISK</th>
              <th className="text-left text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3 pr-4">CDT</th>
              <th className="text-right text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-3">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {priorityActions.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="py-4 pr-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border ${getPriorityStyle(row.priority)}`}>
                    {row.priority}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">{row.patient}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{row.gapType}</span>
                </td>
                <td className="py-4 pr-4 text-right">
                  <span className={`text-sm font-medium ${row.days >= 10 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                    {row.days}d
                  </span>
                </td>
                <td className="py-4 pr-4 text-right">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    ${row.atRisk.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{row.cdt}</span>
                </td>
                <td className="py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <CalendarPlus className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function OutcomeGapPage() {
  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 
          flex items-center justify-center shadow-lg shadow-rose-500/20 dark:shadow-rose-500/10">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Outcome Gap Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Track every dollar from AI detection to collection
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={kpiMetrics.outcomeGap.label}
          value={`${kpiMetrics.outcomeGap.value}%`}
          subtitle={kpiMetrics.outcomeGap.subtitle}
          trend={kpiMetrics.outcomeGap.trend}
          up={kpiMetrics.outcomeGap.up}
          variant={kpiMetrics.outcomeGap.variant}
        />
        <StatCard
          label={kpiMetrics.atRiskRevenue.label}
          value={`$${(kpiMetrics.atRiskRevenue.value / 1000).toFixed(0)}K`}
          subtitle={kpiMetrics.atRiskRevenue.subtitle}
          trend={kpiMetrics.atRiskRevenue.trend}
          up={kpiMetrics.atRiskRevenue.up}
          variant={kpiMetrics.atRiskRevenue.variant}
        />
        <StatCard
          label={kpiMetrics.activeGaps.label}
          value={kpiMetrics.activeGaps.value.toString()}
          subtitle={kpiMetrics.activeGaps.subtitle}
          trend={kpiMetrics.activeGaps.trend}
          up={kpiMetrics.activeGaps.up}
          variant={kpiMetrics.activeGaps.variant}
        />
        <StatCard
          label={kpiMetrics.collectionRate.label}
          value={`${kpiMetrics.collectionRate.value}%`}
          subtitle={kpiMetrics.collectionRate.subtitle}
          trend={kpiMetrics.collectionRate.trend}
          up={kpiMetrics.collectionRate.up}
          variant={kpiMetrics.collectionRate.variant}
        />
      </div>

      {/* Funnel + Gap Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueFunnel />
        </div>
        <GapBreakdownPanel />
      </div>

      {/* Revenue Trend */}
      <RevenueTrendChart />

      {/* Priority Actions */}
      <PriorityActionsTable />

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Dentamind AI — Outcome Gap Intelligence Engine
        </p>
      </div>
    </div>
  );
}
