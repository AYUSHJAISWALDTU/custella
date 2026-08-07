/**
 * All timestamps are stored as UTC ISO strings and displayed in the device's local zone
 * (Asia/Kolkata in practice). "Today" therefore means the local day, not the UTC day —
 * otherwise the home-screen counter would reset at 05:30 IST. See DECISIONS.md.
 */

export type PartOfDay = 'morning' | 'afternoon' | 'evening';

export function partOfDay(now: Date = new Date()): PartOfDay {
  const hour = now.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/** Local-midnight boundaries for "today", as UTC ISO strings for querying SQLite. */
export function todayRange(now: Date = new Date()): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Local-midnight boundaries for the current calendar month. */
export function monthRange(now: Date = new Date()): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** "7 Aug 2026" — the timeline's date format. */
export function formatVisitDate(iso: string, locale = 'en-IN'): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
