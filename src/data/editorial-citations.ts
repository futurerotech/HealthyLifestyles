import type { LinkPolicy } from '../lib/text';

// Explicit source-audit decisions (2026-11-24, Phase 3 section 7.4).
// These are article-specific ordinary editorial citations, not a blanket
// domain trust list or medical endorsement. Unknown, changed, commercial or
// user-submitted destinations must not gain followable links automatically.
// Extend only after checking the exact URL, claim and editorial relationship.
const reviewedCitationUrls = new Map<string, readonly string[]>([
  ['due-date-by-conception-date', [
    'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date',
    'https://www.acog.org/womens-health/faqs/when-pregnancy-goes-past-your-due-date',
    'https://www.acog.org/womens-health/faqs/ultrasound-exams',
    'https://www.acog.org/womens-health/faqs/prenatal-care',
    'https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning',
    'https://www.acog.org/womens-health/faqs/ectopic-pregnancy',
    'https://medlineplus.gov/ency/article/003432.htm',
    'https://www.medlineplus.gov/ency/article/003432.htm',
    'https://www.cdc.gov/hearher/maternal-warning-signs/',
    'https://www.cdc.gov/hearher/maternal-warning-signs/index.html',
  ]],
  ['what-do-your-blood-pressure-numbers-mean', [
    'https://professional.heart.org/en/science-news/2025-high-blood-pressure-guideline/top-things-to-know',
    'https://professional.heart.org/en/guidelines-and-statements/unified-approach-to-cv-risk',
    'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings',
    'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home',
    'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/when-to-call-911-for-high-blood-pressure',
    'https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC11409525/',
    'https://www.cdc.gov/high-blood-pressure/data-research/facts-stats/index.html',
    'https://www.nhlbi.nih.gov/health/high-blood-pressure',
  ]],
  ['pregnancy-weight-gain-calculator-healthy-range-guide', [
    'https://www.cdc.gov/maternal-infant-health/pregnancy-weight/',
    'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',
    'https://www.ncbi.nlm.nih.gov/books/NBK32799/',
    'https://www.ncbi.nlm.nih.gov/books/NBK32799/table/summary.t1/?report=objectonly',
    'https://health.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/prenatal-nutrition/pregnancy-weight-gain-calculator.html',
    'https://medlineplus.gov/highbloodpressureinpregnancy.html',
    'https://www.cdc.gov/hearher/maternal-warning-signs/index.html',
  ]],
]);

export function editorialLinkPolicy(slug: string): LinkPolicy {
  return { purpose: 'editorial', approvedCitationUrls: new Set(reviewedCitationUrls.get(slug) ?? []) };
}
