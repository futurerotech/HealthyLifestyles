import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Executes the production scoring function used by QuizCalculator.tsx.
const { QUIZZES, scoreQuiz, PHQ9_ITEM9_MESSAGE } = await import('../../../src/islands/quizzes/quiz-defs.ts');
const ui = readFileSync(new URL('../../../src/islands/QuizCalculator.tsx', import.meta.url), 'utf8');

const PHQ9 = QUIZZES['phq-9-depression-screener'];
const GAD7 = QUIZZES['gad-7-anxiety-screener'];
const WHO5 = QUIZZES['who-5-wellbeing-screener'];

// Answers that sum to `total`, filling items in order; `pin` fixes given items first.
function answersFor(quiz, total, pin = {}) {
  const max = Math.max(...quiz.scale.map((o) => o.value));
  const a = quiz.questions.map((_, i) => (i in pin ? pin[i] : 0));
  let rest = total - a.reduce((x, y) => x + y, 0);
  for (let i = 0; i < a.length && rest > 0; i++) {
    if (i in pin) continue;
    const add = Math.min(max, rest); a[i] = add; rest -= add;
  }
  assert.equal(rest, 0, 'cannot build total ' + total);
  return a;
}
const label = (quiz, total, pin) => scoreQuiz(quiz, answersFor(quiz, total, pin)).band?.label;

test('PHQ-9: every total 0–27 gets the published severity band (Kroenke 2001)', () => {
  const expected = (s) => s <= 4 ? 'Minimal' : s <= 9 ? 'Mild' : s <= 14 ? 'Moderate' : s <= 19 ? 'Moderately severe' : 'Severe';
  for (let s = 0; s <= 27; s++) assert.equal(label(PHQ9, s), expected(s), 'PHQ-9 ' + s);
});

test('GAD-7: every total 0–21 gets the published band; a score of 4 is Minimal (was Mild)', () => {
  const expected = (s) => s <= 4 ? 'Minimal' : s <= 9 ? 'Mild' : s <= 14 ? 'Moderate' : 'Severe';
  for (let s = 0; s <= 21; s++) assert.equal(label(GAD7, s), expected(s), 'GAD-7 ' + s);
});

test('WHO-5: raw below 13 is poor well-being; 13 is not (was poor)', () => {
  for (let s = 0; s <= 25; s++) {
    // Spread answers evenly so the any-item rule does not decide the band test.
    const r = scoreQuiz(WHO5, answersFor(WHO5, s));
    assert.equal(r.band.label === 'Poor well-being', s <= 12, 'WHO-5 ' + s);
  }
  assert.equal(label(WHO5, 13), 'Moderate well-being');
  assert.match(WHO5.bands[0].summary, /below 13/);
});

test('PHQ-9 item 9: any answer above "Not at all" is flagged, whatever the total', () => {
  for (const v of [1, 2, 3]) {
    const r = scoreQuiz(PHQ9, answersFor(PHQ9, v, { 8: v }));
    assert.equal(r.band.label, 'Minimal');
    assert.equal(r.flags.length, 1);
    assert.equal(r.flags[0].tone, 'urgent');
    assert.equal(r.flags[0].message, PHQ9_ITEM9_MESSAGE);
  }
  assert.equal(scoreQuiz(PHQ9, answersFor(PHQ9, 20, { 8: 0 })).flags.length, 0);
  // Flagged as soon as item 9 is answered, even before the rest.
  const partial = PHQ9.questions.map((_, i) => (i === 8 ? 1 : null));
  const p = scoreQuiz(PHQ9, partial);
  assert.equal(p.band, undefined);
  assert.equal(p.flags.length, 1);
  assert.match(PHQ9_ITEM9_MESSAGE, /911 in the US or 112 in Europe/);
  assert.match(PHQ9_ITEM9_MESSAGE, /Whatever your total score/);
});

test('WHO-5: a 0 or 1 on any item is flagged for follow-up, even with a high total', () => {
  const r = scoreQuiz(WHO5, [5, 5, 5, 5, 1]);
  assert.equal(r.score, 21);
  assert.equal(r.band.label, 'Good well-being');
  assert.equal(r.flags.length, 1);
  assert.equal(r.flags[0].tone, 'info');
  assert.equal(scoreQuiz(WHO5, [2, 2, 2, 2, 2]).flags.length, 0);
});

test('validated screeners are scored only when every item is answered', () => {
  for (const q of [PHQ9, GAD7, WHO5]) {
    assert.equal(q.validated, true);
    const none = scoreQuiz(q, q.questions.map(() => null));
    assert.equal(none.band, undefined);
    assert.equal(none.answered, 0);
    const oneMissing = q.questions.map((_, i) => (i === 0 ? null : 0));
    assert.equal(scoreQuiz(q, oneMissing).band, undefined);
    assert.equal(scoreQuiz(q, q.questions.map(() => 0)).complete, true);
  }
});

test('wellness self-checks keep their previous percentage bands', () => {
  for (const slug of ['sleep-quality-check', 'stress-level-check', 'burnout-self-check']) {
    const q = QUIZZES[slug];
    assert.notEqual(q.validated, true, slug);
    const max = Math.max(...q.scale.map((o) => o.value)) * q.questions.length;
    for (let s = 0; s <= max; s++) {
      const pct = (s / max) * 100;
      const legacy = q.bands.find((b) => pct <= b.upToPct) ?? q.bands.at(-1);
      assert.equal(label(q, s), legacy.label, `${slug} ${s}`);
    }
  }
});

test('the island never pre-selects screener answers and shows flags before the score', () => {
  assert.match(ui, /quiz\.validated \? null : quiz\.scale\[mid\]\.value/);
  assert.ok(ui.indexOf('{flags.map(') < ui.indexOf('class="calc__headline"'));
  assert.match(ui, /role=\{f\.tone === 'urgent' \? 'alert' : undefined\}/);
  assert.match(ui, /\{quiz\.crisis && <p class="quiz__crisis">\{CRISIS\}<\/p>\}/);
  assert.match(ui, /\{band && \(\s*<ShareResult/);
  for (const n of ['988', '116 123', '13 11 14']) assert.ok(ui.includes(n), n);
});

test('page copy states the WHO-5 cut-off as below 13 and the PHQ-9 item 9 rule', () => {
  const copy = readFileSync(new URL('../../../src/data/mental-content.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(copy, /13 or below/);
  assert.match(copy, /below 13 \(12 or lower\)/);
  assert.match(copy, /to any single statement, whatever your total/);
  assert.match(copy, /regardless of your total score/);
});
