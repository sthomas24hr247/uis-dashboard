import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, UserCheck, AlertTriangle, ArrowLeft } from 'lucide-react';
import { apiFetch, getPracticeId } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// WORKFORCE INTELLIGENCE — live activity slice.
// Per-provider facts shown here (appointment volume, patient panel, no-show
// prevention) come straight from the synced QCI scores and are real. Clinical
// performance (production, utilization, treatment acceptance, retention) stays
// calibrating until provider attribution and visit history are flowing — gated on
// the QCI grade, which is null while clinical scoring calibrates and populates
// automatically once the underlying data is real.
// ─────────────────────────────────────────────────────────────────────────────

interface ProviderActivity {
  providerId: string;
  name: string;
  providerType: string;
  appointments: number;
  patients: number;
  noShowPrevention: number; // 0-100; higher means fewer no-shows
  grade: string | null;     // null while clinical scoring calibrates
}

function mapProvider(row: any): ProviderActivity {
  return {
    providerId: row.provider_id,
    name: row.name || 'Unknown provider',
    providerType: row.provider_type || '',
    appointments: Number(row.total_appointments) || 0,
    patients: Number(row.total_patients) || 0,
    noShowPrevention: Number(row?.dimensions?.no_show_prevention?.score) || 0,
    grade: (row.grade && row.grade !== 'Calibrating') ? row.grade : null,
  };
}

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: any }) {
  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">{label}</p>
        <Icon className="w-4 h-4 text-teal-400" />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

export default function WorkforceIntelPage() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ProviderActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const practiceId = getPracticeId();
    apiFetch(`/api/qci/providers?practice_id=${practiceId}`)
      .then(r => r.json())
      .then((d: any) => {
        const rows = (d && d.providers) || [];
        setProviders(rows.map(mapProvider));
        setLoading(false);
      })
      .catch(() => { setProviders([]); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  const clinicalLive = providers.some(p => p.grade);
  const active = providers.filter(p => p.appointments > 0);
  const totalAppointments = active.reduce((s, p) => s + p.appointments, 0);
  const totalPatients = active.reduce((s, p) => s + p.patients, 0);
  const ordered = [...active].sort((a, b) => b.appointments - a.appointments);
  const pct = (v: number) => `${v.toFixed(1)}%`;

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      <div>
        <button onClick={() => navigate('/home')} className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-xl"><Users className="w-6 h-6 text-violet-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workforce Intelligence</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Provider activity from your live sync — performance analytics calibrating</p>
          </div>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-10 text-center">
          <span className="inline-block text-[11px] uppercase tracking-wider font-semibold text-amber-500 border border-amber-500/40 rounded-full px-3 py-1 mb-4">Preview &middot; Calibrating</span>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">Provider profiles appear here once attribution is flowing from your practice management system.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="PROVIDERS" value={String(active.length)} sub="Active in sync" icon={UserCheck} />
            <StatCard label="APPOINTMENTS" value={totalAppointments.toLocaleString()} sub="Total in record" icon={Calendar} />
            <StatCard label="PATIENT PANEL" value={totalPatients.toLocaleString()} sub="Across all providers" icon={Users} />
          </div>

          {!clinicalLive && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Production, chair utilization, treatment acceptance, and retention are calibrating. These build from provider attribution and visit history syncing from your practice management system, and unlock automatically once that data is flowing. The activity below is live from your sync.
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" /> Provider Activity
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Live from sync</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="text-left py-2 px-4 font-semibold">Provider</th>
                    <th className="text-center py-2 px-4 font-semibold">Appointments</th>
                    <th className="text-center py-2 px-4 font-semibold">Patients</th>
                    <th className="text-center py-2 px-4 font-semibold">No-show prevention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {ordered.map(p => {
                    const thin = p.appointments < 20;
                    return (
                      <tr key={p.providerId} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">{p.name}</p>
                              {p.providerType && <p className="text-[11px] text-slate-400 truncate">{p.providerType}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{p.appointments.toLocaleString()}</td>
                        <td className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{p.patients.toLocaleString()}</td>
                        <td className="text-center py-3 px-4">
                          {p.noShowPrevention <= 0 ? (
                            <span className="text-slate-400">&mdash;</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 dark:text-slate-100">{pct(p.noShowPrevention)}</span>
                              {thin && <span className="text-[9px] uppercase tracking-wider text-amber-500 border border-amber-500/40 rounded-full px-1.5 py-0.5">limited data</span>}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center pb-4">
            <p className="text-xs text-slate-400 dark:text-slate-500">Workforce Intelligence &mdash; live provider activity. Performance analytics calibrating.</p>
          </div>
        </>
      )}
    </div>
  );
}
