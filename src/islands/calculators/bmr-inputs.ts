/** BMR-only canonical metric inputs. Other calculators retain the shared converters. */
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, round, type UnitSystem } from '../../lib/units';

type DisplayValues = Record<string, string>;
export type BmrCanonical = Record<'weight' | 'height' | 'age', number>;

const parseInput = (raw: string | undefined): number => {
  if (raw === undefined || raw.trim() === '') return Number.NaN;
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
};

/** Change only the input the person edited; keep unaffected metric values exact. */
export function editBmrCanonical(
  current: BmrCanonical,
  display: DisplayValues,
  changedField: string,
  units: UnitSystem,
): BmrCanonical {
  const next = { ...current };
  if (changedField === 'weight') {
    const weight = parseInput(display.weight);
    next.weight = units === 'metric' ? weight : lbToKg(weight);
  } else if (changedField === 'height') {
    next.height = parseInput(display.height);
  } else if (changedField === 'height_ft' || changedField === 'height_in') {
    const ft = parseInput(display.height_ft);
    const inches = parseInput(display.height_in);
    next.height = Number.isInteger(ft) && ft >= 0 && Number.isFinite(inches) && inches >= 0 && inches < 12
      ? ftInToCm(ft, inches)
      : Number.NaN;
  } else if (changedField === 'age') {
    next.age = parseInput(display.age);
  }
  return next;
}

/** Unit toggles only change presentation, never the canonical metric measurements. */
export function displayBmrCanonical(
  current: DisplayValues,
  canonical: BmrCanonical,
  units: UnitSystem,
): DisplayValues {
  const next = { ...current };
  if (units === 'metric') {
    next.weight = Number.isFinite(canonical.weight) ? String(round(canonical.weight, 1)) : '';
    next.height = Number.isFinite(canonical.height) ? String(round(canonical.height, 1)) : '';
    delete next.height_ft;
    delete next.height_in;
  } else {
    next.weight = Number.isFinite(canonical.weight) ? String(round(kgToLb(canonical.weight), 1)) : '';
    if (Number.isFinite(canonical.height)) {
      const { ft, inch } = cmToFtIn(canonical.height);
      next.height_ft = String(ft);
      next.height_in = String(inch);
    } else {
      next.height_ft = '';
      next.height_in = '';
    }
    delete next.height;
  }
  return next;
}
