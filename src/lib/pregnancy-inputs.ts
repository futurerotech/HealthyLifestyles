import { cmToIn, ftInToCm, kgToLb, lbToKg, round, type UnitSystem } from './units';

type Display = Record<string, string>;
export type PregnancyMeasurements = { weight: number; height: number; week: number; current: number };

function finiteInput(value: string | undefined): number {
  if (value == null || value.trim() === '') return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

/** Read explicit inputs; incomplete imperial heights must not become valid zero inches. */
export function readPregnancyMeasurements(disp: Display, units: UnitSystem): PregnancyMeasurements {
  const feet = finiteInput(disp.height_ft);
  const inches = finiteInput(disp.height_in);
  const height = units === 'metric' ? finiteInput(disp.height)
    : Number.isInteger(feet) && feet >= 0 && inches >= 0 && inches < 12 ? ftInToCm(feet, inches) : NaN;
  const mass = (key: string) => units === 'metric' ? finiteInput(disp[key]) : lbToKg(finiteInput(disp[key]));
  return { weight: mass('weight'), height, week: finiteInput(disp.week), current: mass('current') };
}

/** Values are converted from the last entered measurements, not from rounded display strings. */
export function pregnancyDisplay(vals: PregnancyMeasurements, units: UnitSystem, week: string): Display {
  const show = (n: number) => Number.isFinite(n) ? String(round(n, 2)) : '';
  const mass = (n: number) => show(units === 'metric' ? n : kgToLb(n));
  const d: Display = { weight: mass(vals.weight), current: mass(vals.current), week };
  if (units === 'metric') d.height = show(vals.height);
  else if (!Number.isFinite(vals.height) || vals.height <= 0) { d.height_ft = ''; d.height_in = ''; }
  else {
    const totalIn = cmToIn(vals.height);
    let feet = Math.floor(totalIn / 12);
    let inches = round(totalIn - feet * 12, 2);
    if (inches >= 12) { feet++; inches = 0; }
    d.height_ft = String(feet);
    d.height_in = String(inches);
  }
  return d;
}

/** Editing a field supersedes only that field's retained measurement. */
export function forgetPregnancyMeasurement(preserved: Partial<PregnancyMeasurements>, key: string): Partial<PregnancyMeasurements> {
  const field = key === 'height_ft' || key === 'height_in' ? 'height' : key;
  if (!['weight', 'height', 'week', 'current'].includes(field) || !Object.prototype.hasOwnProperty.call(preserved, field)) return preserved;
  const next = { ...preserved };
  delete next[field as keyof PregnancyMeasurements];
  return next;
}
