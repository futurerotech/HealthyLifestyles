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

/** Parse an "YYYY-MM-DD" value from <input type="date"> as a local date. */
export const parseDateInput = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
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
