import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  RECIPE_TEXT_MAX, RECIPE_SERVINGS_MAX, NUTRIENT_KEYS,
  validateRecipeRequest, verifyRecipeResponse,
  type NutrientSet,
} from '../../../src/lib/recipeAnalysis.ts';

const n = (x: Partial<NutrientSet> = {}): NutrientSet => ({
  calories: 200, protein: 10, fat: 5, carbs: 30,
  fiber: 3, sugar: 1, sodium: 70, ...x,
});
const ingredient = (name: string, value: NutrientSet) => ({
  raw: '100 g ' + name, name, quantity: 100, unit: 'g',
  originalQuantity: 100, originalUnit: 'g', unitConverted: false,
  usedFood: name + ' USDA-like description', nutrients: value,
});
const base = () => {
  const first = n({calories: 100, protein: 4, fat: 1, carbs: 20,
    fiber: 2, sugar: 0, sodium: 50});
  const second = n({calories: 200, protein: 10, fat: 5, carbs: 30,
    fiber: 3, sugar: 1, sodium: 20});
  return {
    servings: 2, ingredients: [ingredient('rice', first), ingredient('beans',second)],
    unmatched: [] as {raw:string;name:string}[], notes: [] as string[],
    perRecipe: n({calories: 300, protein: 14, fat: 6, carbs: 50,
      fiber: 5, sugar: 1, sodium: 70}),
    perServing: n({calories: 150, protein: 7, fat: 3, carbs: 25,
      fiber: 2.5, sugar: 0.5, sodium: 35}),
  };
};
const read = (path:string) =>
  readFileSync(new URL('../../../' + path,import.meta.url),'utf8');

test('validates trimmed recipe length and preserves input without truncation', () => {
  assert.deepEqual(validateRecipeRequest({text:'  200 g chicken  ',servings:4}),
    {ok:true,value:{text:'200 g chicken',servings:4}});
  assert.equal(validateRecipeRequest({text:'abcde',servings:1}).ok,true);
  assert.equal(validateRecipeRequest({text:'x'.repeat(RECIPE_TEXT_MAX),servings:100}).ok,true);
  for(const text of ['', 'a', '  abc ', 'x'.repeat(RECIPE_TEXT_MAX+1), 5, null,undefined]){
    assert.equal(validateRecipeRequest({text,servings:4}).ok,false,String(text).slice(0,50));
  }
});

test('strict whole-number 1..100 servings; no Number(x)||1, clamp, or fractional silent rounding', () => {
  assert.equal(RECIPE_SERVINGS_MAX,100);
  for(const servings of [1,4,100])
    assert.equal(validateRecipeRequest({text:'100 g rice',servings}).ok,true);
  for(const servings of [0,-1,101,1.1,99.9,Infinity,-Infinity,NaN,'4',null,undefined])
    assert.equal(validateRecipeRequest({text:'100 g rice',servings}).ok,false,String(servings));
});

test('complete food matches reconcile per-100g ingredient subtotals and planned servings', () => {
  const v=verifyRecipeResponse(base(),2);
  assert.equal(v.perRecipe.calories,300);
  assert.equal(v.perServing.calories,150);
  assert.equal(v.perRecipe.protein,14);
  assert.equal(v.perServing.protein,7);
  assert.deepEqual(v.coverage.missingNutrients,[]);
  assert.equal(v.coverage.partial,false);
  assert.equal(v.ingredients.length,2);
  assert.equal(v.servings,2);
});

test('missing nutrient for one matched item masks CMS silent-zero totals', () => {
  const raw=base();
  raw.ingredients[1].nutrients.protein=null;
  raw.perRecipe.protein=4; // current CMS omits missing item in aggregation
  raw.perServing.protein=2;
  const r=verifyRecipeResponse(raw,2);
  assert.equal(r.perRecipe.protein,null);
  assert.equal(r.perServing.protein,null);
  assert.equal(r.perRecipe.calories,300);
  assert.deepEqual(r.coverage.missingNutrients,['protein']);
  assert.equal(r.coverage.partial,true);
});

test('missing energy 1008 cannot be misrepresented as 0 kcal', () => {
  const raw=base();
  raw.ingredients[0].nutrients.calories=null;
  raw.perRecipe.calories=200;
  raw.perServing.calories=100;
  const r=verifyRecipeResponse(raw,2);
  assert.equal(r.perRecipe.calories,null);
  assert.equal(r.perServing.calories,null);
  assert.ok(r.coverage.missingNutrients.includes('calories'));
});

test('all unknown nutrient values in matched foods must show unknown, not zero', () => {
  const raw=base();
  for(const i of raw.ingredients) i.nutrients.fiber=null;
  raw.perRecipe.fiber=0;
  raw.perServing.fiber=0;
  const r=verifyRecipeResponse(raw,2);
  assert.equal(r.perRecipe.fiber,null);
  assert.equal(r.perServing.fiber,null);
});

test('unmatched foods remain excluded and mark every visible subtotal partial', () => {
  const raw=base();
  raw.unmatched.push({raw:'a handful of unknown item',name:'unknown item'});
  const r=verifyRecipeResponse(raw,2);
  assert.equal(r.perRecipe.calories,300);
  assert.equal(r.coverage.partial,true);
  assert.equal(r.coverage.unmatchedCount,1);
  assert.equal(r.perServing.carbs,25);
});

test('zero matched ingredients must not be shown as a complete 0 kcal recipe', () => {
  const raw=base();
  raw.ingredients=[];
  raw.unmatched=[{raw:'unknown ingredient',name:'unknown'}];
  assert.throws(()=>verifyRecipeResponse(raw,2),/No ingredient has/);
});

test('reject contradictory per-recipe subtotals compared with visible matched foods', () => {
  const raw=base();
  raw.perRecipe.calories=400;
  assert.throws(()=>verifyRecipeResponse(raw,2),/Inconsistent/);
});

test('reject silently rounded or manipulated serving counts and per-serving mismatch', () => {
  const raw=base();
  raw.servings=4;
  assert.throws(()=>verifyRecipeResponse(raw,2),/Invalid recipe/);
  raw.servings=2;
  raw.perServing.calories=100;
  assert.throws(()=>verifyRecipeResponse(raw,2),/Inconsistent/);
});

test('accept realistic 0.1 precision rounding variance without inventing decimals', () => {
  const raw=base();
  raw.perRecipe.protein=14.1;
  raw.perServing.protein=7.1;
  assert.equal(verifyRecipeResponse(raw,2).perRecipe.protein,14.1);
});

test('negative, infinite, NaN and missing nutrients fail closed', () => {
  for(const invalid of [-1,Infinity,-Infinity,NaN,undefined,'200']){
    const raw=base() as unknown as Record<string,unknown>;
    (raw.perRecipe as Record<string,unknown>).calories=invalid;
    assert.throws(()=>verifyRecipeResponse(raw,2),/Invalid nutrient/);
  }
  assert.equal(NUTRIENT_KEYS.length,7);
});

test('invalid returned grams, quantities, matching name, units or converted flag fail closed', () => {
  for(const [field,value] of [
    ['quantity',0],['quantity',-2],['quantity',Infinity],
    ['unit','cups'],['usedFood',''],['unitConverted','yes'],
    ['originalQuantity',Infinity],['originalUnit',null],
  ] as const) {
    const raw=base() as unknown as Record<string,unknown>;
    ((raw.ingredients as Record<string,unknown>[])[0])[field]=value;
    assert.throws(()=>verifyRecipeResponse(raw,2),/Invalid ingredient/,field);
  }
});

test('missing or corrupt ingredient arrays/notes/unmatched data do not render results', () => {
  for(const field of ['ingredients','notes','unmatched'] as const) {
    const raw=base() as unknown as Record<string,unknown>;
    raw[field]='invalid';
    assert.throws(()=>verifyRecipeResponse(raw,2),/Invalid recipe/);
  }
  const raw=base();
  raw.unmatched.push({raw:5 as unknown as string,name:'wrong'});
  assert.throws(()=>verifyRecipeResponse(raw,2),/Invalid unmatched/);
});

test('USDA FDC IDs and data types are NOT fabricated from description strings', () => {
  const r=verifyRecipeResponse(base(),2);
  assert.equal(r.coverage.hasVerifiableFdcIds,false);
  assert.equal('fdcId' in r.ingredients[0],false);
  assert.equal('dataType' in r.ingredients[0],false);
});

test('client makes energy-based 4/4/9 macro percentages instead of gram fractions', () => {
  const ui=read('src/islands/RecipeAnalyzer.tsx');
  assert.match(ui,/const kcalP = protein \* 4/);
  assert.match(ui,/const kcalC = carbs \* 4/);
  assert.match(ui,/const kcalF = fat \* 9/);
  assert.match(ui,/verifyRecipeResponse\(data, input.value.servings\)/);
  assert.match(ui,/hasVerifiableFdcIds|does not supply\s+USDA FDC IDs/);
  assert.match(ui,/result.coverage.partial/);
});

test('UI validates input, alerts about sending recipe text and guards conversion', () => {
  const ui=read('src/islands/RecipeAnalyzer.tsx');
  assert.match(ui,/validateRecipeRequest\(\{ text, servings: Number\(servings\) \}\)/);
  assert.match(ui,/maxLength=\{RECIPE_TEXT_MAX\}/);
  assert.match(ui,/step="1"/);
  assert.match(ui,/third-party AI parsing provider/);
  assert.match(ui,/match/i);
  assert.doesNotMatch(ui,/setServings\(Number\(\(e.target as HTMLInputElement\).value\) \|\| 1\)/);
});

test('server proxy rejects invalid inputs before forwarding, never caches or exposes CMS errors', () => {
  const source=read('src/pages/api/analyze-recipe.ts');
  assert.match(source,/validateRecipeRequest\(body\)/);
  assert.match(source,/verifyRecipeResponse\(parsed, checked.value.servings\)/);
  assert.match(source,/Cache-Control': 'no-store'/);
  assert.match(source,/cache: 'no-store'/);
  assert.match(source,/!import.meta.env.PROD/);
  assert.doesNotMatch(source,/Math.max\(1, Math.min\(100/);
  assert.doesNotMatch(source,/text\.trim\(\)\.slice\(0, 5000\)/);
  assert.doesNotMatch(source,/console\.(log|warn|error)\(/);
  assert.doesNotMatch(source,/return new Response\(JSON\.stringify\(data\)/);
});

test('editorial and catalog disclaim exact source limitations, privacy and false accuracy claims', () => {
  const text=read('src/data/nutrition-content.ts');
  const a=text.indexOf("'recipe-nutrition-analyzer': {");
  assert.ok(a>0);
  const section=text.slice(a);
  assert.match(section,/third-party AI parser/);
  assert.match(section,/100 g × ingredient grams ÷ 100/);
  assert.match(section,/Foundation Foods/);
  assert.match(section,/1008/);
  assert.match(section,/2047 or 2048/);
  assert.match(section,/Unmatched foods are excluded/);
  assert.match(section,/https:\/\/fdc.nal.usda.gov\/api-guide\//);
  assert.match(section,/https:\/\/fdc.nal.usda.gov\/data-documentation\//);
  assert.match(section,/https:\/\/fdc.nal.usda.gov\/GBFPD_Documentation\//);
  assert.doesNotMatch(section,/within 10.?20% of lab-analyzed/);
  const catalog=read('src/data/tools.ts');
  assert.match(catalog,/USDA-matched recipe ingredients with portions, missing-data and privacy warnings/);
});
