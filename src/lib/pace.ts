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
