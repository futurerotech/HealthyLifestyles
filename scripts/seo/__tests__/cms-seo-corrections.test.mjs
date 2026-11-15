import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });

// The offline CMS SEO correction package (docs/content) must propose exactly the
// reviewed source metadata, and must never describe itself as applied.
const pkg = JSON.parse(readFileSync(new URL('../../../docs/content/cms-seo-corrections-20261114.json', import.meta.url), 'utf8'));
const dataDir = new URL('../../../src/data/', import.meta.url);
const source = {};
for (const f of readdirSync(dataDir).filter((f) => f.endsWith('-content.ts'))) {
  const m = await import(new URL(f, dataDir).href);
  for (const v of Object.values(m)) if (v && typeof v === 'object') Object.assign(source, v);
}
const { SOURCE_COPY_CANDIDATES } = await import('../../../src/lib/tool-copy-safety.ts');

test('every proposed value equals the reviewed source copy', () => {
  assert.ok(pkg.corrections.length >= 10);
  for (const c of pkg.corrections) {
    assert.equal(c.proposed.metaTitle, source[c.slug]?.seoTitle, c.slug);
    assert.equal(c.proposed.metaDescription, source[c.slug]?.metaDescription, c.slug);
    assert.notDeepEqual(c.proposed, c.current, c.slug + ' proposes no change');
  }
});

test('proposed metadata fits search-result limits', () => {
  for (const c of pkg.corrections) {
    assert.ok(c.proposed.metaTitle.length <= 60, `${c.slug} title ${c.proposed.metaTitle.length}`);
    assert.ok(c.proposed.metaDescription.length <= 160, `${c.slug} description ${c.proposed.metaDescription.length}`);
  }
});

test('the package covers every high-risk score tool and stays an unapplied, draft-only proposal', () => {
  const required = new Set(pkg.corrections.filter((c) => c.priority === 'required').map((c) => c.slug));
  for (const slug of ['heart-disease-risk-calculator', 'diabetes-risk-calculator', 'waist-health-risk-calculator']) assert.ok(required.has(slug), slug);
  for (const c of pkg.corrections) {
    assert.ok(['required', 'recommended', 'optional'].includes(c.priority));
    assert.ok(Number.isInteger(c.cmsToolId) && c.cmsToolId > 0, c.slug);
    assert.ok(SOURCE_COPY_CANDIDATES.has(c.slug) || ['water-intake-calculator'].includes(c.slug), c.slug);
    assert.ok(c.reason.length > 20);
  }
  assert.equal(new Set(pkg.corrections.map((c) => c.slug)).size, pkg.corrections.length);
  assert.match(pkg.purpose, /Nothing here has been written to any CMS/);
  assert.ok(pkg.applyRules.some((r) => /Owner authorization required/.test(r)));
  assert.ok(pkg.applyRules.some((r) => /draft versions of the existing records/.test(r)));
  assert.ok(pkg.applyRules.some((r) => /Never publish/.test(r)));
  assert.doesNotMatch(JSON.stringify(pkg), /"applied"\s*:\s*true|approvedBy/);
});
