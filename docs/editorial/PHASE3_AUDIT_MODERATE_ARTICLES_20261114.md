# Phase 3 §7.2 — editorial audit of the 33 moderate-risk articles (2026-11-14)

The scope, method and limitations are the same as in `PHASE3_AUDIT_10_ARTICLES_20261114.md`:
- articles were read from the public published pages, read-only, under the owner's authorization;
- every worked example was recomputed;
- claims were checked against the article's sources and current guidance.

Only verified defects are recorded. Corrections are prepared offline as drafts for the **existing** CMS records (same IDs, slugs and relationships). Nothing in the CMS was changed. This is an AI editorial review, not a clinical sign-off.

## Cross-cutting findings

| # | Finding | Scope | Status |
|---|---|---|---|
| X1 | **Embedded calculators share "My Calculate your … result" / "My Estimate your … result".** `ToolEmbed` did not pass the tool name to the calculator, so the share text and report title fall back to the form heading. Seen on the BMR, body-fat and 1RM article embeds; it affects every numeric-engine embed. | Frontend code | **Fixed on #56** (`ToolEmbed.astro`, guarded by a test); CI pending at the next push |
| X2 | **Dietary Guidelines edition.** Articles cite the *Dietary Guidelines for Americans 2020–2025* as current. The 2025–2030 edition was released on January 7, 2026. AMDR percentages come from the IOM Dietary Reference Intakes, which remain in force. | Macros, meal plan, keto | Draft citation update |
| X3 | **Article–tool consistency after #56 merges.** Several tools were corrected on #56 (VO2 max: fitness age and bands removed; waist-to-hip: WHO ≥0.90/≥0.85 with two bands; muscle preservation: kidney caution; fasting: medicine warning; weight-loss timeline: healthy-range floor). Their articles describe the old behavior. | VO2 max, WHR, keep-muscle, IF, timeline | Article drafts should be published **together with** the #56 release |
| X4 | **Taxonomy tags.** Tags unrelated to the topic, e.g. "Sleep Optimization" on the WHtR and ideal-weight articles; "Mental Wellness" and "Women's Health" on reduce-sitting; "Calories & Energy" on recovery; "Weight Loss" on 1RM. | Many | Draft tag corrections (relationships only) |
| X5 | **Embed/topic mismatch the preflight cannot see.** On the waist-to-height article, the embed block is labeled for the WHtR calculator but references the Lean Body Mass tool. The §6.3 preflight check verifies that each embed renders the tool it references, not that this is the article's subject. | WHtR | Content fix below |

## Batch 1 — nutrition and weight management

### how-many-calories-to-lose-weight — moderate
- **Verified:** BMR 1,669 and TDEE 2,295 (×1.375); 500 kcal ≈ 1 lb/week; CDC 1–2 lb/week.
- **Defects:**
  1. No population exclusions. The page doesn't address pregnancy or breastfeeding, under-18s, eating disorders, or medical conditions and medicines. The site's own deficit article does.
  2. The 1,200/1,500 kcal figures are called the "lowest safe targets". The tools now call them the usual minimum *without medical supervision*.
  3. "Crash diets cost … blood-pressure stability" is unsupported.
  4. The tag "Heart Health" is off-topic.
- **Draft:**
  - Add a "Who should not use a calorie target without professional advice" paragraph: pregnant or breastfeeding, under 18, current or past eating disorder, diabetes or other conditions, medicines affecting weight or appetite.
  - Reword the floor as "commonly cited minimum without medical supervision".
  - Delete the blood-pressure clause.
  - Retag as Weight Loss.

### how-to-calculate-your-macros — low
- **Verified:** worked example (140 g / 60 g / 225 g = 2,000 kcal); 4/4/9/7 kcal per gram.
- **Defects:**
  1. Protein guidance is inconsistent: 1.6–2.2 g/kg in the body, 2.0–2.2 g/kg in the FAQ for fat loss.
  2. Cites DGA 2020–2025 for AMDR (see X2).
- **Draft:**
  - State one range: 1.6–2.2 g/kg, with up to about 2.4 g/kg during a deficit, matching the protein guide.
  - Cite the IOM DRI AMDR (protein 10–35%, fat 20–35%, carbohydrate 45–65%) and the DGA 2025–2030.
- **Tool note:** the macro tool lists kcal from unrounded grams (130 g shows 518 kcal). This is a cosmetic display inconsistency, recorded for a later tool pass.

### how-much-protein-do-i-need — moderate
- **Verified:** RDA 0.8 g/kg; ISSN; Morton 2018 (a systematic review with meta-analysis, so both labels are correct); kidney caution present.
- **Defects:**
  1. "Building muscle" is 1.4–2.0 g/kg in the body but 1.6–2.2 g/kg in the FAQ and the calculator.
  2. Thin for its traffic (a 2-minute read).
- **Draft:**
  - Use 1.6–2.2 g/kg throughout. Morton 2018 found the benefit plateaus at about 1.6 g/kg, so 1.6–2.2 g/kg is the commonly cited range.
  - Add a worked per-meal example (0.4 g/kg per meal).

### how-many-carbs-on-keto — moderate (safety)
- **Verified:** 2,000 kcal split (156/125/25 g); embed 143/29/178 g; strong medicine and disordered-eating cautions.
- **Defects:**
  1. No mention of **SGLT2 inhibitors** (FDA-warned risk of ketoacidosis, including with normal glucose, which very-low-carb diets can increase).
  2. No distinction between **nutritional ketosis and diabetic ketoacidosis**.
  3. Cites DGA via ODPHP without the edition (see X2).
  4. After #56, the keto tool caps carbs at 50 g and names pregnancy, diabetes and blood-pressure medicine; the article should mention the cap.
- **Draft:**
  - Add: "If you take an SGLT2 inhibitor (such as empagliflozin, dapagliflozin or canagliflozin), do not start a ketogenic diet without your prescriber: the combination raises the risk of ketoacidosis, which can occur even when blood sugar is near normal."
  - Add a short ketosis vs. ketoacidosis explainer: nutritional ketosis is mild; ketoacidosis is a medical emergency, with vomiting, abdominal pain, confusion and rapid breathing — go to emergency care.

### how-to-build-a-meal-plan — moderate
- **Verified:** about 0.4 g/kg protein per meal (25–40 g).
- **Defects:**
  1. The sample-day table referenced in the text did not render. Check the table block in the CMS.
  2. A high-protein plan with no kidney-disease caution, unlike the protein guide and the muscle tool.
  3. DGA 2020–2025 (see X2).
  4. Thin (2-minute read).
- **Draft:**
  - Add: "If you have kidney disease or have been told to limit protein, ask your doctor or dietitian before following a high-protein plan."
  - Repair or remove the table reference.
  - Update the citation.

### what-calorie-deficit-calculator-can-tell-you — moderate (§6.3)
- **Verified:** 10 lb × 3,500 ÷ 70 days = 500 kcal/day → 1,700 kcal; strong exclusions.
- **Defect:** **no embedded calculator.** The article is about the Calorie Deficit Calculator but only links to it.
- **Draft:** add a `toolEmbed` block for `calorie-deficit-calculator` after the worked example (existing tool; relationship only).

### what-is-bmr-calculator-daily-calorie-needs — no content defect
- **Verified:** Mifflin-St Jeor coefficients; male 1,668.75 and female 1,502.75; all five TDEE values (2,003 / 2,295 / 2,587 / 2,879 / 3,171); Frankenfield 2005 "within 10%".
- The only issue is the share text (X1, already fixed).

### how-long-does-it-take-to-lose-weight — moderate
- **Verified:**
  - 5 kg in 5–10 weeks; 10 kg in 10–20 weeks; 4–8 lb a month.
  - Embed milestones: 90 → 85.5 kg at week 9; 82.5 kg at week 15; 75 kg at week 30.
- **Defects:**
  1. The "10, 20, or 50 pounds" table did not render. Check the CMS block.
  2. No eating-disorder or medical-supervision guidance.
  3. "Biggest predictor" of maintenance is stated without support.
  4. After #56 the timeline tool asks for height and won't plan below BMI 18.5; the article doesn't say so (X3).
  5. Check that the Hall source URL (PMID 26399868) matches its title.
- **Draft:**
  - Add who-should-get-advice wording, as in the calorie article.
  - Soften to "is associated with better long-term maintenance".
  - Add one sentence on the height-based goal check.

## Batch 2 — body composition

### healthy-bmi-by-age — low
- **Verified:** WHO/CDC categories; default 23.5 and 57–76 kg; Winter 2014 meta-analysis.
- **Defects:**
  1. Adult categories are said to apply to adults "roughly 20–65", yet the summary says "at every age". CDC adult BMI applies from age 20; under 20 uses percentiles.
  2. Tag "Heart Health" is off-topic.
- **Draft:**
  - "For adults 20 and older, the categories don't change with age; over 65, the lower-to-mid 20s is often reasonable."
  - Optionally note NICE's lower action thresholds for people of South Asian, Chinese, other Asian, Middle Eastern, Black African or African-Caribbean family background.

### body-fat-calculator-what-the-navy-method-can-tell-you — no content defect
- Share text affected (X1, fixed).
- 19.2% "Average" matches the corrected bands.

### healthy-waist-to-height-ratio — **high (§6.3 and accuracy)**
- **Defects:**
  1. **Wrong embedded calculator.** The "Try it" block shows the Lean Body Mass calculator (X5).
  2. **Boundary contradiction.** The lead says "0.5 or lower" is healthy; the table puts 0.50 in "Moderate"; the FAQ calls 35 ÷ 70 = 0.50 "below 0.50". NICE NG246 sets healthy at 0.40–0.49, increased at 0.50–0.59 and high at ≥0.60, and the tool was corrected to this on #56.
  3. An uncited claim that cutoffs may be "closer to 0.53" over 65.
  4. NICE NG246, the authoritative source for these bands, isn't cited.
  5. Tag "Sleep Optimization" is off-topic.
- **Draft:**
  - Change the embed to `waist-to-height-ratio-calculator`.
  - Lead: "A healthy waist-to-height ratio is below 0.5" (from 0.4 to 0.49).
  - FAQ: "a waist under 35 inches (89 cm) keeps a 5 ft 10 in adult below 0.50".
  - Remove the 0.53 claim or add a citation.
  - Add NICE NG246 to the sources.
  - Retag.

### waist-to-hip-ratio-how-to-measure-it-and-what-it-means — **high**
- **Defects:**
  1. It states the WHO cutoffs as "above 0.90 / above 0.85" and describes three male tiers. The WHO 2008 expert consultation sets substantially increased risk **at or above** 0.90 (men) and 0.85 (women). The tool was corrected on #56 to these two bands (X3).
  2. The WHO source is dated "(2026)". The report is from 2008, published 2011.
  3. **No embedded calculator** (§6.3).
- **Draft:**
  - Replace the bands with: "WHO: a ratio of 0.90 or above (men) or 0.85 or above (women) indicates substantially increased risk of metabolic complications; below these values is lower risk."
  - Fix the source date.
  - Add a `toolEmbed` for `waist-to-hip-ratio-calculator`.

### ideal-weight-for-height-bmi-devine-guide — low
- **Verified:** every example; 5 ft 10 in Devine 73.0 kg (men) and 68.5 kg (women); the BMI ranges at 5 ft 2 in, 5 ft 6 in and 5 ft 10 in; default 56.7–76.3 kg and 70.5 kg.
- **Defects:**
  1. Doesn't say Devine is undefined below 5 ft. The tool now says so on #56.
  2. Tag "Sleep Optimization" is off-topic.
- **Draft:**
  - Add: "Devine is defined from 5 feet (152 cm) upward; below that, use the BMI-based range."
  - Retag.

### lean-body-mass-calculator-guide — low
- **Verified:** Boer male 56.8 kg / 15.2 kg / 78.9%.
- **Defects:**
  1. Thin (a 2-minute read).
  2. "LBM is the inverse of body fat percentage" is imprecise.
  3. The source "NIH, Body Composition and Health" (PMC6021272) title couldn't be confirmed. Check it.
- **Draft:** replace with "lean mass percentage is 100% minus body-fat percentage".

### what-is-ffmi-fat-free-mass-index-guide — no defect
- **Verified:** FFM 61.2 kg; FFMI 19.98; normalized 20.29; sensitivity 20.69; Kouri 1995 (6.1 vs 6.3 explained); Schutz 2002; Morton 2018.

### what-does-your-waist-based-health-risk-level-mean — no defect
- All five examples and the default output recompute correctly.
- The underweight edge case is disclosed honestly.
- NICE NG246 is cited.

## Batch 3 — exercise safety and weight management

### how-long-should-you-recover-between-workouts — low
- **Verified:** 48 × 1.1 = 52.8 h (44.9–60.7 h); rhabdomyolysis warning present.
- **Defect:** tag "Calories & Energy" is off-topic (X4).

### how-to-build-a-four-week-strength-training-program — low
- **Verified:** 225 lb example (180 / 185 / 190 / 145); tables match the builder; safety section complete.
- **Defect (X3):** after #56 the builder flags weights below an empty bar and keeps warm-ups lighter than working sets. Add one sentence for light lifts.

### what-is-one-rep-max-how-to-calculate-it — low
- **Verified:** Epley 93.3 kg; Brzycki 90.0 kg; percentage table.
- **Defects:**
  1. Share text (X1, fixed).
  2. Source 5 is listed but not cited in the body.
  3. Tag "Weight Loss" is off-topic.

### what-does-your-push-up-test-score-mean — to verify
- The norms (men 30–39: "Excellent ≥ 39", Average from 17) could not be matched to a cited table in this audit. The article says the site uses toe-supported push-ups for both sexes, unlike the traditional ACSM/CSEP tables.
- **For clinical review:** confirm the norm source and its protocol. Not changed here.
- JAMA Netw Open 2019 is cited without overstating causation.

### what-does-your-vo2-max-score-mean — **high (X3)**
- **Verified:** Uth–Sørensen 48.45 and the sensitivity table (52.85 / 48.45 / 44.72 / 41.53).
- **Defect:** the article describes a "fitness age" (18 for a 30-year-old) and five bands (Below Average…Superior). These were removed from the tool on #56 because the fitness-age formula (50 − 0.5 × age) has no published validation and the bands were not age- or sex-adjusted. The live page shows an internally inconsistent fitness age.
- **Draft:**
  - Remove the fitness-age and band text.
  - Describe the estimate as a rough illustration from a method studied in well-trained men aged 21–51.
  - Publish together with #56.

### how-to-reduce-sitting-time — low
- **Verified:**
  - Break table (5 / 8 / 11 / 13).
  - Calorie example: 3 METs × 75 kg × 41 min ≈ 154 kcal and 2 METs × 75 kg × 33 min ≈ 83 kcal.
  - Dunstan 2012 (n = 19).
  - Buffey 2022.
- **Defect:** tags include Mental Wellness, Women's Health and Metabolism (X4). Keep Healthy Habits, Health Risk and Weight Loss.

### how-to-keep-muscle-while-losing-weight — moderate
- **Verified:** 0.5–1% of body weight per week; Longland 2016; protein embed 115 g.
- **Defects:**
  1. No kidney-disease caution next to the 1.6–2.4 g/kg advice. The muscle tool has one on #56 (X3).
  2. Training frequency is inconsistent ("about twice a week" vs. a "2–3×" checklist). Use "at least twice a week (2–3 sessions)".
  3. Thin (2 minutes).

### weight-loss-percentage-what-the-number-really-means — no defect
- **Verified:** 5%, 6.7% and 8.9%; NIDDK; MedlinePlus unintentional-loss threshold; eating-disorder caution.

## Batch 4 — hydration, diet patterns, alcohol, gut, vitamin D, cycle, sleep

### how-much-water-should-you-drink-a-day — moderate
- **Verified:** IOM 3.7 L / 2.7 L; pregnancy 3.0 L; breastfeeding 3.8 L; about 20% of water from food; embed 72 kg × 35 mL = 2.52 L.
- **Defects:**
  1. **Broken reference.** The "CDC, Water and Healthier Drinks" source links to the CDC *adult BMI calculator* page.
  2. Fluid-restricted readers aren't addressed explicitly. Add: "If you've been told to limit fluids — for example with heart failure or advanced kidney disease — follow that limit, not a general target."
  3. The method description ("~35 mL/kg plus activity") must match the water tool's method on #56 at release (X3).
  4. British spellings in the CMS text ("litres", "yoghurt").
- **Draft:**
  - Replace the CDC link with the CDC water and healthier drinks page.
  - Add the fluid-restriction sentence.
  - Convert to American English.

### what-is-an-anti-inflammatory-diet — moderate
- **Defects:**
  1. The article repeats claims removed from the tool at `db53357` (X3): omega-3s are "powerfully anti-inflammatory", "liquid sugar drives inflammation", red meat is "high in … inflammatory compounds", and following any of these patterns "gives similar anti-inflammatory benefits".
  2. None of the three sources (WHO healthy diet, MedlinePlus fats, DGA) supports inflammation-specific claims.
  3. Share text (X1, fixed).
- **Draft:**
  - Use the tool's association wording, for example "omega-3 fats (EPA/DHA) are linked with lower markers of inflammation".
  - Replace "gives similar anti-inflammatory benefits" with "in studies, people who follow these patterns tend to have lower inflammatory markers".
  - Add an evidence source on dietary patterns and inflammatory markers, chosen by the editor. Keep the WHO source.

### hidden-calories-in-alcohol-and-weight-loss — moderate
- **Verified:** 7 kcal/g; NIAAA calorie values; embed 600 + 375 + 194 + 225 = 1,394 kcal/week → 6,057 kcal/month (× 4.345) → 72,488 kcal/year → 20.7 lb; FAQ arithmetic (750 ÷ 3,500 ≈ 0.21 lb).
- **Defects:**
  1. No safety context: pregnancy (no known safe amount), interactions with medicines, and driving.
  2. The claim that alcohol "pauses fat oxidation" is uncited.
  3. The NHS 14-unit guidance is cited in the text but has no source entry.
  4. The CDC moderate-drinking figures should be checked against the DGA 2025–2030 at publication (X2).
- **Draft:**
  - Add a "Before you drink" safety paragraph (pregnancy, medicines, driving; SAMHSA helpline 1-800-662-4357, as in the units article).
  - Cite a metabolic study for the fat-oxidation claim, or soften it.
  - Add the NHS source.

### alcohol-units-calculator (article) — **high (numerical accuracy)**
- **Verified:** UK unit = 10 mL (7.9 g); 250 mL at 12% = 3 units; 175 mL at 13% = 2.3 units, 1.3 US drinks, about 18 g, about 126 kcal; pint at 4% = 2.3 units; 14 units ≈ 8 US drinks.
- **Defects:**
  1. "25 mL at 40% = 0.7 US drinks" is wrong. 10 mL of ethanol is 7.9 g, or **0.56** of a 14 g US drink.
  2. "15% vs 12% wine = 50% more alcohol" is wrong. It is **25%** more.
  3. "Binge = 3 to 4 UK units" is wrong. CDC binge drinking (4+ / 5+ US drinks, 56–70 g) is about **7–9 UK units**. The NHS single-session high-risk levels are more than 6 units (women) and more than 8 (men).
  4. The calorie-savings claim (3 occasions → 1,500–2,500 kcal) implies about 4–6 drinks per occasion without saying so.
  5. Uncited claims: the "30% or more" undercount, and a red-wine "heart benefits" statement attributed to an unlinked DGA review. Current US and UK guidance does not recommend drinking for heart health. Remove that claim.
  6. The article's 13% wine example and the calculator's 12% wine default differ without explanation (the tool gives 6.3 units for 3 × 175 mL).
  7. The live tool's three risk labels (Low / Increasing / High) change to two on #56 (X3).
- **Draft:**
  - Correct the three figures to 0.56, 25%, and "about 7–9 UK units".
  - State the drinks-per-occasion assumption in the savings example.
  - Remove the red-wine claim and the undercount figure, or add citations.
  - Say that the calculator assumes 12% wine.
  - Align the risk-label text with the tool at release.

### how-do-you-know-if-your-gut-is-healthy — low
- **Verified:** 14 g fiber per 1,000 kcal; 25–35 g/day; red flags (blood in stool, weight loss, persistent pain, change in bowel habit, nighttime symptoms).
- **Defects:**
  1. It doesn't mention routine colorectal-cancer screening from age 45 (USPSTF 2021), which belongs alongside the red flags.
  2. Tag "Mental Wellness" is off-topic (X4).
- **Draft:** add "Adults 45 and older should also follow routine colorectal-cancer screening, whatever their symptoms."

### can-sun-exposure-tell-you-if-you-need-vitamin-d — low
- **Verified:** RDA 600 IU (15 mcg) for ages 19–70 and 800 IU (20 mcg) for 71+; AAD position; EPA UV Index ≥3.
- **Defects:**
  1. It warns that excess supplementation is harmful but omits the adult upper limit (4,000 IU, or 100 mcg, a day; NIH ODS).
  2. **No embedded calculator** (§6.3); the tool is only linked.
- **Draft:**
  - Add the upper limit.
  - Add a `toolEmbed` for `vitamin-d-sun-calculator`.

### period-calculator-next-period-dates-guide — no defect
- **Verified:**
  - all worked dates for 26-, 28- and 31-day cycles (Nov 5 / Dec 1 / Dec 27; Nov 7 / Dec 5 / Jan 2; Nov 10 / Dec 11 / Jan 11);
  - ovulation Oct 24;
  - average 28.5 days;
  - ACOG 21–35 days;
  - heavy-bleeding definition;
  - contraception warnings.

### how-much-sleep-debt-do-you-have-weekly-recovery — moderate
- **Verified:**
  - default debt 7.5 h (48.5 of 56 h), about 6.9 h average, 6 of 7 nights below target;
  - weekend example 59 h;
  - CDC age bands;
  - Van Dongen 2003;
  - drowsy-driving warning.
- **Defects:**
  1. It repeats the contradictory tips removed from the tool at `b2d1ded` ("1–2 extra hours per night" vs. "30–60 minutes earlier") (X3).
  2. The weekend example (weekdays at 7 h, two 12-hour nights) is labeled "Well rested". The article's own source (NIH 2019) says weekend catch-up does not counter chronic weekday restriction.
- **Draft:**
  - Use the tool's tip: "about 30–60 extra minutes a night over several nights".
  - Add after the weekend example: "A weekly total can balance while weekday sleep stays short; research suggests weekend catch-up doesn't fully reverse the effects of short weekday sleep."

### best-time-to-stop-drinking-coffee-for-sleep — moderate
- **Verified:**
  - curfew 95 mg → 5 × log₂(95/50) ≈ 4.6 h → 6:22 PM;
  - 200 mg at 4 PM → 100 mg at 9 PM;
  - sleep-cycle times 9:45 PM, 11:15 PM and 12:45 AM;
  - Drake 2013.
- **Defects:**
  1. Contradictory advice. The article recommends stopping 8–10 hours before bed (1–3 PM), while the embedded curfew tool shows 6:22 PM, 4.6 hours before bed, for one coffee. The tool's 50 mg residual model is a site heuristic, not a sleep-study threshold. Drake found that 400 mg disrupted sleep even 6 hours before bed.
  2. Thin (a 2-minute read).
  3. Tag "Mental Wellness" is off-topic.
- **Draft:** explain that the tool estimates when one dose falls to about 50 mg, that studies show larger doses can disturb sleep even 6 hours later, and that sensitive people should use the earlier, 8–10-hour rule.

## Summary — 33 moderate-risk articles

| Result | Count | Articles |
|---|---|---|
| **High** | 4 | waist-to-height (wrong embedded tool; boundary contradiction), waist-to-hip (WHO "above" vs "at or above"; no embed; wrong source year), VO2 max (fitness age and bands removed from the tool on #56), alcohol-units (three numerical errors; unsupported red-wine claim) |
| Moderate | 13 | calories-to-lose-weight, protein, keto (SGLT2 / ketoacidosis), meal plan, calorie-deficit (no embed), weight-loss timeline, keep-muscle, water (broken source), anti-inflammatory, hidden alcohol calories, sleep debt, coffee cutoff, BMI-by-age* |
| Low | 10 | macros, ideal weight, lean body mass, recovery, strength program, 1RM, reduce sitting, gut, vitamin D, push-up (norms to verify) |
| None | 6 | BMR, body-fat, FFMI, waist-based risk, weight-loss %, period |

\*BMI-by-age is borderline, low to moderate.

**Cross-cutting:**
- X1 (share text) is **fixed in code** on #56 at `52f393c`.
- X3 is the important release coupling. Seven articles describe tool behavior that #56 changes, so their corrected drafts should be published with the #56 release.
