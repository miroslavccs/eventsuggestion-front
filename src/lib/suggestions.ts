import type { CustomerProfile, Suggestion, SuggestionCategory } from '@/api/types';
import { fromIso, shortDate, toIso } from './dates';

const byDate = (a: Suggestion, b: Suggestion) =>
  (a.suggestedDate ?? '9999-12-31').localeCompare(b.suggestedDate ?? '9999-12-31');

export const isSnoozed = (s: Suggestion, today: string) => !!s.snoozedUntil && s.snoozedUntil > today;

/** Pending suggestions that are not snoozed past today: the Today feed. */
export function feedItems(all: Suggestion[], today: string = toIso(new Date())): Suggestion[] {
  return all.filter((s) => s.status === 'PENDING' && !isSnoozed(s, today)).sort(byDate);
}

export const snoozedItems = (all: Suggestion[], today: string = toIso(new Date())) =>
  all.filter((s) => s.status === 'PENDING' && isSnoozed(s, today));

/** Soonest snooze expiry, e.g. for "1 snoozed until Friday". */
export function nextSnoozeEnd(snoozed: Suggestion[]): string | null {
  const dates = snoozed.map((s) => s.snoozedUntil!).sort();
  return dates[0] ?? null;
}

export function countByCategory(items: Suggestion[]): Record<SuggestionCategory | 'ALL', number> {
  const counts = { ALL: items.length, DAILY: 0, WEEKEND: 0, MONTHLY: 0 };
  for (const s of items) counts[s.category] += 1;
  return counts;
}

export interface PlanGroups {
  /** Accepted, dated today or later (or undated). */
  upcoming: Suggestion[];
  /** Accepted and past, not yet rated: "How was it?". */
  toRate: Suggestion[];
  wishlist: Suggestion[];
  /** Accepted and past, already rated, newest first. */
  past: Suggestion[];
}

export function planGroups(all: Suggestion[], today: string = toIso(new Date())): PlanGroups {
  const accepted = all.filter((s) => s.status === 'ACCEPTED');
  const isPast = (s: Suggestion) => !!s.suggestedDate && s.suggestedDate < today;
  return {
    upcoming: accepted.filter((s) => !isPast(s)).sort(byDate),
    toRate: accepted.filter((s) => isPast(s) && s.rating == null).sort(byDate),
    wishlist: all.filter((s) => s.status === 'WISHLIST'),
    past: accepted.filter((s) => isPast(s) && s.rating != null).sort((a, b) => byDate(b, a)),
  };
}

/** The backend only allows a rating on an accepted suggestion whose date has passed. */
export function canRate(s: Suggestion, today: string = toIso(new Date())): boolean {
  return s.status === 'ACCEPTED' && !!s.suggestedDate && s.suggestedDate < today;
}

/** Card date label: "Tonight" style needs time, which the API lacks; use the date. */
export function dateLabel(s: Suggestion, today: string = toIso(new Date())): string {
  if (!s.suggestedDate) return 'Flexible';
  if (s.suggestedDate === today) return 'Today';
  return shortDate(s.suggestedDate);
}

/** "Fruška Gora · about 40 EUR" from the optional location and cost fields. */
export function metaLine(s: Suggestion): string {
  return [s.location, s.estimatedCost].filter(Boolean).join(' · ');
}

export function pausedSet(profile: CustomerProfile): Set<SuggestionCategory> {
  return new Set(profile.pausedCategories);
}

/** Next regular refresh for a category, shown under the schedule toggles. */
export const SCHEDULE: Record<SuggestionCategory, { title: string; summary: string; blurb: string }> = {
  DAILY: { title: 'Daily', summary: 'Every day · 08:00', blurb: 'Ideas every morning at 08:00' },
  WEEKEND: { title: 'Weekend', summary: 'Fridays · 09:00', blurb: 'Fridays at 09:00' },
  MONTHLY: { title: 'Monthly', summary: '1st of month', blurb: 'Bigger trips on the 1st of each month' },
};

export const isPastDate = (iso: string, today: string = toIso(new Date())) => fromIso(iso) < fromIso(today);
