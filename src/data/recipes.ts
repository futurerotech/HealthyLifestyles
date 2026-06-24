/**
 * Curated, tagged food/recipe database for the 7-Day Meal Plan Generator.
 * Each entry has per-serving macros, the meal slots it suits, the diet styles
 * it satisfies, allergen tags, and a simple ingredient list for the grocery
 * list. The fitting algorithm (src/lib/mealplan.ts) scales servings to hit
 * calorie targets and picks combinations that approach the macro targets.
 *
 * Macros are realistic per-serving estimates for general planning — not lab
 * values. "omnivore" needs no tag (omnivores eat everything); a recipe lists
 * only the restricted diets it still satisfies. vegan recipes are also tagged
 * vegetarian. Halal entries assume halal-sourced meat; pork is never halal.
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Diet = 'vegetarian' | 'vegan' | 'keto' | 'mediterranean' | 'halal';
export type Allergen = 'dairy' | 'gluten' | 'nuts' | 'shellfish' | 'egg' | 'soy' | 'fish';

export interface Recipe {
  id: string;
  name: string;
  meals: MealType[];
  /** Per-serving macros. */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  diets: Diet[];
  allergens: Allergen[];
  ingredients: string[];
}

export const RECIPES: Recipe[] = [
  // ---------------- Breakfasts ----------------
  { id: 'oats-banana-pb', name: 'Oatmeal with banana & peanut butter', meals: ['breakfast'], kcal: 420, protein: 15, carbs: 60, fat: 14, diets: ['vegetarian', 'vegan'], allergens: ['nuts'], ingredients: ['rolled oats', 'banana', 'peanut butter', 'plant milk'] },
  { id: 'greek-yogurt-berries', name: 'Greek yogurt, berries & honey', meals: ['breakfast', 'snack'], kcal: 260, protein: 20, carbs: 34, fat: 5, diets: ['vegetarian', 'mediterranean', 'halal'], allergens: ['dairy'], ingredients: ['greek yogurt', 'mixed berries', 'honey'] },
  { id: 'scrambled-eggs-avocado', name: 'Scrambled eggs with avocado', meals: ['breakfast'], kcal: 400, protein: 20, carbs: 8, fat: 32, diets: ['vegetarian', 'keto', 'mediterranean', 'halal'], allergens: ['egg'], ingredients: ['eggs', 'avocado', 'olive oil', 'spinach'] },
  { id: 'tofu-scramble', name: 'Tofu veggie scramble', meals: ['breakfast'], kcal: 320, protein: 22, carbs: 14, fat: 20, diets: ['vegetarian', 'vegan', 'halal'], allergens: ['soy'], ingredients: ['firm tofu', 'bell pepper', 'onion', 'turmeric', 'spinach'] },
  { id: 'berry-protein-smoothie', name: 'Berry protein smoothie', meals: ['breakfast', 'snack'], kcal: 300, protein: 30, carbs: 30, fat: 6, diets: ['vegetarian', 'halal'], allergens: ['dairy'], ingredients: ['whey protein', 'banana', 'mixed berries', 'milk'] },
  { id: 'avocado-toast-egg', name: 'Avocado toast with poached egg', meals: ['breakfast'], kcal: 380, protein: 16, carbs: 34, fat: 20, diets: ['vegetarian', 'mediterranean', 'halal'], allergens: ['egg', 'gluten'], ingredients: ['whole-grain bread', 'avocado', 'eggs', 'chili flakes'] },
  { id: 'chia-pudding', name: 'Overnight chia pudding', meals: ['breakfast', 'snack'], kcal: 340, protein: 12, carbs: 30, fat: 20, diets: ['vegetarian', 'vegan', 'mediterranean'], allergens: ['nuts'], ingredients: ['chia seeds', 'almond milk', 'maple syrup', 'berries'] },
  { id: 'cottage-cheese-bowl', name: 'Cottage cheese with fruit & seeds', meals: ['breakfast', 'snack'], kcal: 280, protein: 26, carbs: 22, fat: 8, diets: ['vegetarian', 'halal'], allergens: ['dairy'], ingredients: ['cottage cheese', 'pineapple', 'pumpkin seeds'] },
  { id: 'keto-omelette', name: 'Cheese & spinach omelette', meals: ['breakfast'], kcal: 380, protein: 24, carbs: 4, fat: 30, diets: ['vegetarian', 'keto', 'halal'], allergens: ['egg', 'dairy'], ingredients: ['eggs', 'cheddar', 'spinach', 'butter'] },
  { id: 'eggs-turkey-bacon', name: 'Eggs with turkey bacon', meals: ['breakfast'], kcal: 350, protein: 28, carbs: 3, fat: 24, diets: ['keto', 'halal'], allergens: ['egg'], ingredients: ['eggs', 'turkey bacon', 'olive oil'] },
  { id: 'banana-oat-pancakes', name: 'Banana oat pancakes', meals: ['breakfast'], kcal: 360, protein: 14, carbs: 52, fat: 10, diets: ['vegetarian'], allergens: ['egg', 'gluten'], ingredients: ['oats', 'banana', 'eggs', 'baking powder'] },
  { id: 'smoked-salmon-rye', name: 'Smoked salmon on rye', meals: ['breakfast', 'lunch'], kcal: 360, protein: 24, carbs: 36, fat: 12, diets: ['mediterranean'], allergens: ['fish', 'gluten', 'dairy'], ingredients: ['rye bread', 'smoked salmon', 'cream cheese', 'capers'] },
  { id: 'shakshuka', name: 'Shakshuka (eggs in tomato sauce)', meals: ['breakfast', 'dinner'], kcal: 300, protein: 16, carbs: 18, fat: 18, diets: ['vegetarian', 'mediterranean', 'halal'], allergens: ['egg'], ingredients: ['eggs', 'tomato', 'bell pepper', 'onion', 'olive oil'] },
  { id: 'high-protein-oats', name: 'High-protein overnight oats', meals: ['breakfast'], kcal: 400, protein: 30, carbs: 45, fat: 12, diets: ['vegetarian', 'halal'], allergens: ['dairy', 'nuts'], ingredients: ['oats', 'whey protein', 'peanut butter', 'milk'] },
  { id: 'coconut-yogurt-granola', name: 'Coconut yogurt with granola & fruit', meals: ['breakfast', 'snack'], kcal: 330, protein: 8, carbs: 48, fat: 13, diets: ['vegetarian', 'vegan'], allergens: ['gluten', 'nuts'], ingredients: ['coconut yogurt', 'granola', 'banana', 'almonds'] },

  // ---------------- Lunches ----------------
  { id: 'chicken-rice-bowl', name: 'Grilled chicken & rice bowl', meals: ['lunch', 'dinner'], kcal: 520, protein: 40, carbs: 55, fat: 14, diets: ['mediterranean', 'halal'], allergens: [], ingredients: ['chicken breast', 'brown rice', 'broccoli', 'olive oil'] },
  { id: 'chickpea-salad', name: 'Mediterranean chickpea salad', meals: ['lunch'], kcal: 420, protein: 16, carbs: 48, fat: 18, diets: ['vegetarian', 'vegan', 'mediterranean', 'halal'], allergens: [], ingredients: ['chickpeas', 'cucumber', 'tomato', 'red onion', 'olive oil', 'lemon'] },
  { id: 'tuna-pasta-salad', name: 'Tuna pasta salad', meals: ['lunch'], kcal: 480, protein: 34, carbs: 52, fat: 12, diets: ['mediterranean'], allergens: ['fish', 'gluten'], ingredients: ['pasta', 'canned tuna', 'sweetcorn', 'olive oil'] },
  { id: 'lentil-soup', name: 'Hearty lentil soup with bread', meals: ['lunch', 'dinner'], kcal: 430, protein: 22, carbs: 60, fat: 9, diets: ['vegetarian', 'vegan', 'mediterranean', 'halal'], allergens: ['gluten'], ingredients: ['lentils', 'carrot', 'onion', 'whole-grain bread'] },
  { id: 'turkey-wrap', name: 'Turkey & salad wrap', meals: ['lunch'], kcal: 450, protein: 35, carbs: 40, fat: 16, diets: ['halal'], allergens: ['gluten'], ingredients: ['whole-wheat tortilla', 'turkey breast', 'lettuce', 'tomato', 'hummus'] },
  { id: 'salmon-quinoa', name: 'Salmon with quinoa & greens', meals: ['lunch', 'dinner'], kcal: 520, protein: 38, carbs: 38, fat: 22, diets: ['mediterranean'], allergens: ['fish'], ingredients: ['salmon fillet', 'quinoa', 'asparagus', 'olive oil'] },
  { id: 'falafel-bowl', name: 'Falafel & tabbouleh bowl', meals: ['lunch'], kcal: 480, protein: 18, carbs: 56, fat: 20, diets: ['vegetarian', 'vegan', 'mediterranean', 'halal'], allergens: ['gluten'], ingredients: ['falafel', 'bulgur wheat', 'parsley', 'tomato', 'tahini'] },
  { id: 'beef-stir-fry', name: 'Beef & veg stir-fry with rice', meals: ['lunch', 'dinner'], kcal: 560, protein: 40, carbs: 50, fat: 20, diets: ['halal'], allergens: ['soy'], ingredients: ['beef strips', 'mixed vegetables', 'rice', 'soy sauce'] },
  { id: 'caprese-sandwich', name: 'Caprese ciabatta sandwich', meals: ['lunch'], kcal: 470, protein: 20, carbs: 46, fat: 22, diets: ['vegetarian', 'mediterranean'], allergens: ['dairy', 'gluten'], ingredients: ['ciabatta', 'mozzarella', 'tomato', 'basil', 'olive oil'] },
  { id: 'buddha-bowl', name: 'Vegan Buddha bowl', meals: ['lunch', 'dinner'], kcal: 500, protein: 18, carbs: 62, fat: 20, diets: ['vegetarian', 'vegan', 'mediterranean', 'halal'], allergens: [], ingredients: ['sweet potato', 'chickpeas', 'kale', 'quinoa', 'tahini'] },
  { id: 'chicken-caesar', name: 'Chicken Caesar salad', meals: ['lunch'], kcal: 420, protein: 38, carbs: 12, fat: 24, diets: ['halal'], allergens: ['dairy', 'gluten', 'egg', 'fish'], ingredients: ['chicken breast', 'romaine', 'parmesan', 'croutons', 'caesar dressing'] },
  { id: 'egg-salad-sandwich', name: 'Egg salad sandwich', meals: ['lunch'], kcal: 430, protein: 20, carbs: 38, fat: 22, diets: ['vegetarian', 'halal'], allergens: ['egg', 'gluten', 'dairy'], ingredients: ['whole-grain bread', 'eggs', 'mayonnaise', 'lettuce'] },
  { id: 'salmon-poke', name: 'Salmon poke bowl', meals: ['lunch', 'dinner'], kcal: 520, protein: 34, carbs: 56, fat: 16, diets: [], allergens: ['fish', 'soy'], ingredients: ['sushi rice', 'salmon', 'edamame', 'avocado', 'soy sauce'] },
  { id: 'halloumi-salad', name: 'Grilled halloumi salad', meals: ['lunch'], kcal: 440, protein: 24, carbs: 20, fat: 30, diets: ['vegetarian', 'mediterranean', 'halal'], allergens: ['dairy'], ingredients: ['halloumi', 'mixed greens', 'cherry tomato', 'olive oil'] },
  { id: 'keto-chicken-avocado', name: 'Chicken & avocado salad', meals: ['lunch', 'dinner'], kcal: 480, protein: 40, carbs: 10, fat: 32, diets: ['keto', 'halal', 'mediterranean'], allergens: [], ingredients: ['chicken breast', 'avocado', 'mixed greens', 'olive oil'] },
  { id: 'keto-cobb-salad', name: 'Cobb salad', meals: ['lunch'], kcal: 520, protein: 38, carbs: 10, fat: 36, diets: ['keto', 'halal'], allergens: ['egg', 'dairy'], ingredients: ['chicken', 'turkey bacon', 'eggs', 'avocado', 'blue cheese', 'greens'] },
  { id: 'keto-salmon-salad', name: 'Salmon & avocado salad', meals: ['lunch'], kcal: 480, protein: 36, carbs: 8, fat: 32, diets: ['keto', 'mediterranean'], allergens: ['fish'], ingredients: ['salmon', 'mixed greens', 'avocado', 'olive oil'] },
  { id: 'tofu-peanut-noodles', name: 'Tofu peanut noodles', meals: ['lunch', 'dinner'], kcal: 520, protein: 24, carbs: 60, fat: 20, diets: ['vegetarian', 'vegan'], allergens: ['soy', 'nuts', 'gluten'], ingredients: ['rice noodles', 'tofu', 'peanut sauce', 'mixed vegetables'] },

  // ---------------- Dinners ----------------
  { id: 'baked-salmon-veg', name: 'Baked salmon with veg & potatoes', meals: ['dinner'], kcal: 560, protein: 40, carbs: 40, fat: 24, diets: ['mediterranean'], allergens: ['fish'], ingredients: ['salmon', 'potato', 'green beans', 'olive oil'] },
  { id: 'chicken-noodle-stir-fry', name: 'Chicken & veg noodle stir-fry', meals: ['dinner'], kcal: 540, protein: 42, carbs: 52, fat: 16, diets: ['halal'], allergens: ['soy', 'gluten', 'egg'], ingredients: ['chicken breast', 'egg noodles', 'mixed vegetables', 'soy sauce'] },
  { id: 'spaghetti-bolognese', name: 'Beef spaghetti bolognese', meals: ['dinner'], kcal: 600, protein: 35, carbs: 65, fat: 22, diets: ['halal'], allergens: ['gluten'], ingredients: ['spaghetti', 'beef mince', 'tomato sauce', 'onion'] },
  { id: 'veg-chili', name: 'Vegan three-bean chili with rice', meals: ['dinner', 'lunch'], kcal: 520, protein: 22, carbs: 78, fat: 10, diets: ['vegetarian', 'vegan', 'halal'], allergens: [], ingredients: ['kidney beans', 'black beans', 'tomato', 'rice', 'onion'] },
  { id: 'chicken-sweet-potato', name: 'Grilled chicken & sweet potato', meals: ['dinner'], kcal: 520, protein: 45, carbs: 45, fat: 16, diets: ['halal', 'mediterranean'], allergens: [], ingredients: ['chicken breast', 'sweet potato', 'broccoli', 'olive oil'] },
  { id: 'keto-steak-greens', name: 'Steak with buttered greens', meals: ['dinner'], kcal: 560, protein: 42, carbs: 8, fat: 40, diets: ['keto', 'halal'], allergens: ['dairy'], ingredients: ['steak', 'asparagus', 'butter', 'mushrooms'] },
  { id: 'keto-chicken-thighs', name: 'Roast chicken thighs & broccoli', meals: ['dinner'], kcal: 560, protein: 42, carbs: 6, fat: 40, diets: ['keto', 'halal'], allergens: [], ingredients: ['chicken thighs', 'broccoli', 'butter', 'olive oil'] },
  { id: 'keto-pork-chop', name: 'Pork chop with asparagus', meals: ['dinner'], kcal: 560, protein: 45, carbs: 4, fat: 40, diets: ['keto'], allergens: ['dairy'], ingredients: ['pork chop', 'asparagus', 'butter'] },
  { id: 'lentil-spinach-curry', name: 'Lentil & spinach curry with rice', meals: ['dinner'], kcal: 540, protein: 22, carbs: 80, fat: 12, diets: ['vegetarian', 'vegan', 'halal'], allergens: [], ingredients: ['red lentils', 'spinach', 'coconut milk', 'rice', 'curry spices'] },
  { id: 'fish-tacos', name: 'Fish tacos with slaw', meals: ['dinner'], kcal: 520, protein: 32, carbs: 52, fat: 18, diets: [], allergens: ['fish', 'gluten'], ingredients: ['white fish', 'corn tortillas', 'cabbage slaw', 'lime'] },
  { id: 'tofu-veg-curry', name: 'Tofu & vegetable curry with rice', meals: ['dinner'], kcal: 520, protein: 22, carbs: 68, fat: 16, diets: ['vegetarian', 'vegan', 'halal'], allergens: ['soy'], ingredients: ['tofu', 'mixed vegetables', 'coconut milk', 'rice'] },
  { id: 'shrimp-stir-fry', name: 'Garlic shrimp & veg stir-fry', meals: ['dinner'], kcal: 460, protein: 38, carbs: 40, fat: 14, diets: [], allergens: ['shellfish', 'soy'], ingredients: ['shrimp', 'mixed vegetables', 'rice', 'garlic'] },
  { id: 'stuffed-peppers', name: 'Quinoa-stuffed peppers', meals: ['dinner'], kcal: 480, protein: 20, carbs: 62, fat: 16, diets: ['vegetarian', 'vegan', 'mediterranean', 'halal'], allergens: [], ingredients: ['bell peppers', 'quinoa', 'black beans', 'tomato'] },
  { id: 'chicken-tikka-rice', name: 'Chicken tikka with rice', meals: ['dinner'], kcal: 580, protein: 45, carbs: 55, fat: 18, diets: ['halal'], allergens: ['dairy'], ingredients: ['chicken breast', 'yogurt', 'rice', 'tomato', 'tikka spices'] },
  { id: 'mediterranean-cod', name: 'Cod with tomatoes & olives', meals: ['dinner'], kcal: 460, protein: 40, carbs: 18, fat: 24, diets: ['mediterranean'], allergens: ['fish'], ingredients: ['cod', 'cherry tomato', 'olives', 'olive oil'] },
  { id: 'eggplant-parmesan', name: 'Baked eggplant parmesan', meals: ['dinner'], kcal: 520, protein: 22, carbs: 48, fat: 26, diets: ['vegetarian', 'mediterranean'], allergens: ['dairy', 'gluten', 'egg'], ingredients: ['eggplant', 'tomato sauce', 'mozzarella', 'breadcrumbs'] },
  { id: 'turkey-meatballs-zoodles', name: 'Turkey meatballs with zoodles', meals: ['dinner'], kcal: 440, protein: 40, carbs: 12, fat: 22, diets: ['keto', 'halal', 'mediterranean'], allergens: ['egg'], ingredients: ['turkey mince', 'zucchini', 'egg', 'tomato sauce'] },
  { id: 'burrito-bowl', name: 'Vegan burrito bowl', meals: ['dinner', 'lunch'], kcal: 560, protein: 22, carbs: 82, fat: 14, diets: ['vegetarian', 'vegan', 'halal'], allergens: [], ingredients: ['rice', 'black beans', 'corn', 'salsa', 'avocado'] },

  // ---------------- Snacks ----------------
  { id: 'apple-peanut-butter', name: 'Apple with peanut butter', meals: ['snack'], kcal: 200, protein: 6, carbs: 24, fat: 10, diets: ['vegetarian', 'vegan'], allergens: ['nuts'], ingredients: ['apple', 'peanut butter'] },
  { id: 'greek-yogurt-honey', name: 'Greek yogurt & honey', meals: ['snack'], kcal: 150, protein: 15, carbs: 18, fat: 2, diets: ['vegetarian', 'halal'], allergens: ['dairy'], ingredients: ['greek yogurt', 'honey'] },
  { id: 'protein-shake', name: 'Protein shake', meals: ['snack'], kcal: 160, protein: 30, carbs: 6, fat: 2, diets: ['vegetarian', 'halal'], allergens: ['dairy'], ingredients: ['whey protein', 'milk'] },
  { id: 'hummus-veg-sticks', name: 'Hummus with veggie sticks', meals: ['snack'], kcal: 180, protein: 6, carbs: 20, fat: 9, diets: ['vegetarian', 'vegan', 'mediterranean', 'halal'], allergens: [], ingredients: ['hummus', 'carrot', 'cucumber'] },
  { id: 'mixed-nuts', name: 'Handful of mixed nuts', meals: ['snack'], kcal: 200, protein: 6, carbs: 8, fat: 17, diets: ['vegetarian', 'vegan', 'keto', 'mediterranean', 'halal'], allergens: ['nuts'], ingredients: ['mixed nuts'] },
  { id: 'cheese-crackers', name: 'Cheese & crackers', meals: ['snack'], kcal: 220, protein: 9, carbs: 18, fat: 13, diets: ['vegetarian', 'halal'], allergens: ['dairy', 'gluten'], ingredients: ['cheddar', 'crackers'] },
  { id: 'boiled-eggs', name: 'Two boiled eggs', meals: ['snack'], kcal: 140, protein: 12, carbs: 1, fat: 10, diets: ['vegetarian', 'keto', 'mediterranean', 'halal'], allergens: ['egg'], ingredients: ['eggs'] },
  { id: 'edamame', name: 'Sea-salt edamame', meals: ['snack'], kcal: 150, protein: 13, carbs: 12, fat: 6, diets: ['vegetarian', 'vegan', 'halal'], allergens: ['soy'], ingredients: ['edamame', 'sea salt'] },
  { id: 'cottage-cheese-cucumber', name: 'Cottage cheese & cucumber', meals: ['snack'], kcal: 130, protein: 16, carbs: 6, fat: 4, diets: ['vegetarian', 'keto', 'halal'], allergens: ['dairy'], ingredients: ['cottage cheese', 'cucumber'] },
  { id: 'dark-choc-almonds', name: 'Dark chocolate & almonds', meals: ['snack'], kcal: 210, protein: 5, carbs: 16, fat: 15, diets: ['vegetarian', 'vegan', 'mediterranean', 'halal'], allergens: ['nuts'], ingredients: ['dark chocolate', 'almonds'] },
  { id: 'rice-cakes-pb', name: 'Rice cakes with peanut butter', meals: ['snack'], kcal: 190, protein: 7, carbs: 22, fat: 9, diets: ['vegetarian', 'vegan'], allergens: ['nuts'], ingredients: ['rice cakes', 'peanut butter'] },
  { id: 'banana-protein', name: 'Banana with protein shake', meals: ['snack'], kcal: 250, protein: 28, carbs: 30, fat: 3, diets: ['vegetarian', 'halal'], allergens: ['dairy'], ingredients: ['banana', 'whey protein'] },
  { id: 'olives-feta', name: 'Olives & feta', meals: ['snack'], kcal: 180, protein: 7, carbs: 4, fat: 16, diets: ['vegetarian', 'keto', 'mediterranean', 'halal'], allergens: ['dairy'], ingredients: ['olives', 'feta'] },
  { id: 'avocado-lime', name: 'Avocado with lime & salt', meals: ['snack'], kcal: 170, protein: 2, carbs: 9, fat: 15, diets: ['vegetarian', 'vegan', 'keto', 'mediterranean', 'halal'], allergens: [], ingredients: ['avocado', 'lime'] },
  { id: 'turkey-rollups', name: 'Turkey & cheese roll-ups', meals: ['snack'], kcal: 170, protein: 18, carbs: 3, fat: 9, diets: ['keto', 'halal'], allergens: ['dairy'], ingredients: ['turkey slices', 'cheese'] },
  { id: 'trail-mix', name: 'Trail mix', meals: ['snack'], kcal: 220, protein: 6, carbs: 22, fat: 13, diets: ['vegetarian', 'vegan', 'halal'], allergens: ['nuts'], ingredients: ['nuts', 'raisins', 'seeds'] },
];

/** Diet styles the UI offers (omnivore = no restriction). */
export const DIET_OPTIONS = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'halal', label: 'Halal' },
] as const;

/** Allergen toggles the UI offers. */
export const ALLERGEN_OPTIONS: { value: Allergen; label: string }[] = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'egg', label: 'Egg' },
  { value: 'soy', label: 'Soy' },
  { value: 'fish', label: 'Fish' },
];
