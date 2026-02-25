import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Building2, TrendingUp, TrendingDown, Users, DollarSign, Target,
  ChevronRight, ArrowUpRight, ArrowDownRight, Minus, BarChart3,
  AlertTriangle, CheckCircle2, Eye, EyeOff, Filter,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

// Demo multi-office data (transitions to real API data once multiple practices are connected)
const demoOffices = [
  {
    id: "82D32761-3ADF-4F9D-9EE1-0DEDD9288B27",
    name: "Bright Smiles Dental - Main",
    location: "Phoenix, AZ",
    providers: 4,
    activePatients: 847,
    monthlyRevenue: 142500,
    prevMonthRevenue: 135200,
    qciScore: 60.2,
    qciGrade: "C",
    noShowRate: 12.3,
    outcomeGapLeakage: 2600,
    benchmarkStatus: "below" as const,
    dimensions: {
      treatment_completion: { score: 65, benchmark: 65, status: "at" as const },
      recall_compliance: { score: 58, benchmark: 58, status: "at" as const },
      outcome_gap_closure: { score: 45, benchmark: 45, status: "at" as const },
      no_show_prevention: { score: 79, benchmark: 72, status: "above" as const },
      patient_retention: { score: 45, benchmark: 60, status: "below" as const },
      revenue_capture: { score: 70, benchmark: 70, status: "at" as const },
    },
    reason: "Patient retention significantly below industry benchmark (45% vs 60%). Strong no-show prevention offsets some risk.",
  },
  {
    id: "OFFICE-002",
    name: "Bright Smiles Dental - East",
    location: "Scottsdale, AZ",
    providers: 3,
    activePatients: 623,
    monthlyRevenue: 118900,
    prevMonthRevenue: 121400,
    qciScore: 74.8,
    qciGrade: "B",
    noShowRate: 8.1,
    outcomeGapLeakage: 1200,
    benchmarkStatus: "above" as const,
    dimensions: {
      treatment_completion: { score: 78, benchmark: 65, status: "above" as const },
      recall_compliance: { score: 72, benchmark: 58, status: "above" as const },
      outcome_gap_closure: { score: 62, benchmark: 45, status: "above" as const },
      no_show_prevention: { score: 85, benchmark: 72, status: "above" as const },
      patient_retention: { score: 68, benchmark: 60, status: "above" as const },
      revenue_capture: { score: 76, benchmark: 70, status: "above" as const },
    },
    reason: "All dimensions above industry benchmarks. Strong team execution, consistent recall outreach, low no-show rates.",
  },
  {
    id: "OFFICE-003",
    name: "Bright Smiles Dental - West",
    location: "Glendale, AZ",
    providers: 2,
    activePatients: 412,
    monthlyRevenue: 87300,
    prevMonthRevenue: 84100,
    qciScore: 66.5,
    qciGrade: "C",
    noShowRate: 15.7,
    outcomeGapLeakage: 3800,
    benchmarkStatus: "at" as const,
    dimensions: {
      treatment_completion: { score: 70, benchmark: 65, status: "above" as const },
      recall_compliance: { score: 55, benchmark: 58, status: "below" as const },
      outcome_gap_closure: { score: 52, benchmark: 45, status: "above" as const },
      no_show_prevention: { score: 65, benchmark: 72, status: "below" as const },
      patient_retention: { score: 62, benchmark: 60, status: "at" as const },
      revenue_capture: { score: 72, benchmark: 70, status: "at" as const },
    },
    reason: "No-show rate highest across offices (15.7%). Recall compliance below benchmark. Treatment acceptance is a strength.",
  },
];

const statusColors = {
  above: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  at: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
  below: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" },
};

const statusLabels = { above: "Above Benchmark", at: "At Benchmark", below: "Below Benchmark" };

const dimensionLabels: Record<string, string> = {
  treatment_completion: "Treatment Completion",
  recall_compliance: "Recall Compliance",
  outcome_gap_closure: "Outcome Gap Closure",
  no_show_prevention: "No-Show Prevention",
  patient_retention: "Patient Retention",
  revenue_capture: "Revenue Capture",
};

type TabType = "offices" | "benchmarks" | "alerts";

export default function ExecutiveCommandCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("offices");
  const [showPriorities, setShowPriorities] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.displayName || user?.firstName || user?.email?.split("@")[0] || "Executive";

  // Aggregate stats across all offices
  const totalRevenue = demoOffices.reduce((s, o) => s + o.monthlyRevenue, 0);
  const totalPrevRevenue = demoOffices.reduce((s, o) => s + o.prevMonthRevenue, 0);
  const revenueChange = ((totalRevenue - totalPrevRevenue) / totalPrevRevenue * 100);
  const totalPatients = demoOffices.reduce((s, o) => s + o.activePatients, 0);
  const avgQCI = demoOffices.reduce((s, o) => s + o.qciScore, 0) / demoOffices.length;
  const totalLeakage = demoOffices.reduce((s, o) => s + o.outcomeGapLeakage, 0);

  const officeAlerts = demoOffices.flatMap(o => {
    const alerts: { office: string; message: string; severity: "high" | "medium" | "low" }[] = [];
    if (o.noShowRate > 14) alerts.push({ office: o.name, message: `No-show rate at ${o.noShowRate}% — above 14% threshold`, severity: "high" });
    if (o.benchmarkStatus === "below") alerts.push({ office: o.name, message: `Overall QCI below benchmark (${o.qciScore})`, severity: "high" });
    Object.entries(o.dimensions).forEach(([key, dim]) => {
      if (dim.status === "below") alerts.push({ office: o.name, message: `${dimensionLabels[key]} below benchmark (${dim.score}% vs ${dim.benchmark}%)`, severity: "medium" });
    });
    return alerts;
  });

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: "offices", label: "All Offices" },
    { key: "benchmarks", label: "Benchmark Comparison" },
    { key: "alerts", label: "Alerts", count: officeAlerts.length },
  ];

  return (
    <div className={`max-w-7xl mx-auto transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {greeting()}, <span className="text-teal-600 dark:text-teal-400">{userName}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          <span className="ml-3 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-medium">{demoOffices.length} offices</span>
        </p>
      </div>

      {/* Organization KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue (MTD)</p>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">${(totalRevenue / 1000).toFixed(1)}K</p>
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(revenueChange).toFixed(1)}% vs last month
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Patients</p>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalPatients.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Across {demoOffices.length} locations</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg QCI Score</p>
            <Target className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgQCI.toFixed(1)}</p>
          <p className="text-xs text-slate-400 mt-1">Organization aggregate</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Revenue Leakage</p>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">${(totalLeakage / 1000).toFixed(1)}K</p>
          <p className="text-xs text-slate-400 mt-1">Outcome gap monthly total</p>
        </div>
      </div>

      {/* Priorities Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.count != null && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowPriorities(!showPriorities)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {showPriorities ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPriorities ? "Hide" : "Show"} Priorities
        </button>
      </div>

      {/* Top Priorities (toggleable) */}
      {showPriorities && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/40">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Top Priorities Right Now
          </h3>
          <div className="space-y-2">
            {officeAlerts.filter(a => a.severity === "high").slice(0, 3).map((alert, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">{alert.office}:</span>{" "}
                  <span className="text-slate-600 dark:text-slate-400">{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Offices View */}
      {activeTab === "offices" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {demoOffices.map((office) => {
            const sc = statusColors[office.benchmarkStatus];
            const revChange = ((office.monthlyRevenue - office.prevMonthRevenue) / office.prevMonthRevenue * 100);
            return (
              <div
                key={office.id}
                onClick={() => navigate(`/home?office=${office.id}`)}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-800/80 border ${sc.border} hover:shadow-lg transition-all cursor-pointer group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{office.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{office.location} · {office.providers} providers</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {statusLabels[office.benchmarkStatus]}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Revenue</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">${(office.monthlyRevenue / 1000).toFixed(1)}K</p>
                    <span className={`text-[10px] font-medium ${revChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {revChange >= 0 ? '↑' : '↓'} {Math.abs(revChange).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">QCI Score</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{office.qciScore}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      office.qciGrade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                      office.qciGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>Grade {office.qciGrade}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Patients</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{office.activePatients}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">No-Show Rate</p>
                    <p className={`text-lg font-bold ${office.noShowRate > 12 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{office.noShowRate}%</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{office.reason}</p>
                </div>

                <div className="flex items-center justify-end mt-3 text-xs font-medium text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Benchmark Comparison View */}
      {activeTab === "benchmarks" && (
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Office</th>
                  <th className="text-center py-3 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">QCI</th>
                  {Object.keys(dimensionLabels).map(key => (
                    <th key={key} className="text-center py-3 px-2 font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                      {dimensionLabels[key].replace("Prevention", "Prev.").replace("Completion", "Comp.").replace("Compliance", "Comp.").replace("Closure", "Close")}
                    </th>
                  ))}
                  <th className="text-center py-3 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {demoOffices.map(office => (
                  <tr key={office.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer" onClick={() => navigate(`/home?office=${office.id}`)}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{office.name.replace("Bright Smiles Dental - ", "")}</p>
                      <p className="text-[10px] text-slate-400">{office.providers} providers</p>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-white">{office.qciScore}</span>
                      <span className={`ml-1 text-[10px] font-bold px-1 py-0.5 rounded ${
                        office.qciGrade === 'B' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>{office.qciGrade}</span>
                    </td>
                    {Object.entries(office.dimensions).map(([key, dim]) => {
                      const cs = statusColors[dim.status];
                      return (
                        <td key={key} className="text-center py-3 px-2">
                          <div className={`inline-flex flex-col items-center px-2 py-1 rounded-lg ${cs.bg}`}>
                            <span className={`text-xs font-bold ${cs.text}`}>{dim.score}%</span>
                            <span className="text-[9px] text-slate-400">{dim.benchmark}%</span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${statusColors[office.benchmarkStatus].bg} ${statusColors[office.benchmarkStatus].text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[office.benchmarkStatus].dot}`} />
                        {statusLabels[office.benchmarkStatus]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts View */}
      {activeTab === "alerts" && (
        <div className="space-y-3">
          {officeAlerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${
              alert.severity === "high" ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40" :
              "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40"
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                alert.severity === "high" ? "bg-red-500" : "bg-amber-500"
              }`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{alert.office}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{alert.message}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                alert.severity === "high" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              }`}>{alert.severity}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dentamind Quick Ask */}
      <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">✨</span>
          <h3 className="font-bold text-white">Quick Ask Dentamind</h3>
          <span className="text-xs text-slate-400">Click any card to ask</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "Revenue Risk This Week", desc: "Which offices are most likely to miss targets?" },
            { title: "Best Performing Office", desc: "What are they doing differently?" },
            { title: "One Fix for Tomorrow", desc: "Highest-impact action across all offices" },
          ].map((card, i) => (
            <button
              key={i}
              onClick={() => navigate("/ai-predictions")}
              className="text-left p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 transition-all group"
            >
              <p className="font-semibold text-white text-sm group-hover:text-teal-400 transition-colors">{card.title}</p>
              <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
