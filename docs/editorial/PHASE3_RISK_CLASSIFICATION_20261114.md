# Phase 3.1 — medical risk classification of published articles (2026-11-14)

Source: the live published inventory rendered by CI run 43584650891 (build against the production CMS, read-only). There are 60 published articles, and the release preflight reported 0 errors.
Categories follow Master Roadmap §7.1. This is an engineering triage to order the editorial audit. It is not a clinical risk assessment.

## High risk (12)

| Article | Why |
|---|---|
| `/wellness-hub/what-do-your-blood-pressure-numbers-mean` | Cardiovascular: hypertension categories, emergency thresholds, pregnancy BP |
| `/wellness-hub/what-does-your-heart-disease-risk-score-mean` | Cardiovascular risk estimation; treatment-decision adjacent |
| `/wellness-hub/what-does-type-2-diabetes-risk-score-mean` | Diabetes risk screening |
| `/wellness-hub/pregnancy-week-by-week-guide` | Pregnancy |
| `/wellness-hub/due-date-by-conception-date` | Pregnancy dating |
| `/wellness-hub/pregnancy-weight-gain-calculator-healthy-range-guide` | Pregnancy weight gain |
| `/wellness-hub/ovulation-calculator-fertile-window-guide` | Fertility; risk of being relied on as contraception |
| `/wellness-hub/normal-resting-heart-rate-by-age` | Cardiovascular: brady/tachycardia urgent-care thresholds |
| `/wellness-hub/how-to-calculate-target-heart-rate-zones-karvonen` | Cardiovascular exercise intensity; beta-blocker and heart-condition caveats |
| `/wellness-hub/intermittent-fasting-for-beginners` | Medication and diabetes interactions (hypoglycemia), pregnancy, disordered eating |
| `/wellness-hub/maximum-heart-rate-by-age-220-minus-age-tanaka` | Cardiovascular exercise limits |
| `/wellness-hub/how-much-caffeine-is-too-much-per-day` | Pregnancy limit; cardiac/medication sensitivity |

## Moderate risk (33)

Nutrition, exercise, body composition, recovery, weight management, health behavior.

- `/wellness-hub/alcohol-units-calculator`
- `/wellness-hub/best-time-to-stop-drinking-coffee-for-sleep`
- `/wellness-hub/body-fat-calculator-what-the-navy-method-can-tell-you`
- `/wellness-hub/can-sun-exposure-tell-you-if-you-need-vitamin-d`
- `/wellness-hub/healthy-bmi-by-age`
- `/wellness-hub/healthy-waist-to-height-ratio`
- `/wellness-hub/hidden-calories-in-alcohol-and-weight-loss`
- `/wellness-hub/how-do-you-know-if-your-gut-is-healthy`
- `/wellness-hub/how-long-does-it-take-to-lose-weight`
- `/wellness-hub/how-long-should-you-recover-between-workouts`
- `/wellness-hub/how-many-calories-to-lose-weight`
- `/wellness-hub/how-many-carbs-on-keto`
- `/wellness-hub/how-much-protein-do-i-need`
- `/wellness-hub/how-much-sleep-debt-do-you-have-weekly-recovery`
- `/wellness-hub/how-much-water-should-you-drink-a-day`
- `/wellness-hub/how-to-build-a-four-week-strength-training-program`
- `/wellness-hub/how-to-build-a-meal-plan`
- `/wellness-hub/how-to-calculate-your-macros`
- `/wellness-hub/how-to-keep-muscle-while-losing-weight`
- `/wellness-hub/how-to-reduce-sitting-time`
- `/wellness-hub/ideal-weight-for-height-bmi-devine-guide`
- `/wellness-hub/lean-body-mass-calculator-guide`
- `/wellness-hub/period-calculator-next-period-dates-guide`
- `/wellness-hub/waist-to-hip-ratio-how-to-measure-it-and-what-it-means`
- `/wellness-hub/weight-loss-percentage-what-the-number-really-means`
- `/wellness-hub/what-calorie-deficit-calculator-can-tell-you`
- `/wellness-hub/what-does-your-push-up-test-score-mean`
- `/wellness-hub/what-does-your-vo2-max-score-mean`
- `/wellness-hub/what-does-your-waist-based-health-risk-level-mean`
- `/wellness-hub/what-is-an-anti-inflammatory-diet`
- `/wellness-hub/what-is-bmr-calculator-daily-calorie-needs`
- `/wellness-hub/what-is-ffmi-fat-free-mass-index-guide`
- `/wellness-hub/what-is-one-rep-max-how-to-calculate-it`

## Lower risk (15)

General explanations, unit conversions and straightforward calculations.

- `/wellness-hub/calories-burned-calculator-guide`
- `/wellness-hub/flexibility-mobility-score-at-home-tests-guide`
- `/wellness-hub/how-blue-light-affects-sleep-evening-habits-score`
- `/wellness-hub/how-long-should-you-nap-best-length-and-timing`
- `/wellness-hub/how-long-to-walk-to-burn-calories`
- `/wellness-hub/how-many-calories-burn-walking-10000-steps`
- `/wellness-hub/how-to-calculate-calories-in-a-recipe`
- `/wellness-hub/how-to-calculate-running-pace`
- `/wellness-hub/how-to-keep-a-food-and-symptom-diary`
- `/wellness-hub/how-to-read-your-hrv-trend`
- `/wellness-hub/metabolic-age-calculator-guide`
- `/wellness-hub/sleep-chronotypes-explained`
- `/wellness-hub/smoking-cost-per-year-quit-savings-guide`
- `/wellness-hub/what-does-your-lifestyle-age-test-mean`
- `/wellness-hub/what-time-should-you-go-to-bed-sleep-cycles-explained`

## §7.2 initial editorial audit sample (10 higher-risk articles)

1. `/wellness-hub/what-do-your-blood-pressure-numbers-mean`
2. `/wellness-hub/what-does-your-heart-disease-risk-score-mean`
3. `/wellness-hub/what-does-type-2-diabetes-risk-score-mean`
4. `/wellness-hub/pregnancy-week-by-week-guide`
5. `/wellness-hub/due-date-by-conception-date`
6. `/wellness-hub/pregnancy-weight-gain-calculator-healthy-range-guide`
7. `/wellness-hub/ovulation-calculator-fertile-window-guide`
8. `/wellness-hub/normal-resting-heart-rate-by-age`
9. `/wellness-hub/how-to-calculate-target-heart-rate-zones-karvonen`
10. `/wellness-hub/intermittent-fasting-for-beginners`

Each article will be checked against the §7.2 checklist:

- claim-level accuracy;
- clinical limitations;
- source validity and working references;
- internal links;
- numerical examples;
- author/reviewer attribution (no fabricated medical review);
- warning language;
- last-updated date;
- calculator integration;
- search intent.

Corrections are prepared offline as CMS-ready drafts. No live record is changed, and nothing is published without owner authorization and independent clinical review.

**Access note.** Article bodies exist only in the CMS. CI reads them at build time, but this session's shell cannot reach the CMS host. The audit needs a read-only export of the ten published article bodies (public, published content only), for example from a CI job artifact.
