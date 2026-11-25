# Phase 5 §9.2 research gate — Candidates 2–5, with ranking across all five (2026-11-25)

Status: research for §9.2 steps 1–9 and 11. **Step 10 is gated:** no authorized Search Console, Trends or analytics data, so no demand figures are used. **Step 12 needs the owner's decision.**
Candidate 1 (Smart Meal Plan & Grocery Budget Studio): see `PHASE5_CANDIDATE1_MEALPLAN_BUDGET_20261114.md`. Phase 6 Hypotheses A–C: see `PHASE6_INNOVATION_LAB_EVALUATION_20261114.md`.
Scores are reviewer judgments (1–5) on the evidence cited. They are not measurements. Competitor details are from public pages checked on 2026-11-25, and third-party pricing may vary.

## Step 1: overlap with existing HealthyLifeStyles tools (inventory from `src/data/tools.ts`, `src/lib`, `src/islands`)

| Candidate | Existing tools that already cover part of it | Implication |
|---|---|---|
| 2. Nutrition Pattern Analyzer | recipe-nutrition-analyzer (USDA FDC), food-symptom-diary (local log), macro-, protein-, calorie-, keto-calculator, gut-health-score, anti-inflammatory-score | A real pattern analyzer needs a daily food log plus a full nutrient database. Nothing existing provides multi-day nutrient totals. |
| 3. Workout Progression Planner | strength-program-builder (`src/lib/strength-program.ts`: strength or hypertrophy, beginner or intermediate, 5 lifts, weekly prescriptions, warm-ups), one-rep-max, recovery-time, push-up and flexibility tests | **Extension, not a new tool.** Missing: a logged-session history, and progression driven by completed and missed sessions. |
| 4. Sleep & Recovery Pattern Studio | sleep-calculator, nap-, sleep-debt-calculator, chronotype quiz, caffeine curfew, blue-light estimator, sleep-quality check, HRV log (local storage) | **Extension.** Missing: a multi-night sleep log and schedule-consistency (regularity) view. It also overlaps Phase 6 Hypothesis C (shift work). |
| 5. Race Training & Progression Simulator | running-pace-calculator (`src/lib/running-pace.ts`: time, pace and distance, km/mi, splits), VO2 max, calories burned | **Extension.** Missing: race-time equivalence across distances and training-pace guidance. |

## Steps 2–9 per candidate

### Candidate 2 — Advanced Nutrition Pattern Analyzer
- **Problem:** people want to see multi-day nutrient patterns, not single-meal estimates.
- **Competitors:** Cronometer's free tier already tracks 80+ nutrients with customizable targets (gap-filling suggestions and custom charts are paid). [cronometer.com](https://cronometer.com/blog/free-features)
- **Differentiation:** low. A strong free incumbent exists, and matching it needs a food-logging product.
- **Data:** USDA FoodData Central (public domain) already powers our recipe analyzer; per-food logging would need search, portions and storage.
- **Cost:** $0 data, but a large build. Logs are health-sensitive (local-only required).
- **Medical risk:** high. "Nutrient gap" indicators drift toward deficiency diagnosis (§9.1 warns against this).
- **Accessibility:** a logging UI is heavy on mobile.
- **Verdict:** not recommended now.

### Candidate 3 — Adaptive Workout Progression Planner
- **Problem:** beginners stall or overreach without a simple rule for adjusting load after each session.
- **Competitors:**
  - Hevy's free plan logs workouts, but automated progressive-overload recommendations are a Pro feature. [help.hevyapp.com](https://help.hevyapp.com/hc/en-us/articles/33106320824727)
  - Fitbod has no permanent free tier (about $15.99/month or $95.99/year reported). [sensai.fit](https://www.sensai.fit/blog/fitness-app-pricing-free-tier-comparison)
- **Differentiation:** medium-high. A free, account-free progression on top of our existing program builder, with transparent rules (for example, add load after all target reps are completed; repeat or reduce after missed sessions; planned deload weeks).
- **Data:** none external. Rules are cited to ACSM progression guidance.
- **Cost:** $0. Local-only session log.
- **Medical risk:** moderate (injury). No medical clearance claims; keep "stop and seek care if pain" guidance; adults only; no individualized prescription language.
- **Accessibility:** reuse the existing program-builder components.

### Candidate 4 — Sleep & Recovery Pattern Studio
- **Problem:** people track single nights but cannot see consistency, which is a recognized sleep-health dimension.
- **Competitors:** RISE (sleep need, 14-night sleep debt, circadian timing) requires a paid subscription, about $59.99–69.99/year. [apps.apple.com](https://apps.apple.com/us/app/rise-sleep-tracker/id1453884781) · [risescience.com](https://www.risescience.com/blog/rise-app-review)
- **Differentiation:** medium-high. A free, local-only multi-night log built on our existing sleep-debt calculator, adding bed and wake time consistency (variability) and weekly debt.
- **Data:** none external.
- **Cost:** $0.
- **Medical risk:** moderate. No composite "sleep score" presented as diagnosis (§9.1). Keep insomnia and sleep-apnea warning signs that point to a clinician.
- **Accessibility:** charts need text equivalents (the existing gauge and donut patterns already provide aria labels).
- **Synergy:** this is the natural base for the Phase 6 Shift Work Explorer.

### Candidate 5 — Race Training & Progression Simulator
- **Problem:** runners want equivalent race times and training paces from one result.
- **Competitors:**
  - The McMillan Running Calculator is free and gives race predictions and training paces. [mcmillanrunning.com](https://www.mcmillanrunning.com/?p=390593)
  - Runna is paid (about $19.99/month, $119.99/year in the US; no free tier since June 2026). [the5krunner.com](https://the5krunner.com/2026/10/14/is-runna-free/)
- **Differentiation:** low-medium. Free race equivalence already exists. A small extension to our pace calculator (Riegel equivalence with stated limits) adds convenience, not novelty.
- **Data:** published formula (Riegel 1981).
- **Cost:** $0.
- **Medical risk:** low; avoid performance guarantees.

## Weighted ranking (§10 criteria reused for comparability; demand criterion "insufficient" for all)

| Criterion (weight) | C1 Meal budget | C2 Nutrition | C3 Workout | C4 Sleep | C5 Race |
|---|---|---|---|---|---|
| Verified unmet need (25%) | 4 | 3 | 3 | 3 | 3 |
| Differentiation (20%) | 4 | 1 | 4 | 4 | 2 |
| Cost/feasibility (20%) | 4 | 2 | 4 | 4 | 5 |
| Privacy/trust/safety (15%) | 4 | 2 | 3 | 3 | 4 |
| Repeat use and discovery (10%) | insufficient | insufficient | insufficient | insufficient | insufficient |
| Accessibility/international (10%) | 3 | 2 | 4 | 3 | 4 |
| **Score over the 90% with evidence (÷0.9)** | **3.9** | **2.1** | **3.6** | **3.4** | **3.4** |

## Step 11: recommendation (no implementation started)

1. **C1 Meal Plan & Grocery Budget**, an extension of `meal-plan-generator`. The scope is in the Candidate 1 document:
   - ingredient quantities;
   - a household multiplier;
   - estimated cost from a bundled BLS public-domain snapshot, with source and month shown;
   - a budget target;
   - USDA food-plan benchmark;
   - local-only.
2. **C3 Workout Progression**, an extension of `strength-program-builder`:
   - local session log (completed or missed sets);
   - transparent progression rules with ACSM citations;
   - planned deloads;
   - adults only, no clearance claims.
3. **C4 Sleep Regularity Log**, an extension of `sleep-debt-calculator`:
   - 14-night local log;
   - bed/wake variability and weekly debt;
   - text-equivalent charts;
   - clinician-referral warning signs.

   This becomes the base for Phase 6 C (Shift Work Explorer) in a later approved step.
4. Not recommended now:
   - C2: low differentiation and diagnostic-drift risk.
   - C5: a free incumbent exists. It is a small optional add-on to the pace calculator if wanted.

**Gates before any build:**
- the owner selects scope(s);
- independent review of any health guidance text;
- an accessibility review of new charts and logs;
- demand evidence once Search Console and Trends access exists.
