/** Long-form, source-cited content for the Metabolic Health tools. */
import { pubmed, type Source, type ToolContent } from './content-types';

const MIFFLIN: Source = {
  citation:
    'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. "A new predictive equation for resting energy expenditure in healthy individuals." Am J Clin Nutr. 1990;51(2):241–247.',
  url: pubmed('A new predictive equation for resting energy expenditure in healthy individuals'),
};
const CDC_ALCOHOL: Source = {
  citation: 'CDC. About Moderate Alcohol Use (2025). Less alcohol is better; even moderate drinking may increase cancer and other health risks.',
  url: 'https://www.cdc.gov/alcohol/about-alcohol-use/moderate-alcohol-use.html',
};
const CDC_ALCOHOL_CANCER: Source = {
  citation: 'CDC. Alcohol and Cancer (January 2026). Alcohol increases the risk of several cancers, and reducing intake lowers risk.',
  url: 'https://www.cdc.gov/cancer/risk-factors/alcohol.html',
};
const NHS_ALCOHOL: Source = {
  citation: 'UK National Health Service (NHS). "Alcohol units" — keep to 14 units a week or less.',
  url: 'https://www.nhs.uk/live-well/alcohol-advice/calculating-alcohol-units/',
};
const NIAAA_ALCOHOL_CALORIES: Source = {
  citation: 'National Institute on Alcohol Abuse and Alcoholism (NIAAA). Rethinking Drinking: Alcohol Calorie Calculator.',
  url: 'https://rethinkingdrinking.niaaa.nih.gov/tools/calculators/alcohol-calorie-calculator',
};

export const METABOLIC_CONTENT: Record<string, ToolContent> = {
  // ============================================================
  'metabolic-age-calculator': {
    seoTitle: 'Metabolic Age Calculator (BMR Illustration)',
    metaDescription:
      'See a fictional BMR-based age index with transparent assumptions. It does not measure metabolic health or biological age.',
    intro:
      'This tool converts predicted resting energy use into an illustrative age index. A lower number does not prove better health or fitness, and it is not a medical measurement.',
    notice:
      'An unvalidated consumer-fitness index only. Increasing weight by itself can lower the number without improving health. Never treat it as a diagnosis or a goal for weight changes.',
    sections: [
      {
        h2: 'What is "metabolic age"?',
        paragraphs: [
          'Metabolic age is a consumer-fitness term used by some smart scales. There is no universal clinical scale that turns resting energy expenditure into biological age or cardiometabolic risk.',
          'A favorable-looking result is not evidence of better metabolic health; use proven clinical measurements and lifestyle goals instead.',
        ],
      },
      {
        h2: 'How we estimate it (transparently)',
        paragraphs: [
          'We predict resting energy expenditure with the Mifflin-St Jeor equation and compare it with custom age-and-sex reference constants. An arbitrary 40 kcal/day difference becomes one model year, with the age result capped near your actual age. These reference values and the age mapping are not validated clinical or population age standards.',
          'Increasing body weight can mechanically increase predicted BMR and make this age index look younger, without proving improved metabolic health. The [Obesity Medicine Association review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10661987/) documents the effects of body mass and composition on resting energy expenditure.',
        ],
      },
      {
        h2: 'What matters more than an age index',
        list: {
          items: [
            'Maintain functional strength with resistance training appropriate to your abilities; do not aim to change a fictional age value.',
            'Stay active regularly as your health permits, independent of the age number displayed above.',
            'Get adequate nutrition and protein for your needs, with clinical guidance when necessary.',
            'Prioritize sleep, stress management and overall health rather than a model output.',
          ],
        },
      },
    ],
    faq: [
      { q: 'Is metabolic age a real medical measurement?', a: 'No. This is an unvalidated index derived from predicted BMR and custom comparison constants, not a clinical age or metabolic health measurement.' },
      { q: 'How is metabolic age calculated here?', a: 'We estimate BMR, compare it with custom sex/age constants, then divide the difference by 40 kcal/day per model year. This is not a validated age standard.' },
      { q: 'Should I try to lower my metabolic age?', a: 'No health benefit is established from lowering this unvalidated number. Focus on appropriate activity, nutrition, sleep and individual health measurements instead.' },
      { q: 'Why is my metabolic age younger when I weigh more?', a: 'Body size affects predicted BMR; added weight can produce a younger-looking result without better metabolic health. This index does not measure body composition or disease risk.' },
    ],
    sources: [MIFFLIN, { citation: 'Obesity Medicine Association. Clinical Practice Statement: Energy Expenditure (2022).', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10661987/' }, { citation: 'National Academies. Dietary Reference Intakes for Energy (2023), factors affecting resting energy expenditure.', url: 'https://www.ncbi.nlm.nih.gov/books/NBK591031/' }],
  },
  // ============================================================
  'alcohol-calorie-calculator': {
    seoTitle: 'Alcohol Calorie Calculator (Weekly & Yearly)',
    metaDescription:
      'Estimate weekly, monthly and yearly beverage calories from alcohol. No predicted fat gain or risk-free drinking threshold.',
    intro:
      'Estimate calories from beer, wine, spirits and cocktails each week, and explore corresponding monthly and yearly totals. These are arithmetic intake estimates, not predictions of fat gain, weight loss or an individual health-risk score.',
    notice:
      'Educational only. Less alcohol generally reduces health risks. The moderate-drinking category does not mean risk-free drinking. Avoid alcohol during pregnancy; talk to a qualified professional or support service if cutting back is difficult.',
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
          'The calculator adds estimated beverage calories per week, then multiplies by 52 for a simple yearly intake projection. This does not predict weight or body-fat change: appetite, other intake, energy expenditure and physiological adaptations are not modeled. The [NIAAA alcohol calorie calculator](https://rethinkingdrinking.niaaa.nih.gov/tools/calculators/alcohol-calorie-calculator) likewise focuses on beverage-calorie awareness rather than a guaranteed body-weight outcome.',
        ],
      },
      {
        h2: 'Low-risk drinking guidance',
        paragraphs: [
          'The [CDC explains](https://www.cdc.gov/alcohol/about-alcohol-use/moderate-alcohol-use.html) that its moderate-use definition (up to one drink/day for women or two for men) is not a no-risk threshold. Even moderate use may increase health risks compared with not drinking. The [CDC cancer guidance](https://www.cdc.gov/cancer/risk-factors/alcohol.html) explains why drinking less or not drinking lowers cancer risk. Pregnant people and others with contraindications should avoid alcohol; people who do not drink should not begin for health reasons.',
        ],
      },
    ],
    faq: [
      { q: 'How many calories are in alcohol?', a: 'Alcohol provides about 7 calories per gram. A 12-oz beer is ~150 kcal, a 5-oz glass of wine ~125, a 1.5-oz spirit ~97, and a typical cocktail 200–250+.' },
      { q: 'Can alcohol make you gain weight?', a: 'Yes — alcohol calories add to your daily total and are easy to overlook. Regular drinking can contribute meaningful calories over a week, month and year, especially with sugary mixers.' },
      { q: 'Is moderate alcohol use risk-free?', a: 'No. CDC moderation levels describe a category of drinking, not a guaranteed safe amount. Even moderate alcohol use may increase certain health risks. Drinking less or not at all lowers risk, and some people should avoid alcohol entirely.' },
      { q: 'Can I convert alcohol calories to pounds of fat?', a: 'No reliable personal prediction can be made from a fixed 3,500-calorie-per-pound conversion. The estimates here show drink-derived energy intake only; they do not model appetite, total intake, activity or metabolic adaptation.' },
    ],
    sources: [NIAAA_ALCOHOL_CALORIES, CDC_ALCOHOL, CDC_ALCOHOL_CANCER, NHS_ALCOHOL],
  },
};
