// Indian digit grouping (1,23,45,678) without relying on Intl, which varies across Android builds.
export function rupees(n: number, opts: { sign?: boolean } = {}): string {
  const neg = n < 0;
  const whole = Math.round(Math.abs(n));
  const s = String(whole);
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const out = rest ? `${rest},${last3}` : last3;
  const prefix = neg ? '−' : opts.sign ? '+' : '';
  return `${prefix}₹${out}`;
}

export const plain = (n: number) => rupees(n).replace('₹', '');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISODate(new Date());
export const monthKey = (iso: string) => iso.slice(0, 7);
export const currentMonth = () => monthKey(todayISO());

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDate(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthName(month: string, withYear = false): string {
  const [y, m] = month.split('-').map(Number);
  const sameYear = y === new Date().getFullYear();
  return withYear || !sameYear ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1];
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/** Days remaining in the month including today; 0 for past months, full length for future ones. */
export function daysLeft(month: string): number {
  const cur = currentMonth();
  if (month < cur) return 0;
  if (month > cur) return daysInMonth(month);
  return daysInMonth(month) - Number(todayISO().slice(8, 10)) + 1;
}

export function dayLabel(iso: string): string {
  const t = todayISO();
  if (iso === t) return 'Today';
  if (iso === shiftDate(t, -1)) return 'Yesterday';
  const d = parseISO(iso);
  return `${DAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
