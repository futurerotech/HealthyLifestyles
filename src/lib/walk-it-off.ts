/**
 * "Walk It Off" food energy → illustrative extra activity time (UI-free).
 * minutes = kcal / ((MET - 1) × weightKg) × 60, using energy ABOVE
 * the resting baseline. MET values are population approximations from the
 * Compendium, not personal measurements or instructions to offset food.
 */


/** Keep calculator mass in kg; displayed unit toggles must not change the math. */
export type WeightUnits = 'kg' | 'lb';
const LB_PER_KG = 2.20462;
export const weightToKg = (value: number, units: WeightUnits): number =>
  units === 'lb' ? value / LB_PER_KG : value;
export const weightForDisplay = (kg: number, units: WeightUnits): number =>
  Math.round((units === 'lb' ? kg * LB_PER_KG : kg) * 100) / 100;

export interface Food {
  name: string;
  kcal: number;
  emoji: string;
}

/** Common foods with rough calories (per typical serving). */
export const FOODS: Food[] = [
  { name: 'Big burger (e.g. Big Mac)', kcal: 563, emoji: '🍔' },
  { name: 'Slice of pizza', kcal: 285, emoji: '🍕' },
  { name: 'Glazed donut', kcal: 260, emoji: '🍩' },
  { name: 'Medium fries', kcal: 365, emoji: '🍟' },
  { name: 'Chocolate bar', kcal: 230, emoji: '🍫' },
  { name: 'Croissant', kcal: 270, emoji: '🥐' },
  { name: 'Bagel (plain)', kcal: 250, emoji: '🥯' },
  { name: 'Banana', kcal: 105, emoji: '🍓' },
  { name: 'Apple', kcal: 95, emoji: '🍎' },
  { name: 'Can of cola', kcal: 140, emoji: '🥤' },
  { name: 'Pint of beer', kcal: 208, emoji: '🍺' },
  { name: 'Glass of wine', kcal: 125, emoji: '🍷' },
  { name: 'Café latte', kcal: 190, emoji: '☕' },
  { name: 'Scoop of ice cream', kcal: 137, emoji: '🍦' },
  { name: 'Chocolate chip cookie', kcal: 160, emoji: '🍪' },
  { name: 'Slice of cake', kcal: 350, emoji: '🍰' },
  { name: 'Avocado', kcal: 240, emoji: '🥑' },
  { name: 'Handful of chips/crisps', kcal: 150, emoji: '🥔' },
  { name: 'Cheeseburger (regular)', kcal: 300, emoji: '🍔' },
  { name: 'Fried chicken piece', kcal: 320, emoji: '🍗' },
  { name: 'Bowl of cereal + milk', kcal: 230, emoji: '🥣' },
  { name: 'Peanut butter (2 tbsp)', kcal: 190, emoji: '🥜' },
  { name: 'Bar of dark chocolate (½)', kcal: 270, emoji: '🍫' },
  { name: 'Energy drink', kcal: 110, emoji: '⚡' },
  { name: 'Burrito', kcal: 580, emoji: '🌯' },
  { name: 'Sushi roll (6 pc)', kcal: 250, emoji: '🍣' },
];

export interface Activity {
  key: string;
  label: string;
  met: number;
  emoji: string;
}

export const ACTIVITIES: Activity[] = [
  { key: 'walk', label: 'Walking', met: 3.8, emoji: '🚶' }, // brisk ~3.5 mph
  { key: 'run', label: 'Running', met: 9.8, emoji: '🏃' }, // ~6 mph
  { key: 'cycle', label: 'Cycling', met: 7.5, emoji: '🚴' }, // moderate
];

/** Valid UI domain: avoid silently reporting 0 minutes for missing/invalid weight. */
export function validWalkInputs(kcal: number, weightKg: number): boolean {
  return Number.isFinite(kcal) && kcal >= 0 && kcal <= 3000 &&
    Number.isFinite(weightKg) && weightKg >= 1 && weightKg <= 300;
}

/** Approximate minutes to expend `kcal` ABOVE resting energy at MET intensity. */
export function minutesToBurn(kcal: number, met: number, weightKg: number): number {
  if (!Number.isFinite(kcal) || kcal < 0 || !Number.isFinite(met) || met <= 1 ||
      !Number.isFinite(weightKg) || weightKg <= 0) return Number.NaN;
  return (kcal / ((met - 1) * weightKg)) * 60;
}
