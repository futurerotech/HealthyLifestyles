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

const { MEDICAL_SCORE_SLUGS, EDUCATIONAL_ACTIVITY_SLUGS } = await import('../../../src/lib/tool-copy-safety.ts');

test('custom risk and metabolic index tools cannot claim external validation', () => {
  const layout = source('src/components/ToolPageLayout.astro');
  for (const slug of ['heart-disease-risk-calculator','diabetes-risk-calculator','waist-health-risk-calculator','metabolic-age-calculator']) {
    assert.ok(MEDICAL_SCORE_SLUGS.has(slug), slug);
  }
  assert.match(layout, /not a CDC\/WHO-endorsed clinical risk classification/);
  assert.match(layout, /const resultAuthority = MEDICAL_SCORE_SLUGS\.has\(tool\.slug\)/);
});

test('page copy and SEO precedence go through the one tested policy module', () => {
  const layout = source('src/components/ToolPageLayout.astro');
  assert.match(layout, /import \{ MEDICAL_SCORE_SLUGS, resolveToolPagePresentation \} from '\.\.\/lib\/tool-copy-safety'/);
  assert.match(layout, /resolveToolPagePresentation\(tool\.slug, Astro\.props\.content, tool\.cmsContent, tool\.seo\)/);
  assert.match(layout, /seo=\{seo\}/);
  // No second, hand-maintained slug list in the layout.
  assert.doesNotMatch(layout, /new Set\(\[\s*'[a-z0-9-]+-(calculator|score)'/);
});

test('the score and activity slug sets are disjoint, deduplicated and include Healthspan', () => {
  const score = [...MEDICAL_SCORE_SLUGS], activity = [...EDUCATIONAL_ACTIVITY_SLUGS];
  assert.equal(score.length, 5);
  assert.ok(MEDICAL_SCORE_SLUGS.has('healthspan-score'));
  assert.equal(score.filter((x) => EDUCATIONAL_ACTIVITY_SLUGS.has(x)).length, 0);
  assert.equal(new Set(activity).size, activity.length);
});

test('Healthspan page copy keeps its lifespan, alcohol-guidance and comparability limits', () => {
  const content = source('src/data/risk-content.ts');
  const start = content.indexOf("'healthspan-score': {");
  const end = content.indexOf("'lifestyle-age-test': {", start);
  assert.ok(start >= 0 && end > start);
  const healthspan = content.slice(start, end);
  assert.match(healthspan, /not a prediction of your lifespan/i);
  assert.match(healthspan, /not official Dietary Guidelines limits/i);
  assert.match(healthspan, /not directly comparable/i);
});
