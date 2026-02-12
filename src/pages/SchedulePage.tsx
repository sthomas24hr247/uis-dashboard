import { useState, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  CalendarDays,
  List,
  Clock,
  User,
  MapPin,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  isToday,
} from 'date-fns';

// Using Dentamind query (works without auth)
const GET_APPOINTMENTS = gql`
  query GetAppointments($status: String, $date: String, $limit: Int, $offset: Int) {
    dentamindAppointments(status: $status, date: $date, limit: $limit, offset: $offset) {
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

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 border-blue-300 text-blue-700',
  CONFIRMED: 'bg-emerald-100 border-emerald-300 text-emerald-700',
  ARRIVED: 'bg-violet-100 border-violet-300 text-violet-700',
  IN_PROGRESS: 'bg-amber-100 border-amber-300 text-amber-700',
  IN_CHAIR: 'bg-amber-100 border-amber-300 text-amber-700',
  COMPLETED: 'bg-slate-100 border-slate-300 text-slate-600',
  COMPLETE: 'bg-slate-100 border-slate-300 text-slate-600',
  CANCELLED: 'bg-red-100 border-red-300 text-red-600',
  NO_SHOW: 'bg-red-100 border-red-300 text-red-600',
};

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'list'>('week');

  const { data, loading, error, refetch } = useQuery(GET_APPOINTMENTS, {
    variables: {
      limit: 100,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  const appointments = data?.dentamindAppointments || [];

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    appointments.forEach((apt: any) => {
      const date = apt.date || '';
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(apt);
    });
    return grouped;
  }, [appointments]);

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
          <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
          <p className="text-slate-500">
            {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Navigation and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('week')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'week' ? 'bg-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Week
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'list' ? 'bg-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-3 text-center border-r last:border-r-0 ${
                  isToday(day) ? 'bg-blue-50' : ''
                }`}
              >
                <p className="text-xs text-slate-500 uppercase">{format(day, 'EEE')}</p>
                <p className={`text-lg font-semibold ${isToday(day) ? 'text-blue-600' : 'text-slate-900'}`}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppointments = appointmentsByDate[dateStr] || [];
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 border-r last:border-r-0 space-y-1 ${
                    isToday(day) ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {dayAppointments.slice(0, 5).map((apt: any) => (
                    <div
                      key={apt.id}
                      className={`p-2 rounded-lg border text-xs ${statusColors[apt.status] || statusColors.SCHEDULED}`}
                    >
                      <p className="font-medium truncate">{apt.time}</p>
                      <p className="truncate">{apt.patientName}</p>
                    </div>
                  ))}
                  {dayAppointments.length > 5 && (
                    <p className="text-xs text-slate-500 text-center">
                      +{dayAppointments.length - 5} more
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No appointments found
              </div>
            ) : (
              appointments.map((apt: any) => (
                <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[80px]">
                        <p className="text-sm text-slate-500">{apt.date}</p>
                        <p className="font-semibold text-slate-900">{apt.time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{apt.patientName}</p>
                        <p className="text-sm text-slate-500">
                          {apt.type || 'General'} • {apt.provider || 'No Provider'} • {apt.duration || 0} min
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[apt.status] || statusColors.SCHEDULED}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
