/** Clock-time helpers for the sleep calculators. Times are minutes since midnight. */

export const MIN_PER_CYCLE = 90;
export const FALL_ASLEEP_MIN = 15;

/** Parse an "HH:MM" (24-hour) value from an <input type="time"> into minutes. */
export const parseTime = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
};

/** Add (or subtract) minutes, wrapping within a 24-hour clock. */
export const addMinutes = (minutes: number, delta: number): number =>
  (((minutes + delta) % 1440) + 1440) % 1440;

/** Format minutes-since-midnight as a 12-hour time, e.g. "6:45 AM". */
export const formatClock = (minutes: number): string => {
  const t = (((minutes % 1440) + 1440) % 1440);
  const h = Math.floor(t / 60);
  const m = t % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/** Format a duration in hours as "7.5 hours" / "9 hours". */
export const formatHours = (hours: number): string => {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} hour${rounded === 1 ? '' : 's'}`;
};
