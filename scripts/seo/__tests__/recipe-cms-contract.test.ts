// Cross-repository contract: frontend recipe proxy/verifier against the response of
// healthylifestyles-cms PR #76 (src/endpoints/analyzeRecipe.ts @ 5c02ca8).
// fixtures/recipe-cms-contract.json is the endpoint's REAL output for a fixed parser output
// and STUBBED USDA records (synthetic FDC IDs 900001-900003). It is a contract fixture,
// not live USDA validation. The CMS repository pins the same JSON in its endpoint test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  verifyRecipeResponse, upstreamFailure, preparationState, USDA_DATA_TYPES,
} from '../../../src/lib/recipeAnalysis.ts';

const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/recipe-cms-contract.json', import.meta.url), 'utf8'));
const read = (path: string) => readFileSync(new URL('../../../' + path, import.meta.url), 'utf8');

test('the CMS #76 response verifies and exposes validated USDA provenance', () => {
  const r = verifyRecipeResponse(fixture(), 2);
  assert.deepEqual(r.ingredients.map(i => i.provenance), [
    { fdcId: 900001, dataType: 'SR Legacy', matchConfidence: 'exact', fdcUrl: 'https://fdc.nal.usda.gov/food-details/900001/nutrients' },
    { fdcId: 900002, dataType: 'SR Legacy', matchConfidence: 'exact', fdcUrl: 'https://fdc.nal.usda.gov/food-details/900002/nutrients' },
    { fdcId: 900003, dataType: 'Foundation', matchConfidence: 'approx', fdcUrl: 'https://fdc.nal.usda.gov/food-details/900003/nutrients' },
  ]);
  assert.equal(r.coverage.hasVerifiableFdcIds, true);
  assert.equal(r.coverage.approximateCount, 1);
});

test('missing nutrients stay null end to end (never zero)', () => {
  const r = verifyRecipeResponse(fixture(), 2);
  assert.equal(r.perRecipe.sugar, null);
  assert.equal(r.perServing.sugar, null);
  assert.deepEqual(r.coverage.missingNutrients, ['sugar']);
  assert.equal(r.perRecipe.calories, 528.3);
  assert.equal(r.perServing.calories, 264.2);
});

test('unmatched ingredients make the result an explicit partial subtotal', () => {
  const r = verifyRecipeResponse(fixture(), 2);
  assert.equal(r.coverage.partial, true);
  assert.equal(r.coverage.unmatchedCount, 1);
  assert.deepEqual(r.unmatched, [{ raw: 'a pinch of saffron', name: 'saffron' }]);
  assert.ok(r.notes.some(n => /not a complete recipe total/.test(n)));
});

test('raw/cooked: consistent, unspecified and contradictory states', () => {
  const r = verifyRecipeResponse(fixture(), 2);
  assert.deepEqual(r.ingredients[0].preparation, { requested: 'raw', matched: 'raw', status: 'consistent' });
  assert.deepEqual(r.ingredients[1].preparation, { requested: null, matched: null, status: 'unknown' });
  assert.deepEqual(r.ingredients[2].preparation, { requested: null, matched: 'raw', status: 'unspecified' });
  assert.equal(r.coverage.unspecifiedPreparationCount, 1);
  // The CMS never matches an explicit state to the opposite one; if it ever did, fail closed.
  for (const [raw, usedFood] of [
    ['100 g white rice (raw)', 'Rice, white, long-grain, regular, cooked'],
    ['150 g cooked rice', 'Rice, white, long-grain, regular, raw, enriched'],
    ['100 g raw cooked rice', 'Rice, white, raw'],
    ['100 g white rice (raw)', 'Rice, white, raw or cooked, mixed'],
  ]) {
    const bad = fixture();
    Object.assign(bad.ingredients[0], { raw, usedFood });
    assert.throws(() => verifyRecipeResponse(bad, 2), /Invalid ingredient/, raw + ' / ' + usedFood);
  }
  assert.equal(preparationState('Chicken, broilers or fryers, breast, raw'), 'raw');
  assert.equal(preparationState('Egg, whole, cooked, fried'), 'cooked');
});

test('malformed or partial provenance fails closed; it is never inferred', () => {
  const cases: [string, (x: any) => void][] = [
    ['fdcId as string', x => { x.fdcId = '900001'; }],
    ['fdcId zero', x => { x.fdcId = 0; }],
    ['fdcId fractional', x => { x.fdcId = 1.5; }],
    ['fdcId unsafe', x => { x.fdcId = 2 ** 60; }],
    ['unknown data type', x => { x.dataType = 'Survey (FNDDS)'; }],
    ['confidence none', x => { x.matchConfidence = 'none'; }],
    ['confidence missing', x => { delete x.matchConfidence; }],
    ['dataType missing', x => { delete x.dataType; }],
  ];
  for (const [name, mutate] of cases) {
    const bad = fixture();
    mutate(bad.ingredients[1]);
    assert.throws(() => verifyRecipeResponse(bad, 2), /Invalid ingredient|provenance/, name);
  }
  const some = fixture();
  for (const k of ['fdcId', 'dataType', 'matchConfidence']) delete some.ingredients[2][k];
  assert.throws(() => verifyRecipeResponse(some, 2), /only some matched ingredients/);
  assert.deepEqual([...USDA_DATA_TYPES], ['SR Legacy', 'Foundation', 'Branded']);
});

test('an older CMS without provenance still works, clearly marked unverifiable', () => {
  const old = fixture();
  for (const i of old.ingredients) for (const k of ['fdcId', 'dataType', 'matchConfidence']) delete i[k];
  const r = verifyRecipeResponse(old, 2);
  assert.equal(r.coverage.hasVerifiableFdcIds, false);
  assert.ok(r.ingredients.every(i => i.provenance === null));
});

test('HTTP 422 (nothing matched) gets a fixed actionable message; bodies are never forwarded', () => {
  assert.deepEqual(upstreamFailure(422).status, 422);
  assert.match(upstreamFailure(422).error, /No ingredient could be matched.*no totals are shown/);
  assert.equal(upstreamFailure(429).status, 429);
  assert.equal(upstreamFailure(503).status, 503);
  assert.equal(upstreamFailure(400).status, 400);
  for (const s of [401, 403, 404, 413, 500, 502, 504]) assert.equal(upstreamFailure(s).status, 502, String(s));
  const proxy = read('src/pages/api/analyze-recipe.ts');
  assert.match(proxy, /upstreamFailure\(upstream\.status\)/);
  // A 422 body from the CMS is not even read before the fixed message is returned.
  assert.ok(proxy.indexOf('if (!upstream.ok)') < proxy.indexOf('await upstream.text()'));
});

test('the UI shows FDC ID, data type and an honest heuristic-confidence explanation', () => {
  const ui = read('src/islands/RecipeAnalyzer.tsx');
  assert.match(ui, /ing\.provenance\.fdcUrl/);
  assert.match(ui, /rel="noopener noreferrer"/);
  assert.match(ui, /USDA \{ing\.provenance\.dataType\}, FDC ID/);
  assert.match(ui, /Match confidence is a heuristic/);
  assert.match(ui, /Neither\s+confirms the same food, brand, cut or preparation/);
  assert.match(ui, /You did not state raw or cooked/);
  assert.match(ui, /does not\s+supply USDA FDC IDs/); // older-CMS wording retained
});
