import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../../../' + p, import.meta.url), 'utf8');
const content = ['src/data/nutrition-content.ts', 'src/data/sleep-content.ts', 'src/islands/calculators/defs.ts'].map(read).join('\n');

test('citations verified as removed pages (2026-11-25) are not used', () => {
  // NIH ODS "Fiber-Consumer" returned File Not Found; CDC "sleep-hygiene" returned Page Not Found.
  assert.doesNotMatch(content, /ods\.od\.nih\.gov\/factsheets\/Fiber-Consumer/);
  assert.doesNotMatch(content, /cdc\.gov\/sleep\/about-sleep\/sleep-hygiene/);
});

test('gut-health fiber target matches its cited source (about 21–38 g/day by age and sex)', () => {
  assert.doesNotMatch(content, /25–35\s?g(rams)?(\/day| of fiber| fiber)/);
  assert.match(read('src/data/nutrition-content.ts'), /21–38 g a day depending on age and sex/);
  assert.match(read('src/data/nutrition-content.ts'), /in-depth\/fiber\/art-20043983/);
  assert.match(read('src/data/sleep-content.ts'), /https:\/\/www\.cdc\.gov\/sleep\/about\/index\.html/);
});
