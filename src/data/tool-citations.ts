import type { LinkPolicy } from '../lib/text';

// Per-tool source-audit decisions (2026-11-24, extended 2026-11-25). Each entry is an
// exact URL already cited on that tool page, verified to load without redirect on a
// scientific, government or professional-body domain: by HTTP 200/203, or, for sites
// that block automated requests (cdc.gov, heart.org, mayoclinic.org), by loading the
// exact URL in a browser and matching the page title. This is not a domain trust list
// or a medical endorsement. PubMed search-query links, redirected URLs (doi.org),
// commercial sites, pages behind a bot challenge and broken pages stay nofollow
// until checked again.
const reviewedToolCitationUrls = new Map<string, readonly string[]>([
  ['alcohol-calorie-calculator', [
    'https://rethinkingdrinking.niaaa.nih.gov/tools/calculators/alcohol-calorie-calculator',
    'https://www.nhs.uk/live-well/alcohol-advice/calculating-alcohol-units/',
    'https://www.cdc.gov/alcohol/about-alcohol-use/moderate-alcohol-use.html',
    'https://www.cdc.gov/cancer/risk-factors/alcohol.html',
  ]],
  ['blood-pressure-checker', [
    'https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy',
    'https://www.acog.org/womens-health/experts-and-stories/the-latest/3-conditions-to-watch-for-after-childbirth',
    'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings',
    'https://professional.heart.org/en/science-news/2025-high-blood-pressure-guideline/top-things-to-know',
    'https://www.cdc.gov/high-blood-pressure/about/high-blood-pressure-during-pregnancy.html',
  ]],
  ['blue-light-exposure-estimator', [
    'https://www.cdc.gov/sleep/about/index.html',
  ]],
  ['bmi-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
    'https://www.cdc.gov/bmi/about/index.html',
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
    'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/caffeine/art-20045678',
  ]],
  ['calorie-calculator', [
    'https://odphp.health.gov/our-work/nutrition-physical-activity/dietary-guidelines',
  ]],
  ['calories-burned-calculator', [
    'https://pubmed.ncbi.nlm.nih.gov/38242596/',
    'https://pacompendium.com/walking/',
  ]],
  ['diabetes-risk-calculator', [
    'https://www.cdc.gov/diabetes/widgets/risktest/how-your-test-is-scored.html',
    'https://www.cdc.gov/prediabetes/risktest/about-the-test.html',
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
    'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/fiber/art-20043983',
  ]],
  ['healthspan-score', [
    'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
    'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    'https://odphp.health.gov/our-work/nutrition-physical-activity/dietary-guidelines/current-dietary-guidelines',
    'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',
  ]],
  ['heart-disease-risk-calculator', [
    'https://www.heart.org/en/healthy-living/healthy-lifestyle/lifes-essential-8',
    'https://professional.heart.org/en/guidelines-and-statements/prevent-calculator',
  ]],
  ['ideal-weight-calculator', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  ]],
  ['lean-body-mass-calculator', [
    'https://pubmed.ncbi.nlm.nih.gov/6496691/',
  ]],
  ['lifestyle-age-test', [
    'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
    'https://www.heart.org/en/healthy-living/healthy-lifestyle/lifes-essential-8',
  ]],
  ['max-heart-rate-calculator', [
    'https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates/',
    'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse',
  ]],
  ['meal-plan-generator', [
    'https://www.dietaryguidelines.gov/',
    'https://www.eatright.org/',
    'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html',
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
    'https://www.cdc.gov/maternal-infant-health/pregnancy-weight/',
    'https://www.cdc.gov/hearher/maternal-warning-signs/index.html',
  ]],
  ['push-up-test-calculator', [
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC9362895/',
  ]],
  ['recipe-nutrition-analyzer', [
    'https://fdc.nal.usda.gov/',
  ]],
  ['recovery-time-calculator', [
    'https://my.clevelandclinic.org/health/diseases/delayed-onset-muscle-soreness',
    'https://www.cdc.gov/niosh/rhabdo/signs-symptoms/',
  ]],
  ['resting-heart-rate-checker', [
    'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse',
    'https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979',
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
  ['target-heart-rate-calculator', [
    'https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates/',
    'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse',
  ]],
  ['vitamin-d-sun-calculator', [
    'https://www.aad.org/media/stats-vitamin-d',
    'https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation',
    'https://www.epa.gov/sunsafety/uv-index-scale-0',
  ]],
  ['vo2-max-calculator', [
    'https://pubmed.ncbi.nlm.nih.gov/14624296/',
    'https://pubmed.ncbi.nlm.nih.gov/32777866/',
    'https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates',
    'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse',
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
    'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html',
  ]],
]);

export function toolLinkPolicy(slug: string): LinkPolicy {
  return { purpose: 'editorial', approvedCitationUrls: new Set(reviewedToolCitationUrls.get(slug) ?? []) };
}
