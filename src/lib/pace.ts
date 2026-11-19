/**
 * Preserve real running distance and pace when switching between km and mi.
 * Pace is seconds per distance unit; it scales in the opposite direction
 * from the numeric distance. Keep incomplete/invalid inputs untouched.
 *
 * The pace UI accepts whole minutes/seconds, so conversion rounds to the
 * nearest second. The distance input retains four decimal places to avoid
 * silently changing an event's length (e.g. 10 km to 6.2137 mi).
 */
export type PaceUnit = 'km' | 'mi';

export const KM_PER_MILE = 1.609344;

export interface PaceInputs {
  distance: string;
  paceMinutes: string;
  paceSeconds: string;
}

function nonnegativeNumber(text: string): number | null {
  if (text.trim() === '') return null;
  const number = Number(text);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function convertPaceInputs(
  original: PaceInputs,
  from: PaceUnit,
  to: PaceUnit,
): PaceInputs {
  if (from === to) return { ...original };
  const paceRatio = from === 'km' ? KM_PER_MILE : 1 / KM_PER_MILE;
  const next: PaceInputs = { ...original };
  const distance = nonnegativeNumber(original.distance);
  if (distance !== null) {
    next.distance = String(Number((distance / paceRatio).toFixed(4)));
  }
  const minutes = nonnegativeNumber(original.paceMinutes);
  const seconds = nonnegativeNumber(original.paceSeconds);
  if (minutes !== null && Number.isInteger(minutes) &&
      seconds !== null && Number.isInteger(seconds) && seconds <= 59) {
    const convertedSeconds = Math.round((minutes * 60 + seconds) * paceRatio);
    next.paceMinutes = String(Math.floor(convertedSeconds / 60));
    next.paceSeconds = String(convertedSeconds % 60);
  }
  return next;
}

export type PaceMode = 'time' | 'pace' | 'distance';

export interface RunningPaceFields extends PaceInputs {
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
}

/** Validate only the two fields visible for the active calculation mode. */
export function runningPaceInputError(
  mode: PaceMode, fields: RunningPaceFields,
): string | null {
  const value = (s: string): number => s.trim() === '' ? NaN : Number(s);
  if (mode !== 'distance') {
    const distance = value(fields.distance);
    if (!Number.isFinite(distance) || distance <= 0) {
      return 'Enter a positive distance.';
    }
  }
  if (mode !== 'time') {
    const h = value(fields.timeHours);
    const m = value(fields.timeMinutes);
    const s = value(fields.timeSeconds);
    if (!Number.isSafeInteger(h) || h < 0 ||
        !Number.isInteger(m) || m < 0 || m > 59 ||
        !Number.isInteger(s) || s < 0 || s > 59) {
      return 'Enter valid hours, minutes and seconds (0–59 for minutes and seconds).';
    }
    if (h * 3600 + m * 60 + s <= 0) return 'Enter a time greater than zero.';
  }
  if (mode !== 'pace') {
    const m = value(fields.paceMinutes);
    const s = value(fields.paceSeconds);
    if (!Number.isSafeInteger(m) || m < 0 ||
        !Number.isInteger(s) || s < 0 || s > 59) {
      return 'Enter valid pace minutes and seconds (0–59 for seconds).';
    }
    if (m * 60 + s <= 0) return 'Enter a pace greater than zero.';
  }
  return null;
}
