# Phase 3 §7.3 / §7.5 — Editorial quality pass (60 published articles)

Date: 2026-11-14 · Branch `integration/calculator-safety-20261114` (PR #56)
Scope:
- American-English consistency;
- medically responsible language;
- thin content;
- source quality;
- internal links;
- article-tool coherence.
Method: read-only. No CMS record was changed and no draft was created.

> AI-assisted editorial engineering review. This is **not** a licensed clinical
> sign-off. Every proposed text below is an **offline draft**. It must pass
> independent medical review and owner authorization before entering the CMS.

## 1. Method and evidence

- Lint: `scripts/content/editorial-lint.mjs`. It runs in `.github/workflows/reference-audit.yml` (non-blocking, read-only) and its unit tests are `scripts/seo/__tests__/editorial-lint.test.mjs` (3 tests).
- What it reads: article title, excerpt, SEO title and description, every layout text block (via the same `blockTexts` the release preflight uses), and the FAQ.
- What it skips: cited source titles are exempt from the spelling check. Negated cautions ("does not guarantee", "no miracle") are not flagged as overclaims.
- Run **43609387700** @ `9e6f218`, 60 articles. Findings: thin-content 10, british-spelling 2, overclaim-review 14, no-internal-links 4, few-sources 2, no-faq 1, tool-missing 4.
- Every lint finding was then checked by hand against the public article page (authorized read-only access). Manual verdicts are below.
- The claim-level medical findings from §7.1/§7.2 (`PHASE3_AUDIT_*`) and the §7.4 reference corrections (`PHASE3_REFERENCE_AUDIT_20261114.md`) are **not repeated** here.

## 2. American English (§7.3)

| Article | Current | Replace with |
|---|---|---|
| 13 `how-much-water-should-you-drink-a-day` | litres / litre (6 sentences) | liters / liter |
| 13 | "vomiting, or diarrhoea" | "vomiting, or diarrhea" |
| 13 | "high-fibre diet" | "high-fiber diet" |
| 13 | "soups, yoghurt, and produce" | "soups, yogurt, and produce" |
| 13 | "Pale, straw-coloured urine" (×2) | "Pale, straw-colored urine" |
| 11 `how-to-calculate-your-macros` | flavour | flavor |
| 11 | organise | organize |

For article 13, the US audience reads fluid amounts in ounces and cups first. Where both units appear, lead with US customary and put metric in parentheses. Example: "about 125 oz (3.7 liters) of total water a day for men and 91 oz (2.7 liters) for women". The numbers are unchanged; this is a format change only.

The other 58 articles: no British spelling in reader-facing copy.

## 3. Medically responsible language (§7.3)

The lint flagged 14 articles. Manual review found **12 of 14 responsible as written**: the hit appears in a caution ("not … a guarantee", "None guarantees…") or in a FAQ question that the article answers "no". IDs 29, 41, 42, 49, 50, 51, 55, 56, 58, 59, 65 and 66 need no change.

Two genuine wording issues:

| Article | Current | Proposed |
|---|---|---|
| 11 `how-to-calculate-your-macros` | "…because it guarantees you hit protein." | "…because it makes it easier to reach your protein target." |
| 37 `healthy-waist-to-height-ratio` | "…see why this visceral fat metric…" and "…tracks abdominal fat directly." | "…see why this simple measure of where you carry weight…" and "…reflects abdominal (central) fat better than BMI alone, although it does not measure visceral fat directly." WHtR is an anthropometric proxy (Ashwell 2012, PMID 22106927). ID 37 is also under the §6.3 wrong-primary gate and §7.4 W3/D2/R1; apply all of its corrections together |

## 4. Article-tool coherence (§7.5)

- Four articles still lack their primary-tool embed: 27 HRV, 28 vitamin D, 29 calorie deficit, 32 WHR. ID 37 embeds the wrong tool. All five are already gated exactly in `scripts/content/article-tool-gates.json` (§6.3), and each gate carries its correction.
- The other 55 articles embed their primary tool.
- **New coherence defect, ID 2 `how-much-protein-do-i-need`:** the body says active people need 1.4–2.0 g/kg/day (ISSN position stand), but the FAQ says 1.6–2.2 g/kg/day for building muscle. Proposed FAQ answer: "Most active adults do well with about 1.4–2.0 g per kg of body weight per day. In the Morton 2018 meta-analysis, extra protein stopped adding measurable muscle gains at around 1.6 g/kg/day, with an upper estimate near 2.2 g/kg/day, so going higher is rarely needed." Both sources are already cited in the article and verified (PMIDs 28642676 and 28698222).
- Missing FAQ: only ID 27. Add three questions with the HRV gate correction: "What is a normal HRV?", "Why does my HRV change from day to day?" and "Can a wearable diagnose a heart problem from HRV?" (answer: no; persistent symptoms need a clinician).

## 5. Source quality (§7.5)

Source quality depends on the §7.4 corrections. After them, two articles fall below three credible sources:

| Article | Sources after §7.4 fixes | Add (all verified records, already cited elsewhere on the site) |
|---|---|---|
| 17 `lean-body-mass-calculator-guide` | 1 (MedlinePlus "Muscle Mass" image page) once W2 is removed | NIH Technology Assessment Conference Statement, "Bioelectrical impedance analysis in body composition measurement" (PMID 8974099); Kyle UG et al., "Fat-free mass index and fat mass index percentiles in Caucasians aged 18–98 y" (PMID 12080449) |
| 16 `calories-burned-calculator-guide` | 2 (CDC with D3 fix; MedlinePlus) | Herrmann SD et al., "2024 Adult Compendium of Physical Activities" (PMID 38242596) for the MET section; "Reliability and Validity of Commercially Available Wearable Devices for Measuring Steps, Energy Expenditure, and Heart Rate: Systematic Review" (PMID 32897239) for the tracker section |

Weak but acceptable sources (low): ID 3 cites "CDC, About Adult BMI" but links the BMI calculator. Point it to `https://www.cdc.gov/bmi/about/index.html` ("About Body Mass Index (BMI)"), and replace the WHO topic page as in §7.4 L4.

## 6. Internal links (§7.5)

Every article page renders "Try these tools" and "Related guides" modules, so no page is an orphan. Four articles have **no contextual link in the body copy**. Proposed in-copy links, all to published slugs from the CI article and tool map:

| Article | Add a link at | Target |
|---|---|---|
| 13 water | "What changes how much water you need?" → heat/exercise sentence | `/tools/water-intake-calculator`; `/wellness-hub/how-much-caffeine-is-too-much-per-day` from "Do coffee, tea, and food count?" |
| 15 metabolic age | "How is Metabolic Age Calculated?" | `/wellness-hub/what-is-bmr-calculator-daily-calorie-needs`; `/tools/bmr-calculator` |
| 16 calories burned | "How Do MET Values Estimate…" and the tracker section | `/wellness-hub/how-long-to-walk-to-burn-calories`; `/wellness-hub/how-many-calories-burn-walking-10000-steps` |
| 17 lean body mass | "How to Protect Your Lean Mass While Losing Weight" | `/wellness-hub/how-to-keep-muscle-while-losing-weight`; `/wellness-hub/what-is-ffmi-fat-free-mass-index-guide` |

No broken internal link was found: every in-copy link resolves to a published article or tool, with aliases honored.

## 7. Thin content (§7.3): offline expansion drafts

Ten articles are under 700 words (2–3 minute reads). They cover high-intent calculator topics, so each draft adds **one or two sections** that answer the reader's next question. Each draft uses only sources that are verified in this audit, and links to existing guides rather than duplicating them. No new articles. Target length: about 850–1,000 words each.

### 7.1 ID 2 `how-much-protein-do-i-need` (588 words)
New H2 **"When to check with a clinician first"**: "If you have chronic kidney disease, or a clinician has told you to limit protein, do not raise your intake based on a calculator. Ask your care team for a target. During pregnancy, protein needs rise. The Institute of Medicine sets a higher recommended intake for the second half of pregnancy than for other adults, so a prenatal care provider is the right person to set your number." Source: IOM DRI (NBK56068, already cited). Plus the FAQ harmonization in §4.

### 7.2 ID 3 `healthy-bmi-by-age` (525 words)
New H2 **"What BMI can't tell you"**:
- BMI does not separate fat from muscle and does not show where fat is stored.
- Waist-to-height ratio is a quick second check. Keeping your waist below half your height is a widely used screening threshold (Ashwell 2012, PMID 22106927). Link `/tools/waist-to-height-ratio-calculator`.

New H3 under "Does a healthy BMI change with age?", **"Ethnicity and BMI"**: "A WHO expert consultation found that many Asian populations have a substantial risk of type 2 diabetes and heart disease at BMIs below 25. It kept the international cut-offs but identified additional public-health action points, starting at 23 (WHO Expert Consultation, Lancet 2004, PMID 14726171). Ask your clinician which thresholds apply to you."

### 7.3 ID 4 `best-time-to-stop-drinking-coffee-for-sleep` (597 words)
New H2 **"Who may need an earlier cutoff"**:
- Sensitivity to caffeine varies widely.
- The FDA's 400 mg/day figure applies to healthy adults. People who are pregnant, trying to become pregnant or breastfeeding, and people who take certain medicines or have heart-rhythm or anxiety symptoms, should ask a clinician about their limit (FDA "Spilling the Beans", already cited).
- If sleep problems last for weeks despite an earlier cutoff, see a clinician rather than adjusting caffeine alone.

Also relabel the FDA source (§7.4 L1).

### 7.4 ID 5 `how-to-keep-muscle-while-losing-weight` (575 words)
New H2 **"How to tell whether you're keeping muscle"**:
- The most practical signals are steady or improving strength in your usual lifts and a shrinking waist while weight falls at about 0.5–1% per week.
- Home body-fat scales use bioelectrical impedance, which shifts with hydration, so track trends over weeks rather than single readings (NIH BIA statement, PMID 8974099).
- Link `/tools/body-fat-calculator` and `/wellness-hub/what-is-ffmi-fat-free-mass-index-guide`.

Apply with the §7.4 W4 source fix and the release-coupled description change.

### 7.5 ID 6 `due-date-by-conception-date` (568 words)
New H2 **"When your due date may be changed"**:
- An early ultrasound measurement up to 13 6/7 weeks is the most accurate way to confirm gestational age.
- ACOG changes the due date when that ultrasound differs from the LMP date by more than 5 days before 9 0/7 weeks, or by more than 7 days from 9 0/7 to 13 6/7 weeks.
- Pregnancies from IVF keep the date based on embryo age and transfer date.
- Source: ACOG CO 700, already cited.

New H3 **"What 'term' means"**: early term is 37 0/7–38 6/7 weeks, full term 39 0/7–40 6/7, late term 41 0/7–41 6/7, and postterm 42 0/7 and beyond (ACOG CO 579, PMID 24150030).

Apply with the §7.4 W6/I1 source fixes.

### 7.6 ID 8 `sleep-chronotypes-explained` (666 words)
New H2 **"Where the four animal types come from"**:
- Lion, Bear, Wolf and Dolphin are a popular framework, not a clinical classification.
- Researchers usually describe chronotype as a continuum from early to late. They often estimate it from mid-sleep time on free days, as in the large surveys by Roenneberg and colleagues (PMID 12568247, the §7.4 S1 fix).

New H3 **"When a late body clock needs medical attention"**: "If you cannot fall asleep until very late, cannot wake for work or school, and this persists for months despite consistent wake times and morning light, ask a clinician or sleep specialist about circadian rhythm sleep-wake disorders." Apply with the release-coupled description change.

### 7.7 ID 9 `how-to-build-a-meal-plan` (664 words)
New H2 **"Keep meal prep food-safe"**: refrigerate cooked food within 2 hours and eat refrigerated leftovers within 3–4 days, or freeze them. Source: USDA FSIS, "Leftovers and Food Safety", `https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety` (verified).

New H3 **"When a generic plan isn't enough"**: diabetes, kidney disease, food allergies, pregnancy or a history of disordered eating call for a plan made with a registered dietitian or clinician.

Apply with the §7.4 G1/G2 fixes (eatright and DGA 2025–2030).

### 7.8 ID 15 `metabolic-age-calculator-guide` (621 words)
New H2 **"What the number can and can't tell you"**:
- Metabolic age compares your estimated resting energy use with average values for different ages. It is an estimate built on prediction equations, not a lab measurement and not a diagnosis.
- Equations can be off by several hundred calories for an individual (Mifflin–St Jeor and the RMR-equation reviews, PMIDs 2305711 and 15883556, already cited on the site).
- Treat the result as a prompt to look at activity, strength and sleep, not as a health grade.

Consistent with the lower-risk report's metabolic-age overclaim finding. Plus the in-copy links from §6.

### 7.9 ID 16 `calories-burned-calculator-guide` (594 words)
New H2 **"Why two people burn different amounts doing the same thing"**:
- MET values in the Adult Compendium describe an average adult. Body size, fitness, technique and terrain move the real number up or down (Herrmann 2024, PMID 38242596).
- Wrist trackers estimate energy expenditure far less accurately than they count steps (PMID 32897239).
- Use either as a rough guide, and do not "eat back" exercise calories exactly.

Plus the §5 sources and the §6 links.

### 7.10 ID 17 `lean-body-mass-calculator-guide` (512 words)
New H2 **"How lean body mass is estimated"**:
- Calculators use equations built from height and weight (the Boer, James and Hume formulas). Body-fat-based methods start from a body-fat estimate. Bioelectrical impedance and DEXA measure body composition more directly.
- Each method has error, so compare results from the same method over time (NIH BIA statement, PMID 8974099).
- Fat-free mass index puts lean mass in context of height (Kyle 2002, PMID 12080449). Link `/wellness-hub/what-is-ffmi-fat-free-mass-index-guide`.

Apply with the §7.4 W2 removal and the §5 sources.

## 8. Release grouping

- Corrections touching the **12 release-coupled articles** must ship in the coordinated release after PR #56 merges. From this pass that is IDs 5 and 8, together with their earlier corrections.
- ID 37 bundles the §6.3 gate, §7.4 W3/D2/R1 and the §3 wording. Its gate in `article-tool-gates.json` must be removed in the same change that fixes the CMS record, or the release preflight fails as designed.
- The other corrections are independent of the frontend and can be applied as one batch after clinical review.

## 9. Gates (unchanged)

Owner authorization and independent clinical review are required before any CMS change. No drafts were created in the CMS, nothing was published, and no indexing requests were sent.
