/** Preserve physical distance and pace when switching between km and miles. */
export type PaceUnit = 'km' | 'mi';
export const KM_PER_MILE = 1.609344;
export const toKilometers = (value: number, unit: PaceUnit): number =>
  unit === 'km' ? value : value * KM_PER_MILE;
export const fromKilometers = (km: number, unit: PaceUnit): number =>
  unit === 'km' ? km : km / KM_PER_MILE;
// Pace is seconds per distance unit, so mi pace is numerically LONGER.
export const toSecondsPerKm = (secondsPerUnit: number, unit: PaceUnit): number =>
  unit === 'km' ? secondsPerUnit : secondsPerUnit / KM_PER_MILE;
export const fromSecondsPerKm = (secondsPerKm: number, unit: PaceUnit): number =>
  unit === 'km' ? secondsPerKm : secondsPerKm * KM_PER_MILE;
