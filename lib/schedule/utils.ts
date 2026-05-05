import { DAYS } from './data';
import type { DayName } from './data';

export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function todayDayName(): DayName {
  const idx = (new Date().getDay() + 6) % 7;
  return DAYS[idx];
}

export function toDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns the ISO date string (YYYY-MM-DD) for Monday of the given date's week */
export function getWeekStart(d: Date = new Date()): string {
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return toDateKey(monday);
}

/**
 * Determines the Gi/NoGi variant for the current week.
 * Week 0 (reference: 2026-05-04, Monday) = 'nogi'.
 * Alternates every week.
 */
const REFERENCE_WEEK = new Date('2026-05-04'); // Monday, NoGi week

export function getGiNogiVariant(weekStart?: string): 'gi' | 'nogi' {
  const start = weekStart ? new Date(weekStart) : new Date(getWeekStart());
  const diffMs = start.getTime() - REFERENCE_WEEK.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks % 2 === 0 ? 'nogi' : 'gi';
}

export function formatTime(t: string): string {
  return t.slice(0, 5);
}

/** Returns the last N Mondays as date keys */
export function getPastWeekStarts(n: number): string[] {
  const result: string[] = [];
  const current = new Date(getWeekStart());
  for (let i = 0; i < n; i++) {
    result.push(toDateKey(current));
    current.setDate(current.getDate() - 7);
  }
  return result;
}

export function isTodayOrFuture(dateKey: string): boolean {
  return dateKey >= toDateKey();
}

/**
 * Given a day name (e.g. "Miercoles") and the ISO date of the week's Monday,
 * returns the ISO date key for that day in that week.
 */
export function dayNameToDateKey(dayName: string, weekStart: string): string {
  const idx = DAYS.indexOf(dayName as DayName);
  if (idx === -1) return weekStart;
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + idx);
  return toDateKey(d);
}
