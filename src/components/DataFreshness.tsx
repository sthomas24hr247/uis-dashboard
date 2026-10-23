// src/components/DataFreshness.tsx
// Source health (Work Surface v2, "Nothing stale looks live").
// A top-bar button: green when the Dentrix connection is current, amber when it has fallen behind.
// Health comes from the sync, not from when the office last posted, so closed days stay green.
// It opens "Where today's numbers come from": every source with its state, age, threshold and
// what it may assert. Refreshes every 5 minutes.

import { useEffect, useRef, useState } from 'react';
import { fetchDataStatus, formatThrough, timeAgo } from '@/lib/dataFreshness';
import type { DataStatus, SourceHealth } from '@/lib/dataFreshness';

const STATE_LABEL: Record<string, string> = {
  fresh: 'Current', stale: 'Behind', connected: 'Connected', not_connected: 'Not connected',
};
const STATE_CLASS: Record<string, string> = {
  fresh: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  stale: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  connected: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200',
  not_connected: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};
const lastWord = (s: SourceHealth) =>
  s.key === 'eligibility' ? 'Last check' : s.key === 'remittances' ? 'Last received' : 'Last updated';

export function DataFreshness() {
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const s = await fetchDataStatus();
      if (alive) setStatus(s);
    };
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);

  if (!status || !status.connected) return null;

  const sources = status.sources || [];
  const pms = sources.find(s => s.key === 'pms');
  const behind = pms ? pms.state !== 'fresh' : !status.syncHealthy;
  const label = behind
    ? 'Practice data behind' + (pms?.lastGood ? ' · ' + timeAgo(pms.lastGood) : '')
    : 'Practice data current';

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label + '. Show where the numbers come from.'}
        onClick={() => setOpen(o => !o)}
        className={
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap '
          + (behind
            ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300'
            : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-300')
        }
      >
        <span aria-hidden="true" className={'inline-block w-2 h-2 rounded-full ' + (behind ? 'bg-amber-500' : 'bg-emerald-500')} />
        <span className="hidden md:inline">{label}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Where today's numbers come from"
          className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-4 text-sm text-slate-700 dark:text-slate-200"
        >
          <div className="font-semibold text-slate-900 dark:text-white mb-2">Where today's numbers come from</div>
          {status.ledgerDollarsFrozen && (
            <p className="mb-3 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 px-2 py-1.5 text-xs">
              The Dentrix connection is behind, so dollar figures from the ledger are hidden until it catches up.
            </p>
          )}
          {sources.length === 0 ? (
            <p className="text-xs">Last successful sync {timeAgo(status.lastSuccessfulSync)}.</p>
          ) : (
            <ul className="space-y-3">
              {sources.map(s => (
                <li key={s.key}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                    <span className={'shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ' + (STATE_CLASS[s.state] || STATE_CLASS.not_connected)}>
                      {STATE_LABEL[s.state] || s.state}
                    </span>
                  </div>
                  {s.state !== 'not_connected' && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {lastWord(s)} {timeAgo(s.lastGood)}
                      {s.staleAfterMinutes ? ' · counts as behind after ' + s.staleAfterMinutes + ' minutes' : ''}
                    </div>
                  )}
                  {s.newestPosting && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">Newest office posting {formatThrough(s.newestPosting)}</div>
                  )}
                  <div className="text-xs text-slate-500 dark:text-slate-400">{s.asserts}</div>
                  {s.note && <div className="text-xs text-slate-500 dark:text-slate-400">{s.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default DataFreshness;
