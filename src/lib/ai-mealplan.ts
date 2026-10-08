import { RECIPES, type Recipe } from '../data/recipes.ts';
import { filterPool, recomputeDay, withinTolerance, type MealPlan, type PlanInputs, type PlannedDay, type PlannedMeal } from './mealplan.ts';

/**
 * AI text is not an allergen database. When restrictions are selected, accept
 * only unchanged ingredient lists from a compatible, explicitly tagged recipe.
 * Unknown or modified recipes fall back to the local planner in the caller.
 * Recipe tags still do not establish brand-level or cross-contact safety.
 */
export function normalizeAiMealPlan(data: { days?: { meals?: any[] }[] }, inputs: PlanInputs, recipes: Recipe[] = RECIPES): MealPlan | null {
  if (!data || !Array.isArray(data.days) || data.days.length < 1) return null;
  const restricted = inputs.excludeAllergens.length > 0 || Boolean(inputs.excludeText.trim()) || inputs.diet !== 'omnivore';
  const compatible = restricted ? filterPool(recipes, inputs) : [];
  const normalizeIngredients = (items: string[]) => items.map((item) => item.trim().toLowerCase()).sort();
  const out: PlannedDay[] = [];
  for (const d of data.days.slice(0, 7)) {
    if (!Array.isArray(d.meals) || !d.meals.length) return null;
    const meals: PlannedMeal[] = [];
    for (const m of d.meals) {
      const ingredients = Array.isArray(m.ingredients) ? m.ingredients.map(String) : [];
      let recipeId = `ai-${out.length}-${meals.length}`;
      const type: PlannedMeal['type'] = ['breakfast', 'lunch', 'dinner', 'snack'].includes(m.type) ? m.type : 'lunch';
      if (restricted) {
        const recipe = compatible.find((candidate) => candidate.id === m.recipeId);
        if (!recipe || !recipe.meals.includes(type) || JSON.stringify(normalizeIngredients(ingredients)) !== JSON.stringify(normalizeIngredients(recipe.ingredients))) return null;
        const requestedServings = Number(m.servings);
        const servings = Number.isFinite(requestedServings) && requestedServings > 0
          ? Math.min(2, Math.max(0.5, requestedServings))
          : 1;
        meals.push({
          type,
          recipeId: recipe.id,
          name: recipe.name,
          servings,
          kcal: Math.round(recipe.kcal * servings),
          protein: Math.round(recipe.protein * servings * 10) / 10,
          carbs: Math.round(recipe.carbs * servings * 10) / 10,
          fat: Math.round(recipe.fat * servings * 10) / 10,
          ingredients: [...recipe.ingredients],
        });
        continue;
      }
      meals.push({
        type,
        recipeId,
        name: String(m.name || 'Meal'),
        servings: Number(m.servings) > 0 ? Number(m.servings) : 1,
        kcal: Math.round(Number(m.kcal ?? m.calories) || 0),
        protein: Number(m.protein) || 0,
        carbs: Number(m.carbs) || 0,
        fat: Number(m.fat) || 0,
        ingredients,
      });
    }
    out.push(recomputeDay(meals));
  }
  const okDays = out.filter((day) => withinTolerance(day, inputs.targets)).length;
  if (okDays < Math.ceil(out.length / 2)) return null;
  return { days: out, targets: inputs.targets, allWithinTolerance: okDays === out.length };
}
