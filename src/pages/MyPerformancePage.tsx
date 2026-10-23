// src/pages/MyPerformancePage.tsx
// Work Surface v2: "A provider's own numbers". Production by month, self against self only;
// no ranking against other providers. Every month opens to the ledger lines behind it, in a
// plain-English view and a ledger view with the same arithmetic, and says whether they tie.
// Who may see whose numbers is decided by the API (one money rule), not by this page.

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

interface Month { month: string; production: number | null; hidden?: string; procedures: number; patients: number }
interface Perf {
  linked: boolean; message?: string;
  provider?: { id: string; name: string };
  canChooseProvider?: boolean; providers?: { id: string; name: string }[];
  definition?: string; ledgerFrozen?: boolean; asOf?: string | null;
  months?: Month[]; collections?: { status: string; note: string };
}
interface Line { date: string; type: string; amount: number | null; patient: { id: string; name: string | null } | null }
interface MonthDetail { month: string; total: number | null; lineCount: number; truncated: boolean; plainEnglish: string; lines: Line[]; ledgerFrozen: boolean }

const usd = (n: number | null | undefined, cents = false) =>
  n === null || n === undefined ? '—'
    : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
const monthLabel = (k: string, long = false) =>
  new Date(k + '-15T12:00:00Z').toLocaleString('en-US', long ? { month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'short', timeZone: 'UTC' });

const card = 'bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm';

export default function MyPerformancePage() {
  const { token } = useAuth();
  const [provider, setProvider] = useState('');
  const [data, setData] = useState<Perf | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [detail, setDetail] = useState<MonthDetail | null>(null);
  const [detailFailed, setDetailFailed] = useState(false);
  const [view, setView] = useState<'plain' | 'ledger'>('plain');

  useEffect(() => {
    if (!token) return;
    setLoading(true); setFailed(false); setOpenMonth(null); setDetail(null);
    const q = provider ? `?provider=${encodeURIComponent(provider)}` : '';
    fetch(`${API}/api/predictions/my-performance${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Perf) => setData(d))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [token, provider]);

  useEffect(() => {
    if (!token || !openMonth) return;
    setDetail(null); setDetailFailed(false);
    const q = new URLSearchParams({ month: openMonth });
    if (provider) q.set('provider', provider);
    fetch(`${API}/api/predictions/my-performance/month?${q.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: MonthDetail) => setDetail(d))
      .catch(() => setDetailFailed(true));
  }, [token, openMonth, provider]);

  const months = data?.months || [];
  const current = months[months.length - 1];
  const frozen = !!data?.ledgerFrozen;
  const openFigure = months.find(m => m.month === openMonth)?.production ?? null;
  const ties = detail && detail.total !== null && openFigure !== null ? Math.abs(detail.total - openFigure) < 0.005 : null;
  const chartData = months.map(m => ({ label: monthLabel(m.month), month: m.month, value: m.production ?? 0 }));

  const picker = data?.canChooseProvider && data.providers && data.providers.length > 0 ? (
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span>Provider</span>
      <select
        value={provider || data.provider?.id || ''}
        onChange={e => setProvider(e.target.value)}
        className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
      >
        <option value="" disabled>Choose a provider</option>
        {data.providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </label>
  ) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-500" /> {data?.linked && data.provider ? data.provider.name : 'Your production'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your own numbers, compared only with your own history.</p>
        </div>
        {picker}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading…</div>
      ) : failed ? (
        <div className={card + ' text-center text-slate-500 dark:text-slate-400'}>These numbers could not be loaded. Please try again shortly.</div>
      ) : !data?.linked ? (
        <div className={card + ' text-center text-slate-500 dark:text-slate-400'}>
          {data?.message || 'This account is not linked to a provider record yet.'}
        </div>
      ) : (
        <>
          {frozen && (
            <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200 px-4 py-3 text-sm">
              The Dentrix connection is behind, so dollar figures are hidden until it catches up. The source panel at the top of the page shows the details.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={card}>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Production, {current ? monthLabel(current.month, true) : 'this month'}</div>
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">{frozen ? 'Hidden' : usd(current?.production)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Month to date</div>
            </div>
            <div className={card}>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Procedures posted</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{current?.procedures ?? '—'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">This month</div>
            </div>
            <div className={card}>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patients</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{current?.patients ?? '—'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">This month</div>
            </div>
            <div className={card}>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Collections</div>
              <div className="text-base font-semibold text-slate-600 dark:text-slate-300 mt-2">Reconciling with Dentrix</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Shown once it matches to the cent</div>
            </div>
          </div>

          {!frozen && (
            <div className={card}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">You, against you: the last seven months</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">Not compared with any other provider. Choose a month to see the lines behind it.</span>
              </div>
              <div className="h-56 text-slate-500 dark:text-slate-400">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} width={56}
                      tickFormatter={(v: number) => (v >= 1000 ? '$' + Math.round(v / 1000) + 'K' : '$' + v)} />
                    <Tooltip formatter={(v: any) => usd(Number(v), true)} cursor={{ fill: 'rgba(148,163,184,0.15)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}
                      onClick={(e: any) => { const m = e?.payload?.month || e?.month; if (m) setOpenMonth(m); }} style={{ cursor: 'pointer' }}>
                      {chartData.map(d => <Cell key={d.month} fill={d.month === openMonth ? '#0f766e' : '#14b8a6'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Open a month">
                {months.map(m => (
                  <button key={m.month} type="button" onClick={() => setOpenMonth(m.month)} aria-pressed={openMonth === m.month}
                    className={'rounded-lg border px-2.5 py-1 text-xs ' + (openMonth === m.month
                      ? 'border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-400')}>
                    {monthLabel(m.month)} · {usd(m.production)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {openMonth && !frozen && (
            <div className={card} aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{monthLabel(openMonth, true)}: {usd(openFigure, true)}</h2>
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-xs" role="group" aria-label="View">
                  {(['plain', 'ledger'] as const).map(v => (
                    <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
                      className={'px-3 py-1.5 ' + (view === v ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-300')}>
                      {v === 'plain' ? 'Plain English' : 'Ledger'}
                    </button>
                  ))}
                </div>
              </div>

              {detailFailed ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">This month's lines could not be loaded. Please try again.</p>
              ) : !detail ? (
                <p className="text-sm text-slate-400">Loading the lines…</p>
              ) : view === 'plain' ? (
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{detail.plainEnglish}</p>
              ) : (
                <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                      <tr><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Patient</th><th className="text-right px-3 py-2">Amount</th></tr>
                    </thead>
                    <tbody>
                      {detail.lines.map((l, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                          <td className="px-3 py-1.5 whitespace-nowrap">{l.date}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{l.type}</td>
                          <td className="px-3 py-1.5">{l.patient?.name || '—'}</td>
                          <td className="px-3 py-1.5 text-right whitespace-nowrap">{usd(l.amount, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detail && (
                <div className={'mt-3 text-xs font-medium ' + (ties ? 'text-teal-700 dark:text-teal-400' : 'text-red-700 dark:text-red-400')}>
                  {detail.lineCount} lines totaling {usd(detail.total, true)}.{' '}
                  {ties ? 'They tie exactly to the month above.' : 'These lines do not tie to the month above. Please report this; the figure should not be relied on.'}
                  {detail.truncated ? ' Only the first 2,000 lines are shown.' : ''}
                </div>
              )}
            </div>
          )}

          {data.definition && <p className="text-xs text-slate-500 dark:text-slate-400">How this is counted: {data.definition}</p>}
        </>
      )}
    </div>
  );
}
