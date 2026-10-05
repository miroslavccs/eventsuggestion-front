const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses YYYY-MM-DD as a local date (new Date(iso) would be UTC and can shift the day). */
export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidIso(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = fromIso(value);
  return toIso(d) === value;
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return next;
}

export const dayName = (iso: string) => DAY_NAMES[fromIso(iso).getDay()];
export const monthName = (iso: string) => MONTH_NAMES[fromIso(iso).getMonth()];
export const dayOfMonth = (iso: string) => fromIso(iso).getDate();

/** "Sat 10 Oct" */
export function shortDate(iso: string): string {
  return `${dayName(iso)} ${dayOfMonth(iso)} ${monthName(iso)}`;
}

/** Age in whole years from a YYYY-MM-DD birth date. */
export function ageFromBirthDate(iso: string, today: Date = new Date()): number {
  const b = fromIso(iso);
  let age = today.getFullYear() - b.getFullYear();
  const beforeBirthday =
    today.getMonth() < b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Accepts DD.MM.YYYY (as in the design) or YYYY-MM-DD; returns ISO or null. */
export function parseBirthDate(input: string): string | null {
  const t = input.trim();
  const dmy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(t);
  const iso = dmy ? `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}` : t;
  return isValidIso(iso) ? iso : null;
}

export type SnoozePreset = { key: 'tomorrow' | 'weekend' | 'month'; label: string; date: string };

/** Snooze shortcuts shown in the design: tomorrow, next Friday (the weekend), 1st of next month. */
export function snoozePresets(today: Date = new Date()): SnoozePreset[] {
  const tomorrow = addDays(today, 1);
  const daysToFriday = ((5 - today.getDay() + 7) % 7) || 7;
  const friday = addDays(today, daysToFriday);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return [
    { key: 'tomorrow', label: 'Tomorrow', date: toIso(tomorrow) },
    { key: 'weekend', label: 'Next weekend', date: toIso(friday) },
    { key: 'month', label: 'Next month', date: toIso(nextMonth) },
  ];
}
