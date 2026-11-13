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
  assert.match(layout, /medicalSafetyOverrideSlugs\.has\(tool\.slug\)/);
});

test('only verified educational-risk tools use source SEO while other tools retain CMS precedence', () => {
  const layout = source('src/components/ToolPageLayout.astro');
  assert.match(layout, /const medicalSafetyOverrideSlugs = new Set\(\[/);
  assert.match(layout, /seoTitle: medicalSafetyOverrideSlugs\.has\(tool\.slug\)/);
  assert.match(layout, /metaDescription: medicalSafetyOverrideSlugs\.has\(tool\.slug\)/);
  assert.match(layout, /tool\.seo\?\.metaTitle \|\| Astro\.props\.content\.seoTitle/);
  assert.match(layout, /tool\.seo\?\.metaDescription \|\| Astro\.props\.content\.metaDescription/);
});

test('the clinical disclaimer and SEO override use one identical audited slug set', () => {
  const layout = source('src/components/ToolPageLayout.astro');
  assert.match(layout, /const resultAuthority = medicalSafetyOverrideSlugs\.has\(tool\.slug\)/);
  assert.equal((layout.match(/medicalSafetyOverrideSlugs = new Set/g) ?? []).length, 1);
});


test('Healthspan source SEO overrides the older CMS metadata without changing other tool precedence', () => {
  const layout = source('src/components/ToolPageLayout.astro');
  const set = layout.match(/const medicalSafetyOverrideSlugs = new Set\\(\\[([\\s\\S]*?)\\]\\);/);
  assert.ok(set, 'single scoped SEO override list must exist');
  const slugs = [...set[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.equal(slugs.length, 5);
  assert.equal(new Set(slugs).size, 5);
  assert.ok(slugs.includes('healthspan-score'));
  const content = source('src/data/risk-content.ts');
  const start = content.indexOf("'healthspan-score': {");
  const end = content.indexOf("'lifestyle-age-test': {", start);
  const healthspan = content.slice(start, end);
  assert.match(healthspan, /not a prediction of your lifespan/i);
  assert.match(healthspan, /not official Dietary Guidelines limits/i);
  assert.match(healthspan, /not directly comparable/i);
});
