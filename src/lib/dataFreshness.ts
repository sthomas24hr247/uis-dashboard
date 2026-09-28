// src/lib/dataFreshness.ts
// Shared helpers for showing how current the practice data is (from /api/data-status).

export interface DataStatus {
  pmsSource: string | null;
  connected: boolean;
  syncHealthy: boolean;
  lastSync: { startedAt: string | null; completedAt: string | null; status: string; fullSync: boolean; hasErrors: boolean } | null;
  lastSuccessfulSync: string | null;
  dataCurrentThrough: string | null;
  newestTransactionDate: string | null;
  databaseLatencyMs: number;
}

const API_BASE: string = (import.meta as any).env?.VITE_API_URL || 'https://api.uishealth.com';

export async function fetchDataStatus(): Promise<DataStatus | null> {
  try {
    const token = localStorage.getItem('uis_token') || '';
    const res = await fetch(API_BASE + '/api/data-status', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) return null;
    return (await res.json()) as DataStatus;
  } catch {
    return null;
  }
}

export async function startSync(): Promise<{ ok: boolean; message: string }> {
  try {
    const token = localStorage.getItem('uis_token') || '';
    const res = await fetch(API_BASE + '/api/data-status/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data.error || 'Could not start a sync.' };
    return { ok: true, message: data.message || 'Sync started.' };
  } catch {
    return { ok: false, message: 'Could not start a sync. Check your connection and try again.' };
  }
}

export function timeAgo(isoValue: string | null): string {
  if (!isoValue) return 'never';
  const ms = Date.now() - new Date(isoValue).getTime();
  if (isNaN(ms)) return 'unknown';
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return min + (min === 1 ? ' minute ago' : ' minutes ago');
  const hours = Math.floor(min / 60);
  if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
  const days = Math.floor(hours / 24);
  return days + (days === 1 ? ' day ago' : ' days ago');
}

export function formatThrough(isoValue: string | null): string {
  if (!isoValue) return 'not available';
  const d = new Date(isoValue);
  if (isNaN(d.getTime())) return 'not available';
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Older than this many hours reads as stale (amber).
export function isStale(isoValue: string | null, hours = 24): boolean {
  if (!isoValue) return true;
  const ms = Date.now() - new Date(isoValue).getTime();
  return isNaN(ms) || ms > hours * 3600 * 1000;
}
