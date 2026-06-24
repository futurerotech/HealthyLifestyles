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
