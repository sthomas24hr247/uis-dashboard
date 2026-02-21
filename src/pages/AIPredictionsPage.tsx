import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  AlertTriangle,
  TrendingUp,
  Users,
  BarChart3,
  Shield,
  RefreshCw,
  ChevronRight,
  Activity,
  DollarSign,
  Calendar,
  UserX,
  Phone,
  Mail,
} from 'lucide-react';

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

const GET_AI_SUMMARY = gql`
  query GetAISummary {
    aiPredictionsSummary {
      highRiskAppointments
      mediumRiskAppointments
      lowRiskAppointments
      highRiskPatients
      nextMonthForecast
      confidenceLevel
    }
  }
`;

const GET_NOSHOW_RISKS = gql`
  query GetNoshowRisks {
    noshowRisks {
      appointmentId
      patientName
      dateTime
      type
      provider
      noshowRiskScore
      riskCategory
      historicalNoShowRate
      dayOfWeek
      daysSinceLastVisit
    }
  }
`;

const GET_REVENUE_FORECAST = gql`
  query GetRevenueForecast {
    revenueForecast {
      forecastMonth
      monthOffset
      forecastProduction
      forecastCollections
      forecastLow
      forecastHigh
      monthsOfData
      growthRatePct
      confidenceLevel
    }
  }
`;

const GET_CHURN_RISKS = gql`
  query GetChurnRisks {
    churnRisks {
      patientId
      firstName
      lastName
      email
      phone
      balance
      lastVisit
      totalVisits
      noShows
      daysSinceVisit
      churnRiskScore
      churnRiskCategory
      recommendedAction
    }
  }
`;

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function RiskBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[category] || styles.LOW}`}>
      {category}
    </span>
  );
}

function RiskScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono font-semibold text-slate-700 w-8 text-right">{score}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sublabel, color = 'blue' }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

// =============================================================================
// TAB CONTENT: OVERVIEW
// =============================================================================

function OverviewTab() {
  const { data, loading } = useQuery(GET_AI_SUMMARY);
  const { data: forecastData } = useQuery(GET_REVENUE_FORECAST);
  const { data: churnData } = useQuery(GET_CHURN_RISKS);

  const summary = data?.aiPredictionsSummary;
  const forecasts = forecastData?.revenueForecast || [];
  const churnPatients = churnData?.churnRisks?.filter((p: any) => p.churnRiskCategory === 'HIGH') || [];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="High Risk Appointments"
          value={summary?.highRiskAppointments || 0}
          sublabel="May no-show"
          color="red"
        />
        <StatCard
          icon={UserX}
          label="At-Risk Patients"
          value={summary?.highRiskPatients || 0}
          sublabel="Churn risk HIGH"
          color="amber"
        />
        <StatCard
          icon={DollarSign}
          label="Next Month Forecast"
          value={summary?.nextMonthForecast ? formatCurrency(summary.nextMonthForecast) : '—'}
          sublabel={`Confidence: ${summary?.confidenceLevel || 'N/A'}`}
          color="emerald"
        />
        <StatCard
          icon={Shield}
          label="Low Risk Appointments"
          value={summary?.lowRiskAppointments || 0}
          sublabel="On track"
          color="blue"
        />
      </div>

      {/* Revenue Forecast Chart (simplified bar display) */}
      {forecasts.length > 0 && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            3-Month Revenue Forecast
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {forecasts.map((f: any) => {
              const maxProd = Math.max(...forecasts.map((x: any) => x.forecastHigh));
              const barHeight = (f.forecastProduction / maxProd) * 100;
              return (
                <div key={f.monthOffset} className="text-center">
                  <div className="h-40 flex flex-col justify-end items-center mb-2">
                    <div className="relative w-full max-w-[80px]">
                      {/* Confidence range */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-8 bg-emerald-100 rounded"
                        style={{
                          height: `${((f.forecastHigh - f.forecastLow) / maxProd) * 100}%`,
                          bottom: `${(f.forecastLow / maxProd) * 100}%`,
                        }}
                      />
                      {/* Main bar */}
                      <div
                        className="relative w-full bg-emerald-500 rounded-t"
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                  </div>
                  <p className="font-bold text-slate-900">{formatCurrency(f.forecastProduction)}</p>
                  <p className="text-xs text-slate-500">{formatDate(f.forecastMonth)}</p>
                  <p className="text-xs text-slate-400">
                    {formatCurrency(f.forecastLow)} – {formatCurrency(f.forecastHigh)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-emerald-500 rounded" /> Production
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-emerald-100 rounded" /> Confidence Range
            </span>
            <span>Based on {forecasts[0]?.monthsOfData || 0} months of data</span>
          </div>
        </div>
      )}

      {/* At-Risk Patients Quick View */}
      {churnPatients.length > 0 && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-600" />
            Patients Needing Attention
          </h3>
          <div className="space-y-3">
            {churnPatients.slice(0, 5).map((p: any) => (
              <div key={p.patientId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-slate-500">{p.recommendedAction}</p>
                  </div>
                </div>
                <RiskBadge category={p.churnRiskCategory} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TAB CONTENT: NO-SHOW RISK
// =============================================================================

function NoShowTab() {
  const { data, loading, refetch } = useQuery(GET_NOSHOW_RISKS);
  const risks = data?.noshowRisks || [];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{risks.length} appointments scored</p>
        <button onClick={() => refetch()} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Appointment</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Day</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Risk Score</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {risks.map((r: any) => (
              <tr key={r.appointmentId} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{r.patientName}</p>
                  <p className="text-xs text-slate-400">{r.provider}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-700">{r.type}</p>
                  <p className="text-xs text-slate-400">{formatTime(r.dateTime)}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{r.dayOfWeek}</td>
                <td className="px-4 py-3 w-40">
                  <RiskScoreBar score={r.noshowRiskScore} />
                </td>
                <td className="px-4 py-3">
                  <RiskBadge category={r.riskCategory} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// TAB CONTENT: REVENUE FORECAST
// =============================================================================

function RevenueTab() {
  const { data, loading } = useQuery(GET_REVENUE_FORECAST);
  const forecasts = data?.revenueForecast || [];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecasts.map((f: any) => (
          <div key={f.monthOffset} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">Month {f.monthOffset}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                f.confidenceLevel === 'HIGH' ? 'bg-emerald-100 text-emerald-700' :
                f.confidenceLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {f.confidenceLevel} confidence
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-1">{formatDate(f.forecastMonth)}</p>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Production</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(f.forecastProduction)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Collections</p>
                <p className="text-lg font-semibold text-emerald-600">{formatCurrency(f.forecastCollections)}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-slate-400">Range</p>
                <p className="text-sm text-slate-600">
                  {formatCurrency(f.forecastLow)} – {formatCurrency(f.forecastHigh)}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <TrendingUp className="w-3 h-3" />
                {f.growthRatePct}% growth • {f.monthsOfData} months data
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// TAB CONTENT: CHURN RISK
// =============================================================================

function ChurnTab() {
  const { data, loading, refetch } = useQuery(GET_CHURN_RISKS);
  const patients = data?.churnRisks || [];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{patients.length} patients analyzed</p>
        <button onClick={() => refetch()} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Last Visit</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Visits / No-Shows</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Risk Score</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p: any) => (
              <tr key={p.patientId} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      p.churnRiskCategory === 'HIGH' ? 'bg-red-100' :
                      p.churnRiskCategory === 'MEDIUM' ? 'bg-amber-100' : 'bg-emerald-100'
                    }`}>
                      <Users className={`w-4 h-4 ${
                        p.churnRiskCategory === 'HIGH' ? 'text-red-600' :
                        p.churnRiskCategory === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{p.firstName} {p.lastName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {p.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{p.phone}</span>}
                        {p.email && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" />{p.email}</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-600">
                    {p.lastVisit ? formatDate(p.lastVisit) : 'Never'}
                  </p>
                  {p.daysSinceVisit != null && (
                    <p className="text-xs text-slate-400">{p.daysSinceVisit} days ago</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {p.totalVisits || 0} / {p.noShows || 0}
                </td>
                <td className="px-4 py-3 w-40">
                  <RiskScoreBar score={p.churnRiskScore} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {p.recommendedAction}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// LOADING SPINNER
// =============================================================================

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'noshow', label: 'No-Show Risk', icon: AlertTriangle },
  { id: 'revenue', label: 'Revenue Forecast', icon: TrendingUp },
  { id: 'churn', label: 'Patient Churn', icon: UserX },
];

export default function AIPredictionsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">AI Predictions</h1>
        </div>
        <p className="text-slate-500">
          Risk scoring, revenue forecasting, and patient retention insights powered by UIS AI
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'noshow' && <NoShowTab />}
      {activeTab === 'revenue' && <RevenueTab />}
      {activeTab === 'churn' && <ChurnTab />}
    </div>
  );
}
