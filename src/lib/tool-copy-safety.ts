import type { ToolContent } from '../data/content-types';
import type { CmsToolContent } from './cms-content';
import type { SeoMetadata } from './seo';

/**
 * Tool-page copy precedence.
 *
 * The CMS is the system of record for published tool copy and SEO metadata:
 * by default its fields override the authored source copy, exactly as before.
 * The release preflight (scripts/content/preflight.mjs) enforces that.
 *
 * Several calculators have safety-reviewed source copy that differs from what
 * may be published in the CMS. Showing the source copy instead of the CMS copy
 * is an owner decision, because it makes the live page diverge from the CMS
 * record. The preferred route is a reviewed draft update of the CMS records;
 * this mechanism is the alternative if the owner approves it per tool.
 *
 * - SOURCE_COPY_CANDIDATES: tools whose reviewed source copy is ready, and the
 *   scope it would replace ('body' = intro, notice, sections, FAQ, sources and
 *   metadata; 'metadata' = SEO title/description and social tags only).
 * - SOURCE_COPY_APPROVED: tools for which the owner has approved source
 *   precedence. Empty until such an approval is recorded.
 */
export type CopyScope = 'body' | 'metadata';

export const SOURCE_COPY_CANDIDATES: ReadonlyMap<string, CopyScope> = new Map<string, CopyScope>([
  ['waist-health-risk-calculator', 'metadata'],
  ['heart-disease-risk-calculator', 'metadata'],
  ['diabetes-risk-calculator', 'metadata'],
  ['metabolic-age-calculator', 'metadata'],
  ['healthspan-score', 'metadata'],
  ['sitting-disease-reversal-calculator', 'body'],
  ['walk-it-off-calculator', 'body'],
  ['calories-burned-calculator', 'body'],
  ['steps-to-calories-calculator', 'body'],
  ['vo2-max-calculator', 'body'],
  ['one-rep-max-calculator', 'body'],
  ['ffmi-calculator', 'body'],
  ['recovery-time-calculator', 'body'],
  ['lean-body-mass-calculator', 'body'],
  ['alcohol-calorie-calculator', 'body'],
]);

export const SOURCE_COPY_APPROVED: ReadonlySet<string> = new Set<string>([]);

/** Custom point tallies and indices: never presented as validated clinical scores.
 *  This only selects the frontend-owned disclaimer; it does not touch CMS copy. */
export const MEDICAL_SCORE_SLUGS: ReadonlySet<string> = new Set([
  'waist-health-risk-calculator',
  'heart-disease-risk-calculator',
  'diabetes-risk-calculator',
  'metabolic-age-calculator',
  'healthspan-score',
]);

export function resolveToolPagePresentation(
  slug: string,
  authored: ToolContent,
  cmsContent?: CmsToolContent,
  cmsSeo?: SeoMetadata,
  approved: ReadonlySet<string> = SOURCE_COPY_APPROVED,
): { content: ToolContent; seo: SeoMetadata | undefined } {
  const scope = approved.has(slug) ? SOURCE_COPY_CANDIDATES.get(slug) : undefined;
  const sourceBody = scope === 'body';
  const sourceMetadata = scope === 'body' || scope === 'metadata';
  const content: ToolContent = {
    ...authored,
    ...cmsContent,
    // A CMS body is not necessarily the body that introduced the authored
    // quick answer. Do not emit inconsistent FAQ/quick-answer schema.
    ...(cmsContent?.sections && !sourceBody ? { directAnswer: undefined } : {}),
    ...(sourceBody ? {
      intro: authored.intro,
      notice: authored.notice,
      directAnswer: authored.directAnswer,
      sections: authored.sections,
      faq: authored.faq,
      sources: authored.sources,
    } : {}),
    seoTitle: sourceMetadata ? authored.seoTitle : cmsSeo?.metaTitle || authored.seoTitle,
    metaDescription: sourceMetadata ? authored.metaDescription : cmsSeo?.metaDescription || authored.metaDescription,
  };
  // SEO.astro gives seo.* priority over title/description props. With source
  // metadata, override every user-visible tag consistently but keep canonical,
  // noIndex, images and other CMS SEO settings.
  const seo: SeoMetadata | undefined = sourceMetadata ? {
    ...cmsSeo,
    metaTitle: content.seoTitle,
    metaDescription: content.metaDescription,
    ogTitle: content.seoTitle,
    ogDescription: content.metaDescription,
    twitterTitle: content.seoTitle,
    twitterDescription: content.metaDescription,
  } : cmsSeo;
  return { content, seo };
}
