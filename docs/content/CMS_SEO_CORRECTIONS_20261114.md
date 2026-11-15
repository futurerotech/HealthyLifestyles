# CMS SEO metadata corrections — offline package (2026-11-14)

**Status: proposal only. Nothing has been written to any CMS.** Machine-readable source: `cms-seo-corrections-20261114.json`; `scripts/seo/__tests__/cms-seo-corrections.test.mjs` keeps every proposed value identical to the reviewed source copy on PR #56.

Why it matters: the release preflight shows the CMS supplies the SEO title for 68 of 70 tools and the description for all 70, so these CMS values — not the corrected source copy — are what search results and social cards show.

## Apply rules

- Owner authorization required before any CMS change.
- Apply only as draft versions of the existing records (same CMS ID), first on verified isolated staging.
- Change only seo.metaTitle and seo.metaDescription; leave og/twitter fields empty so they inherit.
- Never publish, create duplicates, or trigger indexing as part of this change.

Current values read 2026-11-14 (read-only SELECT on the production CMS database (public metadata, also present in page HTML)).

Left unchanged on purpose (accurate as published): `ffmi-calculator`, `one-rep-max-calculator`, `pregnancy-weight-gain-calculator`.

## Required (5)

### `heart-disease-risk-calculator` (CMS ID 46)

Why: CMS calls it a "heart risk estimate"; the tool is an illustrative checklist, not a validated risk score.

| | Title | Description |
|---|---|---|
| Current | Heart Disease Risk (Educational) | An educational lifestyle-based heart risk estimate — not a diagnosis. |
| Proposed | Heart Disease Risk Factors Checklist (Educational) | Review five heart-health factors using illustrative points, not a validated heart disease risk score. Ask your clinician about AHA PREVENT. |

### `diabetes-risk-calculator` (CMS ID 47)

Why: CMS promises a "risk band"; the tool is an illustrative checklist, not a validated screening score.

| | Title | Description |
|---|---|---|
| Current | Type 2 Diabetes Risk (Educational) | A non-diagnostic diabetes risk band — and why to get screened. |
| Proposed | Type 2 Diabetes Factors Checklist (Educational) | Explore factors linked to type 2 diabetes with illustrative points, not a validated screening risk score. Learn about laboratory testing. |

### `waist-health-risk-calculator` (CMS ID 45)

Why: CMS promises a combined "risk-level"; the tool no longer produces an unvalidated combined risk score.

| | Title | Description |
|---|---|---|
| Current | Waist-Based Health Risk | Combine your BMI and waist-to-height ratio into a risk-level explainer. |
| Proposed | BMI and Waist-to-Height Ratio Calculator | Calculate BMI and waist-to-height ratio side by side. Learn what each measure means and its limits, without an unvalidated combined risk score. |

### `sitting-disease-reversal-calculator` (CMS ID 21)

Why: CMS title and description promise "reversal" and a "personalized" recipe; no step count can guarantee reversal.

| | Title | Description |
|---|---|---|
| Current | Sitting Disease Reversal Calculator | Offset desk time with micro-breaks and extra NEAT steps — get a personalized movement recipe. |
| Proposed | Sitting & Movement Break Planner — Optional Steps and NEAT | Explore optional breaks and step ideas for a sitting day. No step count guarantees reversal of sitting-related health effects; calories are approximate. |

### `vo2-max-calculator` (CMS ID 25)

Why: CMS says the estimate uses your max heart rate; max heart rate is predicted from age, and the result is not a fitness grade.

| | Title | Description |
|---|---|---|
| Current | VO₂ Max Calculator | Estimate your cardio fitness from your resting and max heart rate. |
| Proposed | VO₂ Max Calculator (Heart Rate Method) | Get a rough VO₂ max estimate from your age and resting heart rate using the Uth–Sørensen heart-rate ratio. An illustration, not a lab test or fitness grade. |

## Recommended (7)

### `walk-it-off-calculator` (CMS ID 19)

Why: CMS frames food as something to "burn" off; the tool uses energy above rest and avoids earn/burn framing.

| | Title | Description |
|---|---|---|
| Current | Walk It Off Calculator | Enter a food or calories to see the minutes of walking, running, or cycling to burn it. |
| Proposed | Walk It Off Calculator — Food to Exercise Time | Explore illustrative walking, running, and cycling time using estimated extra activity energy above rest. Food is not something you must earn or burn off. |

### `metabolic-age-calculator` (CMS ID 31)

Why: CMS presents "metabolic age" as estimable; the tool is an illustrative BMR index, not a measure of metabolic health.

| | Title | Description |
|---|---|---|
| Current | Metabolic Age Calculator | Estimate your metabolic age from your BMR vs the average for your age (illustrative). |
| Proposed | Metabolic Age Calculator (BMR Illustration) | See a fictional BMR-based age index with transparent assumptions. It does not measure metabolic health or biological age. |

### `healthspan-score` (CMS ID 56)

Why: CMS ranks "highest-impact next steps" (unsupported) and its description is cut off after "Educational".

| | Title | Description |
|---|---|---|
| Current | Healthspan Score – Free Healthy-Habits Calculator | Score your everyday habits (0–100) against WHO and CDC lifestyle guidance and see your 2–3 highest-impact next steps. Educational |
| Proposed | Healthspan Score – Free Healthy-Habits Calculator | Score everyday habits (0–100) against WHO and CDC guidance and see which habits have the most model points left. Educational, not a lifespan prediction. |

### `recovery-time-calculator` (CMS ID 58)

Why: CMS calls it a heuristic "from sports-science principles"; the tool states it is site-defined and not validated.

| | Title | Description |
|---|---|---|
| Current | Recovery Time Calculator — Rest Between Workouts | Estimate how long to rest before training the same muscle group again. A transparent heuristic from sports-science recovery principles. Free, no signup. |
| Proposed | Recovery Time Calculator — Rest Between Workouts | Explore a site-defined recovery planning estimate for hard workouts. Understand limits, effort, sleep and soreness; not a validated healing timer. |

### `lean-body-mass-calculator` (CMS ID 15)

Why: CMS states a measurement ("find how much … is muscle"); the tool gives a Boer (1984) estimate.

| | Title | Description |
|---|---|---|
| Current | Lean Body Mass Calculator | Find how much of your weight is muscle, bone, and organs — not fat. |
| Proposed | Lean Body Mass Calculator (Boer Formula) | Estimate fat-free body mass using Boer (1984), with safeguards when a regression gives a physically impossible result. Educational, not clinical. |

### `water-intake-calculator` (CMS ID 7)

Why: CMS says "how much water to drink"; the tool estimates total fluid (drinks + food) and is not a target.

| | Title | Description |
|---|---|---|
| Current | Water Intake Calculator | Find how much water to drink each day, in liters and fluid ounces. |
| Proposed | Water Intake Calculator (Liters & oz) | Estimate your total daily fluid from body weight and activity, and the part from drinks, in liters and fluid ounces. A rule of thumb, not a target or limit. |

### `steps-to-calories-calculator` (CMS ID 26)

Why: CMS says "calories burned"; the tool separates gross and above-rest energy.

| | Title | Description |
|---|---|---|
| Current | Steps to Calories Calculator | Turn your step count into distance walked and calories burned. |
| Proposed | Steps to Calories & Distance Calculator | Convert steps to approximate walking distance, gross energy and above-rest energy from height and weight. Kilometers or miles; no measured calorie claims. |

## Optional (2)

### `calories-burned-calculator` (CMS ID 24)

Why: Accurate as published; the source adds the gross/above-rest distinction.

| | Title | Description |
|---|---|---|
| Current | Calories Burned Calculator | Estimate calories burned by activity using MET values and your weight. |
| Proposed | Calories Burned Calculator — Gross vs Above-Rest METs | Estimate gross activity energy and illustrative above-rest calories for exercise using MET values, weight and duration. Includes metric/imperial inputs. |

### `alcohol-calorie-calculator` (CMS ID 32)

Why: Accurate as published; the source adds that no threshold is risk-free.

| | Title | Description |
|---|---|---|
| Current | Alcohol Calorie Calculator | Add up the hidden calories in your weekly drinks — per week, month, and year. |
| Proposed | Alcohol Calorie Calculator (Weekly & Yearly) | Estimate weekly, monthly and yearly beverage calories from alcohol. No predicted fat gain or risk-free drinking threshold. |
