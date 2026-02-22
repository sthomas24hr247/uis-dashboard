import { useQuery, gql } from '@apollo/client';
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    analyticsStats {
      totalRevenue
      activePatients
      totalAppointments
      completedAppointments
      cancelledAppointments
      noShowRate
    }
    revenueMetrics(months: 6) {
      date
      production
      collections
      newPatients
    }
    todaysAppointments {
      id
      patientName
      time
      status
      type
      provider
    }
  }
`;

export default function DashboardPage() {
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_DATA, {
    fetchPolicy: 'cache-and-network',
  });

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading dashboard: {error.message}</p>
        <button onClick={() => refetch()} className="mt-2 text-sm text-red-700 underline">
          Try again
        </button>
      </div>
    );
  }

  const stats = data?.analyticsStats || {};
  const revenue = data?.revenueMetrics || [];
  const appointments = data?.todaysAppointments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Month Revenue"
          value={`$${((stats.totalRevenue || 0) / 1000).toFixed(1)}K`}
          change={0 || 0}
          icon={DollarSign}
          color="emerald"
        />
        <KPICard
          title="Active Patients"
          value={stats.activePatients || 0}
          change={0 || 0}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Today's Appointments"
          value={stats.totalAppointments || 0}
          icon={Calendar}
          color="violet"
        />
        <KPICard
          title="Treatment Acceptance"
          value={`${((0 || 0) * 100).toFixed(0)}%`}
          icon={CheckCircle2}
          color="amber"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {((stats.noShowRate || 0) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-slate-500">No-Show Rate</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{0 || 0}</p>
              <p className="text-sm text-slate-500">Pending Treatments</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {revenue.reduce((sum: number, r: any) => sum + (r.newPatients || 0), 0)}
              </p>
              <p className="text-sm text-slate-500">New Patients (6 mo)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trends</h2>
          <div className="space-y-3">
            {revenue.slice().reverse().map((month: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="text-sm text-slate-500 w-20">
                  {format(new Date(month.date), 'MMM yyyy')}
                </span>
                <div className="flex-1">
                  <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (month.production / 80000) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-900 w-20 text-right">
                  ${(month.production / 1000).toFixed(1)}K
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Today's Appointments</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No appointments today</div>
            ) : (
              appointments.slice(0, 8).map((apt: any) => (
                <div key={apt.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{apt.patientName}</p>
                      <p className="text-sm text-slate-500">
                        {apt.time} • {apt.type || 'General'} • {apt.provider || 'TBD'}
                      </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  color: 'emerald' | 'blue' | 'violet' | 'amber';
}) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{title}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    ARRIVED: 'bg-violet-100 text-violet-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    IN_CHAIR: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-slate-100 text-slate-600',
    COMPLETE: 'bg-slate-100 text-slate-600',
    CANCELLED: 'bg-red-100 text-red-600',
    NO_SHOW: 'bg-red-100 text-red-600',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig.SCHEDULED}`}>
      {status}
    </span>
  );
}
