/**
 * P15-P7 — the SINGLE article AEO-schema emitter (SD4). Both the English route
 * and the localized route import these; no route hand-rolls FAQ/speakable.
 * Pure + unit-tested (scripts/seo/__tests__/article-schema.test.ts).
 *
 * Runtime-self-contained (type-only imports) so it loads under both Vite and
 * plain `node --test` without transitive extensionless-import resolution.
 */
import type { Article, ArticleBlock } from '../data/articles';

/** Visible People-Also-Ask Q&A — the same extraction as data/articles' articleFaq. */
function visibleFaq(article: Article): { q: string; a: string }[] {
  return (article.body || [])
    .filter((b): b is Extract<ArticleBlock, { type: 'paa' }> => b.type === 'paa')
    .flatMap((b) => b.items);
}

/**
 * speakable selectors — ONLY selectors guaranteed to exist in the rendered
 * article: the lead (always) and the key-takeaways box (only when the editor
 * supplied exactly 3). Never references an element that isn't rendered.
 */
export function speakableSelectors(article: Article): string[] {
  return ['.wh-article__lead', ...(article.takeaways?.length === 3 ? ['#key-takeaways'] : [])];
}

/**
 * FAQPage node, or null. Emitted ONLY when the editorial flag hasFAQ is set
 * AND visible People-Also-Ask content exists — and it is built FROM that exact
 * visible content, so schema Q&A always matches the rendered HTML (no
 * heuristics, no divergence).
 */
export function buildFaqPage(article: Article): Record<string, unknown> | null {
  const faq = visibleFaq(article);
  if (!article.hasFAQ || faq.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
