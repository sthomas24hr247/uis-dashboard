// src/pages/DayPage.tsx
// Work Surface v2, "The Day": what needs a person, ordered by what expires first.
// Every item shows its source and age. Lanes we cannot fill yet are shown as not connected.
// Dollar estimates appear only when the API includes them (one money rule, server-side).

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '@/lib/dataFreshness';

const API = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';
const DENSITY_KEY = 'uis_day_density';

interface Item {
  id: string; lane: string; title: string; detail: string;
  patient: { id: string; name: string | null; hasPhone: boolean } | null;
  since: string | null; expiresOn: string | null; expiresInDays: number | null;
  source: { name: string; lastGood: string | null };
  patientValue?: number | null;
}
interface Lane { key: string; label: string; state: string; count?: number }
interface Day {
  today: string | null; asOf: string | null; ledgerFrozen: boolean;
  lanes: Lane[]; items: Item[];
  valueBasis?: { averageVisitValue: number; note: string };
}

const LANE_LABEL: Record<string, string> = { lost: 'Lost appointment', recall: 'Hygiene recall', contact: 'Missing contact' };
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function daysBadge(d: number | null) {
  if (d === null) return { text: 'No deadline', cls: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' };
  const text = d <= 0 ? 'Due today' : d === 1 ? '1 day left' : `${d} days left`;
  if (d <= 7) return { text, cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' };
  if (d <= 30) return { text, cls: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' };
  return { text, cls: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' };
}

export default function DayPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Day | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<number | null>(null);
  const [lane, setLane] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [density, setDensity] = useState<'comfortable' | 'dense'>(() => {
    try { return localStorage.getItem(DENSITY_KEY) === 'dense' ? 'dense' : 'comfortable'; } catch { return 'comfortable'; }
  });
  useEffect(() => { try { localStorage.setItem(DENSITY_KEY, density); } catch { /* ignore */ } }, [density]);

  useEffect(() => {
    if (!token) return;
    setLoading(true); setError(null);
    fetch(`${API}/api/day`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Day) => setData(d))
      .catch((s: any) => setError(typeof s === 'number' ? s : 0))
      .finally(() => setLoading(false));
  }, [token]);

  const items = useMemo(() => (data?.items || []).filter(i => lane === 'all' || i.lane === lane), [data, lane]);
  const limit = density === 'comfortable' && !showAll ? 12 : items.length;
  const shown = items.slice(0, limit);
  const todayLabel = data?.today
    ? new Date(data.today + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
    : '';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-teal-500" /> The Day
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {todayLabel ? todayLabel + '. ' : ''}
            {data ? `${data.items.length} things need a person, ordered by what expires first.` : ''}
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-xs" role="group" aria-label="How much fits on screen">
          {(['comfortable', 'dense'] as const).map(v => (
            <button key={v} type="button" aria-pressed={density === v} onClick={() => setDensity(v)}
              className={'px-3 py-1.5 ' + (density === v ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-300')}>
              {v === 'comfortable' ? 'Comfortable' : 'Dense'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading the day…</div>
      ) : error !== null ? (
        <div className="rounded-2xl p-8 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-slate-500 dark:text-slate-400">
          {error === 403 ? 'The Day is not available for your role.' : 'The day could not be loaded. Please try again shortly.'}
        </div>
      ) : data && (
        <>
          {data.ledgerFrozen && (
            <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200 px-4 py-3 text-sm">
              The Dentrix connection is behind. Items are shown as of the last good sync, and dollar estimates are hidden until it catches up.
            </div>
          )}

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by lane">
            <button type="button" aria-pressed={lane === 'all'} onClick={() => { setLane('all'); setShowAll(false); }}
              className={'rounded-full border px-3 py-1 text-xs ' + (lane === 'all' ? 'border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300')}>
              All · {data.items.length}
            </button>
            {data.lanes.map(l => l.state === 'connected' ? (
              <button key={l.key} type="button" aria-pressed={lane === l.key} onClick={() => { setLane(l.key); setShowAll(false); }}
                className={'rounded-full border px-3 py-1 text-xs ' + (lane === l.key ? 'border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300')}>
                {l.label} · {l.count ?? 0}
              </button>
            ) : (
              <span key={l.key} aria-disabled="true" title="Not connected yet"
                className="rounded-full border border-dashed border-slate-300 dark:border-slate-600 px-3 py-1 text-xs text-slate-400 dark:text-slate-500">
                {l.label} · not connected yet
              </span>
            ))}
          </div>

          {data.valueBasis && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dollar estimates use the average visit value ({usd(data.valueBasis.averageVisitValue)}) over the last 90 days. They are estimates, not amounts owed.
            </p>
          )}

          {shown.length === 0 ? (
            <div className="rounded-2xl p-8 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-slate-500 dark:text-slate-400">
              Nothing in this lane right now.
            </div>
          ) : (
            <ul className={density === 'dense' ? 'divide-y divide-slate-100 dark:divide-slate-700 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800' : 'space-y-3'}>
              {shown.map(i => {
                const b = daysBadge(i.expiresInDays);
                const name = i.patient?.name || 'Patient';
                const patientEl = i.patient
                  ? <Link to={`/patients/${i.patient.id}`} className="font-semibold text-slate-900 dark:text-white hover:underline">{name}</Link>
                  : <span className="font-semibold text-slate-900 dark:text-white">{name}</span>;
                return density === 'dense' ? (
                  <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
                    <span className={'shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ' + b.cls}>{b.text}</span>
                    {patientEl}
                    <span className="text-slate-600 dark:text-slate-300">{i.title}</span>
                    <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{LANE_LABEL[i.lane] || i.lane}</span>
                  </li>
                ) : (
                  <li key={i.id} className="rounded-2xl p-4 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{LANE_LABEL[i.lane] || i.lane}</div>
                        <div className="mt-0.5">{patientEl} <span className="text-slate-700 dark:text-slate-200">· {i.title}</span></div>
                        <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{i.detail}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={'rounded px-2 py-0.5 text-xs font-medium ' + b.cls}>{b.text}</span>
                        {typeof i.patientValue === 'number' && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">Est. {usd(i.patientValue)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Source: {i.source.name} · updated {timeAgo(i.source.lastGood)}
                      {i.lane !== 'contact' && i.patient && !i.patient.hasPhone ? ' · no phone on file' : ''}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {items.length > shown.length && (
            <button type="button" onClick={() => setShowAll(true)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 py-2 text-sm text-slate-600 dark:text-slate-300 hover:border-teal-400">
              Show {items.length - shown.length} more
            </button>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            That is the whole list. Every item comes from the Dentrix schedule and shows how fresh it is.
          </p>
        </>
      )}
    </div>
  );
}
