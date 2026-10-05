import { fireEvent, render, screen } from '@testing-library/react-native';

import { SnoozePanel } from '@/components/snooze-panel';
import { StarRating } from '@/components/star-rating';
import { Toggle } from '@/components/ui';

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
