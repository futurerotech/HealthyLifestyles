import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const island = readFileSync(new URL('../../../src/islands/SittingReversal.tsx', import.meta.url), 'utf8');
const content = readFileSync(new URL('../../../src/data/fitness-content.ts', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../../../src/data/tools.ts', import.meta.url), 'utf8');
const source = readFileSync(new URL('../../../src/lib/sitting.ts', import.meta.url), 'utf8');
const start = content.indexOf("'sitting-disease-reversal-calculator':");
const stop = content.indexOf("'strength-program-builder':", start);
assert.ok(start >= 0 && stop > start);
const sitting = content.slice(start, stop);

test('source explicitly identifies unvalidated planning heuristic and calorie overlap', () => {
  assert.match(source, /unvalidated heuristics/i);
  assert.match(source, /DOUBLE-COUNT activity/i);
  assert.doesNotMatch(source, /these habits keep you in a good place/);
});

test('visible interface never claims that it offsets sitting or reclaims calories', () => {
  assert.doesNotMatch(island, /to offset .* of sitting|calories reclaimed|kcal reclaimed|Reclaimed per day/i);
  assert.match(island, /GROSS MET energy estimates/i);
  assert.match(island, /double-count activity/i);
});

test('editorial content identifies the WHO evidence gap and does not assert an offset threshold', () => {
  assert.match(sitting, /WHO sedentary behaviour guidance/);
  assert.match(sitting, /no validated number of steps/i);
  assert.match(sitting, /gross energy and may double-count/i);
  assert.doesNotMatch(sitting, /A practical way to offset a sedentary day/i);
});

test('catalog clearly marks movement plan as nonvalidated', () => {
  const i = catalog.indexOf("slug: 'sitting-disease-reversal-calculator'");
  assert.ok(i >= 0);
  assert.match(catalog.slice(i, i + 440), /not a validated way to reverse health risks/i);
});
