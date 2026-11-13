import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise the ORIGINAL production pure module; do not mirror its math.
const lib = readFileSync(new URL('../../../src/lib/walk-it-off.ts', import.meta.url), 'utf8');
const island = readFileSync(new URL('../../../src/islands/WalkItOff.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('../../../src/data/fitness-content.ts', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../../src/styles/walk-it-off.css', import.meta.url), 'utf8');
const js = ts.transpileModule(lib, { compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS} }).outputText;
const c = { exports: {}, Number, String, Math };
runInNewContext(js, c);
const { minutesToBurn, parseAmount, FOODS, ACTIVITIES } = c.exports;
const round = (x) => Math.round(x);

test('published 285 kcal / 70kg original example stays 64,25,33 gross minutes', () => {
  assert.equal(round(minutesToBurn(285, 3.8, 70)), 64);
  assert.equal(round(minutesToBurn(285, 9.8, 70)), 25);
  assert.equal(round(minutesToBurn(285, 7.5, 70)), 33);
  assert.equal(ACTIVITIES.length, 3);
  assert.equal(ACTIVITIES[0].met, 3.8);
  assert.equal(ACTIVITIES[1].met, 9.8);
  assert.equal(ACTIVITIES[2].met, 7.5);
});
test('original default burger 563kcal / 70kg stays 127,49,64 minutes', () => {
  assert.equal(FOODS[0].kcal, 563);
  assert.equal(round(minutesToBurn(563, 3.8, 70)), 127);
  assert.equal(round(minutesToBurn(563, 9.8, 70)), 49);
  assert.equal(round(minutesToBurn(563, 7.5, 70)), 64);
});
test('invalid weight, negative calorie, MET and nonfinite values fail closed', () => {
  for (const args of [
    [285,3.8,0], [285,3.8,-1], [-1,3.8,70], [285,0,70],
    [285,-1,70], [Infinity,3.8,70], [285,NaN,70],
    [285,3.8,Infinity], [1e308,1e-300,1e-300],
  ]) assert.ok(Number.isNaN(minutesToBurn(...args)), 'Invalid input must not return minutes');
  assert.equal(minutesToBurn(0,3.8,70),0);
  assert.ok(minutesToBurn(3000,3.8,70)>0);
});
test('custom 0–3000 kcal and selected-unit weight >=1 parse without silent fallback', () => {
  assert.equal(parseAmount('70.25',1),70.25);
  assert.equal(parseAmount('1',1),1);
  assert.equal(parseAmount('0',0,3000),0);
  assert.equal(parseAmount('3000',0,3000),3000);
  assert.equal(parseAmount('0.5',0,3000),0.5);
  for(const value of ['', '  ', 'x', '2garbage', '-1', '1e500', 'Infinity', 'NaN']) {
    assert.equal(parseAmount(value,1),null);
  }
  assert.equal(parseAmount('0',1),null);
  assert.equal(parseAmount('3000.1',0,3000),null);
});
test('original UI retains exact kg and user text across display-only unit rounding', () => {
  assert.match(island,/const \[weightKg, setWeightKg\] = useState<number \| null>\(70\)/);
  assert.match(island,/setWeight\(next === weightOrigin\.unit \? weightOrigin\.text : displayWeight\(weightKg, next\)\)/);
  assert.match(island,/setWeightKg\(entered === null \? null : units === 'kg' \? entered : entered \/ LB\)/);
  assert.match(island,/setWeightOrigin\(\{ unit: units, text: raw \}\)/);
  assert.match(island,/if \(invalidMessage\) return/);
  assert.match(island,/disabled=\{!!invalidMessage\}/);
  const kg = 70.25, conversion = 2.20462;
  const shown = Number((kg * conversion).toFixed(1));
  assert.notEqual(shown/conversion,kg);
});
test('UI and original tool-page copy are clear on gross MET and no food debt', () => {
  assert.match(island,/Illustrative gross-energy activity durations/);
  assert.match(island,/Gross includes resting energy/);
  assert.match(island,/Food never needs to be earned/);
  assert.match(island,/role="alert"/);
  assert.doesNotMatch(island,/Tag a friend who needs to see this/);
  assert.match(css,/\.wo__wt input \{ flex: 1; min-width: 0; \}/);
  const begin = page.indexOf("  'walk-it-off-calculator': {");
  const end = page.indexOf('\n  // ============================================================',begin+10);
  const p = page.slice(begin,end);
  assert.match(p,/Gross includes the energy that would also be spent at rest/);
  assert.match(p,/https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/38242596\//);
  assert.match(p,/https:\/\/www\.cdc\.gov\/physical-activity-basics\/measuring\//);
});
