# Phase 3 §7.2 — initial editorial audit of 10 high-risk articles (2026-11-14)

**Scope.** These are the ten articles named in `PHASE3_RISK_CLASSIFICATION_20261114.md`. Each was read from its public published page on `healthylifesstyles.com` under the owner's read-only authorization of 2026-11-14. No drafts, credentials or CMS records were accessed or changed.

**Method.**
- Claim-level checks were made against the article's own cited sources and current authoritative guidance:
  - the 2025 AHA/ACC blood-pressure guideline;
  - CDC NCHS Data Brief 511;
  - ACOG Committee Opinion 700;
  - CDC "Hear Her" urgent maternal warning signs;
  - IOM/CDC pregnancy weight-gain guidance;
  - USPSTF 2021 diabetes screening;
  - ACOG/ASRM fertility guidance;
  - AHA pulse and heart-rate pages.
- Every worked numerical example was recomputed.
- Each article's embedded calculator, internal links, author attribution and dates were checked.

**Limitation.** The fetch tool returns a faithful structured rendering of each page (headings, figures, thresholds, sources, links, embeds) rather than byte-exact HTML. Each correction below therefore states the intended change. At application time it must be matched to the exact field text in the CMS record, as a draft, without creating a new record. This is an AI engineering and editorial review, **not** a licensed clinical review.

## Summary

| # | Article | Result | Severity |
|---|---|---|---|
| 1 | what-do-your-blood-pressure-numbers-mean | Outdated against the 2025 AHA/ACC guideline; stale prevalence figure; no device guidance | **High** |
| 2 | what-does-your-heart-disease-risk-score-mean | Accurate and appropriately limited; examples verified | None |
| 3 | what-does-type-2-diabetes-risk-score-mean | Accurate (CDC thresholds, USPSTF 35–70, DPP 58%); optional ADA screening note | Low |
| 4 | pregnancy-week-by-week-guide | Accurate timelines; warning list omits a CDC urgent sign (thoughts of harming yourself or the baby) | **High** |
| 5 | due-date-by-conception-date | Omits the ACOG rule that IVF dates are not re-dated by ultrasound and omits the re-dating thresholds; thin (2-minute read); unrelated "related guides"; one citation needs checking | **High** |
| 6 | pregnancy-weight-gain-calculator-healthy-range-guide | Accurate (IOM ranges, twin ranges, weekly rates, +340/+450 kcal); BMIs in the examples verified | None |
| 7 | ovulation-calculator-fertile-window-guide | Accurate; all three worked examples verified; strong contraception warning | Low |
| 8 | normal-resting-heart-rate-by-age | Accurate (AHA 60–100; CMAJ 2016 meta-analysis); tagged "Mental Wellness" | Low |
| 9 | how-to-calculate-target-heart-rate-zones-karvonen | All zone values verified; beta-blocker caution present; tagged "Resistance/Strength Training" | Low |
| 10 | intermittent-fasting-for-beginners | No medication warning (the tool now has one); thin (3-minute read); comparison table did not render | **High** |

**Attribution (all ten).** Each article is bylined "HealthyLifeStyles Editorial Team", and none claims a medical reviewer. This complies with §7.3. No reviewer was added or implied by these corrections.

**Embedded calculators (all ten).** Every embed is present and interactive and links to its canonical tool page. The live preflight at `e2fd47f` reported 0 errors.

---

## 1. What Do Your Blood Pressure Numbers Mean? — High

**Facts read from the page.**
- Chart: Normal below 120/below 80; Elevated 120–129/below 80; Stage 1 130–139/80–89; Stage 2 140+/90+; "Hypertensive crisis" over 180/over 120.
- Prevalence: "about 46% of US adults with hypertension (CDC, 2024)".
- Advice: a doctor visit for repeated readings ≥140/90.
- FAQ: "hypertensive urgency vs emergency".
- Sources: AHA (2024), CDC (2024), NHLBI.
- Dates: published and updated July 26, 2026.

**Findings.**
1. **Terminology is outdated.** The 2025 AHA/ACC guideline (Jones et al., *Hypertension* 2025, doi:10.1161/HYP.0000000000000249) retires "hypertensive urgency". It uses *severe hypertension* (>180 and/or >120 mmHg) without new target-organ damage, and *hypertensive emergency* when there is new or worsening organ damage. The site's Blood Pressure Checker already uses the 2025 terms.
2. **Ambiguous chart.** The "/" separators read as "and". The guideline uses "or" for Stage 1 (130–139 **or** 80–89) and Stage 2 (≥140 **or** ≥90). The checker's zones were corrected at `47e0d0d`, so the article and tool now disagree.
3. **Stale prevalence.** CDC NCHS Data Brief 511 (Oct 2024) reports 47.7% of US adults with hypertension in Aug 2021–Aug 2023 (48.1% in 2017–Mar 2020).
4. **Next steps understate clinical follow-up.** Under the 2025 guideline, Stage 1 (≥130/80) warrants discussion with a clinician, because treatment depends on overall risk. Waiting for repeated readings of 140/90 or above delays that.
5. **Measurement guidance gap.** The 2025 guideline recommends:
   - a validated upper-arm cuff (validatebp.org);
   - classification on the average of ≥2 readings on ≥2 occasions;
   - **not** using cuffless devices or smartwatches for diagnosis.

   The article covers posture and cuff size but none of these points.
6. **Sources.** The 2025 guideline isn't cited, although the article was updated in 2026.

**Correction (draft, in place).**
- **Chart:**
  - Normal: below 120 and below 80.
  - Elevated: 120–129 and below 80.
  - Stage 1: 130–139 or 80–89.
  - Stage 2: 140 or higher, or 90 or higher.
  - Replace "Hypertensive crisis" with "Severe hypertension: higher than 180 and/or higher than 120 — contact your clinician promptly; call 911 if you also have chest pain, shortness of breath, back pain, numbness or weakness, vision changes, trouble speaking, or a severe headache (signs of a hypertensive emergency)."
- **Prevalence:** "Nearly half of US adults (47.7%) have hypertension, according to CDC national survey data from 2021–2023."
- **Next steps:** "If your average home reading is 130/80 or higher, talk with your clinician; whether lifestyle changes alone or medication are recommended depends on your overall cardiovascular risk. Readings repeatedly at or above 140/90 need prompt follow-up."
- **New paragraph on measurement:** use a validated upper-arm cuff (validatebp.org); base decisions on the average of at least two readings on at least two occasions; the 2025 guideline does not recommend cuffless devices such as smartwatches for diagnosis.
- **FAQ:** rename "hypertensive urgency vs. emergency" to "severe hypertension vs. hypertensive emergency" and rewrite the answer to the definitions above.
- **Sources:** add the 2025 guideline (primary) and CDC NCHS Data Brief 511 (https://www.cdc.gov/nchs/products/databriefs/db511.htm). Keep the existing three.
- Set `updatedDate` when the correction is approved and published (owner action).

## 2. What Does Your Heart Disease Risk Score Mean? — no defect
- Scoring is verified against the tool: age 0/1/2/3, smoking 0/1/3, activity 0/1/2, BMI 0/1/2, BP 0/1/2.
- The article clearly says the score is not a 10-year probability.
- It describes AHA PREVENT correctly (10-year risk for ages 30–79 without CVD, plus 30-year risk for eligible younger adults).
- It lists the missing inputs (cholesterol, diabetes, kidney function, medicines) and points to emergency care for symptoms.
- No correction needed.

## 3. What Does Your Type 2 Diabetes Risk Score Mean? — low
- The CDC A1C, fasting and OGTT thresholds are correct.
- USPSTF 2021 (screen ages 35–70 with overweight or obesity) is correct.
- The DPP (5–7% weight loss, 58% lower incidence) is correct.
- The "not a validated probability" disclaimer is present.
- **Optional:** add one sentence noting that the American Diabetes Association recommends testing all adults from age 35, and earlier with risk factors. This helps readers whose BMI is under 25 but who have other risks. Not a defect.

## 4. Pregnancy Week-by-Week — High (safety)
- Verified:
  - trimesters (1–13, 14–27, 28+);
  - ACOG term definitions;
  - anatomy scan at 18–22 weeks;
  - gestational diabetes screening at 24–28 weeks;
  - GBS screening at 36–37 weeks;
  - fever ≥100.4 °F;
  - dating examples (73 days = 10w3d; 125 days = 17w6d).
- **Finding.** The urgent-symptom list is modeled on the cited CDC "Hear Her" urgent maternal warning signs, but it omits **thoughts about harming yourself or your baby**, which CDC lists as urgent. It also omits severe nausea and vomiting, overwhelming tiredness, and a fast-beating heart.
- **Correction (draft).** Add to the urgent list: "thoughts about harming yourself or your baby," "a fast or pounding heartbeat," "severe nausea and vomiting," and "overwhelming tiredness." Add: "If you have thoughts of harming yourself or your baby, call or text 988 (Suicide & Crisis Lifeline) or the National Maternal Mental Health Hotline at 1-833-TLC-MAMA (1-833-852-6262), or call 911."
  - **For the clinical reviewer:** confirm the hotline numbers at the time of publication.

## 5. Due Date by Conception Date — High
- Verified:
  - LMP + 280 days;
  - conception + 266 days;
  - IVF day-5 transfer + 261 and day-3 transfer + 263 (ACOG CO 700);
  - "fewer than 1 in 20 babies arrive on the due date".
- **Findings.**
  1. The article says early ultrasound "refines" the estimate and "may shift" the date, without exceptions. ACOG CO 700 says that when pregnancy results from ART, the ART-derived gestational age should be used to assign the due date. IVF due dates are therefore not re-dated by ultrasound, and the article implies they are.
  2. It omits the ACOG re-dating thresholds: change the due date if first-trimester ultrasound differs from LMP dating by more than 5 days before 9 0/7 weeks, or by more than 7 days from 9 0/7 to 13 6/7 weeks.
  3. **Thin content.** At a 2-minute read, this is the shortest article in the sample. It has no limitations section and no when-to-call guidance.
  4. **Weak internal links.** The "related guides" are water, coffee and gut health. The relevant ones are the pregnancy week-by-week, ovulation and weight-gain guides.
  5. Citation "Naegele's rule reference (NCBI Bookshelf NBK459351)" could not be confirmed as a Naegele's-rule source in this audit; check that the link resolves to the intended page.
- **Correction (draft).**
  - Add an "IVF and ultrasound" paragraph: for IVF pregnancies the transfer-based date is used and normally isn't changed by ultrasound; for other pregnancies, a first-trimester ultrasound changes the due date if it differs from LMP dating by more than 5 days before 9 weeks or more than 7 days from 9 to 13 6/7 weeks (ACOG CO 700).
  - Add a short "What a due date can't tell you" section, and a "Contact your care team" line pointing to the pregnancy week-by-week guide's warning-sign section.
  - Replace the related guides with pregnancy-week-by-week-guide, ovulation-calculator-fertile-window-guide and pregnancy-weight-gain-calculator-healthy-range-guide (all existing records; relationships only).
  - Verify or replace the NBK459351 citation.

## 6. Pregnancy Weight Gain — no defect
- Verified:
  - IOM/CDC singleton ranges (28–40 / 25–35 / 15–25 / 11–20 lb);
  - twin ranges (37–54 / 31–50 / 25–42 lb);
  - second- and third-trimester weekly rates (≈1 / 1 / 0.6 / 0.5 lb);
  - extra calories (+340 and +450 kcal);
  - the BMI in example A (140 lb, 5 ft 5 in → 23.3), example B (170 lb, 5 ft 4 in → 29.2) and the embed sample (65 kg, 165 cm → 23.9);
  - the emergency guidance.

## 7. Ovulation Calculator — low
- Verified:
  - all three worked examples (26/28/32-day cycles from Nov 1 → ovulation Nov 13/15/19; next period Nov 27/29/Dec 3);
  - LH-to-ovulation time of 24–36 h;
  - egg viability of 12–24 h;
  - Standard Days Method days 8–19 for 26–32-day cycles;
  - ACOG infertility-evaluation timing.
- It says explicitly not to use the calculator as contraception.
- **Minor:** ACOG "Evaluating Infertility" is linked inline but missing from the source list. Add it to the sources.

## 8. Normal Resting Heart Rate — low
- AHA 60–100 bpm, the cutoffs matching the tool (<40 / 40–59 / 60–100 / >100), the emergency symptoms and the Zhang 2016 CMAJ meta-analysis are all correct.
- **Minor taxonomy:** the article is tagged "Mental Wellness"; replace it with "Heart Health" or "Fitness".

## 9. Target Heart Rate Zones (Karvonen) — low
- Every zone value was recomputed and matches:
  - HRR 125 → 128–140 / 140–153 / 153–165 / 165–178 / 178–190;
  - Tanaka 187 → 126–138;
  - 60% of HRmax = 114.
- The beta-blocker and cardiac cautions are present.
- **Minor taxonomy:** tagged "Resistance Training, Strength Training"; this is a cardio topic, so use "Heart Health" or "Cardio".

## 10. Intermittent Fasting for Beginners — High (safety)
- **Findings.**
  1. The "who should not fast" list (pregnancy or breastfeeding, under 18, disordered eating, diabetes) **does not mention medicines**. Fasting while taking glucose-lowering medication (insulin, sulfonylureas) can cause hypoglycemia, and some medicines must be taken with food. The embedded Intermittent Fasting tool was corrected at `ff0eee3`, so the article and tool now disagree.
  2. **Thin content.** At a 3-minute read, there is little for a YMYL topic.
  3. **Table not rendering.** The protocol comparison table didn't render in the public page text. Confirm in the CMS that the table block has rows. If it is empty, that is a rendering or content defect.
- **Correction (draft).**
  - Extend the warning: "…or take medicine that lowers blood sugar (such as insulin or sulfonylureas) or must be taken with food — check with a healthcare professional first."
  - Add a short "Possible side effects" paragraph: hunger, headache, irritability and dizziness early on; stop and seek advice if they persist.
  - Verify the comparison-table block.

## Owner actions (consolidated)
1. Authorize applying corrections 1, 4, 5 and 10 (high), then the low items 3 and 7–9, as **drafts on the existing CMS records**, after independent clinical review. Nothing has been written to the CMS.
2. Independent licensed clinical review of these corrections (pending; not claimed).

---

## Addendum — remaining two high-risk articles

### 11. Maximum Heart Rate: 220 Minus Age vs. Tanaka — low
- **Verified.**
  - Tanaka table: ages 20/30/40/50/60/70 give 194/187/180/173/166/159, crossing 220 − age at age 40.
  - Age-50 %HRmax zones: moderate 85–119 and vigorous 119–145 (170 max); 87–121 and 121–147 (173 max).
  - HRR example: 60% gives about 138 bpm, against about 112 bpm for 60% of maximum.
  - The beta-blocker caution, the maximal-test safety advice and the emergency symptoms are all present.
- **Minor taxonomy.** Tagged "Resistance Training, Strength Training" (cardio topic). Use "Heart Health" or "Cardio", as for article 9.

### 12. How Much Caffeine Is Too Much in a Day? — low
- **Verified.**
  - The worked totals (190 / 317 / 422 / 375 mg) match the presets.
  - EFSA's single-dose figure of 200 mg.
  - Drake et al. 2013 (400 mg disrupting sleep 6 h before bed).
  - The urgent-care symptoms.
  - The "who should limit" list, which includes medicines.
- **Findings and corrections (draft).**
  1. **FDA wording.** The FDA describes 400 mg/day as an amount "not generally associated with dangerous, negative effects". The article drops "dangerous", which makes the statement stronger. Use the FDA wording.
  2. **US pregnancy source.** The 200 mg pregnancy limit is cited only to the UK NHS. Add ACOG (moderate caffeine, under 200 mg a day, is not a major contributing factor in miscarriage or preterm birth) as the US source; keep the NHS source.
  3. **Energy-drink preset.** The 80 mg preset reflects a small (8.4 fl oz) can. Many energy drinks contain 150–300 mg or more. State the can size and advise checking labels.
  4. **Large doses.** Add the FDA note that about 1,200 mg consumed rapidly has been associated with seizures, and that pure or highly concentrated powders and liquids can be dangerous in small amounts.
  5. **Sources list.** The caffeine-withdrawal review (NCBI Bookshelf NBK430790) is cited inline but missing from the list; add it.
