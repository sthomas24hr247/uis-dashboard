// src/pages/WhosHerePage.tsx
// "Who's here?" for the front desk: staff and each provider's day at a glance. No money.
// Staff cards open The Day; provider cards open that provider's day. Refreshes every 2 minutes.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '@/lib/dataFreshness';

const API = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

interface Patient { id: string; name: string | null }
interface Prov {
  id: string | null; name: string; role: string | null;
  patients: number; seen: number; noShows: number; notConfirmed: number; notMarked: number;
  first: string; last: string; next: { time: string; patient: Patient | null } | null;
}
interface Staff { id: string; name: string; role: string }
interface Team {
  date: string | null; isToday: boolean; asOf: string | null;
  summary: { patients: number; seen: number; noShows: number; confirmed: number; notConfirmed: number; notMarked: number };
  day: { needsPerson: number; expiringToday: number; expiringThisWeek: number };
  staff: Staff[]; providers: Prov[];
}

const time12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const dayLabel = (d: string) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function roleLabel(role: string | null): string {
  const r = String(role || '').toLowerCase();
  if (r.includes('hygien')) return 'Hygienist';
  if (r.includes('pediatric')) return 'Pediatric dentist';
  if (r.includes('surgeon')) return 'Oral surgeon';
  if (r.includes('dentist')) return 'Dentist';
  return 'Provider';
}
function staffRole(role: string): string {
  return role === 'manager' || role === 'office_manager' ? 'Office manager' : 'Front office';
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}
function summaryLine(p: Prov, isToday: boolean): string {
  const parts = [plural(p.patients, 'patient', 'patients')];
  if (isToday) parts.push(`${p.seen} seen`);
  if (p.next) parts.push(`next at ${time12(p.next.time)}`);
  else if (isToday) parts.push('no more today');
  if (p.notConfirmed > 0) parts.push(`${p.notConfirmed} not confirmed`);
  if (p.noShows > 0) parts.push(plural(p.noShows, 'no-show', 'no-shows'));
  if (p.notMarked > 0) parts.push(`${p.notMarked} not marked yet`);
  return parts.join(' · ');
}

const cardCls = 'flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/40';
const avatarCls = 'w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-semibold';

export default function WhosHerePage() {
  const { token } = useAuth();
  const [data, setData] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    const load = () =>
      fetch(`${API}/api/whos-here`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((d: Team) => { if (alive) { setData(d); setError(null); } })
        .catch((s: any) => { if (alive) setError(typeof s === 'number' ? s : 0); })
        .finally(() => { if (alive) setLoading(false); });
    load();
    const t = setInterval(load, 2 * 60 * 1000);
    return () => { alive = false; clearInterval(t); };
  }, [token]);

  const s = data?.summary;
  const stat = (value: number | string, label: string) => (
    <div className="flex items-baseline gap-4 border-t border-white/15 py-3">
      <span className="text-3xl font-semibold tabular-nums min-w-[3.5rem]">{value}</span>
      <span className="text-sm text-teal-50/90">{label}</span>
    </div>
  );
  const dayLine = data ? `${data.day.needsPerson} things on The Day · ${data.day.expiringThisWeek} within a week` : '';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-500" /> Who's here?
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {data?.date ? (data.isToday ? dayLabel(data.date) : `The office is closed today. Next clinic day: ${dayLabel(data.date)}`) : ''}
          {data?.asOf ? ` · Dentrix updated ${timeAgo(data.asOf)}` : ''}
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading…</div>
      ) : error !== null ? (
        <div className="rounded-2xl p-8 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-slate-500 dark:text-slate-400">
          {error === 403 ? 'This page is not available for your role.' : 'This page could not be loaded. Please try again shortly.'}
        </div>
      ) : data && s && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <aside className="rounded-2xl bg-teal-900 dark:bg-teal-950 text-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-teal-100/80 mb-2">{data.isToday ? 'Today' : 'Next clinic day'}</div>
            {stat(s.patients, s.patients === 1 ? 'patient scheduled' : 'patients scheduled')}
            {stat(s.confirmed, `confirmed, ${s.notConfirmed} not yet`)}
            {data.isToday && stat(s.seen, 'seen so far')}
            {data.isToday && s.noShows > 0 && stat(s.noShows, s.noShows === 1 ? 'no-show' : 'no-shows')}
            {data.isToday && s.notMarked > 0 && stat(s.notMarked, 'past visits not marked in Dentrix yet')}
            <div className="border-t border-white/15 pt-3 mt-1">
              <Link to="/day" className="text-sm font-medium text-white underline underline-offset-4 decoration-white/40 hover:decoration-white">
                The Day: {data.day.needsPerson} things need a person
              </Link>
              <div className="text-xs text-teal-50/80 mt-1">
                {data.day.expiringToday > 0 ? `${data.day.expiringToday} expire today, ` : ''}{data.day.expiringThisWeek} within a week
              </div>
            </div>
          </aside>

          <ul className="lg:col-span-2 space-y-3">
            {data.staff.map(st => (
              <li key={st.id}>
                <Link to="/day" className={cardCls}>
                  <span aria-hidden="true" className={avatarCls + ' bg-teal-700 text-white'}>{initials(st.name)}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-slate-900 dark:text-white">
                      {st.name} <span className="font-normal text-slate-500 dark:text-slate-400">· {staffRole(st.role)}</span>
                    </span>
                    <span className="block text-sm text-slate-600 dark:text-slate-300">{dayLine}</span>
                  </span>
                  <span aria-hidden="true" className="text-teal-600 dark:text-teal-400 text-lg">→</span>
                </Link>
              </li>
            ))}
            {data.providers.map(p => (
              <li key={p.id || p.name}>
                {p.id ? (
                  <Link to={`/whos-here/provider/${p.id}${data.date ? `?date=${data.date}` : ''}`} className={cardCls}>
                    <span aria-hidden="true" className={avatarCls + ' bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'}>{initials(p.name)}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-slate-900 dark:text-white">
                        {p.name} <span className="font-normal text-slate-500 dark:text-slate-400">· {roleLabel(p.role)}</span>
                      </span>
                      <span className="block text-sm text-slate-600 dark:text-slate-300">{summaryLine(p, data.isToday)}</span>
                    </span>
                    <span aria-hidden="true" className="text-teal-600 dark:text-teal-400 text-lg">→</span>
                  </Link>
                ) : (
                  <div className={cardCls}>
                    <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">{p.name}: {summaryLine(p, data.isToday)}</span>
                  </div>
                )}
              </li>
            ))}
            {data.staff.length === 0 && data.providers.length === 0 && (
              <li className="rounded-2xl p-8 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-slate-500 dark:text-slate-400">
                No appointments in the next seven days.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
