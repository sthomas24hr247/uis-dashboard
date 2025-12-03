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

// GraphQL query for appointments
const GET_APPOINTMENTS = gql`
  query GetAppointments {
    appointments {
      data {
        appointmentId
        dateTime
        duration
        status
        notes
        patient {
          patientId
          firstName
          lastName
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
    providers {
      providerId
      firstName
      lastName
      specialty
    }
  }
`;

// Status colors
const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 border-blue-300 text-blue-800',
  CONFIRMED: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  ARRIVED: 'bg-violet-100 border-violet-300 text-violet-800',
  SEATED: 'bg-amber-100 border-amber-300 text-amber-800',
  IN_PROGRESS: 'bg-amber-100 border-amber-300 text-amber-800',
  COMPLETED: 'bg-slate-100 border-slate-300 text-slate-600',
  CANCELLED: 'bg-red-100 border-red-300 text-red-600',
  NO_SHOW: 'bg-red-100 border-red-300 text-red-600',
};

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  ARRIVED: 'Arrived',
  SEATED: 'Seated',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

// Time slots (7 AM to 7 PM)
const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}).filter((_, i) => i < 24); // 7 AM to 7 PM

interface Appointment {
  appointmentId: string;
  dateTime: string;
  duration: number;
  status: string;
  notes?: string;
  patient: {
    patientId: string;
    firstName: string;
    lastName: string;
  };
  provider?: {
    providerId: string;
    firstName: string;
    lastName: string;
  };
  operatory?: {
    operatoryId: string;
    name: string;
  };
}

interface Provider {
  providerId: string;
  firstName: string;
  lastName: string;
  specialty?: string;
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day'>('week');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_APPOINTMENTS, {
    fetchPolicy: 'cache-and-network',
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const workDays = weekDays.slice(1, 6); // Mon-Fri

  // Filter appointments for current week
  const appointments = useMemo(() => {
    if (!data?.appointments?.data) return [];
    return data.appointments.data.filter((apt: Appointment) => {
      const aptDate = parseISO(apt.dateTime);
      const inWeek = weekDays.some((day) => isSameDay(day, aptDate));
      const matchesProvider = !selectedProvider || apt.provider?.providerId === selectedProvider;
      return inWeek && matchesProvider;
    });
  }, [data, weekDays, selectedProvider]);

  const providers: Provider[] = data?.providers || [];

  // Group appointments by day and time slot
  const getAppointmentsForSlot = (day: Date, timeSlot: string) => {
    return appointments.filter((apt: Appointment) => {
      const aptDate = parseISO(apt.dateTime);
      const aptTime = format(aptDate, 'HH:mm');
      return isSameDay(aptDate, day) && aptTime === timeSlot;
    });
  };

  // Calculate appointment position and height
  const getAppointmentStyle = (apt: Appointment) => {
    const startTime = parseISO(apt.dateTime);
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    const startMinutes = (hours - 7) * 60 + minutes;
    const top = (startMinutes / 30) * 60; // 60px per 30min slot
    const height = (apt.duration / 30) * 60;
    return { top: `${top}px`, height: `${height}px` };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
          <p className="text-slate-500">Manage appointments and view availability</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="btn-secondary flex items-center gap-2 !py-2.5"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="btn-primary flex items-center gap-2 !py-2.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Appointment</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'd, yyyy')}
            </h2>
          </div>

          {/* Filters and view toggle */}
          <div className="flex items-center gap-3">
            {/* Provider filter */}
            <select
              value={selectedProvider || ''}
              onChange={(e) => setSelectedProvider(e.target.value || null)}
              className="bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-uis-500"
            >
              <option value="">All Providers</option>
              {providers.map((provider) => (
                <option key={provider.providerId} value={provider.providerId}>
                  Dr. {provider.lastName}
                </option>
              ))}
            </select>

            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setView('week')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'week' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                }`}
              >
                <CalendarDays className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={() => setView('day')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'day' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                }`}
              >
                <List className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">Failed to load appointments</p>
            <button onClick={() => refetch()} className="btn-secondary">
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="grid grid-cols-6 border-b border-slate-100">
                <div className="p-4 text-xs font-medium text-slate-400 uppercase">Time</div>
                {workDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`p-4 text-center border-l border-slate-100 ${
                      isToday(day) ? 'bg-uis-50' : ''
                    }`}
                  >
                    <p className="text-xs font-medium text-slate-400 uppercase">
                      {format(day, 'EEE')}
                    </p>
                    <p
                      className={`text-lg font-semibold mt-1 ${
                        isToday(day) ? 'text-uis-600' : 'text-slate-900'
                      }`}
                    >
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              <div className="relative">
                {timeSlots.map((timeSlot, idx) => (
                  <div key={timeSlot} className="grid grid-cols-6 border-b border-slate-50">
                    {/* Time label */}
                    <div className="p-2 pr-4 text-right">
                      {idx % 2 === 0 && (
                        <span className="text-xs font-medium text-slate-400">
                          {format(
                            new Date(`2000-01-01T${timeSlot}:00`),
                            'h:mm a'
                          )}
                        </span>
                      )}
                    </div>

                    {/* Day columns */}
                    {workDays.map((day) => {
                      const slotAppointments = getAppointmentsForSlot(day, timeSlot);
                      return (
                        <div
                          key={`${day.toISOString()}-${timeSlot}`}
                          className={`relative h-[30px] border-l border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                            isToday(day) ? 'bg-uis-50/30' : ''
                          }`}
                        >
                          {slotAppointments.map((apt: Appointment) => (
                            <div
                              key={apt.appointmentId}
                              className={`absolute left-1 right-1 rounded-lg px-2 py-1 text-xs cursor-pointer 
                                border overflow-hidden transition-all hover:shadow-md hover:z-10
                                ${statusColors[apt.status] || statusColors.SCHEDULED}`}
                              style={{
                                height: `${Math.max(apt.duration / 30 * 30, 28)}px`,
                                minHeight: '28px',
                              }}
                              title={`${apt.patient.firstName} ${apt.patient.lastName} - ${apt.duration}min`}
                            >
                              <p className="font-medium truncate">
                                {apt.patient.firstName} {apt.patient.lastName}
                              </p>
                              {apt.duration >= 30 && (
                                <p className="text-[10px] opacity-75 truncate">
                                  {apt.provider ? `Dr. ${apt.provider.lastName}` : ''} 
                                  {apt.operatory ? ` · ${apt.operatory.name}` : ''}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-slate-500 font-medium">Status:</span>
        {Object.entries(statusLabels).slice(0, 5).map(([status, label]) => (
          <div key={status} className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                statusColors[status]?.replace('text-', 'bg-').split(' ')[0] || 'bg-slate-200'
              }`}
            />
            <span className="text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
              <p className="text-sm text-slate-500">This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {appointments.filter((a: Appointment) => a.status === 'CONFIRMED').length}
              </p>
              <p className="text-sm text-slate-500">Confirmed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{providers.length}</p>
              <p className="text-sm text-slate-500">Providers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">4</p>
              <p className="text-sm text-slate-500">Operatories</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
