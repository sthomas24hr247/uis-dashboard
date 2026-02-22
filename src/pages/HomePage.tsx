import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, gql } from "@apollo/client";
import {
  Calendar,
  Users,
  BarChart3,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Star,
} from "lucide-react";

const GET_DASHBOARD_STATS = gql`
  query DashboardStats {
    analyticsStats {
      activePatients
      totalAppointments
      totalRevenue
    }
  }
`;

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data } = useQuery(GET_DASHBOARD_STATS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = () =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

  const userName = user?.email?.split("@")[0] || "Doctor";
  const stats = data?.analyticsStats;

  const quickStats = [
    { label: "Today's Appointments", value: stats?.totalAppointments ?? "—", change: "View schedule", up: true },
    { label: "Active Patients", value: stats?.activePatients ?? "—", change: "Total in system", up: true },
    { label: "Production (MTD)", value: stats?.totalRevenue ? `$${(stats.totalRevenue / 1000).toFixed(1)}K` : "—", change: "Month to date", up: true },
    { label: "No-Show Risk Today", value: "2", change: "Patients flagged", up: false },
  ];

  const actionCards = [
    {
      id: "schedule", title: "Today's Schedule",
      description: "View today's appointments, check-ins, and provider assignments",
      icon: Calendar, stats: `${stats?.totalAppointments ?? 0} appointments`,
      accent: "text-teal-400", bg: "bg-teal-500/10", border: "hover:border-teal-500/30",
      link: "/today",
    },
    {
      id: "patients", title: "My Patients",
      description: "Search patient records, insurance details, and visit history",
      icon: Users, stats: `${stats?.activePatients ?? 0} active patients`,
      accent: "text-blue-400", bg: "bg-blue-500/10", border: "hover:border-blue-500/30",
      link: "/patients",
    },
    {
      id: "analytics", title: "Analytics Dashboard",
      description: "Revenue trends, provider productivity, and practice KPIs",
      icon: BarChart3, stats: stats?.totalRevenue ? `$${(stats.totalRevenue / 1000).toFixed(1)}K production` : "View analytics",
      accent: "text-purple-400", bg: "bg-purple-500/10", border: "hover:border-purple-500/30",
      link: "/analytics",
    },
    {
      id: "dentamind", title: "Ask Dentamind AI",
      description: "Get instant answers about your practice data and AI predictions",
      icon: Sparkles, stats: "AI-powered insights",
      accent: "text-amber-400", bg: "bg-amber-500/10", border: "hover:border-amber-500/30",
      link: "/ai-predictions",
    },
  ];

  const recentActivity = [
    { text: "Maria Garcia checked in for 9:00 AM cleaning", time: "2 min ago", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { text: "Dentamind flagged James Wilson as no-show risk", time: "15 min ago", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    { text: "Dr. Smith completed procedure D2740", time: "28 min ago", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
    { text: "New patient Emily Chen scheduled for Tuesday", time: "1 hr ago", icon: Star, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Welcome Header */}
      <div className={`mb-8 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
          {greeting()}, <span className="text-teal-600 dark:text-teal-400">{userName}</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate()}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, i) => (
          <div
            key={i}
            className={`bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: `${100 + i * 50}ms` }}
          >
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
            <div className={`text-xs font-medium ${stat.up ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {stat.up ? "↑" : "⚡"} {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Action Cards */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actionCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => navigate(card.link)}
                  className={`bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 ${card.border} rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-2xl ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${300 + i * 80}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-5`}>
                    <Icon className={`w-6 h-6 ${card.accent}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">{card.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${card.accent}`}>{card.stats}</span>
                    <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <ChevronRight className={`w-4 h-4 ${card.accent}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className={`transition-all duration-700 ${loaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`} style={{ transitionDelay: "500ms" }}>
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h2>
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-2">
            {recentActivity.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{item.text}</p>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{item.time}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dentamind Insight */}
          <div className="mt-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/15 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Dentamind Insight</span>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed mb-4">
              2 patients on today's schedule have a high no-show risk. Consider sending a reminder or filling backup slots.
            </p>
            <button
              onClick={() => navigate("/ai-predictions")}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 rounded-lg px-4 py-2 hover:bg-amber-200 dark:hover:bg-amber-500/25 transition-colors"
            >
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
