import {
  DollarSign,
  Users,
  Calendar,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Placeholder analytics data
const stats = [
  {
    label: 'Total Revenue',
    value: '$124,500',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    label: 'Patients Seen',
    value: '342',
    change: '+8.2%',
    trend: 'up',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    label: 'Appointments',
    value: '487',
    change: '-2.4%',
    trend: 'down',
    icon: Calendar,
    color: 'bg-violet-100 text-violet-600',
  },
  {
    label: 'Avg Wait Time',
    value: '12 min',
    change: '-15%',
    trend: 'up',
    icon: Clock,
    color: 'bg-amber-100 text-amber-600',
  },
];

const recentMetrics = [
  { period: 'Mon', production: 18500, collection: 16200 },
  { period: 'Tue', production: 22000, collection: 19800 },
  { period: 'Wed', production: 19500, collection: 18100 },
  { period: 'Thu', production: 24000, collection: 21500 },
  { period: 'Fri', production: 21000, collection: 19000 },
];

const topProcedures = [
  { code: 'D0120', description: 'Periodic Oral Exam', count: 145, revenue: 7250 },
  { code: 'D1110', description: 'Prophylaxis - Adult', count: 132, revenue: 13200 },
  { code: 'D0274', description: 'Bitewing - 4 Films', count: 98, revenue: 4900 },
  { code: 'D2391', description: 'Composite - 1 Surface', count: 67, revenue: 12060 },
  { code: 'D2750', description: 'Crown - Porcelain', count: 23, revenue: 27600 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500">Practice performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-uis-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6"
          >
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-4">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
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
          
          {/* Simple bar chart visualization */}
          <div className="space-y-4">
            {recentMetrics.map((day) => (
              <div key={day.period} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600 w-10">{day.period}</span>
                  <span className="text-slate-500">${day.production.toLocaleString()}</span>
                </div>
                <div className="flex gap-1 h-8">
                  <div
                    className="bg-uis-500 rounded-l-lg transition-all"
                    style={{ width: `${(day.production / 25000) * 100}%` }}
                  />
                  <div
                    className="bg-blue-500 rounded-r-lg transition-all"
                    style={{ width: `${(day.collection / 25000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Collection Rate</h2>
          
          <div className="flex items-center justify-center py-8">
            <div className="relative w-48 h-48">
              {/* Circular progress */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="16"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="16"
                  strokeDasharray={`${91 * 5.02} 502`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-slate-900">91%</span>
                <span className="text-sm text-slate-500">Collection Rate</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900">$105,500</p>
              <p className="text-sm text-slate-500">Collected</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900">$10,400</p>
              <p className="text-sm text-slate-500">Outstanding</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Procedures */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Top Procedures</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="pb-4 font-medium">Code</th>
                <th className="pb-4 font-medium">Description</th>
                <th className="pb-4 font-medium text-right">Count</th>
                <th className="pb-4 font-medium text-right">Revenue</th>
                <th className="pb-4 font-medium w-32"></th>
              </tr>
            </thead>
            <tbody>
              {topProcedures.map((proc) => (
                <tr key={proc.code} className="border-b border-slate-50">
                  <td className="py-4 font-mono text-sm text-slate-900">{proc.code}</td>
                  <td className="py-4 text-slate-700">{proc.description}</td>
                  <td className="py-4 text-right font-medium text-slate-900">{proc.count}</td>
                  <td className="py-4 text-right font-medium text-slate-900">
                    ${proc.revenue.toLocaleString()}
                  </td>
                  <td className="py-4">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-uis-500 rounded-full"
                        style={{ width: `${(proc.revenue / 30000) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights Teaser */}
      <div className="bg-gradient-to-br from-uis-600 to-uis-800 rounded-2xl p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Dentamind AI Insights</h3>
            <p className="text-uis-100 mb-4">
              Connect Dentamind to get predictive analytics, patient risk scoring, 
              revenue forecasting, and intelligent scheduling recommendations.
            </p>
            <button className="bg-white text-uis-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-uis-50 transition-colors">
              Connect Dentamind
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
