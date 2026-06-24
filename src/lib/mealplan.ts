/**
 * 7-day meal-plan fitting algorithm (pure functions — UI-free, testable).
 *
 * Approach: split the daily calorie target across meal slots, then for each slot
 * pick a diet/allergen-compatible recipe and SCALE its serving size to hit that
 * slot's calorie share. Selection is greedy and macro-aware — it prefers recipes
 * that move the day's running totals toward the proportional protein/carb/fat
 * sub-targets — with a variety penalty so the week doesn't repeat. Calories land
 * tightly (via scaling); macros land close and the true totals are always shown,
 * never faked.
 */
import type { Recipe, MealType, Diet, Allergen } from '../data/recipes';

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PlanInputs {
  targets: MacroTargets;
  diet: 'omnivore' | Diet;
  mealsPerDay: 3 | 4 | 5;
  excludeAllergens: Allergen[];
  /** Free-text exclusions, comma/space separated (matched against name + ingredients). */
  excludeText: string;
}

export interface PlannedMeal {
  type: MealType;
  recipeId: string;
  name: string;
  servings: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
}

export interface PlannedDay {
  meals: PlannedMeal[];
  totals: MacroTargets;
}

export interface MealPlan {
  days: PlannedDay[];
  targets: MacroTargets;
  /** True if every macro on every day is within tolerance of target. */
  allWithinTolerance: boolean;
}

/** Absolute lower bound below which we refuse to generate a plan (YMYL safety). */
export const SAFE_CALORIE_FLOOR = 1200;
export const MACRO_TOLERANCE = 0.05; // ±5%

export const isBelowFloor = (calories: number): boolean => calories < SAFE_CALORIE_FLOOR;

/** Calorie share per meal slot, by meals-per-day. Sums to 1. */
export function mealSplit(mealsPerDay: 3 | 4 | 5): { type: MealType; ratio: number }[] {
  if (mealsPerDay === 3) {
    return [
      { type: 'breakfast', ratio: 0.3 },
      { type: 'lunch', ratio: 0.4 },
      { type: 'dinner', ratio: 0.3 },
    ];
  }
  if (mealsPerDay === 4) {
    return [
      { type: 'breakfast', ratio: 0.25 },
      { type: 'lunch', ratio: 0.35 },
      { type: 'dinner', ratio: 0.3 },
      { type: 'snack', ratio: 0.1 },
    ];
  }
  return [
    { type: 'breakfast', ratio: 0.25 },
    { type: 'lunch', ratio: 0.3 },
    { type: 'dinner', ratio: 0.25 },
    { type: 'snack', ratio: 0.1 },
    { type: 'snack', ratio: 0.1 },
  ];
}

/** Deterministic PRNG so a given seed reproduces the same plan. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, dp = 0): number => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/** Recipes compatible with the chosen diet, allergen toggles and exclusions. */
export function filterPool(recipes: Recipe[], inputs: PlanInputs): Recipe[] {
  const words = inputs.excludeText
    .toLowerCase()
    .split(/[,\n]|\s{2,}/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3);

  return recipes.filter((r) => {
    if (inputs.diet !== 'omnivore' && !r.diets.includes(inputs.diet)) return false;
    if (inputs.excludeAllergens.some((a) => r.allergens.includes(a))) return false;
    if (words.length) {
      const hay = (r.name + ' ' + r.ingredients.join(' ')).toLowerCase();
      if (words.some((w) => hay.includes(w))) return false;
    }
    return true;
  });
}

function scaleServings(recipe: Recipe, calorieTarget: number): number {
  // Nearest 0.25 serving, clamped to a realistic portion range.
  const raw = calorieTarget / recipe.kcal;
  return Math.min(2, Math.max(0.5, Math.round(raw * 4) / 4));
}

function toPlannedMeal(recipe: Recipe, type: MealType, servings: number): PlannedMeal {
  return {
    type,
    recipeId: recipe.id,
    name: recipe.name,
    servings,
    kcal: Math.round(recipe.kcal * servings),
    protein: round(recipe.protein * servings, 1),
    carbs: round(recipe.carbs * servings, 1),
    fat: round(recipe.fat * servings, 1),
    ingredients: recipe.ingredients,
  };
}

function dayTotals(meals: PlannedMeal[]): MacroTargets {
  return meals.reduce(
    (t, m) => ({
      calories: t.calories + m.kcal,
      protein: round(t.protein + m.protein, 1),
      carbs: round(t.carbs + m.carbs, 1),
      fat: round(t.fat + m.fat, 1),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** Candidates for a slot: recipes that suit the meal type (fallback: whole pool). */
function slotCandidates(pool: Recipe[], type: MealType): Recipe[] {
  const matches = pool.filter((r) => r.meals.includes(type));
  return matches.length ? matches : pool;
}

/**
 * Pick the best recipe for a slot given the remaining macro budget for the day.
 * Scores by how close the scaled recipe lands to the slot's proportional macro
 * share (protein weighted most), with a penalty for recently-used recipes.
 */
function pickForSlot(
  candidates: Recipe[],
  type: MealType,
  calorieTarget: number,
  targets: MacroTargets,
  ratio: number,
  recentlyUsed: Map<string, number>,
  usedToday: Set<string>,
  rand: () => number,
): PlannedMeal | null {
  if (!candidates.length) return null;
  const pTarget = targets.protein * ratio;
  const cTarget = targets.carbs * ratio;
  const fTarget = targets.fat * ratio;

  let best: { meal: PlannedMeal; score: number } | null = null;
  for (const recipe of candidates) {
    const servings = scaleServings(recipe, calorieTarget);
    const meal = toPlannedMeal(recipe, type, servings);

    const calErr = Math.abs(meal.kcal - calorieTarget) / Math.max(calorieTarget, 1);
    const pErr = Math.abs(meal.protein - pTarget) / Math.max(pTarget, 8);
    const cErr = Math.abs(meal.carbs - cTarget) / Math.max(cTarget, 8);
    const fErr = Math.abs(meal.fat - fTarget) / Math.max(fTarget, 6);

    // Weight protein and calories most; small jitter breaks ties for variety.
    let score = calErr * 1.0 + pErr * 1.4 + cErr * 0.8 + fErr * 0.8 + rand() * 0.04;
    if (usedToday.has(recipe.id)) score += 5; // never repeat within a day
    const lastDay = recentlyUsed.get(recipe.id);
    if (lastDay !== undefined) score += 0.5; // mild penalty for any reuse this week

    if (!best || score < best.score) best = { meal, score };
  }
  return best ? best.meal : null;
}

function withinTolerance(day: PlannedDay, targets: MacroTargets, tol = MACRO_TOLERANCE): boolean {
  const ok = (got: number, want: number) => want <= 0 || Math.abs(got - want) / want <= tol;
  return (
    ok(day.totals.calories, targets.calories) &&
    ok(day.totals.protein, targets.protein) &&
    ok(day.totals.carbs, targets.carbs) &&
    ok(day.totals.fat, targets.fat)
  );
}

function buildDay(
  pool: Recipe[],
  targets: MacroTargets,
  split: { type: MealType; ratio: number }[],
  recentlyUsed: Map<string, number>,
  dayIndex: number,
  rand: () => number,
): PlannedDay {
  const usedToday = new Set<string>();
  const meals: PlannedMeal[] = [];
  for (const slot of split) {
    const calorieTarget = targets.calories * slot.ratio;
    const candidates = slotCandidates(pool, slot.type);
    const meal = pickForSlot(
      candidates,
      slot.type,
      calorieTarget,
      targets,
      slot.ratio,
      recentlyUsed,
      usedToday,
      rand,
    );
    if (meal) {
      meals.push(meal);
      usedToday.add(meal.recipeId);
      recentlyUsed.set(meal.recipeId, dayIndex);
    }
  }
  return { meals, totals: dayTotals(meals) };
}

/** Generate a 7-day plan. Returns null if the pool can't support a plan. */
export function generatePlan(recipes: Recipe[], inputs: PlanInputs, seed: number): MealPlan | null {
  const pool = filterPool(recipes, inputs);
  if (pool.length < 4) return null;

  const split = mealSplit(inputs.mealsPerDay);
  const rand = mulberry32(seed);
  const recentlyUsed = new Map<string, number>();
  const days: PlannedDay[] = [];

  for (let d = 0; d < 7; d++) {
    // Expire the variety memory after ~2 days so we don't run out of recipes.
    for (const [id, day] of recentlyUsed) if (day < d - 2) recentlyUsed.delete(id);
    days.push(buildDay(pool, inputs.targets, split, recentlyUsed, d, rand));
  }

  const allWithinTolerance = days.every((day) => withinTolerance(day, inputs.targets));
  return { days, targets: inputs.targets, allWithinTolerance };
}

/**
 * Swap a single meal for the next-best alternative of the same type that isn't
 * the current recipe (or other meals already on that day).
 */
export function swapMeal(
  recipes: Recipe[],
  inputs: PlanInputs,
  day: PlannedDay,
  mealIndex: number,
  seed: number,
): PlannedMeal | null {
  const pool = filterPool(recipes, inputs);
  const slot = mealSplit(inputs.mealsPerDay)[mealIndex];
  if (!slot) return null;
  const current = day.meals[mealIndex];
  const usedToday = new Set(day.meals.filter((_, i) => i !== mealIndex).map((m) => m.recipeId));
  const recent = new Map<string, number>();
  if (current) recent.set(current.recipeId, 0); // discourage picking the same one back
  const candidates = slotCandidates(pool, slot.type).filter((r) => r.id !== current?.recipeId);
  const rand = mulberry32(seed);
  return pickForSlot(
    candidates,
    slot.type,
    inputs.targets.calories * slot.ratio,
    inputs.targets,
    slot.ratio,
    recent,
    usedToday,
    rand,
  );
}

/** Re-scale one meal to a new serving size and return the updated meal. */
export function setServings(recipes: Recipe[], meal: PlannedMeal, servings: number): PlannedMeal {
  const recipe = recipes.find((r) => r.id === meal.recipeId);
  if (!recipe) return meal;
  const s = Math.min(4, Math.max(0.25, Math.round(servings * 4) / 4));
  return toPlannedMeal(recipe, meal.type, s);
}

export interface GroceryItem {
  name: string;
  count: number;
}

/** Aggregate ingredients across the whole plan into a deduped grocery list. */
export function groceryList(plan: MealPlan): GroceryItem[] {
  const counts = new Map<string, number>();
  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const ing of meal.ingredients) {
        counts.set(ing, (counts.get(ing) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Recompute day totals (after a swap or serving change). */
export function recomputeDay(meals: PlannedMeal[]): PlannedDay {
  return { meals, totals: dayTotals(meals) };
}

export { withinTolerance, dayTotals };
