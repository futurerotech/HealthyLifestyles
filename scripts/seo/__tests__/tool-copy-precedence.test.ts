import test from 'node:test';
import assert from 'node:assert/strict';
import type { ToolContent } from '../../../src/data/content-types.ts';
import { resolveToolPagePresentation, SOURCE_COPY_CANDIDATES, SOURCE_COPY_APPROVED } from '../../../src/lib/tool-copy-safety.ts';

const authored: ToolContent = {
  seoTitle: 'Safety-corrected movement tool',
  metaDescription: 'Optional movement ideas; no health-risk reversal claim.',
  intro: 'Source introduction — movement is not a cure.',
  notice: 'Educational only.',
  directAnswer: { question: 'Can movement erase sitting?', answer: 'No.' },
  sections: [{ h2: 'Science', paragraphs: ['Source: no validated offset formula.'] }],
  faq: [{ q: 'What about steps?', a: 'No required step threshold.' }],
  sources: [{ citation: 'WHO guidelines', url: 'https://www.ncbi.nlm.nih.gov/books/NBK566046/' }],
};
const staleCms = {
  sections: [{ h2: 'Legacy', paragraphs: ['Reclaimed calories reverse risk.'] }],
  faq: [{ q: 'Do steps offset harm?', a: 'Yes, guaranteed.' }],
  sources: [{ citation: 'Outdated blog', url: 'https://example.org/' }],
};
const seo = {
  metaTitle: 'Old medical guarantee',
  metaDescription: 'Offset every hour of sitting.',
  ogTitle: 'Reverse risk now!',
  ogDescription: 'Get guaranteed reclaimed calories.',
  twitterTitle: 'Reverse sitting risks',
  twitterDescription: 'Exercise makes eating free.',
  canonical: '/tools/sitting-disease-reversal-calculator',
  noIndex: false,
  ogImage: 'https://www.healthylifesstyles.com/og.jpg',
};

const BODY = [...SOURCE_COPY_CANDIDATES].filter(([, s]) => s === 'body').map(([k]) => k);
const META = [...SOURCE_COPY_CANDIDATES].filter(([, s]) => s === 'metadata').map(([k]) => k);
const ALL = new Set(SOURCE_COPY_CANDIDATES.keys());

test('nothing is approved by default: the CMS stays authoritative for every tool', () => {
  assert.equal(SOURCE_COPY_APPROVED.size, 0);
  for (const slug of [...ALL, 'bmi-calculator']) {
    const r = resolveToolPagePresentation(slug, authored, staleCms, seo);
    assert.deepEqual(r.content.sections, staleCms.sections, slug);
    assert.deepEqual(r.content.faq, staleCms.faq, slug);
    assert.equal(r.content.directAnswer, undefined, slug);
    assert.equal(r.content.seoTitle, seo.metaTitle, slug);
    assert.equal(r.content.metaDescription, seo.metaDescription, slug);
    assert.equal(r.seo, seo, slug);
  }
});

test('default resolution is identical to the previous inline layout expression', () => {
  const legacy = (a: ToolContent, cms?: typeof staleCms, s?: typeof seo) => ({
    ...a, ...cms, ...(cms?.sections ? { directAnswer: undefined } : {}),
    seoTitle: s?.metaTitle || a.seoTitle, metaDescription: s?.metaDescription || a.metaDescription,
  });
  for (const [cms, s] of [[staleCms, seo], [undefined, undefined], [{ faq: staleCms.faq }, { canonical: '/x' }]] as const) {
    const r = resolveToolPagePresentation('walk-it-off-calculator', authored, cms as typeof staleCms, s as typeof seo);
    assert.deepEqual(r.content, legacy(authored, cms as typeof staleCms, s as typeof seo));
    assert.equal(r.seo, s);
  }
});

test('when approved, body-scope candidates use reviewed source prose and social SEO', () => {
  for (const slug of BODY) {
    const r = resolveToolPagePresentation(slug, authored, staleCms, seo, ALL);
    assert.deepEqual(r.content.sections, authored.sections);
    assert.deepEqual(r.content.faq, authored.faq);
    assert.deepEqual(r.content.sources, authored.sources);
    assert.equal(r.content.intro, authored.intro);
    assert.deepEqual(r.content.directAnswer, authored.directAnswer);
    for (const k of ['metaTitle', 'ogTitle', 'twitterTitle'] as const) assert.equal(r.seo?.[k], authored.seoTitle);
    for (const k of ['metaDescription', 'ogDescription', 'twitterDescription'] as const) assert.equal(r.seo?.[k], authored.metaDescription);
    assert.equal(r.seo?.canonical, seo.canonical);
    assert.equal(r.seo?.noIndex, false);
    assert.equal(r.seo?.ogImage, seo.ogImage);
  }
});

test('when approved, metadata-scope candidates change only metadata', () => {
  for (const slug of META) {
    const r = resolveToolPagePresentation(slug, authored, staleCms, seo, ALL);
    assert.equal(r.seo?.metaTitle, authored.seoTitle);
    assert.equal(r.seo?.ogTitle, authored.seoTitle);
    assert.deepEqual(r.content.sections, staleCms.sections);
    assert.equal(r.content.directAnswer, undefined);
  }
});

test('approval cannot extend precedence to a tool that is not a reviewed candidate', () => {
  const r = resolveToolPagePresentation('bmi-calculator', authored, staleCms, seo, new Set(['bmi-calculator']));
  assert.deepEqual(r.content.sections, staleCms.sections);
  assert.equal(r.seo, seo);
});
