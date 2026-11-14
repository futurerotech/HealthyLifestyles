# Phase 3 §7.2 — editorial audit of the 15 lower-risk articles (2026-11-14)

The method and limits are as in the high-risk and moderate-risk reports. Articles were read from the public published pages, read-only. Every worked example was recomputed. Drafts are offline and target the existing CMS records; nothing in the CMS was changed. The cross-cutting codes X1–X5 are defined in `PHASE3_AUDIT_MODERATE_ARTICLES_20261114.md`.

| Article | Result | Verified | Defects → draft |
|---|---|---|---|
| how-to-calculate-running-pace | Low | 9:39/mi 5K; 27:30 → 5:30/km ≈ 8:51/mi; 52:30; 29:35; marathon at 4:00/km = 2:48:47; 4:00/km = 6:26/mi = 15 km/h | Tags "Women's Health", "Heart Health", "Health Risk" off-topic (X4). The extraction flagged "higher speed numbers mean faster running" as an error, but the sentence is correct; no change. |
| calories-burned-calculator-guide | Low | 9.8 × 72 × 0.75 = 529 kcal; 706 and 353 kcal | Weightlifting is MET 5.0 in the tool but 6.0 in the article. Use the Compendium values for vigorous (6.0) and moderate (3.5) resistance training, and state which the tool uses. "Trackers overestimate up to 20–30%" and "workouts are 5–10% of daily expenditure" are uncited; add sources or soften. Thin (3 min). Share text (X1, fixed). |
| how-many-calories-burn-walking-10000-steps | None | Stride 0.415 × 170 = 70.6 cm; 5.64 km; 1.18 h; 296 kcal; 10,000 steps → 7.06 km / 370 kcal; 7,000-step finding (Lancet Public Health 2025) framed as association | Share text only (X1, fixed). |
| how-long-to-walk-to-burn-calories | None | 285 kcal at 70 kg → 64.3 / 24.9 / 32.6 min; burger 563 kcal → 127 min; careful "food is not a debt" framing | — |
| metabolic-age-calculator-guide | Moderate | BMR 1,669 vs typical 1,670 → "about your age" | Overclaims that metabolic age is "driven entirely by" resting energy use and "essentially a proxy" for muscle-to-fat ratio; replace with "a simplified comparison of your estimated BMR with a typical value for your age and sex". The "Evidence-Based" tag is not supported, since no source validates the metric. Thin (3 min). Share text (X1, fixed). |
| how-to-calculate-calories-in-a-recipe | Low | Household-to-gram conversions plausible; "missing ≠ zero" caution | No caution that AI ingredient parsing can misidentify foods and that the analyzer cannot detect allergens. Add: "Check each matched ingredient; the analyzer cannot tell you whether a recipe is safe for a food allergy." |
| smoking-cost-per-year-quit-savings-guide | None | All totals (e.g. 1.5 packs × $15 × 365 = $8,212.50; $180 for 30 days at 0.5 pack and $12); CDC timelines; quitlines | The widget's "normalise" wording was fixed on #56 (X3). |
| what-time-should-you-go-to-bed-sleep-cycles-explained | Low | 9:45 PM / 11:15 PM / 12:45 AM; 7:45 / 6:15 / 4:45 AM; CDC age bands; NHLBI 80–100 min | The live tool's "helps you feel refreshed" contradicts the article's own (correct) caveat. The tool note was fixed on #56 (X3). |
| sleep-chronotypes-explained | **Moderate** | — | Same problems fixed in the tool's page copy on #56 (X3): unsourced population shares ("about half", "10–15%"); framework not attributed to Michael Breus; no statement that it is not validated and that research uses the MEQ and MCTQ; no insomnia or sleep-disorder pointer. The Roenneberg 2003 source is a PubMed *search* link; replace it with the article link. Thin (2 min). Tag "Mental Wellness" off-topic. |
| how-long-should-you-nap-best-length-and-timing | Low | All five worked nap times; Brooks & Lack 2006 | The 2016 and 2023 studies are cited inline but missing from the source list; add them. |
| how-blue-light-affects-sleep-evening-habits-score | Low | 12/40 → 30/100; 16/40 → 40/100; 36/40 → 90/100; Cochrane 2023 cited accurately | After #56 an unused device or filter is not penalized, which may change the "screen-free" example (X3); re-run that example at release. |
| flexibility-mobility-score-at-home-tests-guide | Low | 1 + 1 + 1 + 2 = 5/9, +0.5 at age 45 | "Sex is used because the formula differs" is unexplained; state what changes, or remove the claim. |
| how-to-keep-a-food-and-symptom-diary | Low | Allergy vs. intolerance; celiac testing caveat; emergency signs | No statement of where diary entries are stored; add a privacy note like the HRV article's. The tool is only linked (§6.3); add a `toolEmbed` for `food-symptom-diary`. |
| how-to-read-your-hrv-trend | None (content) | Careful device and arrhythmia caveats; exemplary local-storage privacy note | The tool is only linked (§6.3); optionally add a `toolEmbed` for `hrv-explainer-log`. |
| what-does-your-lifestyle-age-test-mean | Low (X3) | Examples A (−3 → 32), B (+22 → capped +12 → 62) and C | The scoring table gives every pulse under 60 bpm −2 years and 90+ bpm +3.5. After #56, a pulse below 40 is not rewarded and above 100 prompts a medical-review notice. Update the table at release. |

**Totals (15):** 2 moderate (metabolic age, chronotypes), 9 low, 4 none.

## Phase 3 §7.2 — all 60 published articles

| Risk class | Audited | High | Moderate | Low | None |
|---|---|---|---|---|---|
| High-risk articles | 12 | 4 | — | 6 | 2 |
| Moderate-risk articles | 33 | 4 | 13 | 10 | 6 |
| Lower-risk articles | 15 | — | 2 | 9 | 4 |
| **Total** | **60** | **8** | **15** | **25** | **12** |

The high-risk articles were reported on a high/low/none scale, so they have no moderate column.

**Code defect found by the audit and fixed:** X1, article-embed share text, at `52f393c`.

**Release coupling (X3):** these article drafts must ship with the #56 release:
- VO2 max;
- waist-to-hip;
- keep-muscle;
- intermittent fasting;
- weight-loss timeline;
- sleep debt;
- anti-inflammatory;
- alcohol units;
- chronotypes;
- sleep cycles;
- blue light;
- lifestyle age.
