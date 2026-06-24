/**
 * Pure unit conversion + formatting helpers. All calculator maths runs in metric
 * (kg, cm, years); these convert to/from the imperial display values.
 */

export type UnitSystem = 'metric' | 'imperial';
export type Sex = 'male' | 'female';

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const lbToKg = (lb: number): number => lb * KG_PER_LB;
export const kgToLb = (kg: number): number => kg / KG_PER_LB;
export const inToCm = (inches: number): number => inches * CM_PER_IN;
export const cmToIn = (cm: number): number => cm / CM_PER_IN;

export const ftInToCm = (ft: number, inch: number): number =>
  inToCm(ft * 12 + inch);

/** Split centimetres into whole feet + remaining inches (rounded to 0.5"). */
export const cmToFtIn = (cm: number): { ft: number; inch: number } => {
  const totalIn = cmToIn(cm);
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round((totalIn - ft * 12) * 2) / 2;
  if (inch >= 12) {
    ft += 1;
    inch -= 12;
  }
  return { ft, inch };
};

/** Round to a fixed number of decimals, trimming trailing zeros. */
export const round = (n: number, dp = 1): number => {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
};

export const fmt = (n: number, dp = 1): string =>
  round(n, dp).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: dp,
  });

/** Format a mass given in kg, into the chosen unit system, e.g. "72.5 kg" / "159.8 lb". */
export const fmtMass = (kg: number, units: UnitSystem, dp = 1): string =>
  units === 'metric' ? `${fmt(kg, dp)} kg` : `${fmt(kgToLb(kg), dp)} lb`;

export const massUnitLabel = (units: UnitSystem): string =>
  units === 'metric' ? 'kg' : 'lb';
