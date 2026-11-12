import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
    return next(specifier, context);
  },
});
const source = path => readFileSync(new URL('../../../' + path, import.meta.url), 'utf8');
const { renderInline } = await import('../../../src/lib/text.ts');

test('existing tool-page text renders scientific Markdown as clickable HTML', () => {
  const template = source('src/components/ToolPageLayout.astro');
  assert.match(template, /import \{ renderInline \} from '\.\.\/lib\/text'/);
  assert.match(template, /s\.paragraphs\?\.map\(\(p\) => <p set:html=\{renderInline\(p\)\} \/>/);
});

test('ordinary scientific sources are followable with safe new-tab rel', () => {
  const html = renderInline('Read [NICE recommendations](https://www.nice.org.uk/guidance/ng246/).');
  assert.match(html, /<a href="https:\/\/www\.nice\.org\.uk\/guidance\/ng246\/" target="_blank" rel="noopener noreferrer">NICE recommendations<\/a>/);
  assert.doesNotMatch(html, /nofollow/);
});

test('trusted inline renderer escapes HTML and rejects script protocols', () => {
  const html = renderInline('<script>alert("x")</script> [unsafe](javascript:alert)');
  assert.doesNotMatch(html, /<script>/i);
  assert.doesNotMatch(html, /href="javascript:/i);
  assert.match(html, /&lt;script&gt;/);
});

test('internal editorial links remain followable', () => {
  const html = renderInline('Read [BMR](/tools/bmr-calculator)');
  assert.match(html, /<a href="\/tools\/bmr-calculator">BMR<\/a>/);
  assert.doesNotMatch(html, /nofollow/);
});

test('custom risk and metabolic index tools cannot claim external validation', () => {
  const layout = source('src/components/ToolPageLayout.astro');
  for (const slug of ['heart-disease-risk-calculator','diabetes-risk-calculator','waist-health-risk-calculator','metabolic-age-calculator']) {
    assert.ok(layout.includes("'"+slug+"'"), slug);
  }
  assert.match(layout, /not a CDC\/WHO-endorsed clinical risk classification/);
  assert.match(layout, /customEducationalIndexTools\.has\(tool\.slug\)/);
});
