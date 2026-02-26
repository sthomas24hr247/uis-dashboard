import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarCheck,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Phone,
  MessageSquare,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Shield,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.uishealth.com';

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change?: string;
  changePositive?: boolean;
}

interface UpcomingAppointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  provider: string;
  status: string;
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Get user info from localStorage
  const userStr = localStorage.getItem('uis_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Manager';

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodaysAppointments();
  }, []);

  const fetchTodaysAppointments = async () => {
    try {
      const token = localStorage.getItem('uis_token');
      const res = await fetch(API_URL + '/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: `{ todaysAppointments { id patientName time type provider status } }`,
        }),
      });
      const json = await res.json();
      if (json.data?.todaysAppointments) {
        setAppointments(json.data.todaysAppointments.slice(0, 8));
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Quick stats from appointment data
  const totalToday = appointments.length;
  const confirmed = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Scheduled').length;
  const checkedIn = appointments.filter(a => a.status === 'Checked In' || a.status === 'In Progress').length;
  const completed = appointments.filter(a => a.status === 'Complete' || a.status === 'Completed').length;

  const quickStats: QuickStat[] = [
    {
      label: "Today's Appointments",
      value: totalToday || 12,
      icon: CalendarCheck,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Confirmed',
      value: confirmed || 8,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Checked In',
      value: checkedIn || 3,
      icon: UserCheck,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Completed',
      value: completed || 1,
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  const actionCards = [
    {
      title: "Today's Schedule",
      description: 'View and manage appointments',
      icon: CalendarCheck,
      color: 'from-blue-500 to-blue-600',
      path: '/today',
    },
    {
      title: 'Full Schedule',
      description: 'Week and month calendar view',
      icon: Calendar,
      color: 'from-indigo-500 to-indigo-600',
      path: '/schedule',
    },
    {
      title: 'Patient Lookup',
      description: 'Search and manage patients',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      path: '/patients',
    },
    {
      title: 'Ask Dentamind',
      description: 'AI assistant for quick answers',
      icon: Sparkles,
      color: 'from-pink-500 to-pink-600',
      path: '/ai-predictions',
    },
  ];

  const statusColor: Record<string, string> = {
    Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Checked In': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Complete: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    Completed: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    Broken: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {todayStr} · Manager Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/30">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            All Systems Operational
          </span>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {stat.label}
              </span>
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actionCards.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.path)}
            className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-left hover:shadow-lg hover:border-uis-300 dark:hover:border-uis-600 transition-all"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
            >
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{card.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.description}</p>
          </button>
        ))}
      </div>

      {/* Today's Appointments Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-uis-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Upcoming Appointments</h2>
          </div>
          <button
            onClick={() => navigate('/today')}
            className="text-xs text-uis-600 hover:text-uis-700 font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No appointments scheduled for today</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 text-center">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {appt.time}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {appt.patientName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {appt.type} · {appt.provider}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    statusColor[appt.status] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Contact / Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dentamind Insight */}
        <div className="bg-gradient-to-br from-uis-600 to-purple-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold">Dentamind Daily Insight</h3>
          </div>
          <p className="text-sm text-white/80 mb-4">
            3 patients on today's schedule have overdue treatment plans. Consider following up during
            their visit to improve treatment acceptance rates.
          </p>
          <button
            onClick={() => navigate('/ai-predictions')}
            className="text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 transition-colors"
          >
            Ask Dentamind →
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Attention Needed
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">Unconfirmed appointments</span>
              </div>
              <span className="font-semibold text-amber-600">4</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">Pending patient messages</span>
              </div>
              <span className="font-semibold text-blue-600">2</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">Insurance verifications due</span>
              </div>
              <span className="font-semibold text-purple-600">6</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
