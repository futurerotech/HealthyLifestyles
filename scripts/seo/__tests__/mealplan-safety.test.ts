import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { recomputeDay, withinTolerance, type PlanInputs } from '../../../src/lib/mealplan.ts';
import { RECIPES } from '../../../src/data/recipes.ts';

// Exercise the current island implementation until the same behavior is extracted.
const extracted = new URL('../../../src/lib/ai-mealplan.ts', import.meta.url);
let normalize: (data: unknown, inputs: PlanInputs) => unknown;
if (existsSync(extracted)) {
  normalize = (await import(extracted.href)).normalizeAiMealPlan;
} else {
  const source = readFileSync(new URL('../../../src/islands/MealPlanGenerator.tsx', import.meta.url), 'utf8');
  const functionSource = source.slice(source.indexOf('  function normalizeAi('), source.indexOf('  function hash('));
  normalize = new Function('recomputeDay', 'withinTolerance', 'hash', `${stripTypeScriptTypes(functionSource)}; return normalizeAi;`)(recomputeDay, withinTolerance, () => 1);
}
const inputs: PlanInputs = { targets: { calories: 2000, protein: 150, carbs: 200, fat: 68 }, diet: 'omnivore', mealsPerDay: 4, excludeAllergens: ['nuts'], excludeText: '' };
const response = { days: Array.from({ length: 7 }, () => ({ meals: Array.from({ length: 4 }, (_, i) => ({ type: ['breakfast', 'lunch', 'dinner', 'snack'][i], name: 'Peanut meal', servings: 1, kcal: 500, protein: 37.5, carbs: 50, fat: 17, ingredients: ['peanut butter', 'rice'] })) })) };

test('rejects AI ingredient lists that cannot be verified against selected allergen exclusions', () => {
  assert.equal(normalize(response, inputs), null);
});

test('uses trusted recipe identity and nutrition for diet-restricted AI meals', () => {
  const recipe = RECIPES.find((item) => item.id === 'chickpea-salad')!;
  const dietInputs: PlanInputs = {
    ...inputs,
    targets: { calories: 440, protein: 16, carbs: 48, fat: 18 },
    diet: 'vegan',
    excludeAllergens: [],
  };
  const aiResponse = { days: [{ meals: [{
    type: 'lunch', recipeId: recipe.id, name: 'Beef steak bowl', servings: 1,
    kcal: 440, protein: 16, carbs: 48, fat: 18, ingredients: recipe.ingredients,
  }] }] };
  const plan = normalize(aiResponse, dietInputs) as any;
  assert.equal(plan?.days[0].meals[0].name, recipe.name);
  assert.equal(plan?.days[0].meals[0].kcal, recipe.kcal);
  assert.equal(plan?.days[0].meals[0].protein, recipe.protein);
});
