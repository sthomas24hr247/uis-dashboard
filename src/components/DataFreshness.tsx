// src/components/DataFreshness.tsx
// Small top-bar indicator: "Data through Thu, Sep 24, 5:46 AM".
// Amber when the practice data is more than 24 hours old or the sync is not healthy.
// Hover or focus shows the last successful sync. Refreshes every 5 minutes.

import { useEffect, useState } from 'react';
import { fetchDataStatus, formatThrough, isStale, timeAgo } from '@/lib/dataFreshness';
import type { DataStatus } from '@/lib/dataFreshness';

export function DataFreshness() {
  const [status, setStatus] = useState<DataStatus | null>(null);

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

  if (!status || !status.connected) return null;

  const warn = !status.syncHealthy || isStale(status.dataCurrentThrough);
  const detail = 'Practice data current through ' + formatThrough(status.dataCurrentThrough)
    + '. Last successful sync ' + timeAgo(status.lastSuccessfulSync) + '.'
    + (status.syncHealthy ? '' : ' The sync has not completed recently.');

  return (
    <div
      role="status"
      tabIndex={0}
      title={detail}
      aria-label={detail}
      className={
        'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap '
        + (warn
          ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300'
          : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-300')
      }
    >
      <span aria-hidden="true" className={'inline-block w-2 h-2 rounded-full ' + (warn ? 'bg-amber-500' : 'bg-emerald-500')} />
      {'Data through ' + formatThrough(status.dataCurrentThrough)}
    </div>
  );
}

export default DataFreshness;
