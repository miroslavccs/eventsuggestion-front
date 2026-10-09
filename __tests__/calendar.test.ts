import type { Suggestion } from '@/api/types';
import { eventsByDate, freeTime, monthGrid, monthTitle, planStats, shiftMonth } from '@/lib/calendar';

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

describe('monthGrid', () => {
  it('starts on a Monday and pads with the neighbouring months (Oct 2026 starts on a Thursday)', () => {
    const grid = monthGrid(2026, 9);
    expect(grid).toHaveLength(5);
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(grid[0][0]).toEqual({ iso: '2026-09-28', day: 28, inMonth: false });
    expect(grid[0][3]).toEqual({ iso: '2026-10-01', day: 1, inMonth: true });
    expect(grid[4][6]).toEqual({ iso: '2026-11-01', day: 1, inMonth: false });
  });

  it('uses exactly 4 weeks for a 28-day February that starts on a Monday', () => {
    const grid = monthGrid(2027, 1);
    expect(grid).toHaveLength(4);
    expect(grid.flat().every((d) => d.inMonth)).toBe(true);
  });

  it('uses 6 weeks when a 31-day month starts late in the week (Aug 2026 starts on a Saturday)', () => {
    const grid = monthGrid(2026, 7);
    expect(grid).toHaveLength(6);
    expect(grid.flat().filter((d) => d.inMonth)).toHaveLength(31);
  });

  it('handles a leap-year February', () => {
    expect(monthGrid(2028, 1).flat().filter((d) => d.inMonth)).toHaveLength(29);
  });
});

describe('month navigation', () => {
  it('rolls over the year boundary in both directions', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2027, 0, -1)).toEqual({ year: 2026, month: 11 });
    expect(shiftMonth(2026, 9, 14)).toEqual({ year: 2027, month: 11 });
  });

  it('formats the title', () => {
    expect(monthTitle(2026, 9)).toBe('October 2026');
  });
});

describe('eventsByDate', () => {
  it('groups accepted and pending ideas by their date', () => {
    const map = eventsByDate([
      make({ id: 1, status: 'ACCEPTED', suggestedDate: '2026-10-10' }),
      make({ id: 2, status: 'PENDING', suggestedDate: '2026-10-10' }),
      make({ id: 3, status: 'PENDING', suggestedDate: '2026-10-12' }),
    ]);
    expect(map['2026-10-10'].map((s) => s.id)).toEqual([1, 2]);
    expect(map['2026-10-12'].map((s) => s.id)).toEqual([3]);
  });

  it('leaves out ideas that are snoozed past today, but not ones whose snooze has ended', () => {
    const map = eventsByDate(
      [
        make({ id: 1, suggestedDate: '2026-10-10', snoozedUntil: '2026-10-12' }),
        make({ id: 2, suggestedDate: '2026-10-10', snoozedUntil: '2026-10-09' }),
      ],
      '2026-10-09',
    );
    expect(map['2026-10-10'].map((s) => s.id)).toEqual([2]);
  });

  it('leaves out rejected, wishlist and undated items', () => {
    const map = eventsByDate([
      make({ id: 1, status: 'REJECTED', suggestedDate: '2026-10-10' }),
      make({ id: 2, status: 'WISHLIST', suggestedDate: '2026-10-10' }),
      make({ id: 3, status: 'ACCEPTED', suggestedDate: null }),
    ]);
    expect(map).toEqual({});
  });
});

describe('freeTime', () => {
  const TODAY = '2026-10-05'; // Monday

  it('lists Fri/Sat/Sun of the coming week without an accepted plan and the open ideas on them', () => {
    const all = [
      make({ id: 1, status: 'ACCEPTED', suggestedDate: '2026-10-11' }),
      make({ id: 2, suggestedDate: '2026-10-10' }),
      make({ id: 3, suggestedDate: '2026-10-14' }),
      make({ id: 4, suggestedDate: '2026-10-09', snoozedUntil: '2026-10-08' }),
    ];
    const free = freeTime(all, TODAY);
    expect(free.days).toEqual(['2026-10-09', '2026-10-10']);
    expect(free.ideas.map((s) => s.id)).toEqual([2]);
  });

  it('counts today when it is itself a free weekend day', () => {
    expect(freeTime([], '2026-10-10').days[0]).toBe('2026-10-10');
  });

  it('is empty of ideas when nothing is suggested', () => {
    expect(freeTime([], TODAY).ideas).toEqual([]);
  });
});

describe('planStats', () => {
  const TODAY = '2026-10-05';

  it('counts tried and planned plans and averages the ratings', () => {
    const stats = planStats(
      [
        make({ id: 1, status: 'ACCEPTED', suggestedDate: '2026-09-20', rating: 4 }),
        make({ id: 2, status: 'ACCEPTED', suggestedDate: '2026-09-25', rating: 5 }),
        make({ id: 3, status: 'ACCEPTED', suggestedDate: '2026-10-01' }),
        make({ id: 4, status: 'ACCEPTED', suggestedDate: '2026-10-10' }),
        make({ id: 5, status: 'PENDING', suggestedDate: '2026-10-10' }),
      ],
      TODAY,
    );
    expect(stats).toEqual({ tried: 3, averageRating: 4.5, planned: 1 });
  });

  it('has no average when nothing is rated, and zeros for an empty list', () => {
    expect(planStats([make({ status: 'ACCEPTED', suggestedDate: '2026-09-20' })], TODAY).averageRating).toBeNull();
    expect(planStats([], TODAY)).toEqual({ tried: 0, averageRating: null, planned: 0 });
  });
});
