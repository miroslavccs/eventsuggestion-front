import { fireEvent, render, screen } from '@testing-library/react-native';

import { MonthGrid } from '@/components/month-grid';
import { SnoozePanel } from '@/components/snooze-panel';
import { StarRating } from '@/components/star-rating';
import { Toggle } from '@/components/ui';
import type { Suggestion } from '@/api/types';

describe('StarRating', () => {
  it('reports the tapped rating', async () => {
    const onChange = jest.fn();
    await render(<StarRating value={null} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText('4 stars'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('is read-only without onChange', async () => {
    const onChange = jest.fn();
    await render(<StarRating value={3} />);
    await fireEvent.press(screen.getByLabelText('5 stars'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Toggle', () => {
  it('flips the value', async () => {
    const onValueChange = jest.fn();
    await render(<Toggle label="Daily on" value onValueChange={onValueChange} />);
    await fireEvent.press(screen.getByLabelText('Daily on'));
    expect(onValueChange).toHaveBeenCalledWith(false);
  });
});

describe('SnoozePanel', () => {
  it('snoozes to the chosen preset', async () => {
    const onSnooze = jest.fn();
    await render(<SnoozePanel onSnooze={onSnooze} />);
    await fireEvent.press(screen.getByText('Tomorrow'));
    await fireEvent.press(screen.getByLabelText(/^Snooze to/));
    expect(onSnooze).toHaveBeenCalledTimes(1);
    expect(onSnooze.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('refuses an invalid custom date', async () => {
    const onSnooze = jest.fn();
    await render(<SnoozePanel onSnooze={onSnooze} />);
    await fireEvent.press(screen.getByText('Pick a date…'));
    await fireEvent.changeText(screen.getByLabelText('Date (YYYY-MM-DD)'), '2020-01-01');
    await fireEvent.press(screen.getByLabelText('Snooze'));
    expect(onSnooze).not.toHaveBeenCalled();
  });
});

const event = (over: Partial<Suggestion>): Suggestion => ({
  id: 1,
  category: 'WEEKEND',
  title: 'Harvest food market',
  description: null,
  location: null,
  estimatedCost: null,
  suggestedDate: '2026-10-10',
  reasonForSuggestion: null,
  status: 'ACCEPTED',
  feedbackComment: null,
  createdAt: '2026-10-01T08:00:00',
  respondedAt: null,
  notificationRead: true,
  rating: null,
  snoozedUntil: null,
  ...over,
});

describe('MonthGrid', () => {
  it('reports the tapped day and marks the selection', async () => {
    const onSelect = jest.fn();
    await render(<MonthGrid year={2026} month={9} today="2026-10-07" selected="2026-10-18" onSelect={onSelect} />);
    expect(screen.getByLabelText('Sun 18 Oct').props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(screen.getByLabelText('Sat 24 Oct'));
    expect(onSelect).toHaveBeenCalledWith('2026-10-24');
  });

  it('announces how many events a day holds', async () => {
    await render(
      <MonthGrid
        year={2026}
        month={9}
        today="2026-10-07"
        events={{ '2026-10-10': [event({ id: 1 }), event({ id: 2, status: 'PENDING' })], '2026-10-11': [event({ id: 3 })] }}
      />,
    );
    expect(screen.getByLabelText('Sat 10 Oct, 2 events')).toBeTruthy();
    expect(screen.getByLabelText('Sun 11 Oct, 1 event')).toBeTruthy();
    expect(screen.getByLabelText('Mon 12 Oct')).toBeTruthy();
  });

  it('does not let days before minDate be selected', async () => {
    const onSelect = jest.fn();
    await render(<MonthGrid year={2026} month={9} today="2026-10-07" minDate="2026-10-08" onSelect={onSelect} />);
    await fireEvent.press(screen.getByLabelText('Tue 6 Oct'));
    expect(onSelect).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Thu 8 Oct'));
    expect(onSelect).toHaveBeenCalledWith('2026-10-08');
  });

  it('is read-only without onSelect', async () => {
    await render(<MonthGrid year={2026} month={9} today="2026-10-07" />);
    expect(screen.getByLabelText('Sat 10 Oct').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('shows event titles as chips in the full variant', async () => {
    await render(<MonthGrid year={2026} month={9} today="2026-10-07" variant="full" events={{ '2026-10-10': [event({})] }} />);
    expect(screen.getByText('Harvest food market')).toBeTruthy();
  });
});
