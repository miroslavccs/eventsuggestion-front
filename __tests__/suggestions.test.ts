import type { Suggestion } from '@/api/types';
import { canRate, countByCategory, feedItems, metaLine, nextSnoozeEnd, planGroups, snoozedItems } from '@/lib/suggestions';

const make = (over: Partial<Suggestion>): Suggestion => ({
  id: 1,
  category: 'DAILY',
  title: 't',
  description: null,
  location: null,
  estimatedCost: null,
  suggestedDate: null,
  reasonForSuggestion: null,
  status: 'PENDING',
  feedbackComment: null,
  createdAt: '2026-10-01T08:00:00',
  respondedAt: null,
  notificationRead: false,
  rating: null,
  snoozedUntil: null,
  ...over,
});

const TODAY = '2026-10-05';

describe('feed', () => {
  it('shows only pending, unsnoozed items sorted by date', () => {
    const items = [
      make({ id: 1, suggestedDate: '2026-10-10' }),
      make({ id: 2, suggestedDate: '2026-10-06' }),
      make({ id: 3, status: 'ACCEPTED' }),
      make({ id: 4, snoozedUntil: '2026-10-09' }),
    ];
    expect(feedItems(items, TODAY).map((s) => s.id)).toEqual([2, 1]);
  });

  it('a snooze that has expired (or ends today) puts the item back in the feed', () => {
    const items = [make({ id: 1, snoozedUntil: '2026-10-05' }), make({ id: 2, snoozedUntil: '2026-10-01' })];
    expect(feedItems(items, TODAY)).toHaveLength(2);
    expect(snoozedItems(items, TODAY)).toHaveLength(0);
  });

  it('reports snoozed items and the soonest wake-up date', () => {
    const items = [make({ id: 1, snoozedUntil: '2026-10-16' }), make({ id: 2, snoozedUntil: '2026-10-09' })];
    const snoozed = snoozedItems(items, TODAY);
    expect(snoozed).toHaveLength(2);
    expect(nextSnoozeEnd(snoozed)).toBe('2026-10-09');
    expect(nextSnoozeEnd([])).toBeNull();
  });

  it('counts per category', () => {
    const counts = countByCategory([make({ category: 'DAILY' }), make({ category: 'WEEKEND' }), make({ category: 'WEEKEND' })]);
    expect(counts).toEqual({ ALL: 3, DAILY: 1, WEEKEND: 2, MONTHLY: 0 });
  });
});

describe('plans', () => {
  it('splits accepted items into upcoming, to-rate and past, and lists the wishlist', () => {
    const items = [
      make({ id: 1, status: 'ACCEPTED', suggestedDate: '2026-10-08' }),
      make({ id: 2, status: 'ACCEPTED', suggestedDate: '2026-10-03' }),
      make({ id: 3, status: 'ACCEPTED', suggestedDate: '2026-10-01', rating: 4 }),
      make({ id: 4, status: 'WISHLIST' }),
      make({ id: 5, status: 'REJECTED' }),
      make({ id: 6, status: 'ACCEPTED', suggestedDate: null }),
    ];
    const g = planGroups(items, TODAY);
    expect(g.upcoming.map((s) => s.id)).toEqual([1, 6]);
    expect(g.toRate.map((s) => s.id)).toEqual([2]);
    expect(g.past.map((s) => s.id)).toEqual([3]);
    expect(g.wishlist.map((s) => s.id)).toEqual([4]);
  });

  it('only allows rating accepted suggestions whose date has passed', () => {
    expect(canRate(make({ status: 'ACCEPTED', suggestedDate: '2026-10-04' }), TODAY)).toBe(true);
    expect(canRate(make({ status: 'ACCEPTED', suggestedDate: '2026-10-05' }), TODAY)).toBe(false);
    expect(canRate(make({ status: 'ACCEPTED', suggestedDate: null }), TODAY)).toBe(false);
    expect(canRate(make({ status: 'WISHLIST', suggestedDate: '2026-10-01' }), TODAY)).toBe(false);
  });
});

describe('metaLine', () => {
  it('joins the present fields', () => {
    expect(metaLine(make({ location: 'Dorćol', estimatedCost: 'free' }))).toBe('Dorćol · free');
    expect(metaLine(make({ location: 'Dorćol' }))).toBe('Dorćol');
    expect(metaLine(make({}))).toBe('');
  });
});
