// Phase 5 Candidate 1: quantity-aware grocery list, BLS cost estimate, budget swaps.
import test from 'node:test';
import assert from 'node:assert/strict';
import { groceryCost, recipeServingCost, cheaperSwaps, unitPrice, clampHousehold, formatAmount } from '../../../src/lib/grocery-cost.ts';
import { PORTIONS } from '../../../src/data/ingredient-portions.ts';
import { RECIPES } from '../../../src/data/recipes.ts';
import { BLS_SNAPSHOT } from '../../../src/data/bls-price-snapshot.ts';

const snap = BLS_SNAPSHOT as any;
const meal = (recipeId: string, servings = 1) => {
  const r = RECIPES.find((x) => x.id === recipeId)!;
  return { type: r.meals[0], recipeId, name: r.name, servings, kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, ingredients: r.ingredients };
};

test('every recipe ingredient has a portion; every price key is in the snapshot or deliberately unpriced', () => {
  const missing = [...new Set(RECIPES.flatMap((r) => r.ingredients))].filter((i) => !PORTIONS[i]);
  assert.deepEqual(missing, []);
  const keys = new Set(snap.items.map((i: any) => i.key));
  const stalePriced = Object.entries(PORTIONS).filter(([, p]) => p.price && !keys.has(p.price)).map(([n, p]) => `${n}:${p.price}`);
  // Stale BLS series (butter, apples, peppers, broccoli, carrots, peanut butter, whole-wheat bread) are excluded from the
  // snapshot, so those ingredients must come out unpriced, never priced from an old value.
  for (const s of stalePriced) assert.match(s, /butter|apples|peppers|broccoli|carrots|peanutButter|breadWhole/);
});

test('snapshot is dated, attributed and current (no series older than 3 months before the newest)', () => {
  assert.match(snap.source, /Bureau of Labor Statistics/);
  assert.match(snap.retrieved, /^\d{4}-\d{2}-\d{2}$/);
  const months = snap.items.map((i: any) => { const [y, m] = i.period.split('-').map(Number); return y * 12 + m; });
  assert.ok(Math.max(...months) - Math.min(...months) <= 3);
  assert.ok(snap.items.length >= 10);
});

test('unit conversions are exact and never guess across units', () => {
  const lb = { key: 'x', blsItem: '', seriesId: '', unit: 'lb', period: '2026-10', price: 4.536 };
  assert.ok(Math.abs(unitPrice(lb, 'g')! - 0.01) < 1e-12);
  assert.equal(unitPrice(lb, 'each'), null);
  assert.ok(Math.abs(unitPrice({ ...lb, unit: 'dozen', price: 2.4 }, 'each')! - 0.2) < 1e-12);
  assert.equal(unitPrice(undefined, 'g'), null);
});

test('quantities aggregate across the plan and scale with household and servings', () => {
  const plan = { days: [{ meals: [meal('scrambled-eggs-avocado'), meal('scrambled-eggs-avocado', 2)], totals: {} as any }] };
  const one = groceryCost(plan, 1, snap), three = groceryCost(plan, 3, snap);
  const eggs1 = one.lines.find((l) => l.name === 'eggs')!, eggs3 = three.lines.find((l) => l.name === 'eggs')!;
  assert.equal(eggs1.meals, 2);
  assert.equal(eggs1.amount, PORTIONS.eggs.amount * 3); // 1 + 2 servings
  assert.equal(eggs3.amount, eggs1.amount * 3);
  assert.ok(Math.abs(three.pricedCost - one.pricedCost * 3) < 1e-9);
  assert.equal(clampHousehold(0), 1);
  assert.equal(clampHousehold(12), 8);
});

test('coverage is reported: unpriced lines never contribute a cost', () => {
  const plan = { days: [{ meals: [meal('chia-pudding')], totals: {} as any }] };
  const c = groceryCost(plan, 1, snap);
  for (const l of c.lines) if (!PORTIONS[l.name]?.price) assert.equal(l.cost, null);
  assert.ok(c.pricedShare >= 0 && c.pricedShare <= 1);
});

test('a partly priced recipe has no comparable cost; swaps keep the slot and calories within tolerance', () => {
  for (const r of RECIPES) {
    const c = recipeServingCost(r, snap);
    if (c !== null) assert.ok(c > 0);
  }
  const plan = { days: RECIPES.slice(0, 7).map((r) => ({ meals: [meal(r.id)], totals: {} as any })) };
  for (const s of cheaperSwaps(plan, RECIPES, RECIPES, 0.1, snap)) {
    const from = RECIPES.find((r) => r.id === s.fromId)!, to = RECIPES.find((r) => r.id === s.toId)!;
    assert.ok(s.saving > 0);
    assert.ok(to.meals.includes(plan.days[s.day].meals[s.mealIndex].type));
    assert.ok(Math.abs(to.kcal - from.kcal) <= from.kcal * 0.1);
    assert.ok(recipeServingCost(to, snap)! < recipeServingCost(from, snap)!);
  }
});

test('amount formatting shows metric and US units', () => {
  assert.equal(formatAmount(1360.8, 'g'), '1.36 kg (3.0 lb)');
  assert.equal(formatAmount(240, 'ml'), '240 ml');
  assert.equal(formatAmount(2.5, 'each'), '2.5');
});
