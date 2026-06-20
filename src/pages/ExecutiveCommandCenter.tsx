import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useJurisdiction } from "../context/JurisdictionContext";
import {
  Building2, TrendingUp, TrendingDown, Users, DollarSign, Target,
  ChevronRight, ArrowUpRight, ArrowDownRight, Minus, BarChart3,
  AlertTriangle, CheckCircle2, Eye, EyeOff, Filter,
} from "lucide-react";
import { apiFetch } from "@/lib/api";


// Demo multi-office data (transitions to real API data once multiple practices are connected)
type BenchmarkStatus = "above" | "at" | "below";
type DimInfo = { score: number | null; benchmark: number; status: BenchmarkStatus };
const demoOffices: { id: string; name: string; location: string; providers: number; activePatients: number; monthlyRevenue: number | null; prevMonthRevenue: number | null; qciScore: number; qciGrade: string; noShowRate: number; outcomeGapLeakage: number; benchmarkStatus: BenchmarkStatus; dimensions: Record<string, DimInfo>; reason: string }[] = [];

const statusColors = {
  above: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  at: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
  below: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" },
};

const statusLabels = { above: "Above Benchmark", at: "At Benchmark", below: "Below Benchmark" };

// "Newly Onboarded" — practice exists with assigned revenue but no patient data has flowed in yet.
// Distinguishes ramp-up state from broken/dormant practices (which have $0 revenue).
const isNewlyOnboarded = (o: { activePatients: number; monthlyRevenue: number | null }): boolean =>
  o.activePatients === 0 && (o.monthlyRevenue ?? 0) > 0;

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

  const { isCanada } = useJurisdiction();
  // Fetch live practice summary from /api/dashboard/practice-summary.
  // Falls back to demoOffices if the API is unreachable so the dashboard
  // never goes blank during demos.
  const [offices, setOffices] = useState<typeof demoOffices>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
     setIsLoading(true);
        const response = await apiFetch(`/api/dashboard/practice-summary`);   
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.offices && data.offices.length > 0) {
          setOffices(data.offices);
        } else {
          console.warn('[ExecutiveCommandCenter] API returned no offices; showing empty state');
          setOffices([]);
        }
      } catch (err: any) {
        console.error('[ExecutiveCommandCenter] Failed to fetch practice summary:', err);
        setOffices([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  const [missingContact, setMissingContact] = useState<{ episode_count: number; total_dollars: number; affected_patients: number } | null>(null);
  useEffect(() => {
    apiFetch(`/api/outcome-gap/missing-contact`)
      .then(r => r.json())
      .then(d => setMissingContact(d))
      .catch(() => {});
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.displayName || user?.firstName || user?.email?.split("@")[0] || "Executive";

  // Aggregate stats across all offices
  const revenueOffices = offices.filter((o) => o.monthlyRevenue != null);
  const hasRevenue = revenueOffices.length > 0;
  const totalRevenue = revenueOffices.reduce((s, o) => s + (o.monthlyRevenue ?? 0), 0);
  const totalPrevRevenue = revenueOffices.reduce((s, o) => s + (o.prevMonthRevenue ?? 0), 0);
  const revenueChange = hasRevenue && totalPrevRevenue > 0 ? ((totalRevenue - totalPrevRevenue) / totalPrevRevenue * 100) : null;
  const totalPatients = offices.reduce((s, o) => s + o.activePatients, 0);
  const avgQCI = offices.length ? offices.reduce((s, o) => s + o.qciScore, 0) / offices.length : 0;
  const totalLeakage = offices.reduce((s, o) => s + o.outcomeGapLeakage, 0);
  const allQciCalibrating = offices.length > 0 && offices.every(o => !o.qciScore);
  const leakageCalibrating = totalLeakage === 0;
  const contactCalibrating = !missingContact || missingContact.episode_count === 0;

  const officeAlerts = offices.flatMap(o => {
    const alerts: { office: string; message: string; severity: "high" | "medium" | "low" }[] = [];
    if (o.noShowRate > 14) alerts.push({ office: o.name, message: `No-show rate at ${o.noShowRate}% — above 14% threshold`, severity: "high" });
    if (o.benchmarkStatus === "below" && o.qciScore) alerts.push({ office: o.name, message: `Overall QCI below benchmark (${o.qciScore})`, severity: "high" });
    Object.entries(o.dimensions).forEach(([key, dim]) => {
      if (dim.status === "below" && o.qciScore) alerts.push({ office: o.name, message: `${dimensionLabels[key]} below benchmark (${dim.score}% vs ${dim.benchmark}%)`, severity: "medium" });
    });
    return alerts;
  });

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: "offices", label: "All Offices" },
    { key: "benchmarks", label: "Benchmark Comparison" },
    { key: "alerts", label: "Alerts", count: officeAlerts.length },
  ];

  if (isLoading && offices.length === 0) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">
        Loading practice summary…
      </div>
    );
  }

  if (offices.length === 0) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">
        No practice data is available yet.
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {greeting()}, <span className="text-teal-600 dark:text-teal-400">{userName}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          <span className="ml-3 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-medium">{offices.length} office{offices.length !== 1 ? "s" : ""}</span>
        </p>
      </div>

      {/* Organization KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue (MTD)</p>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{hasRevenue ? `$${(totalRevenue / 1000).toFixed(1)}K` : '—'}</p>
          {revenueChange != null && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(revenueChange).toFixed(1)}% vs last month
          </div>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Patients</p>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalPatients.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Across {offices.length} locations</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg QCI Score</p>
            <Target className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{allQciCalibrating ? <span className="text-base text-amber-500">Calibrating</span> : avgQCI.toFixed(1)}</p>
          <p className="text-xs text-slate-400 mt-1">{allQciCalibrating ? 'Clinical scoring in progress' : 'Organization aggregate'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Revenue Leakage</p>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{leakageCalibrating ? <span className="text-base text-amber-500">Calibrating</span> : `$${(totalLeakage / 1000).toFixed(1)}K`}</p>
          <p className="text-xs text-slate-400 mt-1">{leakageCalibrating ? 'Activates with treatment-plan data' : 'Outcome gap monthly total'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-orange-400/50 transition-all" onClick={() => navigate('/outcome-gap')}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Missing Contact</p>
            <Users className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {contactCalibrating ? <span className="text-base text-amber-500">Calibrating</span> : `$${(missingContact!.total_dollars / 1000).toFixed(1)}K`}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {contactCalibrating ? 'Activates with treatment-plan data' : `${missingContact!.episode_count} episodes · ${missingContact!.affected_patients} patients`}
          </p>
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
          {offices.map((office) => {
            const sc = statusColors[office.benchmarkStatus];
            const revChange = (office.monthlyRevenue != null && office.prevMonthRevenue != null && office.prevMonthRevenue !== 0) ? ((office.monthlyRevenue - office.prevMonthRevenue) / office.prevMonthRevenue * 100) : null;
            return (
              <div
                key={office.id}
                onClick={() => setSelectedOffice(office.id)}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-800/80 border ${sc.border} hover:shadow-lg transition-all cursor-pointer group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{office.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{office.location} · {office.providers} total provider records</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isNewlyOnboarded(office) && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        Newly Onboarded
                      </div>
                    )}
                    {!office.qciScore ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Calibrating
                    </div>
                    ) : (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {statusLabels[office.benchmarkStatus]}
                    </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Revenue</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{office.monthlyRevenue != null ? `$${(office.monthlyRevenue / 1000).toFixed(1)}K` : '—'}</p>
                    {revChange != null && (
                    <span className={`text-[10px] font-medium ${revChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {revChange >= 0 ? '↑' : '↓'} {Math.abs(revChange).toFixed(1)}%
                    </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">QCI Score</p>
                    {!office.qciScore ? (
                      <p className="text-lg font-bold text-amber-500">Calibrating</p>
                    ) : (<>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{office.qciScore}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      office.qciGrade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                      office.qciGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>Grade {office.qciGrade}</span>
                    </>)}
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
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{!office.qciScore ? 'Quality scoring is calibrating as clinical data syncs. The activity metrics above are live.' : office.reason}</p>
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
                {offices.map(office => (
                  <tr key={office.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer" onClick={() => setSelectedOffice(office.id)}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{office.name.replace("Bright Smiles Dental - ", "")}</p>
                      <p className="text-[10px] text-slate-400">{office.providers} total provider records</p>
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
                            <span className={`text-xs font-bold ${cs.text}`}>{dim.score == null ? 'Cal' : dim.score + '%'}</span>
                            <span className="text-[9px] text-slate-400">{dim.benchmark}%</span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center py-3 px-3">
                      <div className="inline-flex flex-col items-center gap-1">
                        {isNewlyOnboarded(office) && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            Newly Onboarded
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${statusColors[office.benchmarkStatus].bg} ${statusColors[office.benchmarkStatus].text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusColors[office.benchmarkStatus].dot}`} />
                          {statusLabels[office.benchmarkStatus]}
                        </span>
                      </div>
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
      {/* Practice drill-down panel */}
      {selectedOffice && (() => {
        const office = offices.find(o => o.id === selectedOffice);
        return office ? <PracticeDrillDown office={office} onClose={() => setSelectedOffice(null)} missingContact={missingContact} /> : null;
      })()}
    </div>
  );
}

// ── Practice Drill-Down Panel ────────────────────────────────────────────────
function PracticeDrillDown({ office, onClose, missingContact }: { office: typeof demoOffices[0]; onClose: () => void; missingContact: { episode_count: number; total_dollars: number; affected_patients: number } | null }) {
  const qciCalibrating = !office.qciScore;
  const contactReady = !!missingContact && missingContact.episode_count > 0;

  const kpis = [
    { label: 'Monthly Revenue', value: office.monthlyRevenue != null ? `$${(office.monthlyRevenue / 1000).toFixed(0)}K` : '\u2014', sub: (office.monthlyRevenue != null && office.prevMonthRevenue != null && office.prevMonthRevenue !== 0) ? `${((office.monthlyRevenue - office.prevMonthRevenue) / office.prevMonthRevenue * 100).toFixed(1)}% vs last mo` : 'No revenue data', color: 'text-teal-400' },
    { label: 'QCI Score', value: qciCalibrating ? 'Calibrating' : `${office.qciScore}`, sub: qciCalibrating ? 'clinical scoring in progress' : office.qciGrade + ' grade', color: qciCalibrating ? 'text-amber-400' : (office.qciGrade === 'B' ? 'text-blue-400' : 'text-amber-400') },
    { label: 'No-Show Rate', value: `${office.noShowRate}%`, sub: office.noShowRate > 10 ? 'Above threshold' : 'On target', color: office.noShowRate > 10 ? 'text-red-400' : 'text-teal-400' },
    { label: 'Gap Leakage', value: office.outcomeGapLeakage ? `$${(office.outcomeGapLeakage / 1000).toFixed(1)}K` : 'Calibrating', sub: office.outcomeGapLeakage ? 'This month' : 'activates with PMS data', color: 'text-pink-400' },
    { label: 'Missing Contact', value: contactReady ? `$${(missingContact!.total_dollars / 1000).toFixed(1)}K` : 'Calibrating', sub: contactReady ? `${missingContact!.episode_count} episodes` : 'activates with PMS data', color: 'text-orange-400' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-3xl z-50 bg-[#0A0A14] border-l border-purple-500/20 overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 bg-[#0A0A14]/95 backdrop-blur border-b border-purple-500/10">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-pink-400 mb-1">Practice Intelligence</div>
            <h2 className="text-xl font-semibold text-white">{office.name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{office.location} \u00b7 {office.providers} total provider records \u00b7 {office.activePatients.toLocaleString()} patients</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-all text-lg">\u00d7</button>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-5 gap-3">
            {kpis.map((k, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: '#12121E', border: '1px solid rgba(168,85,247,0.12)' }}>
                <div className="text-[10px] tracking-[0.15em] uppercase text-slate-500 mb-1">{k.label}</div>
                <div className={`text-2xl font-semibold ${k.color}`}>{k.value}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #1a0b2e 0%, #0F0820 100%)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <div className="text-[10px] tracking-[0.25em] uppercase text-pink-400 mb-3">Recovery Intelligence</div>
            <p className="text-base leading-relaxed text-slate-300">Outcome-gap recovery for {office.name} is calibrating. The dollar-flow briefing, gap breakdown, and patient worklist activate once treatment-plan data is flowing from the practice management system. The activity metrics above are live.</p>
          </div>

          <div className="rounded-2xl p-5" style={{ background: '#12121E', border: '1px solid rgba(168,85,247,0.12)' }}>
            <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 mb-4">QCI Dimension Breakdown</div>
            {qciCalibrating ? (
              <p className="text-sm text-slate-400">Per-dimension quality scoring is calibrating as clinical data syncs from the practice management system.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(office.dimensions).map(([key, dim]) => {
                  const label = dimensionLabels[key] || key;
                  const isAbove = dim.status === 'above';
                  const isBelow = dim.status === 'below';
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Benchmark: {dim.benchmark}%</span>
                          <span className={`text-xs font-bold ${isAbove ? 'text-teal-400' : isBelow ? 'text-red-400' : 'text-slate-300'}`}>{dim.score == null ? 'Cal' : dim.score + '%'}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${isAbove ? 'bg-teal-500' : isBelow ? 'bg-red-500' : 'bg-slate-500'}`} style={{ width: `${dim.score == null ? 0 : dim.score}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
