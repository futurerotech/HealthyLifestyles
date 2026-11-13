import type { ToolContent } from '../data/content-types';
import type { CmsToolContent } from './cms-content';
import type { SeoMetadata } from './seo';

/**
 * Narrow safety-only source copy precedence for unmerged calculator reviews.
 * CMS records stay authoritative on every unrelated public tool page.
 * Release requires independent CMS, clinical and browser acceptance.
 */
export const MEDICAL_SCORE_SLUGS = new Set([
  'waist-health-risk-calculator',
  'heart-disease-risk-calculator',
  'diabetes-risk-calculator',
  'metabolic-age-calculator',
  'healthspan-score',
]);

export const EDUCATIONAL_ACTIVITY_SLUGS = new Set([
  'sitting-disease-reversal-calculator',
  'walk-it-off-calculator',
  'calories-burned-calculator',
  'steps-to-calories-calculator',
  'vo2-max-calculator',
]);

export function resolveToolPagePresentation(
  slug: string,
  authored: ToolContent,
  cmsContent?: CmsToolContent,
  cmsSeo?: SeoMetadata,
): { content: ToolContent; seo: SeoMetadata | undefined } {
  const updatedBody = EDUCATIONAL_ACTIVITY_SLUGS.has(slug);
  const updatedMetadata = updatedBody || MEDICAL_SCORE_SLUGS.has(slug);
  const content: ToolContent = {
    ...authored,
    ...cmsContent,
    // A CMS Lexical body is not necessarily the body that introduced the
    // authored quick answer. Do not emit inconsistent FAQ/quick-answer schema.
    ...(cmsContent?.sections && !updatedBody ? { directAnswer: undefined } : {}),
    ...(updatedBody ? {
      intro: authored.intro,
      notice: authored.notice,
      directAnswer: authored.directAnswer,
      sections: authored.sections,
      faq: authored.faq,
      sources: authored.sources,
    } : {}),
    seoTitle: updatedMetadata ? authored.seoTitle : cmsSeo?.metaTitle || authored.seoTitle,
    metaDescription: updatedMetadata ? authored.metaDescription : cmsSeo?.metaDescription || authored.metaDescription,
  };

  // SEO.astro gives seo.metaTitle/Description/OG/Twitter priority over the
  // title/description props. Override all user-visible metadata consistently,
  // but preserve canonical, noIndex, image and other CMS SEO settings.
  const seo: SeoMetadata | undefined = updatedMetadata ? {
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
