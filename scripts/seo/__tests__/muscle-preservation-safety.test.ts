// Muscle preservation: protein targets assume healthy kidneys; say so, always.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ui = readFileSync(new URL('../../../src/islands/MusclePreservation.tsx', import.meta.url), 'utf8');
const copy = readFileSync(new URL('../../../src/data/nutrition-content.ts', import.meta.url), 'utf8')
  .split("'muscle-preservation-calculator': {")[1].split("\n  '")[0];

test('kidney caution is always rendered with the protein target, not behind a condition', () => {
  const i = ui.indexOf('class="mp__kidney"');
  assert.ok(i > 0);
  const before = ui.slice(Math.max(0, i - 200), i);
  assert.doesNotMatch(before, /&&\s*\(\s*$/);
  assert.match(ui, /Kidney disease, or told to limit protein\?/);
  assert.match(ui, /assume healthy kidneys/);
});

test('page notice states the kidney limitation', () => {
  assert.match(copy, /kidney disease or have been told to limit protein/);
});

test('weight input uses the site bounds in both units (25–350 kg / 55–770 lb)', () => {
  assert.match(ui, /min=\{units === 'kg' \? 25 : 55\} max=\{units === 'kg' \? 350 : 770\} value=\{weight\}/);
});
