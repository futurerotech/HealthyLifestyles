/**
 * P15-P6 — empty-shell detector proof. Run: node --test scripts/seo/__tests__/empty-shell.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessShell, extractMeaningful, contentHash, MIN_MEANINGFUL_CHARS } from '../lib/empty-shell.ts';

const wrap = (locale: string, body: string) =>
  `<!doctype html><html lang="${locale}"><head><link rel="canonical" href="https://x/${locale}/a"><link rel="alternate" hreflang="en" href="https://x/a"></head><body><header><nav>Home Tools Wellness Hub</nav></header><main id="main"><article>${body}</article></main><footer>© site</footer></body></html>`;

const ENGLISH_BODY =
  '<h1>How many calories to lose weight</h1><p>Weight loss comes down to a calorie deficit. This guide shows how to set a daily number from your own body and activity in three clear evidence-based steps that stay safe and sustainable over time.</p>';
const SPANISH_BODY =
  '<h1>Cuántas calorías para perder peso</h1><p>La pérdida de peso se reduce a un déficit calórico. Esta guía muestra cómo establecer un número diario a partir de tu propio cuerpo y actividad en tres pasos claros basados en evidencia que se mantienen seguros.</p>';

test('meaningful extraction ignores chrome, nav, attributes, URLs, and metadata', () => {
  const a = extractMeaningful(wrap('en', ENGLISH_BODY));
  assert.ok(!a.includes('hreflang'));
  assert.ok(!a.includes('canonical'));
  assert.ok(!a.includes('home tools wellness hub')); // nav stripped
  assert.ok(a.includes('calorie deficit'));
});

test('genuine translation → NOT a shell (different meaningful hash)', () => {
  const v = assessShell(wrap('es', SPANISH_BODY), wrap('en', ENGLISH_BODY));
  assert.equal(v.isShell, false);
});

test('English content copied under /es → SHELL (reproduces default locale)', () => {
  // Only chrome/lang/canonical/hreflang differ — the article body is identical.
  const v = assessShell(wrap('es', ENGLISH_BODY), wrap('en', ENGLISH_BODY));
  assert.equal(v.isShell, true);
  assert.equal(v.reason, 'reproduces-default-locale');
});

test('near-empty localized page → SHELL (placeholder-or-empty)', () => {
  const v = assessShell(wrap('ar', '<h1>عنوان</h1>'), wrap('en', ENGLISH_BODY));
  assert.equal(v.isShell, true);
  assert.equal(v.reason, 'placeholder-or-empty');
  assert.ok(v.chars < MIN_MEANINGFUL_CHARS);
});

test('hash is deterministic and differs across languages', () => {
  assert.equal(contentHash('abc'), contentHash('abc'));
  assert.notEqual(contentHash(extractMeaningful(ENGLISH_BODY)), contentHash(extractMeaningful(SPANISH_BODY)));
});
