import { useQuery, gql } from '@apollo/client';
import {
  DollarSign, CalendarClock, TrendingUp, Users, ShieldAlert, Activity,
  RefreshCw, AlertTriangle, CheckCircle2, Clock, Brain, Sparkles,
  ChevronRight, Building2,
} from 'lucide-react';
import AskDentamind from '../components/AskDentamind';

const GET_COMMAND_CENTER = gql`
  query GetCommandCenter {
    aiPredictionsSummary {
      highRiskAppointments
      mediumRiskAppointments
      lowRiskAppointments
      highRiskPatients
      nextMonthForecast
      confidenceLevel
    }
    noshowRisks(limit: 20) {
      appointmentId
      patientName
      dateTime
      type
      provider
      noshowRiskScore
      riskCategory
      dayOfWeek
      hourOfDay
    }
    churnRisks(limit: 20) {
      patientId
      firstName
      lastName
      churnRiskScore
      churnRiskCategory
      recommendedAction
      daysSinceVisit
      totalVisits
    }
    revenueForecast {
      forecastMonth
      monthOffset
      forecastProduction
      forecastCollections
      confidenceLevel
      growthRatePct
    }
    analyticsStats {
      totalRevenue
      activePatients
      totalAppointments
      completedAppointments
      cancelledAppointments
      noShowRate
    }
  }
`;

const quickAskCards = [
  {
    title: 'Revenue Risk This Week',
    description: 'Where are we most likely to lose revenue in the next 7...',
    icon: DollarSign,
    color: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
  },
  {
    title: 'Fragile Schedules Tomorrow',
    description: 'Which locations have the highest risk of schedule...',
    icon: CalendarClock,
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  },
  {
    title: 'Biggest Bottleneck Today',
    description: 'Where are we losing chair time or throughput today?',
    icon: Activity,
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
  },
  {
    title: 'Patients Falling Through Cracks',
    description: 'Which patients or treatment plans are at risk of leakage?',
    icon: Users,
    color: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
  },
  {
    title: 'Best Offices: What They Do Differently',
    description: 'What decision patterns separate our best-run offices...',
    icon: Building2,
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
  },
  {
    title: 'One Fix for Tomorrow Morning',
    description: 'If we could fix one thing tomorrow to improve...',
    icon: CheckCircle2,
    color: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
  },
];

function getRiskBadge(category: string) {
  switch (category.toUpperCase()) {
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold
          bg-red-500/20 text-red-400 border border-red-500/30">
          HIGH RISK
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold
          bg-amber-500/20 text-amber-400 border border-amber-500/30">
          MEDIUM RISK
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold
          bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          LOW RISK
        </span>
      );
  }
}

export default function AIPredictionsPage() {
  const { data, loading, refetch } = useQuery(GET_COMMAND_CENTER);
  const summary = data?.aiPredictionsSummary;
  const noshowRisks = data?.noshowRisks || [];
  const churnRisks = data?.churnRisks || [];
  const forecast = data?.revenueForecast || [];
  const stats = data?.analyticsStats;

  // Compute signal metrics
  const totalRiskAppts = (summary?.highRiskAppointments || 0) + (summary?.mediumRiskAppointments || 0);
  const totalAppts = (summary?.highRiskAppointments || 0) + (summary?.mediumRiskAppointments || 0) + (summary?.lowRiskAppointments || 0);
  const scheduleHealth = totalAppts > 0 ? Math.round(((totalAppts - totalRiskAppts) / totalAppts) * 100) : 100;
  const growthRate = forecast.length > 0 ? forecast[0]?.growthRatePct : 0;
  const highChurn = churnRisks.filter((c: any) => c.churnRiskCategory === 'HIGH').length;

  // Build priorities from combined risks
  const priorities = [
    ...noshowRisks
      .filter((r: any) => r.riskCategory === 'HIGH' || r.riskCategory === 'MEDIUM')
      .slice(0, 3)
      .map((r: any) => ({
        text: `${r.patientName} — ${r.riskCategory.toLowerCase()} cancellation risk on ${r.dayOfWeek}`,
        risk: r.riskCategory,
        detail: `${r.provider || 'Unassigned'} • ${r.dayOfWeek} ${r.hourOfDay}:00`,
        action: 'View Recommendation',
      })),
    ...churnRisks
      .filter((c: any) => c.churnRiskCategory === 'HIGH')
      .slice(0, 3)
      .map((c: any) => ({
        text: `${c.firstName} ${c.lastName} — ${c.daysSinceVisit}+ days since last visit`,
        risk: c.churnRiskCategory,
        detail: c.recommendedAction,
        action: 'View Recommendation',
      })),
  ].sort((a, b) => {
    const order: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (order[a.risk] || 2) - (order[b.risk] || 2);
  }).slice(0, 6);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 
            flex items-center justify-center shadow-lg shadow-teal-500/20 dark:shadow-teal-500/10">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Executive Command Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Dentamind highlights what matters most today — across schedules, operations, and outcomes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Last updated: {timeStr}
          </span>
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
              hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-slate-600 dark:text-slate-400"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-teal-200 dark:border-teal-800 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400">Loading intelligence...</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Quick Ask Dentamind */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Ask Dentamind</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickAskCards.map((card) => (
                <button
                  key={card.title}
                  className="group relative flex items-start gap-3 p-4 rounded-2xl text-left
                    bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60
                    hover:border-teal-400/50 dark:hover:border-teal-500/40
                    hover:shadow-lg hover:shadow-teal-500/5 dark:hover:shadow-teal-500/5
                    transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                    <card.icon className={`w-5 h-5 bg-gradient-to-br ${card.color} bg-clip-text`}
                      style={{ color: card.color.includes('teal') ? '#14b8a6' : 
                               card.color.includes('emerald') ? '#10b981' :
                               card.color.includes('amber') ? '#f59e0b' :
                               card.color.includes('rose') ? '#f43f5e' :
                               card.color.includes('violet') ? '#8b5cf6' : '#06b6d4' }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Today's Signal Snapshot */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Today's Signal Snapshot
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Operational Stability */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60
                hover:border-teal-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-teal-500" />
                  </div>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Operational Stability</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.activePatients || 0} patients active
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {summary?.highRiskPatients || 0} trending at risk
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Monitoring in progress</span>
                </div>
              </div>

              {/* Outcome Confidence */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60
                hover:border-teal-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Outcome Confidence</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {growthRate >= 0 ? 'Predictability improving' : 'Predictability declining'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}% this month
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className={`w-2 h-2 rounded-full ${growthRate >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className={`text-xs ${growthRate >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {growthRate >= 0 ? 'Positive trajectory' : 'Needs attention'}
                  </span>
                </div>
              </div>

              {/* Schedule Integrity */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60
                hover:border-teal-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                    <CalendarClock className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Schedule Integrity</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalRiskAppts > 0
                    ? `${totalRiskAppts} fragile schedule${totalRiskAppts !== 1 ? 's' : ''} detected`
                    : 'Schedules stable'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {scheduleHealth}% schedule health
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className={`w-2 h-2 rounded-full ${totalRiskAppts > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <span className={`text-xs ${totalRiskAppts > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {totalRiskAppts > 0 ? 'Action recommended' : 'All clear'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Forecast Mini */}
          {forecast.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Revenue Forecast (6-Month)
                </h3>
                <div className="space-y-3">
                  {forecast.slice(0, 6).map((f: any) => {
                    const label = new Date(f.forecastMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    const maxVal = Math.max(...forecast.map((x: any) => x.forecastProduction)) * 1.1;
                    const pct = (f.forecastProduction / maxVal) * 100;
                    return (
                      <div key={f.forecastMonth} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-16 flex-shrink-0">{label}</span>
                        <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-16 text-right">
                          ${f.forecastProduction.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* At-Risk Summary */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-500" />
                  Patient Risk Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{highChurn}</p>
                    <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">High churn risk</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalRiskAppts}</p>
                    <p className="text-sm text-amber-600/70 dark:text-amber-400/70 mt-1">At-risk appointments</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${(summary?.nextMonthForecast || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 mt-1">Next month forecast</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats?.completedAppointments || 0}
                    </p>
                    <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1">Completed appointments</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Priorities Right Now */}
          {priorities.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Priorities Right Now</h2>
              </div>
              <div className="space-y-3">
                {priorities.map((priority, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-xl 
                      bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/40
                      hover:border-teal-400/30 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 
                      flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {priority.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {getRiskBadge(priority.risk)}
                        <span className="text-xs text-slate-500 dark:text-slate-400">{priority.detail}</span>
                      </div>
                    </div>
                    <button className="hidden group-hover:flex items-center gap-1 text-xs font-semibold 
                      text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors flex-shrink-0">
                      {priority.action}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pb-4">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Dentamind AI — The Decision Brain for Dentistry
            </p>
          </div>
        </>
      )}

      {/* Ask Dentamind Chat */}
      <AskDentamind />
    </div>
  );
}
