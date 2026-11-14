// Phase 2 audit of the remaining standalone tools: chronotype, sleep,
// breathing timer and recipe analyzer (behavior and claims in source).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p: string) => readFileSync(new URL('../../../' + p, import.meta.url), 'utf8');
const { computeChronotype, TYPES } = await import('../../../src/lib/chronotype.ts');

test('chronotype: tally and tie-break unchanged; framework attributed and not presented as research', () => {
  assert.equal(computeChronotype(['wolf', 'wolf', 'wolf', 'lion', 'bear', 'dolphin', 'wolf']), 'wolf');
  assert.equal(computeChronotype(['lion', 'lion', 'bear', 'bear', 'wolf', 'dolphin', 'wolf']), 'bear');
  const ui = read('src/islands/Chronotype.tsx');
  assert.doesNotMatch(ui, /% of people/);
  const copy = read('src/data/sleep-content.ts').split("'sleep-chronotype-quiz': {")[1].split("\n  '")[0];
  assert.match(copy, /popularized by sleep psychologist Michael Breus/);
  assert.match(copy, /has not been validated in research/);
  assert.match(copy, /Morningness–Eveningness Questionnaire/);
  assert.doesNotMatch(copy, /roughly half of people/);
  assert.match(TYPES.dolphin.description, /insomnia is common and treatable/);
});

test('sleep debt: blank or out-of-range entries are reported, not counted as 0 h', () => {
  const ui = read('src/islands/SleepCalculator.tsx');
  assert.match(ui, /const targetOk = inRange\(target, 4, 12\)/);
  assert.match(ui, /badNights = DAY_LABELS\.filter\(\(_, i\) => !inRange\(days\[i\], 0, 14\)\)/);
  assert.match(ui, /Enter hours slept between 0 and 14 for/);
  assert.doesNotMatch(ui, /add 1–2 extra hours per night/);
  assert.match(ui, /roughly 70–120 minutes/);
});

test('breathing timer: pause resumes, phase-only announcements, correct heading, safety note', () => {
  const ui = read('src/islands/BreathingTimer.tsx');
  assert.match(ui, /if \(!started\) setT/);
  assert.match(ui, /started \? 'Resume' : 'Start'/);
  assert.doesNotMatch(ui, /class="calc__result breathe" aria-live/);
  assert.match(ui, /<p class="sr-only" aria-live="polite">\{label\}<\/p>/);
  assert.match(ui, /breathe__count" aria-hidden="true"/);
  assert.match(ui, /technique === 'box' \? 'Box breathing' : '4-7-8 breathing'/);
  assert.match(ui, /heart or lung condition, skip the breath holds/);
});

test('recipe analyzer: no silent truncation; visitor address forwarded for per-visitor limits', () => {
  const api = read('src/pages/api/analyze-recipe.ts');
  assert.doesNotMatch(api, /\.slice\(0, 5000\)/);
  assert.match(api, /length > MAX_RECIPE_CHARS/);
  assert.match(api, /'X-Forwarded-For': visitor/);
  const ui = read('src/islands/RecipeAnalyzer.tsx');
  assert.match(ui, /aria-describedby="ra-text-count"/);
  assert.match(ui, /limit reached; longer text was cut off/);
});

test('article embeds render every tool engine the tool page renders (no silent drift)', () => {
  const engines = (p: string) => [...new Set([...read(p).matchAll(/engine === '([a-z-]+)'/g)].map((m) => m[1]))].sort();
  const all = [...new Set([...read('src/lib/toolEngine.ts').matchAll(/\| '([a-z-]+)'/g)].map((m) => m[1]))].sort();
  assert.deepEqual(engines('src/components/ToolEmbed.astro'), engines('src/components/ToolPageLayout.astro'));
  for (const e of all) assert.ok(engines('src/components/ToolEmbed.astro').includes(e), `engine ${e} not embeddable`);
});

test('article embeds pass the tool name, so share text is not "My Calculate your … result"', () => {
  assert.match(read('src/components/ToolEmbed.astro'), /<Calculator client:visible slug=\{tool\.slug\} toolName=\{tool\.title\} \/>/);
  assert.match(read('src/components/ToolPageLayout.astro'), /<Calculator client:visible slug=\{tool\.slug\} toolName=\{tool\.title\} \/>/);
});
