import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = (path) => readFileSync(new URL('../../../' + path, import.meta.url), 'utf8');

test('medical attribution requires a meaningful explicitly assigned reviewer; update dates are not review dates', async () => {
  assert.doesNotMatch(source('cms/src/app/tools/pseo/[slug]/page.tsx'), /lastReviewed:.*updatedAt/);
  const { assignedReviewer } = await import('../../../src/lib/medical-review.ts');
  const person = { slug: 'test-reviewer', name: 'Test Reviewer', schemaType: 'Person', credential: 'Test credential', bio: 'Test-only profile' };
  const generic = { ...person, slug: 'medical-review', schemaType: 'Organization' };
  assert.equal(assignedReviewer(undefined, [person]), undefined);
  assert.equal(assignedReviewer('missing', [person]), undefined);
  assert.equal(assignedReviewer('medical-review', [generic]), undefined);
  assert.equal(assignedReviewer(person.slug, [{ ...person, credential: '' }]), undefined);
  assert.equal(assignedReviewer(person.slug, [person]), person);
  assert.equal(assignedReviewer(person.name, [person]), person);
  for (const path of ['src/components/ToolPageLayout.astro', 'src/pages/ai-assistant.astro', 'src/pages/health-score.astro', 'src/pages/methodology.astro', 'src/pages/medical-disclaimer.astro', 'cms/src/app/tools/pseo/[slug]/page.tsx']) {
    assert.doesNotMatch(source(path), /lastReviewed:|reviewedBy:/, path);
  }
  assert.doesNotMatch(source('src/pages/wellness-hub/[...path].astro'), /lastReviewed:.*updatedDate|reviewer \|\| REVIEWER_SLUG/);
  assert.doesNotMatch(source('src/components/Byline.astro'), /reviewed = true|getReviewerLocal/);
  assert.match(source('src/components/ArticleBody.astro'), /reviewer=\{article.reviewer\}/);
  assert.doesNotMatch(source('src/data/authors.ts'), /Licensed clinicians|qualified healthcare professionals/);
  assert.doesNotMatch(source('src/pages/about.astro'), /reviewerLd|Medically reviewed by/);
});

test('privacy explains recipe requests, result-image URLs, and persistent HRV readings', () => {
  const privacy = source('src/pages/privacy.astro');
  for (const text of ['Recipe Analyzer', '/api/analyze-recipe', '/api/result-image', 'query', 'HRV', 'localStorage', 'retention']) assert.ok(privacy.includes(text), text);
  for (const path of ['src/pages/privacy.astro', 'src/pages/about.astro', 'src/components/Footer.astro', 'src/pages/editorial-policy.astro', 'src/consts.ts']) {
    assert.doesNotMatch(source(path), /never leave your device|never travel to a server|never uploaded|never stored|no data stored|Data points stored|not uploaded or stored|We never upload|We do not transmit, collect, store/i, path);
  }
});
