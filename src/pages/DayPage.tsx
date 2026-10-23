// src/pages/DayPage.tsx
// Work Surface v2, "The Day", in the dashboard's own style: what needs a person, ordered by
// what expires first. Each card has a time-pressure badge, a plain sentence, its source and age,
// an estimate only for roles allowed to see it, and one honest action (call or open the patient;
// nothing here pretends to write into Dentrix). The "Your day" panel shows today's schedule, or
// the next clinic day within a week.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '@/lib/dataFreshness';

const API = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';
const DENSITY_KEY = 'uis_day_density';

interface Item {
  id: string; lane: string; title: string; detail: string;
  patient: { id: string; name: string | null; hasPhone: boolean; phone?: string | null } | null;
  since: string | null; expiresOn: string | null; expiresInDays: number | null;
  source: { name: string; lastGood: string | null };
  patientValue?: number | null;
}
interface Lane { key: string; label: string; state: string; count?: number }
interface ScheduleItem {
  time: string; status: string; type: string | null; description: string | null;
  provider: { name: string | null; role: string | null };
  patient: { id: string; name: string | null } | null;
}
interface Day {
  today: string | null; asOf: string | null; ledgerFrozen: boolean;
  lanes: Lane[]; items: Item[];
  schedule?: { date: string | null; isToday: boolean; items: ScheduleItem[] };
  valueBasis?: { averageVisitValue: number; note: string };
}

const LANE_LABEL: Record<string, string> = { lost: 'Lost appointment', recall: 'Hygiene recall', contact: 'Missing contact' };
const VALUE_LABEL: Record<string, string> = { lost: 'at risk', recall: 'due back' };
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const dayLabel = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' });
const time12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

function urgency(d: number | null) {
  if (d === null) return { text: 'No deadline', badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200', edge: 'border-l-slate-300 dark:border-l-slate-600' };
  const text = d <= 0 ? 'Due today' : d === 1 ? '1 day left' : `${d} days left`;
  if (d <= 7) return { text, badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200', edge: 'border-l-red-500' };
  if (d <= 30) return { text, badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200', edge: 'border-l-amber-500' };
  return { text, badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200', edge: 'border-l-slate-300 dark:border-l-slate-600' };
}

function sentence(i: Item): string {
  if (i.lane === 'lost') return 'missed a visit and has not rebooked';
  if (i.lane === 'recall') return 'is due back for hygiene with nothing booked';
  return 'has no phone or email on file';
}

const primaryBtn = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 text-sm font-medium whitespace-nowrap';
const secondaryBtn = 'inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-teal-500 px-3 py-2 text-sm font-medium whitespace-nowrap';

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
  const shown = items.slice(0, density === 'comfortable' && !showAll ? 12 : items.length);
  const todayLabel = data?.today ? dayLabel(data.today) : '';

  const chip = (active: boolean) =>
    'rounded-full border px-3 py-1 text-xs ' + (active
      ? 'border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200'
      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300');

  const action = (i: Item) => {
    const name = i.patient?.name || 'this patient';
    if (i.lane !== 'contact' && i.patient?.phone) {
      return (
        <div className="flex gap-2">
          <a href={`tel:${i.patient.phone.replace(/[^\d+]/g, '')}`} className={primaryBtn} aria-label={`Call ${name}`}>
            <Phone className="w-4 h-4" aria-hidden="true" /> Call
          </a>
          {i.patient && <Link to={`/patients/${i.patient.id}`} className={secondaryBtn}>Open</Link>}
        </div>
      );
    }
    return i.patient
      ? <Link to={`/patients/${i.patient.id}`} className={primaryBtn}>Open patient</Link>
      : null;
  };

  const panel = data?.schedule && (
    <aside className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5" aria-label="Your day">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {data.schedule.isToday || !data.schedule.date ? 'Your day' : `Next clinic day · ${dayLabel(data.schedule.date)}`}
        </h2>
        <Link to="/schedule" className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline">Full schedule</Link>
      </div>
      {data.schedule.items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No appointments in the next seven days.</p>
      ) : (
        <ul className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
          {data.schedule.items.map((s, k) => (
            <li key={k} className="flex gap-3 text-sm">
              <span className="w-16 shrink-0 text-slate-500 dark:text-slate-400 tabular-nums">{time12(s.time)}</span>
              <span className="min-w-0 flex-1 rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1.5">
                <span className="block truncate text-slate-900 dark:text-white">
                  {s.patient ? <Link to={`/patients/${s.patient.id}`} className="hover:underline">{s.patient.name || 'Patient'}</Link> : 'Patient'}
                  {s.description || s.type ? <span className="text-slate-500 dark:text-slate-400"> · {s.description || s.type}</span> : null}
                </span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                  {s.provider.name || 'Provider not set'}{s.status === 'confirmed' ? ' · confirmed' : ''}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-teal-500" /> The Day
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{todayLabel}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {data.items.length} {data.items.length === 1 ? 'thing needs' : 'things need'} a person
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ordered by what expires first, not by what's biggest.</p>
            </div>

            {data.ledgerFrozen && (
              <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200 px-4 py-3 text-sm">
                The Dentrix connection is behind. Items are shown as of the last good sync, and estimates are hidden until it catches up.
              </div>
            )}

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by lane">
              <button type="button" aria-pressed={lane === 'all'} onClick={() => { setLane('all'); setShowAll(false); }} className={chip(lane === 'all')}>
                All · {data.items.length}
              </button>
              {data.lanes.map(l => l.state === 'connected' ? (
                <button key={l.key} type="button" aria-pressed={lane === l.key} onClick={() => { setLane(l.key); setShowAll(false); }} className={chip(lane === l.key)}>
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
                Estimates use the average visit value ({usd(data.valueBasis.averageVisitValue)}) over the last 90 days. They are estimates, not amounts owed.
              </p>
            )}

            {shown.length === 0 ? (
              <div className="rounded-2xl p-8 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-slate-500 dark:text-slate-400">
                Nothing in this lane right now.
              </div>
            ) : density === 'dense' ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                {shown.map(i => {
                  const u = urgency(i.expiresInDays);
                  return (
                    <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
                      <span className={'shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ' + u.badge}>{u.text}</span>
                      {i.patient
                        ? <Link to={`/patients/${i.patient.id}`} className="font-semibold text-slate-900 dark:text-white hover:underline">{i.patient.name || 'Patient'}</Link>
                        : <span className="font-semibold text-slate-900 dark:text-white">Patient</span>}
                      <span className="text-slate-600 dark:text-slate-300">{sentence(i)}</span>
                      <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{LANE_LABEL[i.lane] || i.lane}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-3">
                {shown.map(i => {
                  const u = urgency(i.expiresInDays);
                  return (
                    <li key={i.id} className={'rounded-2xl border border-slate-100 dark:border-slate-700 border-l-4 bg-white dark:bg-slate-800 shadow-sm p-4 ' + u.edge}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="sm:w-28 shrink-0">
                          <span className={'inline-block rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide ' + u.badge}>{u.text}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base text-slate-900 dark:text-white">
                            {i.patient
                              ? <Link to={`/patients/${i.patient.id}`} className="font-semibold hover:underline">{i.patient.name || 'Patient'}</Link>
                              : <span className="font-semibold">Patient</span>}{' '}
                            <span>{sentence(i)}</span>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{i.detail}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                            {LANE_LABEL[i.lane] || i.lane} · Source: {i.source.name}, updated {timeAgo(i.source.lastGood)}
                            {i.lane === 'contact' ? ' · add a phone or email in Dentrix' : (!i.patient?.phone ? ' · no phone on file' : '')}
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                          {typeof i.patientValue === 'number' && (
                            <div className="text-right">
                              <div className="text-lg font-semibold text-slate-900 dark:text-white">{usd(i.patientValue)}</div>
                              <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{VALUE_LABEL[i.lane] || 'estimate'}</div>
                            </div>
                          )}
                          {action(i)}
                        </div>
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
          </div>

          <div className="lg:sticky lg:top-24">{panel}</div>
        </div>
      )}
    </div>
  );
}
