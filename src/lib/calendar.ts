import type { Suggestion } from '@/api/types';
import { addDays, fromIso, toIso } from './dates';
import { feedItems, isSnoozed, planGroups } from './suggestions';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface CalendarDay {
  iso: string;
  day: number;
  /** False for the leading/trailing days that belong to the neighbouring months. */
  inMonth: boolean;
}

/** Monday-first month grid: 4–6 full weeks covering `month` (0-11) of `year`. */
export function monthGrid(year: number, month: number): CalendarDay[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((lead + days) / 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(year, month, 1 - lead + w * 7 + d);
      return { iso: toIso(date), day: date.getDate(), inMonth: date.getMonth() === month };
    }),
  );
}

export const monthTitle = (year: number, month: number) => `${MONTHS[month]} ${year}`;

/** Month navigation that rolls over the year boundary in either direction. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/**
 * Suggestions that occupy a calendar day, keyed by ISO date: accepted plans and open (pending) ideas.
 * Rejected ideas, wishlist items and ideas that are snoozed past `today` are not on the calendar.
 */
export function eventsByDate(all: Suggestion[], today: string = toIso(new Date())): Record<string, Suggestion[]> {
  const out: Record<string, Suggestion[]> = {};
  for (const s of all) {
    if (!s.suggestedDate || (s.status !== 'ACCEPTED' && s.status !== 'PENDING')) continue;
    if (isSnoozed(s, today)) continue;
    (out[s.suggestedDate] ??= []).push(s);
  }
  return out;
}

export interface FreeTime {
  /** Fri/Sat/Sun within the next week that have no accepted plan, soonest first. */
  days: string[];
  /** Open ideas dated on one of those days. */
  ideas: Suggestion[];
}

const WEEKEND_DAYS = new Set([5, 6, 0]);

export function freeTime(all: Suggestion[], today: string = toIso(new Date())): FreeTime {
  const busy = new Set(all.filter((s) => s.status === 'ACCEPTED' && s.suggestedDate).map((s) => s.suggestedDate!));
  const start = fromIso(today);
  const days: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(start, i);
    const iso = toIso(d);
    if (WEEKEND_DAYS.has(d.getDay()) && !busy.has(iso)) days.push(iso);
  }
  const ideas = feedItems(all, today).filter((s) => s.suggestedDate && days.includes(s.suggestedDate));
  return { days, ideas };
}

export interface PlanStats {
  /** Accepted plans whose date has passed. */
  tried: number;
  /** Average of the ratings given, or null when nothing is rated yet. */
  averageRating: number | null;
  /** Accepted plans still ahead. */
  planned: number;
}

export function planStats(all: Suggestion[], today: string = toIso(new Date())): PlanStats {
  const groups = planGroups(all, today);
  const ratings = groups.past.map((s) => s.rating!).filter((r) => r > 0);
  const average = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  return {
    tried: groups.toRate.length + groups.past.length,
    averageRating: average === null ? null : Math.round(average * 10) / 10,
    planned: groups.upcoming.length,
  };
}
