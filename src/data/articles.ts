/**
 * Wellness Hub content. Each article is a structured block array (not raw HTML)
 * so the page can build an automatic table of contents, emit FAQPage JSON-LD
 * from "People also ask" blocks, and embed a live calculator inline. Prose uses
 * a tiny trusted markdown (**bold**, [label](/href)) rendered by src/lib/text.ts.
 *
 * Authoring rules (YMYL): educational only, never medical advice; cite real
 * authorities; never push calories below the safe floors; internal-link the
 * matching calculators both ways (relatedTools drives the "From the Wellness
 * Hub" block on tool pages).
 */
import { EDITORIAL } from '../consts';
import { stripInline } from '../lib/text';

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  blurb: string;
  /** Icon key resolved by <Icon name=.. />. */
  icon: string;
  /** Raw hex accent. */
  color: string;
}

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; tone: 'info' | 'tip' | 'warning'; title?: string; text: string }
  | { type: 'tool'; slug: string; label?: string }
  | { type: 'table'; caption?: string; headers: string[]; rows: string[][] }
  | { type: 'paa'; heading?: string; items: { q: string; a: string }[] };

export interface ArticleSource {
  citation: string;
  url?: string;
}

export interface Article {
  slug: string;
  /** H1 — the target keyword phrased as a human title. */
  title: string;
  /** <title> — keep ≤ 60 chars. */
  seoTitle: string;
  /** Meta description — keep ≤ 155 chars. */
  metaDescription: string;
  category: string; // ArticleCategory id
  /** Card + intro lead. */
  excerpt: string;
  /** CMS-uploaded hero image (url + alt) or undefined if not set. */
  heroImage?: { url: string; alt: string };
  author: string;
  /** One-line author bio shown under the byline (E-E-A-T). */
  authorBio?: string;
  publishDate: string; // ISO yyyy-mm-dd
  updatedDate: string; // ISO yyyy-mm-dd
  featured?: boolean;
  /** Tool slug shown as the inline "Try it" embed. */
  primaryTool: string;
  /** Tool slugs to cross-link (sidebar + drives tool→article links). */
  relatedTools: string[];
  /** Explicit related article slugs; otherwise same-category fallback. */
  relatedArticles?: string[];
  sources: ArticleSource[];
  body: ArticleBlock[];
  tags: { name: string; slug: string }[];
  /** Machine-readable medical/physiological entities → JSON-LD `about` + AI citation. */
  semanticEntities?: { term: string; url?: string }[];
}

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  { id: 'nutrition', name: 'Nutrition', slug: 'nutrition', blurb: 'Calories, protein, and eating well without the guesswork.', icon: 'leaf', color: '#f97316' },
  { id: 'weight-loss', name: 'Weight Loss', slug: 'weight-loss', blurb: 'Evidence-based, sustainable fat loss — no crash diets.', icon: 'scale', color: '#3b82f6' },
  { id: 'fitness', name: 'Fitness', slug: 'fitness', blurb: 'Training, strength, and getting more from your workouts.', icon: 'dumbbell', color: '#8b5cf6' },
  { id: 'sleep', name: 'Sleep', slug: 'sleep', blurb: 'Better rest, cycles, and recovery, backed by research.', icon: 'moon', color: '#6366f1' },
  { id: 'womens-health', name: "Women's Health", slug: 'womens-health', blurb: 'Cycle, fertility, and pregnancy, explained clearly.', icon: 'sparkle', color: '#ec4899' },
  { id: 'heart-health', name: 'Heart Health', slug: 'heart-health', blurb: 'Heart rate, blood pressure, and cardiovascular basics.', icon: 'heart-pulse', color: '#ef4444' },
  { id: 'mental-wellness', name: 'Mental Wellness', slug: 'mental-wellness', blurb: 'Stress, burnout, and everyday calm.', icon: 'smile', color: '#0ea5e9' },
];

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export const ARTICLES: Article[] = [
  // 1 ----------------------------------------------------------------------
  {
    slug: 'how-many-calories-to-lose-weight',
    title: 'How Many Calories Should I Eat to Lose Weight?',
    seoTitle: 'How Many Calories to Lose Weight? | Simple Guide',
    metaDescription:
      'Learn how to find your calorie target for weight loss using your TDEE and a safe deficit — plus why crash diets backfire. Free calculators included.',
    category: 'weight-loss',
    excerpt:
      'Weight loss comes down to a calorie deficit — but the right number is personal. Here is how to find a target that actually works, and stays safe.',
    author: 'HealthyLifeStyles Editorial Team',
    publishDate: '2026-04-12',
    updatedDate: '2026-06-10',
    featured: true,
    primaryTool: 'calorie-calculator',
    relatedTools: ['calorie-calculator', 'calorie-deficit-calculator', 'macro-calculator', 'bmr-calculator'],
    relatedArticles: ['how-much-protein-do-i-need', 'how-to-keep-muscle-while-losing-weight'],
    sources: [
      { citation: 'Mifflin MD, St Jeor ST, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990.', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
      { citation: 'National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK). Body Weight Planner.', url: 'https://www.niddk.nih.gov/bwp' },
      { citation: 'CDC. Losing Weight — healthy weight loss is about 1 to 2 pounds per week.', url: 'https://www.cdc.gov/healthyweight/losing_weight/index.html' },
    ],
    body: [
      { type: 'p', text: 'If you want to lose weight, you have to eat fewer calories than your body burns. That is the whole mechanism — a **calorie deficit**. The hard part is not the principle; it is finding a daily number that is low enough to make progress but high enough to be sustainable, protect your muscle, and keep you sane.' },
      { type: 'p', text: 'This guide shows you how to set that number from your own body and activity, in three steps.' },
      { type: 'h2', text: 'Step 1: Find your maintenance calories (TDEE)' },
      { type: 'p', text: 'Your **TDEE** (Total Daily Energy Expenditure) is roughly how many calories you burn in a day. It is the sum of your resting metabolism (the energy to keep you alive — your [BMR](/tools/bmr-calculator)) plus everything you do on top of that. Most evidence-based calculators estimate it with the Mifflin-St Jeor equation, then multiply by an activity factor.' },
      { type: 'p', text: 'Eat at your TDEE and your weight holds steady. Eat below it and you lose. So your maintenance number is the anchor for everything else.' },
      { type: 'tool', slug: 'calorie-calculator', label: 'Find your calorie target' },
      { type: 'h2', text: 'Step 2: Subtract a safe deficit' },
      { type: 'p', text: 'A pound of fat stores roughly 3,500 calories, so a daily deficit of 500 calories trends toward about a pound of loss per week. The [CDC](https://www.cdc.gov/healthyweight/losing_weight/index.html) considers **1 to 2 pounds (about 0.5–1 kg) per week** a healthy, sustainable pace.' },
      { type: 'ul', items: [
        '**Modest deficit (about 250/day):** slow but very easy to maintain — good if you have less to lose.',
        '**Standard deficit (about 500/day):** ~1 lb/week; the sweet spot for most people.',
        '**Aggressive deficit (750+/day):** faster, but harder to stick to and more likely to cost you muscle.',
      ] },
      { type: 'p', text: 'You can let a tool do the subtraction for you: the [Calorie Deficit Calculator](/tools/calorie-deficit-calculator) works backward from a goal weight and date to show the daily deficit required — and flags it if that pace is too aggressive.' },
      { type: 'callout', tone: 'warning', title: 'Never go below the floor', text: 'Very-low-calorie diets backfire: you lose muscle, your metabolism adapts, and the weight tends to return. As a general rule, do not drop below about 1,200 calories/day for women or 1,500 for men without medical supervision, and avoid losing more than ~1% of your body weight per week.' },
      { type: 'h2', text: 'Step 3: Keep protein high and adjust monthly' },
      { type: 'p', text: 'Calories decide whether you lose weight; protein and training decide whether that loss is fat or muscle. Keep protein high (see [how much protein you really need](/wellness-hub/how-much-protein-do-i-need)) and lift something heavy a few times a week. Then re-check your numbers every 3–4 weeks — as you get lighter, your TDEE falls, so the deficit that worked at the start will eventually stall.' },
      { type: 'h3', text: 'What to do when you plateau' },
      { type: 'ul', items: [
        'Recalculate your TDEE at your new weight — your target should drop a little.',
        'Tighten up tracking for two weeks; portions creep over time.',
        'Add movement (steps) rather than cutting calories further.',
        'Take a planned maintenance break — a week at TDEE can help adherence.',
      ] },
      { type: 'paa', items: [
        { q: 'How many calories should I eat a day to lose weight?', a: 'Start from your maintenance calories (TDEE) and subtract 250–500 per day for a sustainable 0.5–1 lb weekly loss. The exact number depends on your age, sex, size, and activity — calculate your TDEE first, then subtract.' },
        { q: 'Is 1,200 calories a day enough?', a: '1,200 is widely treated as the lowest safe target for women (about 1,500 for men) and is too low for many active people. If a calculator suggests going below that, raise the calories and lose weight more slowly instead.' },
        { q: 'Why am I not losing weight in a calorie deficit?', a: 'The most common reasons are under-counting calories, a TDEE estimate that is too high, water-weight fluctuations masking fat loss, or your deficit shrinking as you get lighter. Re-measure, tighten tracking, and give it 2–3 weeks.' },
        { q: 'Do I need to count calories forever?', a: 'No. Counting is a learning tool. Most people track for a few months to calibrate portion sizes, then maintain with awareness rather than weighing everything.' },
      ] },
      { type: 'p', text: 'Bottom line: find your TDEE, subtract a deficit you can live with, keep protein high, and re-check monthly. Slow and steady genuinely wins here.' },
    ],
  },

  // 2 ----------------------------------------------------------------------
  {
    slug: 'how-much-protein-do-i-need',
    title: 'How Much Protein Do I Really Need?',
    seoTitle: 'How Much Protein Do I Really Need? | Daily Guide',
    metaDescription:
      'How much protein per day for muscle, weight loss, or general health — in grams per kg and pound, with what the research actually says.',
    category: 'nutrition',
    excerpt:
      'The RDA is a floor, not a goal. Here is how much protein the evidence supports for muscle, fat loss, and healthy aging — and how to hit it.',
    author: 'HealthyLifeStyles Editorial Team',
    publishDate: '2026-03-05',
    updatedDate: '2026-05-28',
    primaryTool: 'protein-intake-calculator',
    relatedTools: ['protein-intake-calculator', 'macro-calculator', 'calorie-calculator'],
    relatedArticles: ['how-many-calories-to-lose-weight', 'how-to-keep-muscle-while-losing-weight'],
    sources: [
      { citation: 'Institute of Medicine. Dietary Reference Intakes: protein RDA 0.8 g/kg/day.', url: 'https://www.ncbi.nlm.nih.gov/books/NBK56068/' },
      { citation: 'Jäger R, et al. ISSN Position Stand: Protein and Exercise. J Int Soc Sports Nutr. 2017.', url: 'https://pubmed.ncbi.nlm.nih.gov/28642676/' },
      { citation: 'Morton RW, et al. Systematic review of protein and resistance-training adaptations. Br J Sports Med. 2018.', url: 'https://pubmed.ncbi.nlm.nih.gov/28698222/' },
    ],
    body: [
      { type: 'p', text: 'The official **RDA for protein is 0.8 grams per kilogram of body weight per day** — but that is the amount set to prevent deficiency in a sedentary adult, not the amount that is optimal if you exercise, are trying to lose fat, or want to age strongly. For most active people, the research supports quite a bit more.' },
      { type: 'h2', text: 'What the research recommends' },
      { type: 'p', text: 'The [International Society of Sports Nutrition](https://pubmed.ncbi.nlm.nih.gov/28642676/) and a large [2018 meta-analysis](https://pubmed.ncbi.nlm.nih.gov/28698222/) converge on a practical range:' },
      { type: 'ul', items: [
        '**General health (sedentary):** 0.8–1.0 g/kg — the baseline.',
        '**Active / building muscle:** 1.4–2.0 g/kg (about 0.6–0.9 g per pound).',
        '**Losing fat while preserving muscle:** 1.6–2.4 g/kg — protein needs go up, not down, in a deficit.',
        '**Older adults:** 1.0–1.2 g/kg to push back against age-related muscle loss.',
      ] },
      { type: 'p', text: 'In plain terms: a 70 kg (154 lb) active person lands around 100–140 g of protein per day. Round numbers are fine — protein targets are a range, not a knife-edge.' },
      { type: 'tool', slug: 'protein-intake-calculator', label: 'Calculate your protein target' },
      { type: 'callout', tone: 'tip', title: 'Spread it across the day', text: 'Aim for roughly 20–40 g of protein per meal across 3–4 meals rather than one giant serving. Even distribution gives a slightly better muscle-building response than back-loading it all at dinner.' },
      { type: 'h2', text: 'Is too much protein dangerous?' },
      { type: 'p', text: 'For healthy people with healthy kidneys, higher-protein diets within these ranges are well tolerated in the research, with no evidence of harm to bone or kidney function. The usual caveat applies to anyone with **existing kidney disease**, who should follow their doctor’s advice on protein. If that is you, talk to your clinician before increasing intake.' },
      { type: 'h3', text: 'Easy ways to hit your number' },
      { type: 'ul', items: [
        'Anchor every meal with a protein source (eggs, dairy, poultry, fish, tofu, legumes).',
        'Use Greek yogurt, cottage cheese, or a shake to close a gap at the end of the day.',
        'Read labels by grams of protein per serving, not marketing claims.',
        'Plant-based? Combine sources (beans + grains) and aim toward the higher end of your range.',
      ] },
      { type: 'p', text: 'Once you know your protein target, the [Macro Calculator](/tools/macro-calculator) fits carbs and fat around it for your goal, and the [Calorie Calculator](/tools/calorie-calculator) sets the total energy budget.' },
      { type: 'paa', items: [
        { q: 'How much protein per day to build muscle?', a: 'Most evidence points to 1.6–2.2 g/kg of body weight per day (roughly 0.7–1.0 g per pound) combined with resistance training. Going much higher offers little extra benefit.' },
        { q: 'How much protein do I need to lose weight?', a: 'Higher than maintenance — about 1.6–2.4 g/kg — because adequate protein in a calorie deficit preserves muscle and keeps you fuller, so more of the weight you lose is fat.' },
        { q: 'Can I eat too much protein in one sitting?', a: 'Your body uses protein efficiently across the day; very large single servings are not wasted, but spreading protein over 3–4 meals slightly improves muscle protein synthesis.' },
      ] },
    ],
  },

  // 3 ----------------------------------------------------------------------
  {
    slug: 'healthy-bmi-by-age',
    title: "What's a Healthy BMI by Age?",
    seoTitle: 'Healthy BMI by Age: What the Numbers Mean',
    metaDescription:
      'What counts as a healthy BMI, how it changes with age, and the limits of BMI for athletes and older adults — with a free BMI calculator.',
    category: 'weight-loss',
    excerpt:
      'BMI is a useful screening number, but it does not mean the same thing at 25, 55, and 75. Here is how to read it by age — and what it misses.',
    author: 'HealthyLifeStyles Editorial Team',
    publishDate: '2026-02-18',
    updatedDate: '2026-06-02',
    primaryTool: 'bmi-calculator',
    relatedTools: ['bmi-calculator', 'waist-to-height-ratio-calculator', 'body-fat-calculator', 'ideal-weight-calculator'],
    relatedArticles: ['how-many-calories-to-lose-weight'],
    sources: [
      { citation: 'World Health Organization. Body mass index (BMI) classification.', url: 'https://www.who.int/health-topics/obesity' },
      { citation: 'CDC. About Adult BMI.', url: 'https://www.cdc.gov/healthyweight/assessing/bmi/adult_bmi/index.html' },
      { citation: 'Winter JE, et al. BMI and all-cause mortality in older adults: a meta-analysis. Am J Clin Nutr. 2014.', url: 'https://pubmed.ncbi.nlm.nih.gov/24452240/' },
    ],
    body: [
      { type: 'p', text: '**BMI (Body Mass Index)** is your weight divided by your height squared. It is a quick screening tool that sorts adults into ranges — but the standard cut-offs were set for the general adult population, and they do not capture the whole picture at every age.' },
      { type: 'h2', text: 'The standard adult BMI ranges' },
      { type: 'p', text: 'For adults aged roughly 20–65, the [WHO](https://www.who.int/health-topics/obesity) and [CDC](https://www.cdc.gov/healthyweight/assessing/bmi/adult_bmi/index.html) use the same categories regardless of age or sex:' },
      { type: 'ul', items: [
        'Under 18.5 — underweight',
        '18.5 to 24.9 — healthy weight',
        '25.0 to 29.9 — overweight',
        '30.0 and above — obesity',
      ] },
      { type: 'tool', slug: 'bmi-calculator', label: 'Check your BMI' },
      { type: 'h2', text: 'Does a healthy BMI change with age?' },
      { type: 'p', text: 'The official cut-offs do **not** change with age for adults — a BMI of 23 is "healthy weight" at 25 and at 75. What changes is the *interpretation*:' },
      { type: 'h3', text: 'Older adults (65+)' },
      { type: 'p', text: 'In older adults, being at the very low end of "healthy" is not always best. [Research in adults over 65](https://pubmed.ncbi.nlm.nih.gov/24452240/) has linked a slightly higher BMI (in the mid-20s) with lower mortality, partly because some reserve weight is protective during illness and because muscle loss (sarcopenia) can make a "normal" BMI hide low strength.' },
      { type: 'h3', text: 'Children and teens' },
      { type: 'p', text: 'BMI for anyone under 20 is **not** read against the adult ranges at all. It is plotted as an age-and-sex percentile on growth charts, so the adult cut-offs above simply do not apply.' },
      { type: 'callout', tone: 'info', title: 'BMI is a screen, not a diagnosis', text: 'BMI cannot tell muscle from fat or show where you carry weight. A muscular athlete can read "overweight" while being very lean. Pair BMI with your [waist-to-height ratio](/tools/waist-to-height-ratio-calculator) and, if you want, a [body-fat estimate](/tools/body-fat-calculator) for a fuller view.' },
      { type: 'h2', text: 'A better picture in 30 seconds' },
      { type: 'ol', items: [
        'Check your BMI for a baseline category.',
        'Measure your waist — under half your height is the simple target.',
        'Note your trend over months, not day-to-day weight.',
        'If anything looks off, talk to a clinician rather than self-diagnosing.',
      ] },
      { type: 'paa', items: [
        { q: 'What is a healthy BMI for my age?', a: 'For adults, the healthy range is 18.5–24.9 at every age. After about 65, sitting in the lower-to-mid 20s is often reasonable, and strength matters as much as the number. Under-20s use growth-chart percentiles instead.' },
        { q: 'Is BMI accurate for athletes?', a: 'Not very. BMI counts muscle as weight, so lean, muscular people often score "overweight." For them, body-fat percentage and waist measurements are more informative.' },
        { q: 'What is a healthy BMI for women vs men?', a: 'The BMI ranges are the same for women and men. Body composition differs, which is why waist circumference and body-fat percentage add useful context beyond BMI alone.' },
      ] },
    ],
  },

  // 4 ----------------------------------------------------------------------
  {
    slug: 'best-time-to-stop-drinking-coffee-for-sleep',
    title: 'The Best Time to Stop Drinking Coffee for Better Sleep',
    seoTitle: 'When to Stop Drinking Coffee for Better Sleep',
    metaDescription:
      'Caffeine has a ~5-hour half-life and can disrupt sleep even 6 hours before bed. Here is when to set your last-coffee cutoff — and how to time bedtime.',
    category: 'sleep',
    excerpt:
      'Caffeine lingers for hours. Research shows even an afternoon coffee can steal sleep. Here is how to set a sensible caffeine curfew.',
    author: 'HealthyLifeStyles Editorial Team',
    publishDate: '2026-05-02',
    updatedDate: '2026-06-15',
    primaryTool: 'caffeine-curfew-calculator',
    relatedTools: ['caffeine-curfew-calculator', 'sleep-calculator', 'sleep-debt-calculator'],
    relatedArticles: [],
    sources: [
      { citation: 'Drake C, et al. Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed. J Clin Sleep Med. 2013.', url: 'https://pubmed.ncbi.nlm.nih.gov/24235903/' },
      { citation: 'Institute of Medicine / FDA. Caffeine half-life is roughly 5 hours in healthy adults.', url: 'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much' },
      { citation: 'Clark I, Landolt HP. Coffee, caffeine, and sleep: a systematic review. Sleep Med Rev. 2017.', url: 'https://pubmed.ncbi.nlm.nih.gov/26899133/' },
    ],
    body: [
      { type: 'p', text: 'Caffeine works by blocking adenosine, the molecule that builds up through the day and makes you feel sleepy. The catch is how long it sticks around: caffeine has a **half-life of about 5 hours** in a typical healthy adult. Drink a 200 mg coffee at 4 p.m. and roughly 100 mg is still circulating at 9 p.m.' },
      { type: 'h2', text: 'How late is too late?' },
      { type: 'p', text: 'A frequently cited [2013 clinical study](https://pubmed.ncbi.nlm.nih.gov/24235903/) gave people caffeine 0, 3, and 6 hours before bed. Even the **6-hours-before-bed dose measurably reduced total sleep** — and people often did not notice the damage themselves. That is the core problem: caffeine can flatten your sleep quality without making you feel wired.' },
      { type: 'callout', tone: 'tip', title: 'A simple rule of thumb', text: 'Set your "caffeine curfew" about 8–10 hours before your planned bedtime. If you go to bed at 11 p.m., make your last coffee around 1–3 p.m. People who are sensitive to caffeine, or who metabolize it slowly, may need an even earlier cutoff.' },
      { type: 'tool', slug: 'caffeine-curfew-calculator', label: 'Find your caffeine curfew' },
      { type: 'h2', text: 'Work backward from your bedtime' },
      { type: 'p', text: 'To set the curfew you first need a target bedtime — and the easiest way to find one that ends on a natural wake-up is to count in 90-minute sleep cycles from when you have to get up.' },
      { type: 'tool', slug: 'sleep-calculator', label: 'Find your ideal bedtime' },
      { type: 'p', text: 'Once you know your bedtime, subtract 8–10 hours for your last coffee. If poor sleep has already piled up, the [Sleep Debt Calculator](/tools/sleep-debt-calculator) shows how much you owe and how to repay it gradually.' },
      { type: 'h2', text: 'Things that change your cutoff' },
      { type: 'ul', items: [
        '**Genetics & sensitivity:** "slow metabolizers" clear caffeine far more slowly and should cut off earlier.',
        '**Dose:** a double espresso needs more lead time than a small cup.',
        '**Hidden sources:** tea, cola, energy drinks, pre-workout, dark chocolate, and some painkillers all add up.',
        '**Pregnancy & some medications:** can dramatically slow caffeine clearance — follow medical advice.',
      ] },
      { type: 'h3', text: 'Better-sleep habits that help more than timing alone' },
      { type: 'ul', items: [
        'Get morning daylight to anchor your body clock.',
        'Keep a consistent wake-up time, even on weekends.',
        'Swap the late coffee for decaf or herbal tea to keep the ritual.',
        'Dim screens and lights in the last hour before bed.',
      ] },
      { type: 'paa', items: [
        { q: 'What time should I stop drinking coffee?', a: 'Because caffeine has a ~5-hour half-life and can disrupt sleep even 6 hours out, a good default is to stop 8–10 hours before bed — roughly early-to-mid afternoon for an 11 p.m. bedtime.' },
        { q: 'Does afternoon coffee really affect sleep?', a: 'Yes. Controlled research found caffeine taken 6 hours before bed significantly reduced total sleep time, often without the person realizing their sleep had worsened.' },
        { q: 'How long does caffeine stay in your system?', a: 'About half is cleared in roughly 5 hours, but it takes around 10 hours or more to clear most of a dose — longer in slow metabolizers, during pregnancy, or with certain medications.' },
      ] },
    ],
  },

  // 5 ----------------------------------------------------------------------
  {
    slug: 'how-to-keep-muscle-while-losing-weight',
    title: 'How to Keep Muscle While Losing Weight',
    seoTitle: 'How to Keep Muscle While Losing Weight',
    metaDescription:
      'Lose fat without losing muscle: the three levers that matter most — a moderate deficit, high protein, and resistance training — explained simply.',
    category: 'fitness',
    excerpt:
      'Lose weight the wrong way and up to a quarter of it can be muscle. Three evidence-based levers keep the scale moving while protecting your strength.',
    author: 'HealthyLifeStyles Editorial Team',
    publishDate: '2026-04-26',
    updatedDate: '2026-06-08',
    primaryTool: 'muscle-preservation-calculator',
    relatedTools: ['muscle-preservation-calculator', 'protein-intake-calculator', 'calorie-deficit-calculator', 'one-rep-max-calculator'],
    relatedArticles: ['how-many-calories-to-lose-weight', 'how-much-protein-do-i-need'],
    sources: [
      { citation: 'Helms ER, et al. Evidence-based recommendations for natural bodybuilding contest prep: nutrition. J Int Soc Sports Nutr. 2014.', url: 'https://pubmed.ncbi.nlm.nih.gov/24864135/' },
      { citation: 'Longland TM, et al. Higher protein during an energy deficit preserves lean mass. Am J Clin Nutr. 2016.', url: 'https://pubmed.ncbi.nlm.nih.gov/26817506/' },
      { citation: 'Murphy C, Koehler K. Energy deficiency impairs resistance-training adaptations. Scand J Med Sci Sports. 2022.', url: 'https://pubmed.ncbi.nlm.nih.gov/34536305/' },
    ],
    body: [
      { type: 'p', text: 'When you lose weight, the scale does not care whether the loss is fat or muscle — but you should. Lose weight carelessly (big deficit, low protein, no training) and a meaningful share of what you drop can be lean mass, which lowers your metabolism and leaves you "skinny-fat." The good news: keeping muscle while leaning out comes down to three levers.' },
      { type: 'tool', slug: 'muscle-preservation-calculator', label: 'Check your muscle-loss risk' },
      { type: 'h2', text: 'Lever 1: Keep the deficit moderate' },
      { type: 'p', text: 'A gentle calorie deficit signals "lose some fat"; an extreme one signals "famine — break down everything, including muscle." Aim to lose around **0.5–1% of your body weight per week**. Faster than that and the share of loss coming from muscle climbs.' },
      { type: 'p', text: 'Set the number with the [Calorie Deficit Calculator](/tools/calorie-deficit-calculator), which warns you if your target pace is too aggressive.' },
      { type: 'callout', tone: 'warning', title: 'Crash diets cost muscle', text: 'Very aggressive deficits, especially with little protein and no resistance training, are the classic recipe for losing muscle along with fat. Slower is not just safer — it protects the lean mass that keeps your metabolism up.' },
      { type: 'h2', text: 'Lever 2: Eat enough protein' },
      { type: 'p', text: 'Protein is the single most important nutrient in a fat-loss phase. A [2016 controlled trial](https://pubmed.ncbi.nlm.nih.gov/26817506/) had participants train hard in a steep deficit; the higher-protein group *gained* a little lean mass while losing fat, and the lower-protein group did not. Aim for roughly **1.6–2.4 g/kg of body weight** while dieting — more than at maintenance.' },
      { type: 'tool', slug: 'protein-intake-calculator', label: 'Set your protein target' },
      { type: 'p', text: 'Then use the [Macro Calculator](/tools/macro-calculator) to fit carbs and fat around that protein for your calorie budget.' },
      { type: 'h2', text: 'Lever 3: Lift to keep the muscle you have' },
      { type: 'p', text: 'Protein supplies the building blocks, but **resistance training is the signal** that tells your body to hold onto muscle while fat comes off. You do not need to set personal records in a deficit — you need to keep training hard enough to maintain.' },
      { type: 'ul', items: [
        'Train each major muscle group about twice a week.',
        'Prioritize compound lifts (squat, hinge, push, pull).',
        'Keep the loads challenging; aim to maintain strength, not chase new maxes.',
        'Track a key lift over time — the [One-Rep Max Calculator](/tools/one-rep-max-calculator) lets you estimate strength without testing a true max.',
      ] },
      { type: 'h3', text: 'The simple checklist' },
      { type: 'ol', items: [
        'Moderate deficit (~0.5–1% body weight/week).',
        'High protein (1.6–2.4 g/kg).',
        'Resistance training 2–4× per week.',
        'Enough sleep — under-sleeping shifts loss toward muscle.',
        'Patience: protect the muscle and the fat takes care of itself.',
      ] },
      { type: 'paa', items: [
        { q: 'Can you lose fat and keep muscle at the same time?', a: 'Yes. With a moderate calorie deficit, high protein intake, and regular resistance training, most people can lose fat while maintaining — and beginners can even gain — muscle.' },
        { q: 'How do I stop losing muscle when dieting?', a: 'Keep your deficit moderate, eat 1.6–2.4 g of protein per kg of body weight, lift weights at least twice a week, and sleep enough. Those four together preserve lean mass.' },
        { q: 'How fast can I lose weight without losing muscle?', a: 'Around 0.5–1% of your body weight per week is the usual guideline. Faster loss increasingly comes from muscle rather than fat.' },
      ] },
    ],
  },

  // 6 ----------------------------------------------------------------------
  {
    slug: 'due-date-by-conception-date',
    title: 'Due Date by Conception Date: How It Works',
    seoTitle: 'Due Date by Conception Date: How It Works',
    metaDescription:
      'How due dates are calculated from conception, last period (Naegele’s rule), or IVF transfer — and why your ultrasound date may differ.',
    category: 'womens-health',
    excerpt:
      'Pregnancy is dated in a few different ways, and they do not always agree. Here is how a due date is estimated from conception, your last period, or IVF.',
    author: 'HealthyLifeStyles Editorial Team',
    publishDate: '2026-03-20',
    updatedDate: '2026-05-30',
    primaryTool: 'due-date-calculator',
    relatedTools: ['due-date-calculator', 'ovulation-calculator', 'pregnancy-week-calculator'],
    relatedArticles: [],
    sources: [
      { citation: 'American College of Obstetricians and Gynecologists (ACOG). Methods for Estimating the Due Date. Committee Opinion 700.', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date' },
      { citation: 'Naegele’s rule: LMP + 280 days (40 weeks) is the standard estimate.', url: 'https://www.ncbi.nlm.nih.gov/books/NBK459351/' },
      { citation: 'ACOG. Ultrasound dating in the first trimester is the most accurate method.', url: 'https://www.acog.org/womens-health' },
    ],
    body: [
      { type: 'p', text: 'A due date is only ever an **estimate** — fewer than 1 in 20 babies actually arrive on it. But the estimate matters, because it sets the clock for prenatal care. There are a few ways to calculate it, and they start counting from different moments.' },
      { type: 'h2', text: 'The three common methods' },
      { type: 'h3', text: '1. From your last menstrual period (Naegele’s rule)' },
      { type: 'p', text: 'The traditional method, **Naegele’s rule**, adds 280 days (40 weeks) to the first day of your last menstrual period (LMP). It assumes a regular 28-day cycle with ovulation on day 14, so pregnancy is "counted" from about two weeks before you actually conceived. That is why you can be "4 weeks pregnant" only two weeks after conception.' },
      { type: 'h3', text: '2. From conception date' },
      { type: 'p', text: 'If you know roughly when you conceived — for example from tracking [ovulation](/tools/ovulation-calculator) — the estimate is conception date **+ 266 days** (38 weeks), because it skips that pre-ovulation fortnight that the LMP method includes.' },
      { type: 'h3', text: '3. From an IVF transfer' },
      { type: 'p', text: 'IVF dates are the most precise, because the embryo’s age is known exactly. A day-5 (blastocyst) transfer is dated as transfer date + 261 days; a day-3 transfer adds 263 days.' },
      { type: 'tool', slug: 'due-date-calculator', label: 'Estimate your due date' },
      { type: 'callout', tone: 'info', title: 'Your ultrasound has the final say', text: 'According to [ACOG](https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date), a first-trimester ultrasound is the most accurate way to date a pregnancy. If your scan date differs from a calculator, your care team will use the scan. Always confirm dates with your OB-GYN or midwife.' },
      { type: 'h2', text: 'Why the methods disagree' },
      { type: 'p', text: 'The LMP method assumes textbook-regular cycles. If you ovulate earlier or later than day 14, or your cycles run long or short, the LMP estimate can be off by several days — while the conception-based estimate may be closer. This is exactly why early ultrasound dating exists, and why the number can shift slightly at your first scan.' },
      { type: 'ul', items: [
        'Track your cycle so you know your real ovulation day with the [Ovulation Calculator](/tools/ovulation-calculator).',
        'Once you have a due date, follow your progress with the [Pregnancy Week-by-Week](/tools/pregnancy-week-calculator) tool.',
        'Treat every date as an estimate and let your clinician confirm it.',
      ] },
      { type: 'paa', items: [
        { q: 'How is a due date calculated from conception?', a: 'Add 266 days (38 weeks) to the conception date. This is two weeks less than the last-period method, which counts from before ovulation.' },
        { q: 'Why is my due date based on my last period, not conception?', a: 'Most people know their last period date but not their exact conception date, so the 40-week (LMP + 280 days) method is the practical standard. An early ultrasound then refines it.' },
        { q: 'How accurate is a due date calculator?', a: 'It gives a solid estimate, but a first-trimester ultrasound is more accurate and takes precedence. Only about 1 in 20 babies are born on the estimated date.' },
      ] },
    ],
  },

  // 7 ----- Intermittent Fasting -----
  {
    slug: 'intermittent-fasting-for-beginners',
    title: 'Intermittent Fasting for Beginners: How to Pick a Schedule',
    seoTitle: 'Intermittent Fasting for Beginners: Pick a Schedule',
    metaDescription:
      'Intermittent fasting for beginners: compare 16:8, 18:6, OMAD and 5:2, learn what breaks a fast, and find a schedule you can actually keep.',
    category: 'nutrition',
    excerpt:
      'Cycling between eating and fasting windows — like 16:8 — can help you eat less without counting every calorie. Here’s how to pick a schedule you’ll keep.',
    author: 'HealthyLifeStyles Editorial Team',
    authorBio: 'researches and writes our evidence-based wellness guides, each checked by our medical review team.',
    publishDate: '2026-05-08',
    updatedDate: '2026-06-18',
    primaryTool: 'intermittent-fasting-calculator',
    relatedTools: ['intermittent-fasting-calculator', 'calorie-calculator', 'meal-plan-generator'],
    relatedArticles: ['how-many-calories-to-lose-weight', 'how-to-keep-muscle-while-losing-weight'],
    sources: [
      { citation: 'de Cabo R, Mattson MP. "Effects of Intermittent Fasting on Health, Aging, and Disease." N Engl J Med. 2019.', url: 'https://pubmed.ncbi.nlm.nih.gov/31881139/' },
      { citation: 'Patterson RE, Sears DD. "Metabolic Effects of Intermittent Fasting." Annu Rev Nutr. 2017.', url: 'https://pubmed.ncbi.nlm.nih.gov/28715993/' },
      { citation: 'Harvard T.H. Chan School of Public Health. "Diet Review: Intermittent Fasting for Weight Loss."', url: 'https://www.hsph.harvard.edu/nutritionsource/healthy-weight/diet-reviews/intermittent-fasting/' },
    ],
    body: [
      { type: 'p', text: 'Intermittent fasting means cycling between set eating and fasting windows instead of changing what you eat. The most popular schedule, 16:8, has you eat within an 8-hour window and fast for 16. For some people it curbs snacking and steadies energy — but the best schedule is simply the one you can stick to.' },
      { type: 'h2', text: 'What is intermittent fasting, exactly?' },
      { type: 'p', text: 'Most diets tell you **what** to eat. Intermittent fasting (IF) is about **when**. You pick a daily eating window — say noon to 8 p.m. — and eat all your food within it, fasting the rest of the day. Your overnight sleep does most of the work, so a 16-hour fast is gentler than it sounds.' },
      { type: 'p', text: 'There’s no magic switch. IF mostly works by quietly shrinking the hours in which you eat, which for many people means fewer total calories without tracking. The popular claims about autophagy and "metabolic switching" come largely from animal and early human studies — promising, but not a guarantee you’ll get those effects.' },
      { type: 'h2', text: 'Which fasting schedule should a beginner pick?' },
      { type: 'p', text: 'Start gentle, and only tighten the window if it feels easy. Here’s how the common protocols compare:' },
      { type: 'table', headers: ['Schedule', 'Fast / eat', 'Best for', 'Difficulty'], rows: [
        ['14:10', '14h fast / 10h eat', 'First-timers', 'Easy'],
        ['16:8', '16h fast / 8h eat', 'The popular default', 'Moderate'],
        ['18:6', '18h fast / 6h eat', 'Experienced fasters', 'Harder'],
        ['OMAD', '~23h fast / one meal', 'Simplicity seekers', 'Hard'],
        ['5:2', '2 low-calorie days a week', 'People who hate daily limits', 'Moderate'],
      ] },
      { type: 'p', text: 'New to this? Try 14:10 for a week or two, then move to 16:8. Enter your wake time and window below to see your exact eating and fasting hours with a live countdown:' },
      { type: 'tool', slug: 'intermittent-fasting-calculator', label: 'Try it: Intermittent Fasting Calculator' },
      { type: 'h2', text: 'What can you eat or drink while fasting?' },
      { type: 'p', text: 'During the fast, anything with calories restarts the clock. These keep you in the fasted state:' },
      { type: 'ul', items: [
        'Water and sparkling water',
        'Black coffee — no milk, sugar, or cream',
        'Plain tea',
        'A pinch of salt or electrolytes if you feel light-headed',
      ] },
      { type: 'p', text: 'A splash of milk in your coffee is the most common slip — small, but it adds calories and ends the fast. In your eating window, build meals around protein and whole foods; see [how much protein you really need](/wellness-hub/how-much-protein-do-i-need) to hold onto muscle.' },
      { type: 'h2', text: 'Does intermittent fasting actually help you lose weight?' },
      { type: 'p', text: 'It can — but not because of the clock itself. Reviews comparing IF with steady calorie cutting find similar weight loss when calories match. IF just makes the cutting easier for people who’d rather not track. If your eating window turns into a free-for-all, the deficit disappears. Pair it with a sensible target from the [Calorie Calculator](/tools/calorie-calculator) and read [how many calories to eat to lose weight](/wellness-hub/how-many-calories-to-lose-weight).' },
      { type: 'callout', tone: 'warning', title: 'Not for everyone', text: 'Skip intermittent fasting if you’re pregnant or breastfeeding, under 18, have a history of disordered eating, or take medication for diabetes or blood pressure that depends on meal timing. Talk to your doctor first.' },
      { type: 'h2', text: 'How long before you see results?' },
      { type: 'p', text: 'Most people need 2–4 weeks to settle into a window without watching the clock, and visible changes usually follow a consistent deficit over 6–12 weeks. Early scale drops are mostly water — judge progress over months, not days.' },
      { type: 'paa', items: [
        { q: 'Is 16:8 better than 18:6?', a: 'Not inherently. 16:8 is easier to sustain, and a schedule you keep beats a stricter one you abandon. Only tighten the window if 16:8 feels effortless.' },
        { q: 'Will I lose muscle if I fast?', a: 'You can if protein and resistance training are low. Hit your protein target and lift a few times a week and most of what you lose is fat — the [Muscle Preservation Calculator](/tools/muscle-preservation-calculator) can check your risk.' },
        { q: 'Does coffee break a fast?', a: 'Black coffee, plain tea, and water are fine. Milk, sugar, cream, or anything with calories breaks it.' },
        { q: 'Does fasting wreck your metabolism?', a: 'Short daily fasts don’t "starve" your metabolism. Very aggressive, prolonged restriction can lower energy expenditure over time, which is one reason a moderate approach wins.' },
        { q: 'Can I exercise while fasting?', a: 'Yes — many people train fasted comfortably. If you feel weak or light-headed, move harder workouts into your eating window.' },
      ] },
    ],
  },

  // 8 ----- Sleep Chronotypes -----
  {
    slug: 'sleep-chronotypes-explained',
    title: 'Sleep Chronotypes: Are You a Lion, Bear, Wolf, or Dolphin?',
    seoTitle: 'Sleep Chronotypes: Lion, Bear, Wolf or Dolphin?',
    metaDescription:
      'Lion, Bear, Wolf, or Dolphin? Learn the four sleep chronotypes, how to find yours, and how to schedule sleep and focus around your body clock.',
    category: 'sleep',
    excerpt:
      'Lion, Bear, Wolf, or Dolphin? Your chronotype is your body’s natural timing — and matching your day to it makes sleep and focus easier.',
    author: 'HealthyLifeStyles Editorial Team',
    authorBio: 'researches and writes our evidence-based wellness guides, each checked by our medical review team.',
    publishDate: '2026-05-15',
    updatedDate: '2026-06-19',
    primaryTool: 'sleep-chronotype-quiz',
    relatedTools: ['sleep-chronotype-quiz', 'sleep-calculator', 'caffeine-curfew-calculator'],
    relatedArticles: ['best-time-to-stop-drinking-coffee-for-sleep'],
    sources: [
      { citation: 'Roenneberg T, et al. "Life between clocks: daily temporal patterns of human chronotypes." J Biol Rhythms. 2003.', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Life+between+clocks+daily+temporal+patterns+human+chronotypes+Roenneberg' },
      { citation: 'Sleep Foundation. "Chronotypes: Definition, Types, & Effects."', url: 'https://www.sleepfoundation.org/how-sleep-works/chronotypes' },
      { citation: 'Blume C, Garbazza C, Spitschan M. "Effects of light on human circadian rhythms, sleep and mood." Somnologie. 2019.', url: 'https://pubmed.ncbi.nlm.nih.gov/31534436/' },
    ],
    body: [
      { type: 'p', text: 'Your chronotype is your body’s natural timing for sleep and peak energy. The popular framework sorts people into four animals — Lion (early bird), Bear (in sync with the sun, and most common), Wolf (night owl), and Dolphin (light, restless sleeper). Knowing yours lets you schedule sleep, deep work, and exercise with your clock instead of fighting it.' },
      { type: 'h2', text: 'What is a sleep chronotype?' },
      { type: 'p', text: 'A chronotype is your inherited lean toward mornings or evenings, set by your internal body clock. It’s why some people bound out of bed at 6 a.m. while others hit their stride at 10 p.m. It’s largely genetic and shifts predictably with age — but you have some room to nudge it.' },
      { type: 'h2', text: 'What are the four chronotypes?' },
      { type: 'p', text: 'Sleep researchers often describe four patterns. Most people are Bears; true Lions and Wolves are smaller groups; Dolphins are the lightest sleepers.' },
      { type: 'table', caption: 'Approximate shares vary by study — treat them as rough guides.', headers: ['Chronotype', 'Natural wake', 'Peak focus', 'Roughly % of people'], rows: [
        ['🦁 Lion', '5–6 a.m.', 'Early morning', '~15%'],
        ['🐻 Bear', '7 a.m.', 'Mid-morning to noon', '~50%'],
        ['🐺 Wolf', '9 a.m. or later', 'Late afternoon & evening', '~15%'],
        ['🐬 Dolphin', 'Restless, varies', 'Late morning', '~10%'],
      ] },
      { type: 'p', text: 'Not sure which fits? The quiz takes about a minute and gives you an ideal daily schedule:' },
      { type: 'tool', slug: 'sleep-chronotype-quiz', label: 'Try it: Sleep Chronotype Quiz' },
      { type: 'h2', text: 'Can you change your chronotype?' },
      { type: 'p', text: 'You can’t turn a Wolf into a Lion, but you can shift your clock by an hour or two. Morning daylight pulls you earlier; bright evening light and late screens push you later. Age moves it for you: children skew early, teens biologically skew late (which is why early school start times hurt them), and most people drift earlier again after 60.' },
      { type: 'h2', text: 'How do I use my chronotype day to day?' },
      { type: 'ol', items: [
        'Anchor a consistent wake time — the single biggest lever.',
        'Get outdoor light within an hour of waking to set your clock.',
        'Schedule your hardest thinking for your peak-focus window.',
        'Exercise when your body is most willing, not when you "should".',
        'Dim screens 1–2 hours before your natural bedtime — see [when to stop drinking coffee for sleep](/wellness-hub/best-time-to-stop-drinking-coffee-for-sleep).',
      ] },
      { type: 'p', text: 'One trap: treating your chronotype as a free pass. A Wolf who scrolls until 2 a.m. on weekends builds "social jet lag" — a gap between body clock and schedule that leaves you groggy all week. Knowing your type helps you plan around it, not skip good sleep habits.' },
      { type: 'callout', tone: 'tip', title: 'Time your caffeine', text: 'Whatever your type, caffeine has a roughly 5-hour half-life. Find your personal cut-off with the [Caffeine Curfew Calculator](/tools/caffeine-curfew-calculator).' },
      { type: 'paa', items: [
        { q: 'What is the rarest chronotype?', a: 'Dolphins and true Lions are the smaller groups (each roughly 10–15% of people); Bears are the majority.' },
        { q: 'Is being a night owl unhealthy?', a: 'Not on its own. Problems usually come from forcing a late clock into an early schedule, which shortens sleep. Protecting enough total sleep matters more than the timing.' },
        { q: 'What’s the difference between a chronotype and a circadian rhythm?', a: 'Your circadian rhythm is the ~24-hour clock everyone has; your chronotype is where that clock naturally sits — earlier or later than average.' },
        { q: 'Can I become a morning person?', a: 'You can shift earlier with consistent wake times and morning light, but you’ll likely stay near your natural type. Work with it where you can.' },
        { q: 'What chronotype is most common?', a: 'The Bear — about half of people. Bears wake and sleep roughly with the sun and do well on a standard 9-to-5.' },
      ] },
    ],
  },

  // 9 ----- Meal Plan -----
  {
    slug: 'how-to-build-a-meal-plan',
    title: 'How to Build a High-Protein Meal Plan You’ll Actually Follow',
    seoTitle: 'How to Build a High-Protein Meal Plan (Free)',
    metaDescription:
      'Build a meal plan that works: set calories, lock in protein, and keep it flexible. A simple 5-step framework, a sample day, and a free generator.',
    category: 'nutrition',
    excerpt:
      'A good meal plan starts with calories, locks in protein, and stays flexible enough to actually follow. Here’s the framework — plus a free generator.',
    author: 'HealthyLifeStyles Editorial Team',
    authorBio: 'researches and writes our evidence-based wellness guides, each checked by our medical review team.',
    publishDate: '2026-05-22',
    updatedDate: '2026-06-17',
    primaryTool: 'meal-plan-generator',
    relatedTools: ['meal-plan-generator', 'macro-calculator', 'protein-intake-calculator'],
    relatedArticles: ['how-much-protein-do-i-need', 'how-many-calories-to-lose-weight'],
    sources: [
      { citation: 'Jäger R, et al. "ISSN Position Stand: protein and exercise." J Int Soc Sports Nutr. 2017.', url: 'https://pubmed.ncbi.nlm.nih.gov/28642676/' },
      { citation: 'U.S. Department of Agriculture & HHS. "Dietary Guidelines for Americans, 2020–2025."', url: 'https://www.dietaryguidelines.gov/' },
      { citation: 'Academy of Nutrition and Dietetics. "How to Build a Healthy Eating Routine."', url: 'https://www.eatright.org/' },
    ],
    body: [
      { type: 'p', text: 'A solid meal plan starts with your daily calorie target, then locks in protein — about 1.6–2.2 grams per kilogram of body weight if you’re active — and fills the rest with carbs and fats you enjoy. Spread protein across three or four meals, plan around foods you’ll actually eat, and leave a little room for flexibility.' },
      { type: 'h2', text: 'How do you build a meal plan from scratch?' },
      { type: 'p', text: 'You don’t need an app or a dietitian to start. Five steps cover it:' },
      { type: 'ol', items: [
        'Set your calories — use the [Calorie Calculator](/tools/calorie-calculator) for maintenance, then subtract a modest deficit if you’re losing.',
        'Lock in protein — aim for 1.6–2.2 g/kg; the [Protein Intake Calculator](/tools/protein-intake-calculator) gives your number.',
        'Split the day — a common split is 25% breakfast, 35% lunch, 30% dinner, 10% snack.',
        'Pick foods you like for each slot, hitting protein at every meal.',
        'Build a grocery list and prep what you can ahead of time.',
      ] },
      { type: 'p', text: 'Prefer to skip the math? The generator does all five steps from your targets and diet style:' },
      { type: 'tool', slug: 'meal-plan-generator', label: 'Try it: 7-Day Meal Plan Generator' },
      { type: 'h2', text: 'How much protein should each meal have?' },
      { type: 'p', text: 'Muscle responds best to protein spread out rather than dumped into one meal. Aim for roughly 0.4 g per kg of body weight per meal — about 25–40 g for most people — enough to cross the "leucine threshold" that triggers muscle repair. Here’s how a high-protein day around 2,000 calories can look:' },
      { type: 'table', caption: 'A sample 2,000 kcal day with about 145 g of protein.', headers: ['Meal', 'Example', 'Calories', 'Protein'], rows: [
        ['Breakfast', 'Greek yogurt, berries, oats', '~450', '35 g'],
        ['Lunch', 'Chicken, rice, vegetables', '~650', '45 g'],
        ['Dinner', 'Salmon, potatoes, salad', '~600', '40 g'],
        ['Snack', 'Cottage cheese & fruit', '~300', '25 g'],
      ] },
      { type: 'h2', text: 'How do you make a meal plan you’ll actually stick to?' },
      { type: 'ul', items: [
        'Repeat breakfasts and snacks — save the variety for lunch and dinner.',
        'Batch-cook proteins and grains once or twice a week.',
        'Leave 10–15% of calories for treats so the plan survives real life.',
        'Shop from your list to avoid impulse buys.',
      ] },
      { type: 'p', text: 'The best plan is rarely the "optimal" one. Near-perfect adherence to a slightly imperfect plan beats perfect macros you abandon by Wednesday. Build for your real schedule, not an ideal one.' },
      { type: 'callout', tone: 'tip', title: 'Protein on a budget', text: 'Eggs, canned tuna, lentils, Greek yogurt, and frozen chicken are cheap, high-protein staples that make any plan easier to hit.' },
      { type: 'h2', text: 'Should you plan differently for weight loss or muscle gain?' },
      { type: 'p', text: 'The structure is identical; only the calorie target moves. For fat loss, eat below maintenance and keep protein high to protect muscle — see [how to keep muscle while losing weight](/wellness-hub/how-to-keep-muscle-while-losing-weight). For muscle gain, eat a slight surplus. The [Macro Calculator](/tools/macro-calculator) sets carbs and fat around your protein either way.' },
      { type: 'paa', items: [
        { q: 'How many meals a day should I eat to lose weight?', a: 'Total calories matter far more than meal count. Three to four meals suits most people — choose the number that keeps you full and consistent.' },
        { q: 'Is meal prep worth it?', a: 'For most people, yes. Prepping even one or two components (a protein and a grain) removes daily decisions and makes hitting your targets far easier.' },
        { q: 'How do I hit my protein target?', a: 'Anchor every meal with a protein source, use Greek yogurt or a shake to close gaps, and read labels by grams of protein per serving.' },
        { q: 'Can I eat the same meals every day?', a: 'Yes. Repetition makes planning and shopping easier — just cover protein, plenty of vegetables, and enough variety to stay interested.' },
        { q: 'Do I have to count calories forever?', a: 'No. Most people track for a few weeks to learn portion sizes, then maintain with awareness rather than weighing everything.' },
      ] },
    ],
  },

  // 10 ----- Weight Loss Timeline -----
  {
    slug: 'how-long-does-it-take-to-lose-weight',
    title: 'How Long Does It Take to Lose Weight? A Realistic Timeline',
    seoTitle: 'How Long Does It Take to Lose Weight?',
    metaDescription:
      'A realistic weight-loss timeline by goal (10, 20, 50 lb), why the scale stalls, and how to keep it off — at a safe, sustainable pace.',
    category: 'weight-loss',
    excerpt:
      'Safe weight loss takes longer than reality TV suggests. Here’s a realistic timeline by goal — and why the scale stalls partway through.',
    author: 'HealthyLifeStyles Editorial Team',
    authorBio: 'researches and writes our evidence-based wellness guides, each checked by our medical review team.',
    publishDate: '2026-05-29',
    updatedDate: '2026-06-20',
    primaryTool: 'weight-loss-timeline-calculator',
    relatedTools: ['weight-loss-timeline-calculator', 'calorie-deficit-calculator', 'calorie-calculator'],
    relatedArticles: ['how-many-calories-to-lose-weight', 'how-to-keep-muscle-while-losing-weight'],
    sources: [
      { citation: 'Centers for Disease Control and Prevention (CDC). "Losing Weight" — about 1 to 2 pounds per week.', url: 'https://www.cdc.gov/healthyweight/losing_weight/index.html' },
      { citation: 'Hall KD, et al. "Metabolic adaptation to weight loss." Obesity / energy-balance research.', url: 'https://pubmed.ncbi.nlm.nih.gov/26399868/' },
      { citation: 'National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK). Body Weight Planner.', url: 'https://www.niddk.nih.gov/bwp' },
    ],
    body: [
      { type: 'p', text: 'At a safe, sustainable pace of about 0.5–1 kg (1–2 lb) a week, losing 5 kg takes roughly 5–10 weeks and 10 kg about 10–20 weeks. Your exact timeline depends on your starting weight and how large a calorie deficit you can hold without losing muscle or burning out.' },
      { type: 'h2', text: 'How fast can you safely lose weight?' },
      { type: 'p', text: 'The CDC and most clinicians point to 1–2 pounds (about 0.5–1 kg) a week as the sweet spot — roughly up to 1% of your body weight. Heavier people can safely lose a little faster at first; lighter people should expect slower. Going faster usually means shedding muscle and water rather than fat, and it’s far harder to sustain.' },
      { type: 'h2', text: 'How long will it take to lose 10, 20, or 50 pounds?' },
      { type: 'p', text: 'At a steady pace the arithmetic is simple. These ranges assume a consistent deficit:' },
      { type: 'table', headers: ['Goal', 'At ~1 lb/week', 'At ~2 lb/week'], rows: [
        ['10 lb (4.5 kg)', '~10 weeks', '~5 weeks'],
        ['20 lb (9 kg)', '~20 weeks (5 months)', '~10 weeks'],
        ['30 lb (14 kg)', '~30 weeks (7 months)', '~15 weeks'],
        ['50 lb (23 kg)', '~50 weeks (1 year)', '~25 weeks'],
      ] },
      { type: 'p', text: 'See your own projected date and a week-by-week chart — at a pace the tool keeps safe:' },
      { type: 'tool', slug: 'weight-loss-timeline-calculator', label: 'Try it: Weight Loss Timeline Calculator' },
      { type: 'h2', text: 'Why does weight loss slow down over time?' },
      { type: 'p', text: 'Two reasons. First, a lighter body burns fewer calories, so the deficit that worked at the start shrinks — a real effect called metabolic adaptation. Second, and most misunderstood: the dramatic drop in week one is mostly water and glycogen, not fat. When the scale "stalls" around week three, fat loss is often still happening — you’ve just stopped shedding water.' },
      { type: 'callout', tone: 'tip', title: 'Re-check your numbers', text: 'Every few weeks, recalculate your target as you get lighter. The [Calorie Deficit Calculator](/tools/calorie-deficit-calculator) shows the daily deficit your new weight needs.' },
      { type: 'h2', text: 'How do you keep the weight off?' },
      { type: 'ul', items: [
        'Lose at a pace you can imagine living with — habits, not heroics.',
        'Keep protein high and strength-train to protect muscle and metabolism.',
        'Plan a maintenance phase; staying at weight is a skill, not a finish line.',
        'Track the trend over weeks, not daily fluctuations.',
      ] },
      { type: 'p', text: 'The biggest predictor of keeping weight off isn’t how fast you lost it — it’s whether the way you lost it is something you can continue. That’s why slow usually wins. For the calorie side, start with [how many calories to eat to lose weight](/wellness-hub/how-many-calories-to-lose-weight).' },
      { type: 'paa', items: [
        { q: 'Is losing 2 lb a week realistic?', a: 'For heavier people, yes — at least early on. As you get lighter it becomes harder and more likely to cost muscle, so many people settle around 1 lb a week.' },
        { q: 'Why did my weight loss stall?', a: 'Usually a shrinking deficit as you get lighter, water-weight swings masking fat loss, or portions creeping up. Recalculate your target, tighten tracking for two weeks, and look at the monthly trend.' },
        { q: 'How much weight can you lose in a month safely?', a: 'About 4–8 lb (2–4 kg) for most people, at 1–2 lb a week. Faster than that is usually water and muscle, not fat.' },
        { q: 'Does losing weight slowly help you keep it off?', a: 'It tends to, mainly because a slower pace is built on habits you can sustain. The method that fits your life is the one that lasts.' },
        { q: 'How long does it take to lose 20 pounds?', a: 'Roughly 10 weeks at 2 lb a week or 20 weeks at 1 lb a week, depending on how consistent your deficit is.' },
      ] },
    ],
  },

  // Macros ------------------------------------------------------------------
  {
    slug: 'how-to-calculate-your-macros',
    title: 'How to Calculate Your Macros for Your Goal',
    seoTitle: 'How to Calculate Your Macros for Your Goal',
    metaDescription:
      'Calculate your macros in three steps: set protein by body weight, add fat, then fill the rest with carbs — for fat loss, maintenance or muscle gain.',
    category: 'nutrition',
    excerpt:
      'Calories decide whether your weight changes; macros decide what that weight is — fat or muscle. Here’s how to set your protein, carbs, and fat for your goal, and adjust them as you go.',
    author: 'HealthyLifeStyles Editorial Team',
    authorBio:
      'researches and writes our evidence-based wellness guides, each checked by our medical review team.',
    publishDate: '2026-06-23',
    updatedDate: '2026-06-23',
    primaryTool: 'macro-calculator',
    relatedTools: ['macro-calculator', 'calorie-calculator', 'protein-intake-calculator', 'meal-plan-generator'],
    relatedArticles: ['how-much-protein-do-i-need', 'how-many-calories-to-lose-weight', 'how-to-build-a-meal-plan'],
    sources: [
      { citation: 'Jäger R, et al. ISSN Position Stand: Protein and Exercise. J Int Soc Sports Nutr. 2017.', url: 'https://pubmed.ncbi.nlm.nih.gov/28642676/' },
      { citation: 'U.S. Department of Agriculture & HHS. Dietary Guidelines for Americans, 2020–2025 (Acceptable Macronutrient Distribution Ranges).', url: 'https://www.dietaryguidelines.gov/' },
      { citation: 'Morton RW, et al. A systematic review of protein supplementation and resistance-training adaptations. Br J Sports Med. 2018.', url: 'https://pubmed.ncbi.nlm.nih.gov/28698222/' },
    ],
    body: [
      { type: 'p', text: 'To calculate your macros, start from your daily calorie target, then split it in three steps: set **protein** first at about 1.6–2.2 g per kilogram of body weight, add **fat** at roughly 0.8–1 g per kg, and fill the rest with **carbs**. Protein and carbs have 4 calories per gram; fat has 9.' },
      { type: 'p', text: 'That order matters. Protein protects muscle and keeps you full, fat covers your hormones and a lot of flavour, and carbs are the flexible fuel you adjust to fit your calories. Get protein and total calories right, and the exact carb-to-fat split is mostly down to preference.' },

      { type: 'h2', text: 'What are macros, exactly?' },
      { type: 'p', text: '**Macros** — short for macronutrients — are the three nutrients your body needs in large amounts: protein, carbohydrate, and fat. Each supplies energy. Protein and carbohydrate give about 4 calories per gram; fat gives about 9. (Alcohol, at 7 calories per gram, is a fourth energy source, but it isn’t a nutrient you build a plan around.)' },
      { type: 'p', text: 'Your macro targets are just your calorie target divided into those three buckets. So macros never override calories — they organise them.' },

      { type: 'h2', text: 'How to calculate your macros, step by step' },
      { type: 'p', text: 'This is the protein-first method most evidence-based coaches use:' },
      { type: 'ol', items: [
        '**Find your calories.** Start from your maintenance calories (TDEE), then subtract for fat loss or add for muscle gain. Not sure of the number? Use the [Calorie Calculator](/tools/calorie-calculator) first.',
        '**Set protein.** Aim for 1.6–2.2 g per kg of body weight (about 0.7–1 g per pound), toward the higher end when you’re in a deficit or training hard. Multiply your grams by 4 for protein calories.',
        '**Set fat.** Use 0.8–1 g per kg (roughly 20–35% of calories). Dropping much lower can hit your hormones and leave you hungry. Multiply by 9 for fat calories.',
        '**Fill the rest with carbs.** Subtract your protein and fat calories from your total, then divide what’s left by 4. Those are your carb grams — your training fuel.',
      ] },
      { type: 'p', text: 'Worked example: a 70 kg (154 lb) person eating 2,000 calories might land on roughly 140 g protein (560 cal), 60 g fat (540 cal), and 225 g carbs (900 cal). A calculator does this instantly, but running it by hand once shows you why the numbers move the way they do.' },

      { type: 'tool', slug: 'macro-calculator', label: 'Try it: Macro Calculator' },

      { type: 'h2', text: 'Do macros matter more than calories?' },
      { type: 'p', text: 'No — calories decide whether your weight goes up or down; macros decide what that weight is and how the diet feels. You can lose fat on almost any split as long as you’re in a calorie deficit. But hit a high-protein target and you’ll keep more muscle, feel fuller, and recover better than on the same calories with low protein.' },
      { type: 'callout', tone: 'tip', title: 'The detail most macro guides miss', text: 'Set protein in **grams from your body weight**, not as a percentage of calories. “30% protein” sounds fixed, but 30% of 2,500 calories and 30% of 1,500 are very different amounts — so as you diet and eat less, a percentage quietly shrinks your protein right when you need it most. Grams per kilogram stays honest.' },

      { type: 'h2', text: 'What’s the best macro ratio to lose fat?' },
      { type: 'p', text: 'There isn’t one magic ratio. Once protein and calories are set, the leftover energy can lean toward carbs or fat based on what suits you — active people and heavier trainers usually feel better with more carbs, others prefer more fat. A balanced fat-loss starting point is roughly 40% carbs / 30% protein / 30% fat, but treat that as a starting line, not a rule.' },
      { type: 'table', caption: 'Set protein and fat in grams per kilogram of body weight; carbohydrate fills the remaining calories.', headers: ['Goal', 'Calories', 'Protein', 'Fat', 'Carbs'], rows: [
        ['Fat loss (cut)', 'TDEE − 15–20%', '2.0–2.2 g/kg', '0.8–1 g/kg', 'Remaining'],
        ['Maintenance', '≈ TDEE', '1.6–1.8 g/kg', '~1 g/kg', 'Remaining'],
        ['Muscle gain (bulk)', 'TDEE + 5–10%', '1.6–2.0 g/kg', '~1 g/kg', 'Remaining'],
      ] },

      { type: 'h2', text: 'How much protein do you need per day?' },
      { type: 'p', text: 'For most active adults, 1.6–2.2 g per kg of body weight a day covers muscle maintenance and growth, with the upper end helping while you diet. For a 70 kg (154 lb) person that’s about 112–154 g daily, spread over 3–4 meals of 20–40 g. For the full picture — including older adults and plant-based eaters — see [how much protein you really need](/wellness-hub/how-much-protein-do-i-need).' },

      { type: 'h2', text: 'How to adjust your macros as you progress' },
      { type: 'p', text: 'Macros aren’t set once. Recalculate when the scale moves meaningfully — about every 4–6 kg (10 lb) of change, or whenever progress stalls for two to three weeks.' },
      { type: 'ul', items: [
        '**Lost weight?** Bring calories and carbs down a little; keep protein in grams roughly the same — it’s tied to your new body weight, so it barely changes.',
        '**Stalled in a cut?** Trim carbs or add daily steps before touching protein or fat — those two protect muscle and keep you full.',
        '**Gaining too fast on a bulk?** Pull carbs back first. You want to add muscle, not just weight.',
        '**Energy in the gym tanking?** Shift some calories from fat to carbs at the same total — carbs fuel hard training.',
      ] },
      { type: 'p', text: 'Then turn the numbers into food. The [7-Day Meal Plan Generator](/tools/meal-plan-generator) builds a week of meals around your targets, with a grocery list.' },

      { type: 'paa', items: [
        { q: 'How do I calculate my macros for weight loss?', a: 'Set calories below maintenance (a deficit of about 15–20% works well), keep protein high at 2.0–2.2 g per kg of body weight, set fat around 0.8–1 g per kg, and fill the rest with carbs. The deficit drives fat loss; the high protein protects your muscle.' },
        { q: 'Is counting macros better than counting calories?', a: 'Counting calories alone is enough to change your weight. Counting macros adds control over body composition and how full you feel, because it guarantees you hit protein. Many people count calories and protein only, and let carbs and fat fall where they like.' },
        { q: 'What macro split should I start with?', a: 'A balanced starting point is roughly 30% protein, 30% fat, 40% carbs — then adjust. But set protein and fat in grams per kilogram first and let carbs fill the rest; the percentages are the result, not the goal.' },
        { q: 'Do I need to hit my macros exactly every day?', a: 'No. Aim to land within about 5–10 g of your protein and calorie targets most days. Carbs and fat can flex day to day — weekly consistency matters more than daily perfection.' },
        { q: 'How many grams of protein, carbs, and fat should I eat?', a: 'It depends on your weight and calories, but a common example for a 70 kg adult eating 2,000 calories is about 140 g protein, 225 g carbs, and 60 g fat. Calculate your own with the macro calculator above.' },
      ] },

      { type: 'p', text: 'Get your calories and protein right, set fat sensibly, let carbs fill the gap — then recheck the numbers as your body changes. That’s the whole skill.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Articles per page in category archives. */
export const ARTICLES_PER_PAGE = 9;

export const getArticle = (slug: string): Article | undefined =>
  ARTICLES.find((a) => a.slug === slug);

export const getArticleCategory = (id: string): ArticleCategory | undefined =>
  ARTICLE_CATEGORIES.find((c) => c.id === id || c.slug === id);

const byNewest = (a: Article, b: Article) =>
  (b.updatedDate || b.publishDate).localeCompare(a.updatedDate || a.publishDate);

export const getArticlesByCategory = (categoryId: string): Article[] =>
  ARTICLES.filter((a) => a.category === categoryId).sort(byNewest);

export const countArticlesByCategory = (categoryId: string): number =>
  ARTICLES.filter((a) => a.category === categoryId).length;

export const getFeaturedArticle = (): Article =>
  ARTICLES.find((a) => a.featured) ?? [...ARTICLES].sort(byNewest)[0];

export const getLatestArticles = (limit = 6, excludeSlug?: string): Article[] =>
  [...ARTICLES].sort(byNewest).filter((a) => a.slug !== excludeSlug).slice(0, limit);

/** Related articles: explicit list first, then same-category, then latest. */
export const getRelatedArticles = (slug: string, limit = 3): Article[] => {
  const article = getArticle(slug);
  if (!article) return [];
  const out: Article[] = [];
  const push = (a?: Article) => {
    if (a && a.slug !== slug && !out.includes(a)) out.push(a);
  };
  (article.relatedArticles ?? []).forEach((s) => push(getArticle(s)));
  getArticlesByCategory(article.category).forEach(push);
  getLatestArticles(ARTICLES.length).forEach(push);
  return out.slice(0, limit);
};

/** Articles that reference a given tool — drives the tool→article back-links. */
export const getArticlesForTool = (toolSlug: string, limit = 3): Article[] =>
  ARTICLES.filter((a) => a.primaryTool === toolSlug || a.relatedTools.includes(toolSlug))
    .sort(byNewest)
    .slice(0, limit);

/** All readable text of an article (for reading-time / word counts). */
export const articlePlainText = (article: Article): string => {
  const parts: string[] = [article.title, article.excerpt];
  for (const b of article.body) {
    if (b.type === 'p' || b.type === 'h2' || b.type === 'h3') parts.push(stripInline(b.text));
    else if (b.type === 'callout') parts.push(stripInline(b.text));
    else if (b.type === 'ul' || b.type === 'ol') parts.push(...b.items.map(stripInline));
    else if (b.type === 'table') parts.push(...b.headers, ...b.rows.flat().map(stripInline));
    else if (b.type === 'paa') parts.push(...b.items.flatMap((i) => [i.q, i.a]));
  }
  return parts.join(' ');
};

/** People-Also-Ask Q/A pairs across the article (for FAQPage JSON-LD). */
export const articleFaq = (article: Article): { q: string; a: string }[] =>
  article.body.filter((b): b is Extract<ArticleBlock, { type: 'paa' }> => b.type === 'paa')
    .flatMap((b) => b.items);

/** E-E-A-T review line shared by every article. */
export const ARTICLE_REVIEW = {
  reviewer: EDITORIAL.reviewerName,
  credential: EDITORIAL.reviewerCredential,
  lastReviewed: EDITORIAL.lastReviewed,
};
