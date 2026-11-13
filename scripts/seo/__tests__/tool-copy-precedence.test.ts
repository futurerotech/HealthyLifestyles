import test from 'node:test';
import assert from 'node:assert/strict';
import type { ToolContent } from '../../../src/data/content-types.ts';
import { resolveToolPagePresentation } from '../../../src/lib/tool-copy-safety.ts';

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

test('three educational activity calculators favor corrected source prose and social SEO', () => {
  for (const slug of ['sitting-disease-reversal-calculator', 'walk-it-off-calculator', 'calories-burned-calculator', 'steps-to-calories-calculator', 'vo2-max-calculator', 'one-rep-max-calculator']) {
    const r = resolveToolPagePresentation(slug, authored, staleCms, seo);
    assert.deepEqual(r.content.sections, authored.sections);
    assert.deepEqual(r.content.faq, authored.faq);
    assert.deepEqual(r.content.sources, authored.sources);
    assert.equal(r.content.intro, authored.intro);
    assert.deepEqual(r.content.directAnswer, authored.directAnswer);
    assert.equal(r.seo?.metaTitle, authored.seoTitle);
    assert.equal(r.seo?.ogTitle, authored.seoTitle);
    assert.equal(r.seo?.twitterTitle, authored.seoTitle);
    assert.equal(r.seo?.metaDescription, authored.metaDescription);
    assert.equal(r.seo?.ogDescription, authored.metaDescription);
    assert.equal(r.seo?.twitterDescription, authored.metaDescription);
    assert.equal(r.seo?.canonical, seo.canonical);
    assert.equal(r.seo?.noIndex, false);
    assert.equal(r.seo?.ogImage, seo.ogImage);
  }
});

test('existing five score indices retain authored metadata across OG and Twitter', () => {
  for (const slug of ['waist-health-risk-calculator', 'heart-disease-risk-calculator',
    'diabetes-risk-calculator', 'metabolic-age-calculator', 'healthspan-score']) {
    const r = resolveToolPagePresentation(slug, authored, staleCms, seo);
    assert.equal(r.seo?.metaTitle, authored.seoTitle);
    assert.equal(r.seo?.ogTitle, authored.seoTitle);
    assert.deepEqual(r.content.sections, staleCms.sections);
    assert.equal(r.content.directAnswer, undefined);
  }
});

test('unrelated tools preserve CMS editorial precedence and metadata', () => {
  const r = resolveToolPagePresentation('recovery-time-calculator', authored, staleCms, seo);
  assert.deepEqual(r.content.sections, staleCms.sections);
  assert.deepEqual(r.content.faq, staleCms.faq);
  assert.equal(r.content.directAnswer, undefined);
  assert.deepEqual(r.seo, seo);
  assert.equal(r.content.seoTitle, seo.metaTitle);
  assert.equal(r.content.metaDescription, seo.metaDescription);
});

test('when no CMS copy exists authored text remains complete and safe', () => {
  const r = resolveToolPagePresentation('walk-it-off-calculator', authored);
  assert.deepEqual(r.content, authored);
  assert.equal(r.seo?.metaTitle, authored.seoTitle);
  assert.equal(r.seo?.canonical, undefined);
});
