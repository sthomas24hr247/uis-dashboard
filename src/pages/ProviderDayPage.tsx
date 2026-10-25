// src/pages/ProviderDayPage.tsx
// One provider's day for the front desk (opened from Who's here). Things that need a person on
// the left, the day's timeline on the right with lunch and open time. No money on this page.

import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '@/lib/dataFreshness';
import { roleLabel } from './WhosHerePage';

const API = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

interface Patient { id: string; name: string | null; phone?: string | null }
interface Appt { time: string; duration: number | null; status: string; confirmed: boolean; ended: boolean; upcoming: boolean; type: string | null; description: string | null; patient: Patient | null }
interface Need { kind: 'not_marked' | 'unconfirmed' | 'lost'; time?: string; missed?: string; expiresInDays?: number | null; patient: Patient | null }
interface Block { start: string; end: string; minutes: number }
interface Candidate {
  patient: Patient | null; why: string; items?: number; work?: string[]; likelihood?: string | null;
  expiresInDays?: number | null; estimatedNet?: number;
}
interface CallList { kind?: string; basis: string; showsValue?: boolean; candidates: Candidate[] }
interface ProvDay {
  date: string | null; isToday: boolean; asOf: string | null;
  provider: { id: string; name: string; role: string | null };
  hours: { open: string; close: string } | null; lunch: { start: string; end: string } | null;
  worksThatDay: boolean | null; scheduleSource: string | null;
  appointments: Appt[]; openBlocks: Block[]; needs: Need[];
}

const time12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
const dayLabel = (d: string) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const shortDate = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function visitLabel(a: Appt, role: string | null): string {
  const generic = (v: string | null) => !v || /^\s*appointment\s*$/i.test(v);
  if (!generic(a.description)) return a.description as string;
  if (!generic(a.type)) return a.type as string;
  const r = roleLabel(role);
  return r === 'Hygienist' ? 'Hygiene visit' : r === 'Provider' ? 'Visit' : 'Dentist visit';
}
function apptBadge(a: Appt) {
  if (a.status === 'completed') return { text: 'Seen', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' };
  if (a.status === 'no_show') return { text: 'No-show', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' };
  if (a.ended && (a.status === 'scheduled' || a.status === 'confirmed')) return { text: 'Not marked yet', cls: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' };
  return a.confirmed
    ? { text: 'Confirmed', cls: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200' }
    : { text: 'Not confirmed', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' };
}

const primaryBtn = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 text-sm font-medium whitespace-nowrap';
const secondaryBtn = 'inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-teal-500 px-3 py-2 text-sm font-medium whitespace-nowrap';

export default function ProviderDayPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const [search] = useSearchParams();
  const date = search.get('date');
  const [data, setData] = useState<ProvDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<number | null>(null);
  const [showLost, setShowLost] = useState(false);
  const [callFor, setCallFor] = useState<Block | null>(null);
  const [calls, setCalls] = useState<CallList | null>(null);
  const [callsLoading, setCallsLoading] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    let alive = true;
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    const load = () =>
      fetch(`${API}/api/whos-here/provider/${encodeURIComponent(id)}${q}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((d: ProvDay) => { if (alive) { setData(d); setError(null); } })
        .catch((s: any) => { if (alive) setError(typeof s === 'number' ? s : 0); })
        .finally(() => { if (alive) setLoading(false); });
    load();
    const t = setInterval(load, 2 * 60 * 1000);
    return () => { alive = false; clearInterval(t); };
  }, [token, id, date]);

  const first = data?.provider.name.split(' ')[0] || 'Provider';
  const order = { not_marked: 0, unconfirmed: 1, lost: 2 } as const;
  const needs = (data?.needs || []).slice().sort((a, b) =>
    order[a.kind] - order[b.kind] || (a.time || '').localeCompare(b.time || '') || (a.expiresInDays ?? 999) - (b.expiresInDays ?? 999));
  const current = needs.filter(n => n.kind !== 'lost');
  const lost = needs.filter(n => n.kind === 'lost');
  const soonest = lost.reduce<number | null>((m, n) => (n.expiresInDays == null ? m : m == null ? n.expiresInDays : Math.min(m, n.expiresInDays)), null);
  const dayWord = data?.date
    ? (data.isToday ? 'today' : 'on ' + new Date(data.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }))
    : '';

  type Row = { at: number; kind: 'appt' | 'open' | 'lunch'; appt?: Appt; block?: Block };
  const timeline: Row[] = [];
  for (const a of data?.appointments || []) timeline.push({ at: toMin(a.time), kind: 'appt', appt: a });
  for (const b of data?.openBlocks || []) timeline.push({ at: toMin(b.start), kind: 'open', block: b });
  if (data?.lunch && data.hours && data.worksThatDay !== false) timeline.push({ at: toMin(data.lunch.start), kind: 'lunch' });
  timeline.sort((x, y) => x.at - y.at);

  const callBtn = (p: Patient | null) => p?.phone
    ? <a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`} className={primaryBtn} aria-label={`Call ${p.name || 'patient'}`}><Phone className="w-4 h-4" aria-hidden="true" /> Call</a>
    : null;
  const openBtn = (p: Patient | null) => p ? <Link to={`/patients/${p.id}`} className={secondaryBtn}>Open</Link> : null;

  const openList = (b: Block) => {
    if (!token || !id || !data?.date) return;
    setCallFor(b); setCalls(null); setCallsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const q = new URLSearchParams({ date: data.date, start: b.start, minutes: String(b.minutes) });
    fetch(`${API}/api/whos-here/provider/${encodeURIComponent(id)}/call-list?${q.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: CallList) => setCalls(d))
      .catch(() => setCalls({ basis: 'The list could not be loaded. Please try again.', candidates: [] }))
      .finally(() => setCallsLoading(false));
  };

  const renderNeed = (n: Need, i: number) => {
    const name = n.patient?.name || 'Patient';
    const v = n.kind === 'not_marked'
      ? { badge: n.time ? time12(n.time) : 'Today', badgeCls: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200', edge: 'border-l-slate-400', title: `${name}'s visit is not marked in Dentrix yet`, detail: 'The visit time has passed. Mark it completed or as a no-show in Dentrix.' }
      : n.kind === 'unconfirmed'
        ? { badge: `Arrives ${n.time ? time12(n.time) : ''}`, badgeCls: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200', edge: 'border-l-amber-500', title: `${name} has not confirmed`, detail: 'A quick call before the visit keeps the chair from going empty.' }
        : { badge: n.expiresInDays != null ? (n.expiresInDays <= 0 ? 'Due today' : n.expiresInDays === 1 ? '1 day left' : `${n.expiresInDays} days left`) : 'Open', badgeCls: (n.expiresInDays ?? 99) <= 7 ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200', edge: (n.expiresInDays ?? 99) <= 7 ? 'border-l-red-500' : 'border-l-slate-300 dark:border-l-slate-600', title: `${name} missed a visit with ${first} and has not rebooked`, detail: n.missed ? `Missed ${shortDate(n.missed)}.` : '' };
    return (
      <li key={i} className={'rounded-2xl border border-slate-100 dark:border-slate-700 border-l-4 bg-white dark:bg-slate-800 shadow-sm p-4 ' + v.edge}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className={'self-start sm:self-center shrink-0 rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide ' + v.badgeCls}>{v.badge}</span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 dark:text-white">{v.title}</div>
            {v.detail && <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{v.detail}</div>}
          </div>
          <div className="flex gap-2 shrink-0">{n.kind !== 'not_marked' && callBtn(n.patient)}{openBtn(n.patient)}</div>
        </div>
      </li>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <Link to="/whos-here" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Who's here
      </Link>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading…</div>
      ) : error !== null || !data ? (
        <div className="rounded-2xl p-8 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-slate-500 dark:text-slate-400">
          {error === 403 ? 'This page is not available for your role.' : 'This day could not be loaded. Please try again shortly.'}
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.provider.name} <span className="font-normal text-slate-500 dark:text-slate-400">· {roleLabel(data.provider.role)}</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {data.date ? dayLabel(data.date) : 'No appointments in the next seven days'}
              {data.asOf ? ` · Dentrix updated ${timeAgo(data.asOf)}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-3">
              {callFor && (
                <section className="rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 p-4" aria-live="polite">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-amber-950 dark:text-amber-100">
                        Who to call for {time12(callFor.start)} ({callFor.minutes} min open)
                      </h2>
                      {calls?.basis && <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mt-0.5">{calls.basis}</p>}
                    </div>
                    <button type="button" onClick={() => { setCallFor(null); setCalls(null); }}
                      className="text-sm font-medium text-amber-900 dark:text-amber-200 hover:underline">Close</button>
                  </div>
                  {callsLoading ? (
                    <p className="text-sm mt-3 text-amber-900 dark:text-amber-200">Finding patients…</p>
                  ) : !calls || calls.candidates.length === 0 ? (
                    <p className="text-sm mt-3 text-amber-900 dark:text-amber-200">No one to suggest for this slot right now.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {calls.candidates.map((c, i) => (
                        <li key={i} className="rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 dark:text-white">{c.patient?.name || 'Patient'}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-300">{c.why}</div>
                            {c.work && c.work.length > 0 && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {c.work.join(' · ')}{c.items && c.items > c.work.length ? ` · and ${c.items - c.work.length} more` : ''}
                              </div>
                            )}
                            {!c.patient?.phone && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">No phone on file</div>}
                          </div>
                          {typeof c.estimatedNet === 'number' && (
                            <div className="text-right shrink-0">
                              <div className="font-semibold text-slate-900 dark:text-white">{usd(c.estimatedNet)}</div>
                              <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">est. net</div>
                            </div>
                          )}
                          <div className="flex gap-2 shrink-0">{callBtn(c.patient)}{openBtn(c.patient)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {current.length} {current.length === 1 ? 'thing needs' : 'things need'} a person {dayWord}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">For {first}'s patients, most urgent first.</p>
              {current.length === 0 ? (
                <div className="rounded-2xl p-6 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400">
                  Nothing needs a person for {first} {dayWord}.
                </div>
              ) : (
                <ul className="space-y-3">{current.map(renderNeed)}</ul>
              )}
              {lost.length > 0 && (
                <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                  <button
                    type="button"
                    aria-expanded={showLost}
                    onClick={() => setShowLost(v => !v)}
                    className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-left rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">Missed visits not rebooked ({lost.length})</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {showLost ? 'Hide' : 'Show'}
                      {soonest != null ? ` · soonest leaves the window ${soonest <= 0 ? 'today' : soonest === 1 ? 'in 1 day' : `in ${soonest} days`}` : ''}
                    </span>
                  </button>
                  {showLost && <ul className="space-y-3 px-3 pb-3">{lost.map(renderNeed)}</ul>}
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5 lg:sticky lg:top-24" aria-label={`${first}'s day`}>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">{first}'s day</h2>
              {data.worksThatDay === false && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">This is not one of {first}'s usual working days.</p>
              )}
              {!data.hours && data.date && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Office hours are not set for this day, so open time is not shown.</p>
              )}
              {timeline.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No appointments.</p>
              ) : (
                <ul className="space-y-2">
                  {timeline.map((row, i) => {
                    if (row.kind === 'lunch' && data.lunch) {
                      return (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="w-16 shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{time12(data.lunch.start)}</span>
                          <span className="flex-1 rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1.5 text-slate-500 dark:text-slate-400">Lunch until {time12(data.lunch.end)}</span>
                        </li>
                      );
                    }
                    if (row.kind === 'open' && row.block) {
                      const b = row.block;
                      return (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="w-16 shrink-0 tabular-nums font-semibold text-amber-700 dark:text-amber-300">{time12(b.start)}</span>
                          <span className="flex-1 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 font-medium text-amber-900 dark:text-amber-200">
                            <span className="block">Open until {time12(b.end)} ({b.minutes} min)</span>
                            <button type="button" onClick={() => openList(b)}
                              className="mt-1.5 inline-flex rounded-md bg-amber-700 hover:bg-amber-800 text-white px-2.5 py-1 text-xs font-semibold">
                              Who to call
                            </button>
                          </span>
                        </li>
                      );
                    }
                    const a = row.appt as Appt;
                    const badge = apptBadge(a);
                    return (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="w-16 shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{time12(a.time)}</span>
                        <span className="min-w-0 flex-1 rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1.5">
                          <span className="block truncate text-slate-900 dark:text-white">
                            {a.patient ? <Link to={`/patients/${a.patient.id}`} className="hover:underline">{a.patient.name || 'Patient'}</Link> : 'Patient'}
                            <span className="text-slate-500 dark:text-slate-400"> · {visitLabel(a, data.provider.role)}</span>
                          </span>
                          <span className={'inline-block mt-1 rounded px-1.5 py-0.5 text-[11px] font-medium ' + badge.cls}>{badge.text}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {data.hours && (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Open time uses office hours {time12(data.hours.open)} to {time12(data.hours.close)}
                  {data.lunch ? `, lunch ${time12(data.lunch.start)} to ${time12(data.lunch.end)}` : ''}
                  {data.scheduleSource ? `. Source: ${data.scheduleSource}.` : '.'}
                </p>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
