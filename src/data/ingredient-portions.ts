/**
 * Typical per-serving amounts for the meal-plan grocery list (Phase 5 Candidate 1).
 *
 * These are planning estimates for one serving of a recipe that uses the ingredient:
 * not weighed recipe values, and not nutrition data (recipe macros live in recipes.ts).
 * Amounts are edible weights: raw produce after trimming, canned beans drained, and
 * lentils as a dry weight. Grocery costs convert them to purchased weight with the USDA
 * ERS preparation yield (see ers-price-snapshot.ts).
 * `price` names a current BLS item (plain key) or a USDA ERS item (`ers.` prefix), but
 * only where it is the same food in the same form. Ambiguous ingredients, such as a bell
 * pepper of unknown color, "berries", "mixed vegetables" or corn of unknown form, are
 * left unpriced and never guessed.
 */
import type { PriceKey } from '../lib/grocery-cost';

export type PortionUnit = 'g' | 'ml' | 'each';
export interface Portion { amount: number; unit: PortionUnit; price?: PriceKey }

const g = (amount: number, price?: PriceKey): Portion => ({ amount, unit: 'g', price });
const ml = (amount: number, price?: PriceKey): Portion => ({ amount, unit: 'ml', price });
const each = (amount: number, price?: PriceKey): Portion => ({ amount, unit: 'each', price });

export const PORTIONS: Record<string, Portion> = {
  // Avocado: half of a 136 g edible California avocado (USDA FoodData Central portion weight).
  'almond milk': ml(240), almonds: g(28), apple: g(180, 'ers.apples'), asparagus: g(100, 'ers.asparagus'), avocado: g(68, 'ers.avocados'),
  'baking powder': g(2), banana: g(118, 'bananas'), basil: g(3), 'beef mince': g(120, 'groundBeef'), 'beef strips': g(120),
  'bell pepper': g(75), 'bell peppers': g(75), berries: g(75), 'black beans': g(90, 'ers.blackBeansCanned'), 'blue cheese': g(20),
  breadcrumbs: g(15), broccoli: g(90, 'ers.broccoli'), 'brown rice': g(60), 'bulgur wheat': g(60), butter: g(10, 'butter'),
  'cabbage slaw': g(70), 'caesar dressing': ml(20), 'canned tuna': g(100), capers: g(8), carrot: g(60, 'ers.carrots'),
  cheddar: g(30, 'cheddar'), cheese: g(30), 'cherry tomato': g(80, 'ers.cherryTomatoes'), 'chia seeds': g(20), chicken: g(130, 'chickenBreast'),
  'chicken breast': g(130, 'chickenBreast'), 'chicken thighs': g(130), chickpeas: g(90), 'chili flakes': g(1), ciabatta: g(60),
  'coconut milk': ml(60), 'coconut yogurt': g(125), cod: g(140), corn: g(70), 'corn tortillas': each(2), 'cottage cheese': g(110),
  crackers: g(25), 'cream cheese': g(25), croutons: g(10), cucumber: g(80, 'ers.cucumber'), 'curry spices': g(4), 'dark chocolate': g(20),
  edamame: g(75), egg: each(1, 'eggs'), 'egg noodles': g(70), eggplant: g(120), eggs: each(2, 'eggs'), falafel: g(100), feta: g(30),
  'firm tofu': g(120), garlic: g(5), granola: g(40), 'greek yogurt': g(170), 'green beans': g(90, 'ers.greenBeans'), greens: g(40), halloumi: g(60),
  honey: g(10), hummus: g(40), kale: g(40, 'ers.kale'), 'kidney beans': g(90, 'ers.kidneyBeansCanned'), lemon: g(30, 'lemons'), lentils: g(60, 'ers.lentilsDry'), lettuce: g(50, 'lettuce'),
  lime: g(30), 'maple syrup': ml(15), mayonnaise: g(14), milk: ml(240, 'milk'), 'mixed berries': g(75), 'mixed greens': g(40),
  'mixed nuts': g(28), 'mixed vegetables': g(100), mozzarella: g(30), mushrooms: g(70, 'ers.mushrooms'), nuts: g(28), oats: g(50), 'olive oil': ml(10),
  olives: g(20, 'ers.olives'), onion: g(50, 'ers.onions'), parmesan: g(10), parsley: g(4), pasta: g(85, 'pasta'), 'peanut butter': g(32),
  'peanut sauce': g(30), pineapple: g(80, 'ers.pineapple'), 'plant milk': ml(240), 'pork chop': g(150, 'porkChops'), potato: g(170, 'potatoes'),
  'pumpkin seeds': g(15), quinoa: g(60), raisins: g(20, 'ers.raisins'), 'red lentils': g(60, 'ers.lentilsDry'), 'red onion': g(40), rice: g(60, 'rice'),
  'rice cakes': each(2), 'rice noodles': g(70), 'rolled oats': g(50), romaine: g(60, 'romaine'), 'rye bread': g(60), salmon: g(140),
  'salmon fillet': g(140), salsa: g(40), 'sea salt': g(1), seeds: g(15), shrimp: g(120), 'smoked salmon': g(60), 'soy sauce': ml(10),
  spaghetti: g(85, 'pasta'), spinach: g(40, 'ers.spinachRaw'), steak: g(150, 'sirloin'), 'sushi rice': g(60), 'sweet potato': g(150, 'ers.sweetPotatoes'), sweetcorn: g(70),
  tahini: g(15), 'tikka spices': g(4), tofu: g(120), tomato: g(100, 'tomatoes'), 'tomato sauce': g(80), 'turkey bacon': g(30),
  'turkey breast': g(120), 'turkey mince': g(120), 'turkey slices': g(60), turmeric: g(1), 'whey protein': g(30), 'white fish': g(140),
  'whole-grain bread': g(60), 'whole-wheat tortilla': each(1), yogurt: g(170, 'yogurt'), zucchini: g(100, 'ers.zucchini'),
};
