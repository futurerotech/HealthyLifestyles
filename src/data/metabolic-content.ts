/** Long-form, source-cited content for the Metabolic Health tools. */
import { pubmed, type Source, type ToolContent } from './content-types';

const MIFFLIN: Source = {
  citation:
    'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. "A new predictive equation for resting energy expenditure in healthy individuals." Am J Clin Nutr. 1990;51(2):241–247.',
  url: pubmed('A new predictive equation for resting energy expenditure in healthy individuals'),
};
const CDC_ALCOHOL: Source = {
  citation: 'Centers for Disease Control and Prevention (CDC). "Dietary Guidelines for Alcohol" — up to 1 drink/day (women) or 2 (men).',
  url: 'https://www.cdc.gov/alcohol/about-alcohol-use/moderate-alcohol-use.html',
};
const NHS_ALCOHOL: Source = {
  citation: 'UK National Health Service (NHS). "Alcohol units" — keep to 14 units a week or less.',
  url: 'https://www.nhs.uk/live-well/alcohol-advice/calculating-alcohol-units/',
};
const DGA_ALCOHOL: Source = {
  citation: 'U.S. Dietary Guidelines for Americans, 2020–2025 — alcohol provides 7 kcal/g and no nutritional value.',
  url: 'https://www.dietaryguidelines.gov/',
};

export const METABOLIC_CONTENT: Record<string, ToolContent> = {
  // ============================================================
  'metabolic-age-calculator': {
    seoTitle: 'Metabolic Age Calculator (Free Estimate)',
    metaDescription:
      'Estimate your metabolic age from your BMR versus the average for your age — an illustrative fitness estimate, not a medical measurement. Free.',
    intro:
      'Curious how your metabolism compares to your real age? This tool estimates a "metabolic age" from your Basal Metabolic Rate (BMR). It’s a fun, illustrative number — not a medical measurement.',
    notice:
      'A simplified, illustrative estimate popularized by the fitness industry — not a medical measurement. It is based only on BMR and body size, so read it as motivation, not a diagnosis.',
    sections: [
      {
        h2: 'What is "metabolic age"?',
        paragraphs: [
          'Metabolic age is a consumer-fitness concept (you’ll see it on smart scales) that compares your metabolism to the average for different ages. The idea: if your body burns more energy at rest than is typical for your age, your "metabolic age" is younger than your real age — and if it burns less, it’s older.',
          'It is not a clinical measurement and has no formal medical definition. Treat it as a friendly motivator, not a health verdict.',
        ],
      },
      {
        h2: 'How we estimate it (transparently)',
        paragraphs: [
          'We calculate your Basal Metabolic Rate using the well-validated Mifflin-St Jeor equation from your height, weight, age and sex. We then compare that BMR to a typical BMR for your age and sex, and map the gap onto an age — a higher BMR points to a younger estimate. To keep it honest and non-alarmist, the result is capped to within ±12 years of your real age.',
          'An important caveat: because BMR rises with body size, simply being larger can lower the estimate. Real metabolic health is driven much more by muscle mass, activity and overall fitness than by a single number.',
        ],
      },
      {
        h2: 'How to actually improve your metabolism',
        list: {
          items: [
            'Build muscle with resistance training — muscle is more metabolically active than fat.',
            'Stay active daily (NEAT) — steps, standing, and moving all add up.',
            'Eat enough protein to support and maintain muscle.',
            'Prioritize sleep and manage stress, which influence appetite and energy.',
          ],
        },
      },
    ],
    faq: [
      { q: 'Is metabolic age a real medical measurement?', a: 'No. It’s a consumer-fitness concept with no formal clinical definition. This tool gives an illustrative estimate from your BMR — useful as motivation, not as a diagnosis.' },
      { q: 'How is metabolic age calculated here?', a: 'We compute your BMR with the Mifflin-St Jeor equation, compare it to a typical BMR for your age and sex, and map the difference onto an age (capped at ±12 years of your real age).' },
      { q: 'How can I lower my metabolic age?', a: 'Build and keep muscle through resistance training, stay active throughout the day, eat enough protein, and sleep well. These raise or protect your BMR over time.' },
      { q: 'Why is my metabolic age younger when I weigh more?', a: 'BMR rises with body size, so a larger body can produce a higher BMR and a "younger" estimate. This is a known limitation of BMR-based metabolic age — it doesn’t measure body composition.' },
    ],
    sources: [MIFFLIN],
  },
  // ============================================================
  'alcohol-calorie-calculator': {
    seoTitle: 'Alcohol Calorie Calculator (Weekly & Yearly)',
    metaDescription:
      'Add up the calories in your weekly drinks — beer, wine, spirits, cocktails — and see the monthly and yearly total, with low-risk guidance. Free.',
    intro:
      'Alcohol is one of the easiest sources of "hidden" calories to overlook. Enter your weekly drinks to see the calories per week, month and year — plus what that adds up to over time.',
    notice:
      'Educational and non-judgmental — not medical advice. If you find it hard to cut back, your doctor or a support service can help.',
    sections: [
      {
        h2: 'Where alcohol calories come from',
        paragraphs: [
          'Alcohol itself carries about 7 calories per gram — almost as much as pure fat (9 kcal/g) and nearly double carbohydrates or protein (4 kcal/g). Unlike food, those are "empty" calories with no useful nutrients, and sugary mixers, cream liqueurs and large pours pile on more.',
          'A typical 12-oz beer is around 150 calories, a 5-oz glass of wine about 125, a 1.5-oz shot of spirits roughly 97, and a cocktail commonly 200–250 or more.',
        ],
      },
      {
        h2: 'How it adds up over a year',
        paragraphs: [
          'A few drinks a week looks small, but the calories compound. The calculator multiplies your weekly total out to a year and shows a relatable equivalent in body fat (using the rough 3,500-calorie-per-pound rule) — assuming those calories aren’t burned off through activity. It’s a useful gut-check, not a precise prediction.',
        ],
      },
      {
        h2: 'Low-risk drinking guidance',
        paragraphs: [
          'For calories and health alike, less is better. The U.S. CDC defines moderate drinking as up to 1 drink a day for women and 2 for men, and the UK NHS advises keeping to 14 units a week or less, spread over three or more days with some drink-free days. Cutting back even a little is an easy win for both your waistline and your health.',
        ],
      },
    ],
    faq: [
      { q: 'How many calories are in alcohol?', a: 'Alcohol provides about 7 calories per gram. A 12-oz beer is ~150 kcal, a 5-oz glass of wine ~125, a 1.5-oz spirit ~97, and a typical cocktail 200–250+.' },
      { q: 'Can alcohol make you gain weight?', a: 'Yes — alcohol calories add to your daily total and are easy to overlook. Regular drinking can contribute meaningful calories over a week, month and year, especially with sugary mixers.' },
      { q: 'How much alcohol is low-risk?', a: 'The CDC suggests up to 1 drink/day for women and 2 for men; the UK NHS advises ≤14 units per week with several drink-free days. Less is better for both calories and health.' },
      { q: 'Does the body store alcohol calories as fat?', a: 'Your body prioritizes burning alcohol first, which means other calories from that meal are more likely to be stored. Over time, surplus calories from any source — including alcohol — can be stored as fat.' },
    ],
    sources: [DGA_ALCOHOL, CDC_ALCOHOL, NHS_ALCOHOL],
  },
};
