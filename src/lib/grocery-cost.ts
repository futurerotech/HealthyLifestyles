/**
 * Quantity-aware grocery list and grocery-cost estimate for the meal-plan generator
 * (Phase 5 Candidate 1, non-public engineering candidate, not demand-validated).
 *
 * Costs use a dated BLS U.S. city-average price snapshot. They are estimates, not
 * prices at any store, and they cover only ingredients with an equivalent BLS series.
 * Coverage is always reported so a partial estimate is never presented as a total.
 */
import type { MealPlan, PlannedMeal } from './mealplan';
import type { Recipe } from '../data/recipes';
import { PORTIONS, type PortionUnit } from '../data/ingredient-portions.ts';
import { BLS_SNAPSHOT } from '../data/bls-price-snapshot.ts';

export type PriceKey = 'eggs' | 'milk' | 'breadWhole' | 'rice' | 'pasta' | 'groundBeef' | 'sirloin' | 'chickenBreast' | 'porkChops'
  | 'cheddar' | 'butter' | 'bananas' | 'apples' | 'lemons' | 'potatoes' | 'tomatoes' | 'lettuce' | 'romaine' | 'peppers' | 'broccoli'
  | 'carrots' | 'peanutButter';

export interface PriceEntry { key: string; blsItem: string; seriesId: string; unit: string | null; period: string; price: number }
export interface PriceSnapshot { source: string; sourceUrl: string; retrieved: string; items: PriceEntry[] }

const G_PER_LB = 453.6, ML_PER_GAL = 3785.4, G_PER_12OZ = 340.2;

/** Price of one portion unit (g, ml or each), or null when not priced. */
export function unitPrice(p: PriceEntry | undefined, unit: PortionUnit): number | null {
  if (!p || !(p.price > 0)) return null;
  if (p.unit === 'lb' && unit === 'g') return p.price / G_PER_LB;
  if (p.unit === '12oz' && unit === 'g') return p.price / G_PER_12OZ;
  if (p.unit === 'gallon' && unit === 'ml') return p.price / ML_PER_GAL;
  if (p.unit === 'dozen' && unit === 'each') return p.price / 12;
  return null; // unit mismatch: never converted by guesswork
}

export interface GroceryLine { name: string; amount: number; unit: PortionUnit | null; meals: number; cost: number | null }
export interface CostSummary {
  lines: GroceryLine[];
  /** Sum over priced lines, for the whole household and the whole plan. */
  pricedCost: number;
  perDay: number;
  /** Share of grocery lines that carry a price (0..1). */
  pricedShare: number;
  days: number;
  household: number;
  snapshot: { source: string; sourceUrl: string; retrieved: string; periods: string[] };
}

const priceMap = (s: PriceSnapshot) => new Map(s.items.map((i) => [i.key, i]));
const snap0 = BLS_SNAPSHOT as unknown as PriceSnapshot;

export const clampHousehold = (n: number) => Math.min(8, Math.max(1, Math.round(Number.isFinite(n) ? n : 1)));

/** Aggregate a plan into quantities for the household and estimate the priced cost. */
export function groceryCost(plan: Pick<MealPlan, 'days'>, household = 1, snap: PriceSnapshot = snap0): CostSummary {
  const hh = clampHousehold(household);
  const prices = priceMap(snap);
  const acc = new Map<string, GroceryLine>();
  for (const day of plan.days) for (const meal of day.meals) for (const ing of meal.ingredients) {
    const portion = PORTIONS[ing];
    const line = acc.get(ing) ?? { name: ing, amount: 0, unit: portion?.unit ?? null, meals: 0, cost: null };
    line.meals += 1;
    if (portion) {
      const qty = portion.amount * meal.servings * hh;
      line.amount += qty;
      const up = unitPrice(portion.price ? prices.get(portion.price) : undefined, portion.unit);
      if (up !== null) line.cost = (line.cost ?? 0) + up * qty;
    }
    acc.set(ing, line);
  }
  const lines = [...acc.values()].sort((a, b) => b.meals - a.meals || a.name.localeCompare(b.name));
  const priced = lines.filter((l) => l.cost !== null);
  const pricedCost = priced.reduce((s, l) => s + (l.cost ?? 0), 0);
  const days = plan.days.length || 1;
  return {
    lines, pricedCost, perDay: pricedCost / days, pricedShare: lines.length ? priced.length / lines.length : 0, days, household: hh,
    snapshot: { source: snap.source, sourceUrl: snap.sourceUrl, retrieved: snap.retrieved, periods: [...new Set(snap.items.map((i) => i.period))].sort() },
  };
}

/**
 * Estimated cost of one serving of a recipe, or null when fewer than `minCoverage` of
 * its ingredients are priced. Partly priced recipes would look artificially cheap, so
 * they are never ranked as "cheaper".
 */
export function recipeServingCost(recipe: Recipe, snap: PriceSnapshot = snap0, minCoverage = 0.6): number | null {
  const prices = priceMap(snap);
  let cost = 0, priced = 0;
  for (const ing of recipe.ingredients) {
    const p = PORTIONS[ing];
    const up = p ? unitPrice(p.price ? prices.get(p.price) : undefined, p.unit) : null;
    if (p && up !== null) { cost += up * p.amount; priced += 1; }
  }
  return recipe.ingredients.length && priced / recipe.ingredients.length >= minCoverage ? cost : null;
}

export interface CheaperSwap { day: number; mealIndex: number; fromId: string; toId: string; from: string; to: string; saving: number }

/**
 * Same-slot swaps to a cheaper, comparably priced recipe from the allowed pool (already
 * filtered for diet, allergens and exclusions). Calories stay within ±tolerance of the
 * planned recipe, so the plan's macro fitting is preserved; the user still applies the
 * swap through the existing swap flow, which re-checks tolerance.
 */
export function cheaperSwaps(plan: Pick<MealPlan, 'days'>, pool: Recipe[], recipes: Recipe[], tolerance = 0.1, snap: PriceSnapshot = snap0): CheaperSwap[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const out: CheaperSwap[] = [];
  plan.days.forEach((day, d) => day.meals.forEach((meal: PlannedMeal, i: number) => {
    const cur = byId.get(meal.recipeId); if (!cur) return;
    const curCost = recipeServingCost(cur, snap); if (curCost === null) return;
    let best: { r: Recipe; c: number } | null = null;
    for (const r of pool) {
      if (r.id === cur.id || !r.meals.includes(meal.type)) continue;
      if (Math.abs(r.kcal - cur.kcal) > cur.kcal * tolerance) continue;
      const c = recipeServingCost(r, snap);
      if (c === null || c >= curCost) continue;
      if (!best || c < best.c) best = { r, c };
    }
    if (best) out.push({ day: d, mealIndex: i, fromId: cur.id, toId: best.r.id, from: cur.name, to: best.r.name, saving: (curCost - best.c) * meal.servings });
  }));
  return out.sort((a, b) => b.saving - a.saving);
}

/** Display helper: grams/ml to friendly US + metric text. */
export function formatAmount(amount: number, unit: PortionUnit | null): string {
  if (unit === null) return '';
  if (unit === 'each') return `${Math.round(amount * 2) / 2}`;
  if (unit === 'ml') return amount >= 1000 ? `${(amount / 1000).toFixed(1)} L (${(amount / 29.574).toFixed(0)} fl oz)` : `${Math.round(amount)} ml`;
  return amount >= 1000 ? `${(amount / 1000).toFixed(2)} kg (${(amount / 453.6).toFixed(1)} lb)` : `${Math.round(amount)} g (${(amount / 28.35).toFixed(1)} oz)`;
}
