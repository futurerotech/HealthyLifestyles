/**
 * Quantity-aware grocery list and grocery-cost estimate for the meal-plan generator
 * (Phase 5 Candidate 1, non-public engineering candidate, not demand-validated).
 *
 * Two dated, public-domain U.S. price sources are kept separate:
 * - BLS CPI Average Price Data, a monthly U.S. city average (current).
 * - USDA ERS Fruit and Vegetable Prices, an annual scanner average (2023, inferred;
 *   not inflation-adjusted). It is used only for foods with no current BLS series.
 * Costs are estimates, not prices at any store, and cover only ingredients with an exact
 * food match. Coverage and the cost from each source are always reported, so a partial
 * or mixed-vintage estimate is never presented as a complete current total.
 */
import type { MealPlan, PlannedMeal } from './mealplan';
import type { Recipe } from '../data/recipes';
import { PORTIONS, type PortionUnit } from '../data/ingredient-portions.ts';
import { BLS_SNAPSHOT } from '../data/bls-price-snapshot.ts';
import { ERS_SNAPSHOT } from '../data/ers-price-snapshot.ts';

export type PriceKey = string;
export type PriceSource = 'BLS' | 'ERS';

export interface PriceEntry {
  key: string;
  source: PriceSource;
  item: string;
  unit: string | null;
  /** 'YYYY-MM' for BLS; 'YYYY' (annual average) for ERS. */
  period: string;
  price: number;
  /** Edible share of the purchased weight (ERS preparation yield). 1 when not applicable. */
  yield: number;
}
export interface PriceTable { entries: Map<string, PriceEntry>; sources: SourceInfo[] }
export interface SourceInfo { source: PriceSource; name: string; url: string; retrieved: string; periods: string[]; note: string }

interface BlsLike { source: string; sourceUrl: string; retrieved: string; items: readonly { key: string; blsItem: string; unit: string | null; period: string; price: number }[] }
interface ErsLike {
  source: string; sourceUrl: string; retrieved: string; dataYear: number;
  items: readonly { key: string; ersItem: string; form: string; unit: string; price: number; yield: number }[];
  yieldsForBls: Readonly<Record<string, { yield: number }>>;
}

/** Merge the two snapshots. A BLS price always wins; ERS adds foods BLS does not cover. */
export function buildPriceTable(bls: BlsLike = BLS_SNAPSHOT as unknown as BlsLike, ers: ErsLike | null = ERS_SNAPSHOT as unknown as ErsLike): PriceTable {
  const entries = new Map<string, PriceEntry>();
  for (const i of bls.items) {
    const y = ers?.yieldsForBls[i.key]?.yield ?? 1;
    entries.set(i.key, { key: i.key, source: 'BLS', item: i.blsItem, unit: i.unit, period: i.period, price: i.price, yield: y });
  }
  if (ers) for (const i of ers.items) {
    if (entries.has(i.key)) continue;
    entries.set(i.key, { key: i.key, source: 'ERS', item: `${i.ersItem} (${i.form.toLowerCase()})`, unit: i.unit, period: String(ers.dataYear), price: i.price, yield: i.yield });
  }
  const sources: SourceInfo[] = [{
    source: 'BLS', name: 'U.S. Bureau of Labor Statistics, Average Price Data (U.S. city average)', url: 'https://www.bls.gov/cpi/factsheets/average-prices.htm',
    retrieved: bls.retrieved, periods: [...new Set(bls.items.map((i) => i.period))].sort(), note: 'monthly survey prices',
  }];
  if (ers) sources.push({
    source: 'ERS', name: 'USDA Economic Research Service, Fruit and Vegetable Prices', url: ers.sourceUrl,
    retrieved: ers.retrieved, periods: [String(ers.dataYear)], note: 'annual national average, not adjusted for inflation; likely below current prices',
  });
  return { entries, sources };
}

const DEFAULT_TABLE = buildPriceTable();

const G_PER_LB = 453.6, ML_PER_GAL = 3785.4, G_PER_12OZ = 340.2, G_PER_8OZ = 226.8;

/**
 * Price of one edible portion unit (g, ml or each), or null when not priced. Weight
 * prices are per purchased weight, so they are divided by the preparation yield.
 */
export function unitPrice(p: Pick<PriceEntry, 'unit' | 'price'> & { yield?: number } | undefined, unit: PortionUnit): number | null {
  if (!p || !(p.price > 0)) return null;
  const y = p.yield ?? 1;
  if (!(y > 0)) return null;
  if (p.unit === 'lb' && unit === 'g') return p.price / G_PER_LB / y;
  if (p.unit === '12oz' && unit === 'g') return p.price / G_PER_12OZ / y;
  if (p.unit === '8oz' && unit === 'g') return p.price / G_PER_8OZ / y;
  if (p.unit === 'gallon' && unit === 'ml') return p.price / ML_PER_GAL;
  if (p.unit === 'dozen' && unit === 'each') return p.price / 12;
  return null; // unit mismatch: never converted by guesswork
}

export interface GroceryLine { name: string; amount: number; unit: PortionUnit | null; meals: number; cost: number | null; source: PriceSource | null }
export interface CostSummary {
  lines: GroceryLine[];
  /** Sum over priced lines, for the whole household and the whole plan. */
  pricedCost: number;
  /** pricedCost split by price source, so mixed vintages stay visible. */
  costBySource: Record<PriceSource, number>;
  perDay: number;
  /** Share of grocery lines that carry a price (0..1). */
  pricedShare: number;
  /** True when any line is unpriced: the cost is then a lower bound, not a total. */
  incomplete: boolean;
  days: number;
  household: number;
  sources: SourceInfo[];
}

export const clampHousehold = (n: number) => Math.min(8, Math.max(1, Math.round(Number.isFinite(n) ? n : 1)));

const portionPrice = (ing: string, table: PriceTable) => {
  const p = PORTIONS[ing];
  if (!p?.price) return null;
  const e = table.entries.get(p.price);
  const up = unitPrice(e, p.unit);
  return up === null || !e ? null : { up, source: e.source };
};

/** Aggregate a plan into quantities for the household and estimate the priced cost. */
export function groceryCost(plan: Pick<MealPlan, 'days'>, household = 1, table: PriceTable = DEFAULT_TABLE): CostSummary {
  const hh = clampHousehold(household);
  const acc = new Map<string, GroceryLine>();
  for (const day of plan.days) for (const meal of day.meals) for (const ing of meal.ingredients) {
    const portion = PORTIONS[ing];
    const line = acc.get(ing) ?? { name: ing, amount: 0, unit: portion?.unit ?? null, meals: 0, cost: null, source: null };
    line.meals += 1;
    if (portion) {
      const qty = portion.amount * meal.servings * hh;
      line.amount += qty;
      const pp = portionPrice(ing, table);
      if (pp) { line.cost = (line.cost ?? 0) + pp.up * qty; line.source = pp.source; }
    }
    acc.set(ing, line);
  }
  const lines = [...acc.values()].sort((a, b) => b.meals - a.meals || a.name.localeCompare(b.name));
  const priced = lines.filter((l) => l.cost !== null);
  const costBySource: Record<PriceSource, number> = { BLS: 0, ERS: 0 };
  for (const l of priced) costBySource[l.source!] += l.cost!;
  const pricedCost = costBySource.BLS + costBySource.ERS;
  const days = plan.days.length || 1;
  return {
    lines, pricedCost, costBySource, perDay: pricedCost / days, pricedShare: lines.length ? priced.length / lines.length : 0,
    incomplete: priced.length < lines.length, days, household: hh,
    sources: table.sources.filter((s) => s.source === 'BLS' || costBySource.ERS > 0),
  };
}

/** Share of a recipe's ingredients that carry a price (0..1). */
export function recipeCoverage(recipe: Recipe, table: PriceTable = DEFAULT_TABLE): number {
  if (!recipe.ingredients.length) return 0;
  return recipe.ingredients.filter((i) => portionPrice(i, table)).length / recipe.ingredients.length;
}

/**
 * Estimated cost of one serving of a recipe, or null when fewer than `minCoverage` of
 * its ingredients are priced. Partly priced recipes would look artificially cheap, so
 * they are never ranked as "cheaper".
 */
export function recipeServingCost(recipe: Recipe, table: PriceTable = DEFAULT_TABLE, minCoverage = 0.6): number | null {
  let cost = 0, priced = 0;
  for (const ing of recipe.ingredients) {
    const pp = portionPrice(ing, table);
    if (pp) { cost += pp.up * PORTIONS[ing].amount; priced += 1; }
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
export function cheaperSwaps(plan: Pick<MealPlan, 'days'>, pool: Recipe[], recipes: Recipe[], tolerance = 0.1, table: PriceTable = DEFAULT_TABLE): CheaperSwap[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const out: CheaperSwap[] = [];
  plan.days.forEach((day, d) => day.meals.forEach((meal: PlannedMeal, i: number) => {
    const cur = byId.get(meal.recipeId); if (!cur) return;
    const curCost = recipeServingCost(cur, table); if (curCost === null) return;
    let best: { r: Recipe; c: number } | null = null;
    for (const r of pool) {
      if (r.id === cur.id || !r.meals.includes(meal.type)) continue;
      if (Math.abs(r.kcal - cur.kcal) > cur.kcal * tolerance) continue;
      const c = recipeServingCost(r, table);
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
