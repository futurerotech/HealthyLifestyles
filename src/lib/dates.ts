/** Date helpers for the pregnancy & cycle calculators. Work on local-time dates. */

export const startOfDay = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, n: number): Date => {
  const r = startOfDay(d);
  r.setDate(r.getDate() + n);
  return r;
};

/** Whole days from `b` to `a` (a − b). */
export const diffDays = (a: Date, b: Date): number =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);

/** Parse an "YYYY-MM-DD" value from <input type="date"> as a local date.
 *  Impossible calendar dates (e.g. 2026-02-30) are rejected rather than being
 *  normalised by Date into the following month. */
export const parseDateInput = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!m) return null;
  const [y, mo, da] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(y, mo - 1, da);
  if (Number.isNaN(d.getTime()) || d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
  return d;
};

/** A whole number typed into a field, accepted only within [min, max]. */
export const boundedInt = (s: string, min: number, max: number): number | null => {
  const t = (s ?? '').trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= min && n <= max ? n : null;
};

export const toDateInputValue = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Friendly, unambiguous format that works across US/UK/CA/AU, e.g. "Mon, 12 Jan 2026". */
export const formatDate = (d: Date): string =>
  d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const trimesterOf = (weeks: number): string => {
  if (weeks <= 13) return 'First trimester';
  if (weeks <= 27) return 'Second trimester';
  return 'Third trimester';
};

/** "N weeks M days" for a signed span of days (sign shown by the caller's label). */
export const weeksAndDays = (totalDays: number): string => {
  const a = Math.abs(Math.trunc(totalDays));
  const w = Math.floor(a / 7), d = a % 7;
  return `${w} ${w === 1 ? 'week' : 'weeks'} ${d} ${d === 1 ? 'day' : 'days'}`;
};

/** Gestational ages beyond this are treated as a likely date-entry error. */
export const MAX_GESTATION_DAYS = 44 * 7;

export type PregnancyDating =
  | { status: 'future' }
  | { status: 'too-old'; ga: number }
  | { status: 'ok'; ga: number; weeks: number; days: number; due: Date; toGo: number };

/** Gestational dating from an LMP-equivalent date (Naegele: due = LMP + 280 days). */
export function pregnancyDating(lmpEquiv: Date, today: Date): PregnancyDating {
  const ga = diffDays(today, lmpEquiv);
  if (ga < 0) return { status: 'future' };
  if (ga > MAX_GESTATION_DAYS) return { status: 'too-old', ga };
  const due = addDays(lmpEquiv, 280);
  return { status: 'ok', ga, weeks: Math.floor(ga / 7), days: ga % 7, due, toGo: diffDays(due, today) };
}

export type DueDateMethod = 'lmp' | 'conception' | 'ivf';

/** Due-date dating. The entered date itself must not be in the future (checked
 *  BEFORE converting conception/IVF dates to an LMP-equivalent). */
export function dueDateDating(method: DueDateMethod, entered: Date, embryoDay: '3' | '5', today: Date): PregnancyDating {
  if (diffDays(entered, today) > 0) return { status: 'future' };
  const lmpEquiv = method === 'lmp' ? entered
    : method === 'conception' ? addDays(entered, -14)
    : addDays(entered, -(14 + (embryoDay === '3' ? 3 : 5)));
  return pregnancyDating(lmpEquiv, today);
}

/** A "first day of last period" more than a year ago is treated as an entry error. */
export const MAX_LAST_PERIOD_DAYS = 365;
export const lastPeriodProblem = (lastPeriod: Date, today: Date): 'future' | 'too-old' | null => {
  const age = diffDays(today, lastPeriod);
  return age < 0 ? 'future' : age > MAX_LAST_PERIOD_DAYS ? 'too-old' : null;
};
