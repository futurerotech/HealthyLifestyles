import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });

// A tool routed to an engine with no definition for it renders an empty
// calculator (the island returns null) while the page still looks complete.
const { TOOLS } = await import('../../../src/data/tools.ts');
const { getEngine } = await import('../../../src/lib/toolEngine.ts');
const { getDef } = await import('../../../src/islands/calculators/defs.ts');
const { QUIZZES } = await import('../../../src/islands/quizzes/quiz-defs.ts');

const live = TOOLS.filter((t) => t.live !== false);

test('every live numeric-engine tool has a calculator definition', () => {
  const missing = live.filter((t) => getEngine(t) === 'numeric' && !getDef(t.slug)).map((t) => t.slug);
  assert.deepEqual(missing, []);
});

test('every questionnaire is routed to the quiz engine, and every quiz-engine tool has a questionnaire', () => {
  for (const slug of Object.keys(QUIZZES)) {
    const tool = TOOLS.find((t) => t.slug === slug);
    assert.ok(tool, slug + ' has no tool record');
    assert.equal(getEngine(tool), 'quiz', slug);
  }
  for (const t of live.filter((t) => getEngine(t) === 'quiz')) assert.ok(QUIZZES[t.slug], t.slug);
});

test('the three validated screeners render the quiz island', () => {
  for (const slug of ['phq-9-depression-screener', 'gad-7-anxiety-screener', 'who-5-wellbeing-screener']) {
    assert.equal(getEngine(TOOLS.find((t) => t.slug === slug)), 'quiz', slug);
  }
});
