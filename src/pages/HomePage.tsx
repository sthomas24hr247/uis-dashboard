import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, gql } from "@apollo/client";
import {
  Calendar, Users, BarChart3, Sparkles, ChevronRight, CheckCircle2,
  AlertTriangle, Activity, Star, Lightbulb, Target, TrendingUp,
  DollarSign, Clock, Zap,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';
const PRACTICE_ID = '00000000-0000-0000-0000-000000000001';

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

  // Redirect managers to their simplified dashboard
  if (user?.role === 'manager') {
    return <Navigate to="/manager-dashboard" replace />;
  }

  const { data } = useQuery(GET_DASHBOARD_STATS);
  const [loaded, setLoaded] = useState(false);
  const [recCount, setRecCount] = useState(0);
  const [topRecs, setTopRecs] = useState<any[]>([]);
  const [bilStats, setBilStats] = useState<any>(null);
  const [gapData, setGapData] = useState<any>(null);

  useEffect(() => {
    setLoaded(true);
    // Fetch live data from new APIs
    Promise.all([
      fetch(`${API_URL}/api/recommendations/active?practice_id=${PRACTICE_ID}&limit=3`).then(r => r.json()),
      fetch(`${API_URL}/api/bil/summary`).then(r => r.json()),
      fetch(`${API_URL}/api/outcome-gap/funnel?practice_id=${PRACTICE_ID}`).then(r => r.json()),
    ]).then(([recsData, bilData, funnelData]) => {
      setTopRecs(recsData.recommendations || []);
      setRecCount(recsData.count || 0);
      setBilStats(bilData.summary?.[0] || null);
      setGapData(funnelData);
    }).catch(console.error);
  }, []);

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

  const userName = user?.displayName || user?.firstName || user?.email?.split("@")[0] || "Doctor";
  const stats = data?.analyticsStats;

  const quickStats = [
    { label: "Today's Appointments", value: stats?.totalAppointments ?? "—", change: "View schedule", up: true },
    { label: "Active Patients", value: stats?.activePatients ?? "—", change: "Total in system", up: true },
    { label: "Production (MTD)", value: stats?.totalRevenue ? `$${(stats.totalRevenue / 1000).toFixed(1)}K` : "—", change: "Month to date", up: true },
    { label: "Outcome Gap", value: gapData?.overall_gap_pct ? `${gapData.overall_gap_pct}%` : "—", change: gapData?.total_leaked ? `$${(gapData.total_leaked / 1000).toFixed(1)}K leaked` : "View details", up: false },
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
      id: "recommendations", title: "AI Recommendations",
      description: "Review and act on Dentamind intelligence — approve, reject, or delay",
      icon: Lightbulb, stats: `${recCount} pending`,
      accent: "text-violet-400", bg: "bg-violet-500/10", border: "hover:border-violet-500/30",
      link: "/recommendations",
    },
    {
      id: "outcome-gap", title: "Outcome Gap",
      description: "Track revenue from AI detection to collection and close leakage gaps",
      icon: Target, stats: gapData?.total_episodes ? `${gapData.total_episodes} episodes tracked` : "View funnel",
      accent: "text-rose-400", bg: "bg-rose-500/10", border: "hover:border-rose-500/30",
      link: "/outcome-gap",
    },
    {
      id: "dentamind", title: "Ask Dentamind AI",
      description: "Get instant answers about your practice data and AI predictions",
      icon: Sparkles, stats: "AI-powered insights",
      accent: "text-amber-400", bg: "bg-amber-500/10", border: "hover:border-amber-500/30",
      link: "/ai-predictions",
    },
  ];

  const typeIcons: Record<string, string> = {
    scheduling: '🗓️', treatment_plan: '🦷', billing: '💵', compliance: '📋',
    hygiene_protocol: '🛡️', staffing: '👥', marketing: '📈', equipment: '🔧',
    patient_communication: '📞',
  };

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
          <div key={i}
            className={`bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: `${100 + i * 50}ms` }}>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
            <div className={`text-xs font-medium ${stat.up ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {stat.up ? "↑" : "⚡"} {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Action Cards */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actionCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={card.id} onClick={() => navigate(card.link)}
                  className={`bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 ${card.border} rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-2xl ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${300 + i * 80}ms` }}>
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

        {/* Right Sidebar */}
        <div className={`space-y-4 transition-all duration-700 ${loaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`} style={{ transitionDelay: "500ms" }}>

          {/* BIL Decision Stats */}
          {bilStats && (
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">BIL Intelligence</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Decisions</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{bilStats.total_decisions}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Approval</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{bilStats.approval_rate}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Avg Time</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{(bilStats.avg_decision_time_ms / 1000).toFixed(1)}s</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Revenue</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${bilStats.approved_revenue?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Top Recommendations */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Top Recommendations</span>
              </div>
              <button onClick={() => navigate('/recommendations')} className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700">
                View All →
              </button>
            </div>
            <div className="space-y-2">
              {topRecs.map((rec: any) => (
                <div key={rec.id} onClick={() => navigate('/recommendations')}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
                  <span className="text-lg flex-shrink-0 mt-0.5">{typeIcons[rec.type] || '💡'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug line-clamp-1">{rec.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider ${
                        rec.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        rec.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                        'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      }`}>{rec.priority?.toUpperCase()}</span>
                      {rec.estimated_revenue > 0 && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">+${rec.estimated_revenue.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-1" />
                </div>
              ))}
              {topRecs.length === 0 && (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No pending recommendations</p>
              )}
            </div>
          </div>

          {/* Outcome Gap Mini */}
          {gapData && gapData.total_episodes > 0 && (
            <div onClick={() => navigate('/outcome-gap')}
              className="bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/15 rounded-xl p-5 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-500/10 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
                  <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">Outcome Gap Alert</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-rose-600 dark:text-rose-400">{gapData.overall_gap_pct}%</span>
                <span className="text-sm text-rose-500 dark:text-rose-400/70">revenue gap</span>
              </div>
              <p className="text-sm text-rose-700 dark:text-rose-300/80 leading-relaxed mb-1">
                ${(gapData.total_plan_value / 1000).toFixed(1)}K planned → ${(gapData.total_collected / 1000).toFixed(1)}K collected
              </p>
              <p className="text-xs text-rose-500 dark:text-rose-400/60">
                {gapData.total_episodes} episodes · ${(gapData.total_leaked / 1000).toFixed(1)}K leaked
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
