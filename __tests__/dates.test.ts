import { ageFromBirthDate, fromIso, isValidIso, parseBirthDate, shortDate, snoozePresets, toIso } from '@/lib/dates';

describe('dates', () => {
  it('round-trips ISO dates without timezone drift', () => {
    expect(toIso(fromIso('2026-10-05'))).toBe('2026-10-05');
    expect(fromIso('2026-10-05').getDate()).toBe(5);
  });

  it('formats short dates', () => {
    expect(shortDate('2026-10-10')).toBe('Sat 10 Oct');
  });

  it('validates real calendar dates only', () => {
    expect(isValidIso('2026-02-28')).toBe(true);
    expect(isValidIso('2026-02-30')).toBe(false);
    expect(isValidIso('10.10.2026')).toBe(false);
    expect(isValidIso('')).toBe(false);
  });

  it('parses DD.MM.YYYY and ISO birth dates, rejects junk', () => {
    expect(parseBirthDate('7.3.1990')).toBe('1990-03-07');
    expect(parseBirthDate('1990-03-07')).toBe('1990-03-07');
    expect(parseBirthDate('31.02.1990')).toBeNull();
    expect(parseBirthDate('abc')).toBeNull();
  });

  it('computes age, counting the birthday only once reached', () => {
    const today = new Date(2026, 9, 5);
    expect(ageFromBirthDate('1990-10-05', today)).toBe(36);
    expect(ageFromBirthDate('1990-10-06', today)).toBe(35);
  });

  it('builds snooze presets: tomorrow, next Friday, 1st of next month', () => {
    const monday = new Date(2026, 9, 5); // Mon 5 Oct 2026
    const [tomorrow, weekend, month] = snoozePresets(monday);
    expect(tomorrow.date).toBe('2026-10-06');
    expect(weekend.date).toBe('2026-10-09');
    expect(month.date).toBe('2026-11-01');
  });

  it('on a Friday, "next weekend" is the following Friday, never today', () => {
    const friday = new Date(2026, 9, 9);
    expect(snoozePresets(friday)[1].date).toBe('2026-10-16');
  });
});
