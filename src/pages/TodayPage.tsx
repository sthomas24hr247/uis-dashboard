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
import { format, parseISO, isToday } from 'date-fns';
import { Link } from 'react-router-dom';

const GET_TODAY_APPOINTMENTS = gql`
  query GetAppointments {
    appointments {
      data {
        appointmentId
        startDateTime
        durationMinutes
        status
        notes
        patient {
          patientId
          firstName
          lastName
          email
          phone
        }
        provider {
          providerId
          firstName
          lastName
        }
        operatory {
          operatoryId
          name
        }
      }
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

  // Filter for today's appointments (for demo, show all since mock data might not have today's date)
  const appointments = data?.appointments?.data || [];
  
  // Sort by time
  const sortedAppointments = [...appointments].sort((a: any, b: any) => 
    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  // Stats
  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a: any) => a.status === 'CONFIRMED').length,
    arrived: appointments.filter((a: any) => a.status === 'ARRIVED' || a.status === 'SEATED').length,
    completed: appointments.filter((a: any) => a.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Today's Appointments</h1>
          <p className="text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-soft">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Today</p>
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-soft">
          <p className="text-sm font-medium text-slate-500 mb-1">Confirmed</p>
          <p className="text-3xl font-bold text-emerald-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-soft">
          <p className="text-sm font-medium text-slate-500 mb-1">Arrived/Seated</p>
          <p className="text-3xl font-bold text-violet-600">{stats.arrived}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-soft">
          <p className="text-sm font-medium text-slate-500 mb-1">Completed</p>
          <p className="text-3xl font-bold text-slate-600">{stats.completed}</p>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Appointment Timeline</h2>
        </div>

        {loading && !data ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-uis-200 border-t-uis-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load appointments</p>
            <button onClick={() => refetch()} className="btn-secondary">
              Try Again
            </button>
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No appointments for today</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedAppointments.map((appointment: any) => {
              const status = statusConfig[appointment.status] || statusConfig.SCHEDULED;
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={appointment.appointmentId}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Time */}
                    <div className="text-center min-w-[70px]">
                      <p className="text-lg font-bold text-slate-900">
                        {format(parseISO(appointment.startDateTime), 'h:mm')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(parseISO(appointment.startDateTime), 'a')}
                      </p>
                    </div>

                    {/* Status indicator */}
                    <div className={`p-2 rounded-xl ${status.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            to={`/patients/${appointment.patient.patientId}`}
                            className="text-lg font-semibold text-slate-900 hover:text-uis-600 transition-colors"
                          >
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </Link>
                          <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {appointment.durationMinutes} min
                            </span>
                            {appointment.provider && (
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                Dr. {appointment.provider.lastName}
                              </span>
                            )}
                            {appointment.operatory && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {appointment.operatory.name}
                              </span>
                            )}
                          </div>
                          {appointment.notes && (
                            <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                              {appointment.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`badge ${status.color}`}>
                            {status.label}
                          </span>
                          <Link
                            to={`/patients/${appointment.patient.patientId}`}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          </Link>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {appointment.patient.phone && (
                          <a
                            href={`tel:${appointment.patient.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-600 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            Call
                          </a>
                        )}
                        {appointment.patient.email && (
                          <a
                            href={`mailto:${appointment.patient.email}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-600 transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </a>
                        )}
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-uis-100 hover:bg-uis-200 rounded-lg text-sm text-uis-700 transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                          Check In
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
