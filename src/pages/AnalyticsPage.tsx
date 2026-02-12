import { useQuery, gql } from '@apollo/client';
import {
  DollarSign,
  Users,
  Calendar,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

const GET_ANALYTICS = gql`
  query GetAnalyticsStats {
    analyticsStats {
      totalRevenue
      activePatients
      totalAppointments
      completedAppointments
      cancelledAppointments
      noShowRate
      monthlyData {
        month
        production
        collections
        appointments
        cancelled
      }
    }
  }
`;

export default function AnalyticsPage() {
  const { data, loading, error, refetch } = useQuery(GET_ANALYTICS);
  const stats = data?.analyticsStats;

  const statCards = stats ? [
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      detail: `From ${stats.completedAppointments} completed appointments`,
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Active Patients',
      value: stats.activePatients.toString(),
      detail: 'Currently active in system',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Total Appointments',
      value: stats.totalAppointments.toString(),
      detail: `${stats.cancelledAppointments} cancelled`,
      icon: Calendar,
      color: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'No-Show Rate',
      value: `${stats.noShowRate}%`,
      detail: `${stats.cancelledAppointments} of ${stats.totalAppointments} appointments`,
      icon: Clock,
      color: stats.noShowRate > 15 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600',
    },
  ] : [];

  const collectionRate = stats?.monthlyData?.length
    ? Math.round(
        stats.monthlyData.reduce((s: number, m: any) => s + m.collections, 0) /
        stats.monthlyData.reduce((s: number, m: any) => s + m.production, 0) * 100
      )
    : 88;
  const totalCollections = stats?.monthlyData?.reduce((s: number, m: any) => s + m.collections, 0) || 0;
  const totalOutstanding = stats ? stats.totalRevenue - totalCollections : 0;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500">Practice performance overview — Live from Open Dental</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && !stats && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-uis-200 border-t-uis-600 rounded-full animate-spin" />
            <p className="text-slate-500">Loading analytics...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          Error loading analytics: {error.message}
        </div>
      )}

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-4">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.detail}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production vs Collection */}
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Production vs Collection</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-uis-500 rounded-full" />
                    Production
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full" />
                    Collection
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {stats.monthlyData.map((month: any) => {
                  const label = new Date(month.month + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  const maxVal = Math.max(...stats.monthlyData.map((m: any) => m.production)) * 1.1;
                  return (
                    <div key={month.month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600 w-20">{label}</span>
                        <span className="text-slate-500">
                          ${month.production.toLocaleString()} / ${month.collections.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1 h-8">
                        <div
                          className="bg-uis-500 rounded-l-lg transition-all"
                          style={{ width: `${(month.production / maxVal) * 100}%` }}
                        />
                        <div
                          className="bg-blue-500 rounded-r-lg transition-all"
                          style={{ width: `${(month.collections / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Collection Rate */}
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Collection Rate</h2>
              <div className="flex items-center justify-center py-8">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="96" cy="96" r="80" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                    <circle cx="96" cy="96" r="80" fill="none" stroke="#14b8a6" strokeWidth="16"
                      strokeDasharray={`${collectionRate * 5.02} 502`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-900">{collectionRate}%</span>
                    <span className="text-sm text-slate-500">Collection Rate</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-900">${totalCollections.toLocaleString()}</p>
                  <p className="text-sm text-slate-500">Collected</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-900">${totalOutstanding.toLocaleString()}</p>
                  <p className="text-sm text-slate-500">Outstanding</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Breakdown */}
          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Monthly Appointment Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                    <th className="pb-4 font-medium">Month</th>
                    <th className="pb-4 font-medium text-right">Appointments</th>
                    <th className="pb-4 font-medium text-right">Cancelled</th>
                    <th className="pb-4 font-medium text-right">Production</th>
                    <th className="pb-4 font-medium text-right">Collections</th>
                    <th className="pb-4 font-medium w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.monthlyData.map((month: any) => {
                    const label = new Date(month.month + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    const maxProd = Math.max(...stats.monthlyData.map((m: any) => m.production));
                    return (
                      <tr key={month.month} className="border-b border-slate-50">
                        <td className="py-4 text-slate-900 font-medium">{label}</td>
                        <td className="py-4 text-right text-slate-700">{month.appointments}</td>
                        <td className="py-4 text-right text-red-600">{month.cancelled}</td>
                        <td className="py-4 text-right font-medium text-slate-900">
                          ${month.production.toLocaleString()}
                        </td>
                        <td className="py-4 text-right font-medium text-emerald-600">
                          ${month.collections.toLocaleString()}
                        </td>
                        <td className="py-4">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-uis-500 rounded-full"
                              style={{ width: `${(month.production / maxProd) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dentamind AI Teaser */}
          <div className="bg-gradient-to-br from-uis-600 to-uis-800 rounded-2xl p-8 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Powered by Dentamind AI</h3>
                <p className="text-uis-100 mb-4">
                  Analytics computed from live Open Dental data. Connect more practices 
                  to unlock cross-practice benchmarking, predictive scheduling, and automated insights.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
