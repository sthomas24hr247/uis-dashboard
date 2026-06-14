import { useState, useEffect } from 'react';
import ECPAssessment from '../components/ECPAssessment';
import MARVAPortfolioBenchmarks from '../components/MARVAPortfolioBenchmarks';
import { useAuth } from '../context/AuthContext';
import {
  Brain, Zap, TrendingUp, AlertTriangle, CheckCircle2,
  BarChart3, Users, Building2, ChevronRight, Eye,
  Target, Clock, Share2, ArrowUpRight, ArrowDownRight,
  Minus, Shield, Lightbulb
} from 'lucide-react';
import { apiFetch } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MarvaConfig {
  default_view: 'data_table' | 'trend_chart' | 'narrative_summary' | null;
  dashboard_density: 'high' | 'medium' | 'low' | null;
  alert_threshold: number | null;
  show_only_exceptions: boolean;
  recommendation_framing: 'directional' | 'confidence_interval' | 'peer_benchmarks' | null;
  scenario_modeling_enabled: boolean;
  shareable_reports: boolean;
  default_time_window: '90d' | '1y' | '3y' | null;
  show_ltv_metrics: boolean;
  show_yoy: boolean;
}

interface ExecutiveProfile {
  cognitive_style: string;
  decision_velocity: string;
  risk_orientation: string;
  attention_pattern: string;
  strategic_horizon: string;
  marva_config: MarvaConfig;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const LOCATIONS = [
  { name: 'Redlands',       production: 412000, yoy: 14,  collections: 97.2, newPts: 312, status: 'on_track' },
  { name: 'Yucaipa',        production: 388000, yoy: 9,   collections: 95.8, newPts: 284, status: 'on_track' },
  { name: 'Loma Linda',     production: 301000, yoy: 1,   collections: 94.1, newPts: 201, status: 'watch'    },
  { name: 'San Bernardino', production: 271000, yoy: -11, collections: 91.3, newPts: 176, status: 'flagged'  },
];

const SCENARIOS = [
  { label: 'Conservative', pct: 38,  value: '+$18K', conf: '82%', color: '#94A3B8' },
  { label: 'Base case',    pct: 62,  value: '+$31K', conf: '71%', color: '#0D9488' },
  { label: 'Optimistic',   pct: 82,  value: '+$42K', conf: '44%', color: '#0F6E56' },
];

// ─── Helper components ────────────────────────────────────────────────────────
function ConfigChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {label}
    </div>
  );
}

function Badge({ label, variant }: { label: string; variant: 'green' | 'amber' | 'red' | 'purple' | 'teal' | 'gray' }) {
  const styles = {
    green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    teal:   'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    gray:   'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  };
  return <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${styles[variant]}`}>{label}</span>;
}

function MetricCard({ value, label, delta, note }: { value: string; label: string; delta?: { value: string; dir: 'up' | 'down' | 'flat' }; note?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 text-center">
      <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
      {delta && (
        <div className={`text-xs font-semibold mt-1 flex items-center justify-center gap-1 ${delta.dir === 'up' ? 'text-emerald-600' : delta.dir === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
          {delta.dir === 'up' ? <ArrowUpRight className="w-3 h-3" /> : delta.dir === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {delta.value}
        </div>
      )}
      {note && <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{note}</div>}
    </div>
  );
}

// ─── Diana View (Analytical / Deliberate / Calculated / Deep Diver / Annual) ──

// ─── Real User View — driven by actual marva_config ─────────────────────────
function RealUserView({ config, profile }: { config: any; profile: any }) {
  const [approved, setApproved] = useState(false);

  const isNarrative = config.default_view === 'narrative_summary';
  const isDataTable = config.default_view === 'data_table';
  const isTrendChart = config.default_view === 'trend_chart';
  const exceptionOnly = config.show_only_exceptions === true;
  const showScenarios = config.scenario_modeling_enabled === true;
  const showShareable = config.shareable_reports === true;
  const showYoY = config.show_yoy !== false;
  const showLtv = config.show_ltv_metrics === true;
  const timeWindow = config.default_time_window || '1y';
  const framing = config.recommendation_framing || 'confidence_interval';
  const density = config.dashboard_density || 'medium';

  const timeLabel = timeWindow === '90d' ? 'Quarter over Quarter'
    : timeWindow === '3y' ? '3-Year Portfolio View'
    : 'Year over Year';

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-6">
      {/* Config strip */}
      <div className="flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          {profile.cognitive_style} → {config.default_view?.replace(/_/g, ' ')}
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {profile.decision_velocity} → {showScenarios ? 'scenario modeling on' : 'single action'}
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          {profile.risk_orientation} → {framing.replace(/_/g, ' ')}
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          {profile.attention_pattern} → {exceptionOnly ? 'exceptions only' : density + ' density'}
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {profile.strategic_horizon} → {timeWindow} default
        </div>
      </div>

      {/* Nav — order changes based on cognitive style */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {(isNarrative
          ? ['Intelligence', 'Locations', 'Providers', 'Data']
          : isDataTable
          ? ['Performance', 'Locations', 'Providers', 'Intelligence']
          : ['Overview', 'Trends', 'Locations', 'Intelligence']
        ).map((t, i) => (
          <button key={t} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${i === 0 ? 'text-teal-600 border-teal-600' : 'text-slate-400 border-transparent'}`}>{t}</button>
        ))}
      </div>

      {/* Narrative lead — only for narrative cognitive style */}
      {isNarrative && (
        <div className="border-l-4 border-teal-500 pl-6 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-r-2xl">
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            Your practice is tracking above target this {timeWindow === '90d' ? 'quarter' : 'year'}. Production is up and collections remain strong.
            {exceptionOnly ? ' One location needs your attention — everything else is running smoothly.' : ' Review the full breakdown below for detail on each location.'}
          </p>
        </div>
      )}

      {/* Metrics */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          Enterprise performance — {timeLabel}
        </h3>
        <div className={`grid gap-3 ${density === 'low' ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 text-center">
            <div className="text-2xl font-bold text-teal-600">$4.2M</div>
            <div className="text-xs text-slate-500 mt-1">Total Production</div>
            {showYoY && <div className="text-xs font-semibold text-emerald-600 mt-1">↑ +8.3% {timeWindow === '90d' ? 'QoQ' : 'YoY'}</div>}
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 text-center">
            <div className="text-2xl font-bold text-teal-600">96.1%</div>
            <div className="text-xs text-slate-500 mt-1">Collections Rate</div>
            {showYoY && <div className="text-xs font-semibold text-emerald-600 mt-1">↑ +1.4 pts {timeWindow === '90d' ? 'QoQ' : 'YoY'}</div>}
          </div>
          {!exceptionOnly && (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 text-center">
              <div className="text-2xl font-bold text-teal-600">$301K</div>
              <div className="text-xs text-slate-500 mt-1">Avg / Location</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">— Flat</div>
            </div>
          )}
          {showLtv && (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 text-center">
              <div className="text-2xl font-bold text-teal-600">$4,820</div>
              <div className="text-xs text-slate-500 mt-1">Avg Patient LTV</div>
              <div className="text-xs font-semibold text-emerald-600 mt-1">↑ +12% 3Y</div>
            </div>
          )}
          {!showLtv && !exceptionOnly && (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 text-center">
              <div className="text-2xl font-bold text-teal-600">1,847</div>
              <div className="text-xs text-slate-500 mt-1">New Patients</div>
              <div className="text-xs font-semibold text-red-500 mt-1">↓ -6.2% {timeWindow === '90d' ? 'QoQ' : 'YoY'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Exception-only or full location table */}
      {exceptionOnly ? (
        <div>
          <h3 className="text-base font-semibold text-slate-400 dark:text-slate-500 mb-2">What needs you right now</h3>
          <div className="border-2 border-red-400 rounded-2xl p-6 bg-red-50 dark:bg-red-900/10 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Exception flag</span>
              <span className="font-semibold text-sm text-slate-800 dark:text-white">San Bernardino down 11% — action required</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Hygiene capacity is the bottleneck. One additional hygienist closes the gap within 60 days.</p>
            {approved ? (
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" /> Action approved
              </div>
            ) : (
              <button onClick={() => setApproved(true)} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
                {framing === 'directional' ? 'Approve hire now' : 'Review & approve'}
              </button>
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-400">6 locations on track — no action needed.</p>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Location performance</h3>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {['Location', 'Production', showYoY ? 'YoY' : 'QoQ', 'Collections %', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LOCATIONS.map((l, i) => (
                  <tr key={l.name} className={i % 2 === 1 ? 'bg-slate-50 dark:bg-slate-700/30' : ''}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{l.name}</td>
                    <td className="px-4 py-3">${(l.production/1000).toFixed(0)}K</td>
                    <td className={`px-4 py-3 font-semibold ${l.yoy > 0 ? 'text-emerald-600' : l.yoy < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {l.yoy > 0 ? '+' : ''}{l.yoy}%
                    </td>
                    <td className="px-4 py-3">{l.collections}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${l.status === 'on_track' ? 'bg-emerald-100 text-emerald-700' : l.status === 'watch' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {l.status === 'on_track' ? 'On track' : l.status === 'watch' ? 'Watch' : 'Flagged'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendation with framing based on risk_orientation */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">San Bernardino — recommended action</h3>
        <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
          <div>
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${framing === 'directional' ? 'bg-amber-100 text-amber-700' : framing === 'confidence_interval' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
              {framing === 'directional' ? 'Act now — first mover advantage' : framing === 'confidence_interval' ? 'Calculated framing' : 'Peer benchmarks'}
            </span>
          </div>

          {framing === 'peer_benchmarks' && (
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Peer evidence</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">DSOs that resolved hygiene capacity gaps within 60 days averaged +23% production lift vs those that waited. 18 comparable practices have done this successfully.</p>
            </div>
          )}

          <p className="text-sm text-slate-600 dark:text-slate-300">
            {framing === 'directional'
              ? 'Add a hygienist at San Bernardino now. Production gap is hygiene-driven. Early movers capture 23% more revenue.'
              : 'Add a second hygienist at San Bernardino. Production gap is hygiene-driven — provider capacity, not patient volume. Based on 18 comparable locations.'}
          </p>

          {showScenarios && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Outcome projections — 90-day horizon</h4>
              <div className="space-y-3">
                {SCENARIOS.map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 w-24 flex-shrink-0">{s.label}</span>
                    <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-12 text-right">{s.value}</span>
                    <span className="text-xs text-slate-400 w-14">{s.conf} conf</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showShareable && (
            <div className="flex items-center gap-2 text-xs text-teal-600 font-medium">
              <Share2 className="w-3.5 h-3.5" />
              Share with stakeholders before approving
            </div>
          )}

          {approved ? (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Action approved
            </div>
          ) : (
            <button onClick={() => setApproved(true)}
              className={`px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors ${framing === 'directional' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {framing === 'directional' ? 'Approve now' : showScenarios ? 'Approve action' : 'Review & approve'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DianaView() {
  const [approved, setApproved] = useState(false);
  return (
    <div className="space-y-6">
      {/* Config strip */}
      <div className="flex flex-wrap gap-2">
        <ConfigChip color="#534AB7" label="Analytical → data table default" />
        <ConfigChip color="#B45309" label="Deliberate → scenario modeling on" />
        <ConfigChip color="#0D9488" label="Calculated → confidence intervals" />
        <ConfigChip color="#993556" label="Deep diver → location focus" />
        <ConfigChip color="#059669" label="Annual → YoY default" />
      </div>

      {/* Nav */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {['Performance', 'Locations', 'Providers', 'Intelligence'].map((t, i) => (
          <button key={t} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${i === 0 ? 'text-teal-600 border-teal-600' : 'text-slate-400 border-transparent'}`}>{t}</button>
        ))}
      </div>

      {/* Metrics */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Enterprise performance — year over year</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard value="$4.2M" label="Total Production" delta={{ value: '+8.3% YoY', dir: 'up' }} />
          <MetricCard value="96.1%" label="Collections Rate" delta={{ value: '+1.4 pts YoY', dir: 'up' }} />
          <MetricCard value="$301K" label="Avg Production / Location" delta={{ value: 'Flat', dir: 'flat' }} />
          <MetricCard value="1,847" label="New Patients" delta={{ value: '-6.2% YoY', dir: 'down' }} />
        </div>
      </div>

      {/* Location table */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Location performance — full breakdown</h3>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Location', 'Production', 'YoY', 'Collections %', 'New Pts', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOCATIONS.map((l, i) => (
                <tr key={l.name} className={i % 2 === 1 ? 'bg-slate-50 dark:bg-slate-700/30' : ''}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{l.name}</td>
                  <td className="px-4 py-3">${(l.production / 1000).toFixed(0)}K</td>
                  <td className={`px-4 py-3 font-semibold ${l.yoy > 0 ? 'text-emerald-600' : l.yoy < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {l.yoy > 0 ? '+' : ''}{l.yoy}%
                  </td>
                  <td className="px-4 py-3">{l.collections}%</td>
                  <td className="px-4 py-3">{l.newPts}</td>
                  <td className="px-4 py-3">
                    <Badge label={l.status === 'on_track' ? 'On track' : l.status === 'watch' ? 'Watch' : 'Flagged'} variant={l.status === 'on_track' ? 'green' : l.status === 'watch' ? 'amber' : 'red'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended action with scenario modeling */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">San Bernardino — recommended action</h3>
        <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Badge label="Calculated framing" variant="amber" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Add a second hygienist at San Bernardino. Production gap is hygiene-driven — provider capacity, not patient volume. Based on provider utilization data and 18 comparable locations.
          </p>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Outcome projections — 90-day horizon</h4>
            <div className="space-y-3">
              {SCENARIOS.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 w-24 flex-shrink-0">{s.label}</span>
                  <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-12 text-right">{s.value}</span>
                  <span className="text-xs text-slate-400 w-14">{s.conf} conf</span>
                </div>
              ))}
            </div>
          </div>
          {approved ? (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Action approved — hiring workflow initiated
            </div>
          ) : (
            <button onClick={() => setApproved(true)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Approve action
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Marcus View (Narrative / Rapid-Fire / Aggressive / Exception-Only / Quarterly) ──
function MarcusView() {
  const [approved, setApproved] = useState(false);
  return (
    <div className="space-y-6">
      {/* Config strip */}
      <div className="flex flex-wrap gap-2">
        <ConfigChip color="#534AB7" label="Narrative → summary first" />
        <ConfigChip color="#B45309" label="Rapid-fire → single action" />
        <ConfigChip color="#993C1D" label="Aggressive → directional framing" />
        <ConfigChip color="#993556" label="Exception-only → flags only" />
        <ConfigChip color="#059669" label="Quarterly → 90-day focus" />
      </div>

      {/* Nav */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {['Intelligence', 'Locations', 'Providers', 'Data'].map((t, i) => (
          <button key={t} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${i === 0 ? 'text-teal-600 border-teal-600' : 'text-slate-400 border-transparent'}`}>{t}</button>
        ))}
      </div>

      {/* Narrative */}
      <div className="border-l-4 border-teal-500 pl-6 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-r-2xl">
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          This quarter, Pacific Dental Partners is tracking above target in 6 of 8 locations. Your growth story is intact — total production is up 11% vs Q3. One location needs your attention now: <strong>San Bernardino is down 11% and falling further.</strong> The fix is a single hire. Everything else can wait.
        </p>
      </div>

      {/* Exception */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">What needs you right now</h3>
        <div className="border-2 border-red-400 rounded-2xl p-6 bg-red-50 dark:bg-red-900/10 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge label="Exception flag" variant="red" />
            <span className="font-semibold text-sm text-slate-800 dark:text-white">San Bernardino down 11% — action required</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Hygiene capacity is the bottleneck. One additional hygienist closes the gap within 60 days. This is the only location currently off-track for Q4 target.
          </p>
          {approved ? (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Hire approved — fast-track onboarding initiated
            </div>
          ) : (
            <button onClick={() => setApproved(true)} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Approve hire now
            </button>
          )}
        </div>
      </div>

      {/* On track - muted */}
      <div>
        <h3 className="text-base font-semibold text-slate-400 dark:text-slate-500 mb-2">Everything else is on track</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500">6 locations performing within target. No action needed.</p>
        <button className="text-sm text-teal-600 font-medium mt-1 flex items-center gap-1 hover:underline">
          View all data <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Quarterly momentum */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Quarterly momentum</h3>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard value="+11%" label="Q4 vs Q3" note="on pace for best Q4" />
          <MetricCard value="487" label="90-Day New Patients" delta={{ value: '+18% vs Q3', dir: 'up' }} />
          <MetricCard value="6/8" label="Locations On Target" note="1 flagged · 1 watch" />
        </div>
      </div>

      {/* Peer evidence */}
      <div className="bg-slate-100 dark:bg-slate-700/30 rounded-2xl p-6 space-y-3">
        <Badge label="Peer evidence" variant="purple" />
        <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Early movers captured 23% more revenue</h4>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          DSOs that resolved hygiene capacity gaps within 60 days of identification averaged +23% production lift vs those that waited over 90 days. The window closes fast — new patient pipeline starts eroding at 8 weeks of constrained capacity.
        </p>
      </div>
    </div>
  );
}

// ─── ECP Dimensions explanation ───────────────────────────────────────────────
function DimensionsTable() {
  const dimensions = [
    {
      title: 'Cognitive Style',
      rows: [
        { val: 'Analytical', desc: 'Data tables as the default landing view. Drill-down enabled on every metric. Narrative summaries available on demand but never lead.' },
        { val: 'Intuitive',  desc: 'Trend charts as the landing view. Direction and momentum emphasized over decimal precision.' },
        { val: 'Narrative',  desc: 'AI-generated paragraph leads every section. Data is one click away but never competes with the storyline.' },
      ]
    },
    {
      title: 'Decision Velocity',
      rows: [
        { val: 'Rapid-Fire', desc: 'Single action button per recommendation. No scenario modeling. Decisions framed as binary approve/skip.' },
        { val: 'Deliberate', desc: 'Scenario modeling panel auto-expanded. Conservative/base/optimistic outcome ranges shown with confidence intervals.' },
        { val: 'Consensus',  desc: 'Shareable brief format generated. Team circulation button active. Stakeholder sign-off tracking enabled.' },
      ]
    },
    {
      title: 'Risk Orientation',
      rows: [
        { val: 'Aggressive',   desc: 'Directional language — "act now," "first-mover advantage." Early-mover peer evidence leads.' },
        { val: 'Calculated',   desc: 'Confidence intervals shown on every projection. Risk/reward explicitly quantified side by side.' },
        { val: 'Conservative', desc: 'Peer case studies lead every recommendation. Proven outcomes cited before projections.' },
      ]
    },
    {
      title: 'Attention Pattern',
      rows: [
        { val: 'Broad Scanner',  desc: 'Full enterprise dashboard visible. All locations, all providers, all metrics shown simultaneously.' },
        { val: 'Deep Diver',     desc: 'Focused view on the current priority area. Drill-down panels auto-expand.' },
        { val: 'Exception-Only', desc: 'Only flagged items visible. On-track locations hidden behind a muted summary line.' },
      ]
    },
    {
      title: 'Strategic Horizon',
      rows: [
        { val: 'Quarterly',  desc: '30/60/90-day windows as the default time frame. QoQ comparisons lead over YoY.' },
        { val: 'Annual',     desc: 'Year-over-year comparisons lead every section. Full-year forecast shown by default.' },
        { val: 'Multi-Year', desc: 'Lifetime value metrics shown. Portfolio valuation and 3-year trajectory as headline views.' },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      {dimensions.map(d => (
        <div key={d.title}>
          <h4 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-3">{d.title}</h4>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-32">Placement</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">MARVA Adaptation</th>
                </tr>
              </thead>
              <tbody>
                {d.rows.map((r, i) => (
                  <tr key={r.val} className={i % 2 === 1 ? 'bg-slate-50 dark:bg-slate-700/30' : ''}>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 align-top">{r.val}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main MARVA Page ──────────────────────────────────────────────────────────
export default function MARVAPage() {
  const { user, token } = useAuth();
  const [activeExec, setActiveExec] = useState<'diana' | 'marcus'>('diana');
  const [activeTab, setActiveTab] = useState<'my-dashboard' | 'demo' | 'how-it-works' | 'portfolio'>('portfolio');
  const [executiveProfile, setExecutiveProfile] = useState<ExecutiveProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [missingContact, setMissingContact] = useState<{ episode_count: number; total_dollars: number; affected_patients: number; pct_patients_no_channel: string } | null>(null);

  const apiBase = 'https://api.uishealth.com';

  useEffect(() => {
    apiFetch('/api/outcome-gap/missing-contact')
      .then(r => r.json())
      .then(d => setMissingContact(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.userId || !token) return;
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch(
          `${apiBase}/api/bfs/fingerprint/${user.userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.entity_type === 'executive' && data.marva_config) {
            setExecutiveProfile(data);
            setActiveTab('my-dashboard');
          } else {
            setShowAssessment(true);
          }
        } else {
          setShowAssessment(true);
        }
      } catch {
        setShowAssessment(true);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [user?.userId, token]);

  const handleAssessmentComplete = async (result: any) => {
    setShowAssessment(false);
    setAssessmentComplete(true);
    try {
      const res = await fetch(`${apiBase}/api/bfs/fingerprint`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'executive',
          entity_id: user?.userId,
          practice_id: user?.practiceId,
          overall_confidence: 0.95,
          data_source_count: 1,
          access_policy: 'self_only',
          executive_dimensions: {
            cognitive_style: result.cognitive_style,
            decision_velocity: result.decision_velocity,
            risk_orientation: result.risk_orientation,
            attention_pattern: result.attention_pattern,
            strategic_horizon: result.strategic_horizon,
          },
        }),
      });
      if (res.ok) {
        // Reload the fingerprint to get the MARVA config
        const fpRes = await fetch(
          `${apiBase}/api/bfs/fingerprint/${user?.userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (fpRes.ok) {
          const data = await fpRes.json();
          setExecutiveProfile(data);
        }
      }
    } catch (err) {
      console.error('[MARVA] Failed to save ECP assessment:', err);
    }
  };

  const executives = [
    {
      id: 'diana' as const,
      name: 'Diana C.',
      profile: 'Analytical · Deliberate · Calculated · Deep Diver · Annual',
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      id: 'marcus' as const,
      name: 'Marcus W.',
      profile: 'Narrative · Rapid-Fire · Aggressive · Exception-Only · Quarterly',
      color: 'text-teal-600',
      bg: 'bg-teal-100 dark:bg-teal-900/20',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {false && showAssessment && (
        <ECPAssessment
          onComplete={handleAssessmentComplete}
          onDismiss={() => setShowAssessment(false)}
        />
      )}
      {loadingProfile && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading your MARVA profile...</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-xs font-semibold rounded-full border border-teal-200 dark:border-teal-700">
          <Brain className="w-3.5 h-3.5" />
          Dentamind AI — MARVA Engine
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          MARVA <span className="text-teal-600">Adaptation</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm">
          Patient-engagement gaps surfaced from your practice data, with the front-desk actions to close them.
        </p>
      </div>

      {/* Real MARVA config banner */}
      {executiveProfile?.marva_config && Object.keys(executiveProfile.marva_config).length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-2xl">
          <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-teal-700 dark:text-teal-300">Your MARVA profile is active</div>
            <div className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
              {executiveProfile.cognitive_style} · {executiveProfile.decision_velocity} · {executiveProfile.risk_orientation} · {executiveProfile.attention_pattern} · {executiveProfile.strategic_horizon}
            </div>
          </div>
          <button onClick={() => setShowAssessment(true)}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 whitespace-nowrap">
            Retake →
          </button>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 max-w-sm mx-auto">
        {[
          ...(executiveProfile?.marva_config ? [{ id: 'my-dashboard', label: 'My Dashboard' }] : []),
          
          { id: 'how-it-works', label: 'How It Works' },
          { id: 'portfolio', label: 'Portfolio' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'my-dashboard' && executiveProfile?.marva_config && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Your personalized dashboard is calibrating</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md">Your executive view activates once it is connected to your live practice metrics.</p>
        </div>
      )}

      {activeTab === 'demo' && (
        <>
          {/* Executive toggle */}
          <div className="grid grid-cols-2 gap-3">
            {executives.map(e => (
              <button key={e.id} onClick={() => setActiveExec(e.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${activeExec === e.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-full ${e.bg} flex items-center justify-center`}>
                    <Users className={`w-4 h-4 ${e.color}`} />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{e.name}</span>
                  {activeExec === e.id && <span className="ml-auto text-xs font-semibold text-teal-600 bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 ml-10">{e.profile}</p>
              </button>
            ))}
          </div>

          {/* Dashboard view */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            {activeExec === 'diana' ? <DianaView /> : <MarcusView />}
          </div>
        </>
      )}

      {activeTab === 'portfolio' && (
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-orange-200 dark:border-orange-800/40">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Queued — Missing Contact</p>
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {missingContact ? `$${(missingContact.total_dollars / 1000).toFixed(1)}K` : '—'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {missingContact ? `${missingContact.episode_count} episodes · ${missingContact.affected_patients} patients` : 'Loading...'}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Patients — No Channel</p>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {missingContact ? `${missingContact.pct_patients_no_channel}%` : '—'}
              </p>
              <p className="text-xs text-slate-400 mt-1">No phone, SMS, or email on file</p>
            </div>
            <div className="p-5 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/40 flex flex-col justify-center">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">Action Required</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Front desk: capture phone or email at next patient contact. Episodes auto-promote to Actionable when a channel is added.</p>
            </div>
          </div>
          <MARVAPortfolioBenchmarks />
        </div>
      )}

      {activeTab === 'how-it-works' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">How fingerprint adaptation works</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Each of the 5 ECP dimensions maps to specific MARVA interface decisions.</p>
          </div>
          <DimensionsTable />
        </div>
      )}

      {/* Footer note */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400">
        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <span>MARVA configurations are automatically generated when an executive completes the ECP assessment and stored in their behavioral fingerprint. The dashboard experience adapts in real time as their profile evolves.</span>
      </div>
    </div>
  );
}
