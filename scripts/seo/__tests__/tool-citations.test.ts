import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { toolLinkPolicy } = await import('../../../src/data/tool-citations.ts');
const { renderInline, safeLinkAttributes } = await import('../../../src/lib/text.ts');

const root = new URL('../../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const approved = [...read('src/data/tool-citations.ts').matchAll(/\['([a-z0-9-]+)', \[([\s\S]*?)\]\]/g)]
  .map(([, slug, body]) => [slug, [...body.matchAll(/'(https:[^']+)'/g)].map((m) => m[1])] as const);

const toolContent = new Map<string, string>();
for (const f of readdirSync(new URL('src/data/', root)).filter((f) => f.endsWith('-content.ts'))) {
  const mod = await import(new URL(`src/data/${f}`, root).href);
  for (const v of Object.values(mod)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [slug, c] of Object.entries(v as Record<string, { sources?: unknown }>)) {
        if (c && Array.isArray(c.sources)) toolContent.set(slug, JSON.stringify(c));
      }
    }
  }
}

test('every approved tool citation is an exact HTTPS URL that the same tool actually cites', () => {
  assert.ok(approved.length > 0);
  for (const [slug, urls] of approved) {
    const content = toolContent.get(slug);
    assert.ok(content, `${slug} must be an existing tool`);
    for (const url of urls) {
      assert.match(url, /^https:\/\//);
      assert.doesNotMatch(url, /[?&]term=|\/search/, `${url} must not be a search query`);
      assert.ok(content.includes(JSON.stringify(url).slice(1, -1)), `${slug} must cite ${url}`);
    }
  }
});

test('approved tool citations render followable; everything else stays nofollow', () => {
  const [slug, [url]] = approved[0];
  const policy = toolLinkPolicy(slug);
  assert.equal(safeLinkAttributes(url, policy)?.rel, 'noopener');
  assert.match(renderInline(`See [source](${url}).`, policy), /rel="noopener">source<\/a>/);
  // Same URL on another tool page, unknown URLs and search queries are not trusted.
  assert.equal(safeLinkAttributes(url, toolLinkPolicy('not-a-tool'))?.rel, 'noopener nofollow');
  assert.equal(safeLinkAttributes('https://example.com/supplement', policy)?.rel, 'noopener nofollow');
  assert.equal(safeLinkAttributes('https://pubmed.ncbi.nlm.nih.gov/?term=bmr', policy)?.rel, 'noopener nofollow');
  // Compensation and user-generated contexts keep their qualifiers.
  assert.equal(safeLinkAttributes(url, { ...policy, purpose: 'sponsored' })?.rel, 'noopener sponsored nofollow');
  assert.equal(safeLinkAttributes(url, { ...policy, purpose: 'ugc' })?.rel, 'noopener ugc nofollow');
  // Unsafe destinations are still dropped.
  assert.equal(safeLinkAttributes('javascript:alert(1)', policy), undefined);
});

test('tool pages apply the per-tool policy to inline prose and the Sources list', () => {
  const layout = read('src/components/ToolPageLayout.astro');
  assert.match(layout, /const linkPolicy = toolLinkPolicy\(tool\.slug\);/);
  assert.match(layout, /renderInline\(p, linkPolicy\)/);
  assert.match(layout, /safeLinkAttributes\(src\.url, linkPolicy\)/);
  assert.doesNotMatch(layout, /rel="noopener nofollow"/);
});
