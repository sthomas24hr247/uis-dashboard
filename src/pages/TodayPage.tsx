import { useQuery, gql } from '@apollo/client';
import {
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

// Using Dentamind query (works without auth)
const GET_TODAY_APPOINTMENTS = gql`
  query GetTodaysAppointments {
    todaysAppointments {
      id
      patientId
      patientName
      type
      status
      date
      time
      duration
      provider
      notes
    }
  }
`;

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  SCHEDULED: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Scheduled' },
  CONFIRMED: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Confirmed' },
  ARRIVED: { color: 'bg-violet-100 text-violet-700', icon: User, label: 'Arrived' },
  SEATED: { color: 'bg-amber-100 text-amber-700', icon: MapPin, label: 'Seated' },
  IN_PROGRESS: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'In Progress' },
  COMPLETED: { color: 'bg-slate-100 text-slate-600', icon: CheckCircle2, label: 'Completed' },
  CANCELLED: { color: 'bg-red-100 text-red-600', icon: XCircle, label: 'Cancelled' },
  NO_SHOW: { color: 'bg-red-100 text-red-600', icon: AlertCircle, label: 'No Show' },
};

export default function TodayPage() {
  const { data, loading, error, refetch } = useQuery(GET_TODAY_APPOINTMENTS, {
    fetchPolicy: 'cache-and-network',
  });

  const appointments = data?.todaysAppointments || [];

  // Group by status
  const upcoming = appointments.filter((a: any) => 
    ['SCHEDULED', 'CONFIRMED'].includes(a.status)
  );
  const inProgress = appointments.filter((a: any) => 
    ['ARRIVED', 'SEATED', 'IN_PROGRESS', 'IN_CHAIR'].includes(a.status)
  );
  const completed = appointments.filter((a: any) => 
    ['COMPLETED', 'COMPLETE'].includes(a.status)
  );

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
        <p className="text-red-600">Error loading appointments: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Today's Schedule</h1>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Appointments"
          value={appointments.length}
          color="bg-blue-500"
        />
        <StatCard
          label="Upcoming"
          value={upcoming.length}
          color="bg-amber-500"
        />
        <StatCard
          label="In Progress"
          value={inProgress.length}
          color="bg-emerald-500"
        />
        <StatCard
          label="Completed"
          value={completed.length}
          color="bg-slate-500"
        />
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Appointments</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No appointments scheduled for today
            </div>
          ) : (
            appointments.map((apt: any) => (
              <AppointmentRow key={apt.id} appointment={apt} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-10 rounded-full ${color}`}></div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: any }) {
  const config = statusConfig[appointment.status] || statusConfig.SCHEDULED;
  const StatusIcon = config.icon;

  return (
    <div className="p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center min-w-[60px]">
            <p className="text-lg font-semibold text-slate-900">{appointment.time || '--:--'}</p>
            <p className="text-xs text-slate-500">{appointment.duration || 0} min</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">{appointment.patientName || 'Unknown Patient'}</p>
            <p className="text-sm text-slate-500">{appointment.type || 'General'} • {appointment.provider || 'No Provider'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
          <Link
            to={`/patients/${appointment.patientId}`}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
