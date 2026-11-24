import type { LinkPolicy } from '../lib/text';

// Per-tool source-audit decisions (2026-11-24). Each entry is an exact URL already
// cited on that tool page, checked to resolve without redirect (HTTP 200/203) on a
// scientific, government or professional-body domain. This is not a domain trust
// list or a medical endorsement. PubMed search-query links, redirected URLs,
// commercial sites and destinations that refused automated verification (HTTP 403,
// e.g. cdc.gov, heart.org) stay nofollow until checked by hand and added here.
const reviewedToolCitationUrls = new Map<string, readonly string[]>([
  ['alcohol-calorie-calculator', [
    'https://rethinkingdrinking.niaaa.nih.gov/tools/calculators/alcohol-calorie-calculator',
    'https://www.nhs.uk/live-well/alcohol-advice/calculating-alcohol-units/',
  ]],
  ['blood-pressure-checker', [
    'https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy',
    'https://www.acog.org/womens-health/experts-and-stories/the-latest/3-conditions-to-watch-for-after-childbirth',
  ]],
  ['bmi-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  ]],
  ['body-fat-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  ]],
  ['box-breathing-timer', [
    'https://www.apa.org/topics/stress',
  ]],
  ['burnout-self-check', [
    'https://www.who.int/news/item/28-05-2019-burn-out-an-occupational-phenomenon-international-classification-of-diseases',
  ]],
  ['caffeine-curfew-calculator', [
    'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much',
  ]],
  ['caffeine-intake-calculator', [
    'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much',
  ]],
  ['calorie-calculator', [
    'https://odphp.health.gov/our-work/nutrition-physical-activity/dietary-guidelines',
  ]],
  ['calories-burned-calculator', [
    'https://pubmed.ncbi.nlm.nih.gov/38242596/',
    'https://pacompendium.com/walking/',
  ]],
  ['due-date-calculator', [
    'https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy',
  ]],
  ['ffmi-calculator', [
    'https://pubmed.ncbi.nlm.nih.gov/12080449/',
    'https://pubmed.ncbi.nlm.nih.gov/7496846/',
  ]],
  ['food-symptom-diary', [
    'https://www.aaaai.org/conditions-treatments/allergies/food-allergy',
  ]],
  ['gut-health-score', [
    'https://www.dietaryguidelines.gov/',
  ]],
  ['healthspan-score', [
    'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
    'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    'https://odphp.health.gov/our-work/nutrition-physical-activity/dietary-guidelines/current-dietary-guidelines',
  ]],
  ['ideal-weight-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  ]],
  ['lean-body-mass-calculator', [
    'https://pubmed.ncbi.nlm.nih.gov/6496691/',
  ]],
  ['lifestyle-age-test', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  ]],
  ['meal-plan-generator', [
    'https://www.dietaryguidelines.gov/',
    'https://www.eatright.org/',
  ]],
  ['metabolic-age-calculator', [
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC10661987/',
    'https://www.ncbi.nlm.nih.gov/books/NBK591031/',
  ]],
  ['one-rep-max-calculator', [
    'https://pubmed.ncbi.nlm.nih.gov/16937972/',
  ]],
  ['pregnancy-weight-gain-calculator', [
    'https://www.ncbi.nlm.nih.gov/books/NBK32799/',
  ]],
  ['push-up-test-calculator', [
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC9362895/',
  ]],
  ['recipe-nutrition-analyzer', [
    'https://fdc.nal.usda.gov/',
  ]],
  ['recovery-time-calculator', [
    'https://my.clevelandclinic.org/health/diseases/delayed-onset-muscle-soreness',
  ]],
  ['sitting-disease-reversal-calculator', [
    'https://www.ncbi.nlm.nih.gov/books/NBK566046/',
  ]],
  ['smoking-cost-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/tobacco',
  ]],
  ['steps-to-calories-calculator', [
    'https://pubmed.ncbi.nlm.nih.gov/14715035/',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC10818145/',
  ]],
  ['stress-level-check', [
    'https://www.apa.org/topics/stress',
  ]],
  ['vitamin-d-sun-calculator', [
    'https://www.aad.org/media/stats-vitamin-d',
    'https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation',
    'https://www.epa.gov/sunsafety/uv-index-scale-0',
  ]],
  ['vo2-max-calculator', [
    'https://pubmed.ncbi.nlm.nih.gov/14624296/',
    'https://pubmed.ncbi.nlm.nih.gov/32777866/',
  ]],
  ['waist-health-risk-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
    'https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity',
  ]],
  ['waist-to-height-ratio-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  ]],
  ['waist-to-hip-ratio-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  ]],
  ['walk-it-off-calculator', [
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC10818145/',
  ]],
  ['weight-loss-percentage-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  ]],
  ['weight-loss-timeline-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  ]],
]);

export function toolLinkPolicy(slug: string): LinkPolicy {
  return { purpose: 'editorial', approvedCitationUrls: new Set(reviewedToolCitationUrls.get(slug) ?? []) };
}
