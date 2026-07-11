/**
 * P15-P7 — build-time RENDER fixture (test scaffolding, NOT production content).
 *
 * Injected into the article data path ONLY when process.env.P7_FIXTURE === '1'
 * (see src/lib/cms.ts). It never ships in a normal build. Its purpose is to
 * prove, through the REAL Astro render pipeline, that:
 *   - exactly 3 takeaways render as the #key-takeaways box in initial HTML;
 *   - the visible People-Also-Ask block renders and drives a matching FAQPage;
 *   - speakable's selectors (.wh-article__lead, #key-takeaways) resolve to
 *     actually-rendered elements.
 * Content is obviously-synthetic — no real editorial/health claims (SD3).
 */
import type { Article } from './articles';

export const P7_FIXTURE_SLUG = 'p7-render-fixture';

export const P7_FIXTURE_ARTICLE: Article = {
  slug: P7_FIXTURE_SLUG,
  title: 'P7 Render Fixture (test only)',
  seoTitle: 'P7 Render Fixture',
  metaDescription: 'Synthetic fixture used to verify P7 takeaways/FAQ/speakable rendering.',
  category: 'nutrition',
  excerpt: 'This is the fixture lead paragraph used to verify the speakable lead selector resolves.',
  author: 'Test Fixture',
  publishDate: '2026-01-01',
  updatedDate: '2026-01-01',
  primaryTool: '',
  relatedTools: [],
  relatedArticles: [],
  sources: [],
  hasFAQ: true,
  takeaways: [
    'Fixture takeaway one — verifies the first bullet renders.',
    'Fixture takeaway two — verifies the second bullet renders.',
    'Fixture takeaway three — verifies exactly three render.',
  ],
  body: [
    { type: 'h2', text: 'Fixture section' },
    { type: 'p', text: 'Fixture body paragraph so the article is non-empty.' },
    {
      type: 'paa',
      heading: 'People also ask',
      items: [
        { q: 'Is this a fixture question?', a: 'Yes — this is synthetic test content.' },
        { q: 'Does the answer match the schema?', a: 'Yes — the FAQPage is built from this exact visible text.' },
      ],
    },
  ],
};
