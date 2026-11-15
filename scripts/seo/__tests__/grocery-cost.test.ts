// Phase 5 Candidate 1: quantity-aware grocery list, BLS + USDA ERS cost estimate, budget swaps.
import test from 'node:test';
import assert from 'node:assert/strict';
import { groceryCost, recipeServingCost, recipeCoverage, cheaperSwaps, unitPrice, clampHousehold, formatAmount, buildPriceTable } from '../../../src/lib/grocery-cost.ts';
import { PORTIONS } from '../../../src/data/ingredient-portions.ts';
import { RECIPES } from '../../../src/data/recipes.ts';
import { BLS_SNAPSHOT } from '../../../src/data/bls-price-snapshot.ts';
import { ERS_SNAPSHOT } from '../../../src/data/ers-price-snapshot.ts';
import { generatePlan, filterPool, type PlanInputs } from '../../../src/lib/mealplan.ts';

const bls = BLS_SNAPSHOT as any;
const table = buildPriceTable();
const blsOnly = buildPriceTable(bls, null);
const meal = (recipeId: string, servings = 1) => {
  const r = RECIPES.find((x) => x.id === recipeId)!;
  return { type: r.meals[0], recipeId, name: r.name, servings, kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, ingredients: r.ingredients };
};
const inputs = (over: Partial<PlanInputs> = {}): PlanInputs => ({
  targets: { calories: 2000, protein: 120, carbs: 220, fat: 70 }, diet: 'omnivore', mealsPerDay: 3, excludeAllergens: [], excludeText: '', ...over,
});
const weekPlan = (inp: PlanInputs, seed = 7) => {
  const p = generatePlan(RECIPES, inp, seed);
  assert.ok(p, 'plan generated');
  return p!;
};

test('every recipe ingredient has a portion and every price key resolves to a dated source', () => {
  const missing = [...new Set(RECIPES.flatMap((r) => r.ingredients))].filter((i) => !PORTIONS[i]);
  assert.deepEqual(missing, []);
  const dangling = Object.entries(PORTIONS).filter(([, p]) => p.price && !table.entries.has(p.price)).map(([n, p]) => `${n}:${p.price}`);
  assert.deepEqual(dangling, [], 'a price key with no snapshot entry would silently drop a price');
  for (const [, p] of Object.entries(PORTIONS)) if (p.price?.startsWith('ers.')) assert.equal(table.entries.get(p.price)!.source, 'ERS');
});

test('BLS snapshot is current; ERS snapshot is dated, attributed, CC0 and flags its inferred year', () => {
  assert.match(bls.source, /Bureau of Labor Statistics/);
  const months = bls.items.map((i: any) => { const [y, m] = i.period.split('-').map(Number); return y * 12 + m; });
  assert.ok(Math.max(...months) - Math.min(...months) <= 3);
  assert.match(ERS_SNAPSHOT.source, /Economic Research Service.*CC0/);
  assert.equal(ERS_SNAPSHOT.dataYear, 2023);
  assert.equal(ERS_SNAPSHOT.dataYearInferred, true);
  for (const i of ERS_SNAPSHOT.items) {
    assert.equal(i.unit, 'lb');
    assert.ok(i.price > 0 && i.yield > 0 && i.yield <= 1.2, i.key);
  }
  // No ERS item duplicates a food that has a current BLS price.
  const blsKeys = new Set(bls.items.map((i: any) => i.key));
  for (const k of Object.keys(ERS_SNAPSHOT.yieldsForBls)) assert.ok(blsKeys.has(k), `yield for unknown BLS item ${k}`);
});

test('unit conversion divides by the preparation yield and never guesses across units', () => {
  const lb = { unit: 'lb', price: 4.536 };
  assert.ok(Math.abs(unitPrice(lb, 'g')! - 0.01) < 1e-12);
  assert.ok(Math.abs(unitPrice({ ...lb, yield: 0.5 }, 'g')! - 0.02) < 1e-12);
  assert.ok(Math.abs(unitPrice({ unit: '8oz', price: 2.268 }, 'g')! - 0.01) < 1e-12);
  assert.ok(Math.abs(unitPrice({ unit: 'dozen', price: 2.4 }, 'each')! - 0.2) < 1e-12);
  assert.equal(unitPrice(lb, 'each'), null);
  assert.equal(unitPrice({ unit: 'gallon', price: 4 }, 'g'), null);
  assert.equal(unitPrice({ ...lb, yield: 0 }, 'g'), null);
  assert.equal(unitPrice(undefined, 'g'), null);
});

test('BLS prices keep their source; only the ERS yield is applied (banana: purchased weight includes the peel)', () => {
  const b = table.entries.get('bananas')!;
  assert.equal(b.source, 'BLS');
  assert.equal(b.yield, 0.64);
  const bananaPlan = { days: [{ meals: [{ ...meal(RECIPES[0].id), ingredients: ['banana'], servings: 1 }], totals: {} as any }] };
  const line = groceryCost(bananaPlan, 1).lines[0];
  assert.ok(Math.abs(line.cost! - (0.655 / 453.6 / 0.64) * 118) < 1e-9);
  assert.equal(line.source, 'BLS');
});

test('quantities aggregate across the plan and scale with household and servings', () => {
  const plan = { days: [{ meals: [meal('scrambled-eggs-avocado'), meal('scrambled-eggs-avocado', 2)], totals: {} as any }] };
  const one = groceryCost(plan, 1), three = groceryCost(plan, 3);
  const eggs1 = one.lines.find((l) => l.name === 'eggs')!, eggs3 = three.lines.find((l) => l.name === 'eggs')!;
  assert.equal(eggs1.meals, 2);
  assert.equal(eggs1.amount, PORTIONS.eggs.amount * 3); // 1 + 2 servings
  assert.equal(eggs3.amount, eggs1.amount * 3);
  assert.ok(Math.abs(three.pricedCost - one.pricedCost * 3) < 1e-9);
  assert.equal(clampHousehold(0), 1);
  assert.equal(clampHousehold(12), 8);
  assert.equal(clampHousehold(Number.NaN), 1);
});

test('missing prices: unpriced lines carry no cost or source, and the estimate is flagged incomplete', () => {
  const plan = { days: [{ meals: [meal('chia-pudding')], totals: {} as any }] };
  const c = groceryCost(plan, 1);
  for (const l of c.lines) if (!PORTIONS[l.name]?.price) { assert.equal(l.cost, null); assert.equal(l.source, null); }
  assert.equal(c.incomplete, c.lines.some((l) => l.cost === null));
  assert.ok(Math.abs(c.costBySource.BLS + c.costBySource.ERS - c.pricedCost) < 1e-9);
  // ERS is listed as a source only when it contributed to the cost.
  assert.equal(c.sources.some((s) => s.source === 'ERS'), c.costBySource.ERS > 0);
});

test('realistic week: omnivore 2,000 kcal plan for 1 and 4 people', () => {
  const p = weekPlan(inputs());
  const one = groceryCost(p, 1), four = groceryCost(p, 4);
  const weekly = one.pricedCost * (7 / one.days);
  // Lower-bound estimate for one adult: positive and below the USDA Liberal food plan scale.
  assert.ok(weekly > 5 && weekly < 150, `weekly ${weekly.toFixed(2)}`);
  assert.ok(Math.abs(four.pricedCost - one.pricedCost * 4) < 1e-6);
  // A typical plan still has many unpriced items (oils, spices, grains, fish), so it must be flagged incomplete.
  assert.equal(one.incomplete, one.pricedShare < 1);
  console.log(`[GROCERY_WEEK] priced ${(one.pricedShare * 100).toFixed(0)}% of lines, $${weekly.toFixed(2)}/week priced items, ERS share $${(one.costBySource.ERS * 7 / one.days).toFixed(2)}`);
});

test('dietary restrictions: vegan and allergen-free pools only ever suggest swaps from inside the pool', () => {
  for (const inp of [inputs({ diet: 'vegan' }), inputs({ excludeAllergens: ['dairy', 'egg', 'nuts'] }), inputs({ diet: 'vegetarian', excludeText: 'mushrooms' })]) {
    const pool = filterPool(RECIPES, inp);
    const p = generatePlan(RECIPES, inp, 3);
    if (!p) continue;
    const ids = new Set(pool.map((r) => r.id));
    for (const s of cheaperSwaps(p, pool, RECIPES)) {
      assert.ok(ids.has(s.toId), `${s.toId} outside the allowed pool`);
      const to = RECIPES.find((r) => r.id === s.toId)!;
      if (inp.diet !== 'omnivore') assert.ok(to.diets.includes(inp.diet));
      for (const a of inp.excludeAllergens) assert.ok(!to.allergens.includes(a));
    }
  }
});

test('a partly priced recipe has no comparable cost; swaps keep the slot and calories within tolerance', () => {
  for (const r of RECIPES) {
    const c = recipeServingCost(r);
    if (c !== null) { assert.ok(c > 0); assert.ok(recipeCoverage(r) >= 0.6); } else assert.ok(recipeCoverage(r) < 0.6);
  }
  const plan = { days: RECIPES.map((r) => ({ meals: [meal(r.id)], totals: {} as any })) };
  const swaps = cheaperSwaps(plan, RECIPES, RECIPES);
  for (const s of swaps) {
    const from = RECIPES.find((r) => r.id === s.fromId)!, to = RECIPES.find((r) => r.id === s.toId)!;
    assert.ok(s.saving > 0);
    assert.ok(to.meals.includes(plan.days[s.day].meals[s.mealIndex].type));
    assert.ok(Math.abs(to.kcal - from.kcal) <= from.kcal * 0.1);
    assert.ok(recipeServingCost(to)! < recipeServingCost(from)!);
  }
});

test('swap search works when both recipes are fully priced (synthetic recipes)', () => {
  const base = RECIPES[0];
  const dear = { ...base, id: 'syn-dear', name: 'Steak plate', meals: ['dinner' as const], kcal: 600, ingredients: ['steak', 'potato'] };
  const cheap = { ...base, id: 'syn-cheap', name: 'Beef and potato plate', meals: ['dinner' as const], kcal: 620, ingredients: ['beef mince', 'potato'] };
  const far = { ...base, id: 'syn-far', name: 'Rice bowl', meals: ['dinner' as const], kcal: 900, ingredients: ['rice', 'eggs'] };
  const recipes = [dear, cheap, far];
  const plan = { days: [{ meals: [{ ...meal(base.id), type: 'dinner' as const, recipeId: 'syn-dear', ingredients: dear.ingredients, servings: 2 }], totals: {} as any }] };
  const [s, ...rest] = cheaperSwaps(plan, recipes, recipes);
  assert.equal(rest.length, 0);
  assert.equal(s.toId, 'syn-cheap'); // syn-far is cheaper but outside ±10% calories
  const expected = (recipeServingCost(dear)! - recipeServingCost(cheap)!) * 2;
  assert.ok(Math.abs(s.saving - expected) < 1e-9);
});

test('coverage improvement is real and measured (regression floor)', () => {
  const comparable = RECIPES.filter((r) => recipeServingCost(r) !== null).length;
  const comparableBls = RECIPES.filter((r) => recipeServingCost(r, blsOnly) !== null).length;
  assert.ok(comparable >= 13, `comparable recipes ${comparable}`);
  assert.ok(comparable > comparableBls);
});

test('amount formatting shows metric and US units', () => {
  assert.equal(formatAmount(1360.8, 'g'), '1.36 kg (3.0 lb)');
  assert.equal(formatAmount(240, 'ml'), '240 ml');
  assert.equal(formatAmount(2.5, 'each'), '2.5');
});
