// One place that turns any appointment status into a standard key and a display label.
// The practice system stores lower case (completed, no_show); older screens expected
// Title Case or UPPER CASE, so their counters and badges never matched real data.
export type StatusKey =
  | 'SCHEDULED' | 'CONFIRMED' | 'ARRIVED' | 'SEATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

const ALIASES: Record<string, StatusKey> = {
  SCHEDULED: 'SCHEDULED', BOOKED: 'SCHEDULED', UNCONFIRMED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  ARRIVED: 'ARRIVED', CHECKED_IN: 'ARRIVED', CHECKEDIN: 'ARRIVED',
  SEATED: 'SEATED',
  IN_PROGRESS: 'IN_PROGRESS', INPROGRESS: 'IN_PROGRESS', IN_CHAIR: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED', COMPLETE: 'COMPLETED', CHECKED_OUT: 'COMPLETED', CHECKEDOUT: 'COMPLETED',
  CANCELLED: 'CANCELLED', CANCELED: 'CANCELLED', BROKEN: 'CANCELLED',
  NO_SHOW: 'NO_SHOW', NOSHOW: 'NO_SHOW',
};

const LABELS: Record<StatusKey, string> = {
  SCHEDULED: 'Scheduled', CONFIRMED: 'Confirmed', ARRIVED: 'Arrived', SEATED: 'Seated',
  IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled', NO_SHOW: 'No Show',
};

/** Unknown or empty values count as Scheduled, the same fallback the screens used before. */
export function normalizeStatus(raw: string | null | undefined): StatusKey {
  const key = String(raw ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return ALIASES[key] ?? 'SCHEDULED';
}

export function statusLabel(key: StatusKey): string {
  return LABELS[key];
}
