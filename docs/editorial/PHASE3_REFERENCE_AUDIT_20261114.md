# Phase 3 §7.4 — Reference integrity audit (60 published articles)

Date: 2026-11-14 · Branch `integration/calculator-safety-20261114` (PR #56)
Scope: every cited source (`doc.sources`) and every external inline link in the 60 published articles.
Method: read-only. No CMS record was changed and no draft was created.

> AI-assisted editorial engineering review. This is **not** a licensed clinical
> sign-off. Every correction below stays pending independent medical review and
> owner authorization before it is applied to the CMS.

## 1. How the audit was run

- Script: `scripts/content/reference-audit.mjs`. Workflow: `.github/workflows/reference-audit.yml` (non-blocking, `contents: read`).
- Classifier unit tests: `scripts/seo/__tests__/reference-audit.test.mjs` (3 tests, no network).
- Inputs come from the public published-content API. Each URL is fetched with redirects followed. The cited label is compared with the destination's `citation_title`, `og:title`, `<title>` and `h1`.
- PubMed, PMC and Bookshelf block automated page views (HTTP 203 or reCAPTCHA). For those records the title comes from NCBI E-utilities instead.
- Bot challenges and 401/403/429/5xx/timeouts count as **access** (temporary), never as defects.
- A mismatch on an inline prose label ("a 2016 study") is **review**. Every review item was checked by hand.
- Each finding below was re-verified by hand (WebFetch or WebSearch on 2026-11-14) before being recorded.

| Run | SHA | Result |
|---|---|---|
| 43607155017 | 4261771 | failed: `readPublishedCollection` returns an array (script bug, fixed) |
| 43607464885 | 1f00401 | 122 "mismatch" verdicts, mostly NCBI bot challenges (false positives); led to the E-utilities upgrade |
| 43607716809 | e2d561f | **60 articles · 405 citations · 223 unique URLs** — ok 302 · review 29 · mismatch 18 · dead 5 · generic 4 · search-link 1 · access 46 |
| **43608329754** | **59acc16** | final run with Bookshelf sub-part titles ignored: ok 295 · review 28 · mismatch 17 · dead 5 · generic 4 · search-link 1 · access 55 (NBK records move from "verified" to "access"; no defect changes) |

## 2. Verdict summary (after manual verification)

| Class | Count | Meaning |
|---|---|---|
| **Wrong destination** (defect) | 6 | The URL resolves to a different work than the one cited |
| **Dead** (defect) | 5 citations / 4 URLs | HTTP 404 |
| **Generic / hub page** (defect) | 3 | A specific document is cited but the link goes to a homepage or hub |
| **Redirected to a generic page** (defect) | 1 | The old URL now redirects to an unrelated overview |
| **Search-result link** (defect) | 1 | A PubMed search URL is used instead of the record |
| **Outdated edition** (defect) | 2 citations | DGA 2020–2025 cited; DGA 2025–2030 was released Jan 7, 2026 (cross-cutting X2) |
| **Unverifiable** (inconclusive) | 1 | NBK459351: page and metadata both blocked, and the label is a claim rather than a title |
| **Label is a claim, not a title** (low) | 4 | The citation text states a fact rather than the source's title |
| Access only (temporary; not defects) | 21 unique URLs | heart.org and professional.heart.org (Cloudflare), NIH ODS, ACSM PDF, ASRM, nih.gov, Stanford. Spot checks: AHA BP readings, ODS Vitamin D, ASRM, NIH sleep and Stanford all exist |
| Review items checked by hand | 29 | All 29 inline links resolve to the work the sentence describes. No defect |

## 3. Defects and exact offline corrections

Article IDs and slugs come from the CI article map. "Replace" means replacing the `url` (and, where stated, the `label`) of the existing entry in `doc.sources` or of the inline link. **Do not create new articles.**

### 3.1 Wrong destinations (high: a reader is sent to unrelated research)

| # | Article | Cited as | Current URL resolves to | Correction |
|---|---|---|---|---|
| W1 | `how-much-water-should-you-drink-a-day` | CDC — Water and Healthier Drinks | CDC **Adult BMI Calculator** (`/bmi/adult-calculator/`) | URL → `https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html` (verified: "About Water and Healthier Drinks", reviewed Mar 5, 2026) |
| W2 | `lean-body-mass-calculator-guide` | NIH — Body Composition and Health (PMC6021272) | "Oxysterol Signatures Distinguish Age-Related Macular Degeneration from Physiologic Aging" | **Remove** this entry; no NIH page with that title was found. The article's remaining verified sources (e.g. the NIH BIA Consensus Statement, PMID 8974099) already support the claims. If the editor wants a replacement, it must be a verified record |
| W3 | `healthy-waist-to-height-ratio` (ID 37) | Waist-to-height ratio as a screening tool for cardiometabolic risk — PubMed | PMID 27409907 = a **photonics** paper | URL → `https://pubmed.ncbi.nlm.nih.gov/22106927/`. Label → "Ashwell M, Gunn P, Gibson S. Waist-to-height ratio is a better screening tool than waist circumference and BMI for adult cardiometabolic risk factors: systematic review and meta-analysis. Obes Rev. 2012;13(3):275–286." (verified). The editor must confirm the year cited in the text |
| W4 | `how-to-keep-muscle-while-losing-weight` | Murphy C, Koehler K. Energy deficiency impairs resistance-training adaptations | PMID 34536305 = a **prednisolone/wheezing** trial | URL → `https://pubmed.ncbi.nlm.nih.gov/34623696/`. Label → "Murphy C, Koehler K. Energy deficiency impairs resistance training gains in lean mass but not strength: a meta-analysis and meta-regression. Scand J Med Sci Sports. 2022;32(1):125–137." (verified) |
| W5 | `how-long-does-it-take-to-lose-weight` | Hall KD, et al. "Metabolic adaptation to weight loss" | PMID 26399868 = "Metabolic adaptation to caloric restriction and subsequent refeeding: the Minnesota Starvation Experiment revisited" (Am J Clin Nutr 2015), **not Hall** | Replace with Hall KD et al. "Quantification of the effect of energy imbalance on bodyweight." Lancet. 2011;378(9793):826–837, `https://pubmed.ncbi.nlm.nih.gov/21872751/` (verified; models the weight-loss time course this timeline article describes). Alternatively, keep PMID 26399868 and correct the label to the actual paper. The editor decides which claim the citation must support |
| W6 | `due-date-by-conception-date` | ACOG. Ultrasound dating in the first trimester is the most accurate method | ACOG **Women's Health hub** (`/womens-health`) | URL → `https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date`. Label → "ACOG Committee Opinion No. 700: Methods for Estimating the Due Date (2017; reaffirmed)". PubMed 28426621. Consistent with the ACOG CO 700 findings already in `PHASE3_AUDIT_10_ARTICLES_20261114.md` |

### 3.2 Dead links (HTTP 404)

| # | Article | Cited as | Correction |
|---|---|---|---|
| D1 | `alcohol-units-calculator` | CDC – Binge Drinking Fact Sheet (2024) | CDC retired that fact sheet. URL → `https://www.cdc.gov/alcohol/excessive-drinking-data/index.html` (CDC "Data on Excessive Alcohol Use": binge-drinking definition and prevalence). Label → "CDC — Data on Excessive Alcohol Use" |
| D2 | `healthy-waist-to-height-ratio` (ID 37) | Assessing Your Weight — CDC (2023) | URL → `https://www.cdc.gov/bmi/about/index.html` ("About Body Mass Index (BMI)", live). Label to match |
| D3 | `metabolic-age-calculator-guide` ("CDC — Physical Activity for a Healthy Weight") and `calories-burned-calculator-guide` ("CDC — Physical Activity") | same dead URL `/physical-activity-basics/index.html` | URL → `https://www.cdc.gov/healthy-weight-growth/physical-activity/index.html` (verified: "Physical Activity and Your Weight and Health", reviewed Apr 7, 2026) |
| D4 | `hidden-calories-in-alcohol-and-weight-loss` | NIAAA – What's a Standard Drink? (Rethinking Drinking) | URL → `https://www.niaaa.nih.gov/alcohols-effects-health/what-standard-drink` (verified: "What Is A Standard Drink?", updated Dec 2025; about 14 g pure alcohol) |

### 3.3 Generic, redirected, search and outdated links

| # | Article | Issue | Correction |
|---|---|---|---|
| G1 | `how-to-build-a-meal-plan` | "Academy of Nutrition and Dietetics. How to Build a Healthy Eating Routine" → `eatright.org` homepage | No eatright.org article with that title was found. Either point to a verified article and retitle the label to match, e.g. "Forget Low-Fat and Low-Sugar — Concentrate on a Healthy Eating Pattern" (`https://www.eatright.org/health/wellness/healthy-habits/forget-low-fat-and-low-sugar-concentrate-on-a-healthy-eating-pattern`, reviewed Jul 21, 2025), or remove the entry |
| G2 | `how-to-build-a-meal-plan` (×2) | "Dietary Guidelines for Americans, 2020–2025" → `dietaryguidelines.gov` | Outdated edition (X2). Cite the current **Dietary Guidelines for Americans, 2025–2030** document on dietaryguidelines.gov and re-check any number taken from the 2020–2025 edition |
| G3 | `how-to-calculate-calories-in-a-recipe` | USDA FoodData Central → homepage | **Acceptable**: the citation names the database itself. No change |
| R1 | `healthy-waist-to-height-ratio` (ID 37) | NHLBI "Classification of Overweight and Obesity by BMI, Waist Circumference…" (`/health/educational/lose_wt/risk.htm`) now redirects to the generic "Aim for a Healthy Weight" page | The classification table is no longer at this URL. Replace with `https://www.niddk.nih.gov/health-information/weight-management/adult-overweight-obesity/am-i-healthy-weight` (live) or remove; adjust the label |
| S1 | `sleep-chronotypes-explained` | Roenneberg T, et al. "Life between clocks…" is a **PubMed search URL** | URL → `https://pubmed.ncbi.nlm.nih.gov/12568247/` (the search resolves to this record; E-utilities title matches: "Life between clocks: daily temporal patterns of human chronotypes") |

### 3.4 Inconclusive and low-severity label quality

| # | Article | Item | Action |
|---|---|---|---|
| I1 | `due-date-by-conception-date` | "Naegele's rule: LMP + 280 days (40 weeks) is the standard estimate." → NBK459351 | Unverifiable here (reCAPTCHA on both page and metadata). The label is a claim, not a title. Replace with **ACOG CO 700** (which states the EDD convention of 280 days from LMP; PMID 28426621) or StatPearls "Pregnancy Due Date" (NBK536986), and use the source's title as the label |
| L1 | `best-time-to-stop-drinking-coffee-for-sleep` | "Institute of Medicine / FDA. Caffeine half-life is roughly 5 hours…" | The URL is the FDA page "Spilling the Beans: How Much Caffeine is Too Much?" (ok). Retitle the label to the FDA page title and drop "Institute of Medicine", which this URL does not support |
| L2 | `how-long-does-it-take-to-lose-weight` | CDC "Losing Weight" — about 1 to 2 … | The page is "Steps for Losing Weight" (ok). Use the page title as the label; keep the claim in the article body |
| L3 | `how-much-caffeine-is-too-much-per-day` | "EFSA — Caffeine: Safety Assessment (2015)" → EFSA caffeine topic page | Acceptable destination. Either relabel as "EFSA — Caffeine (topic page)" or link the 2015 Scientific Opinion directly |
| L4 | `healthy-bmi-by-age` | "WHO. Body mass index (BMI) classification." → WHO obesity topic page | Weak but relevant. Prefer the WHO fact sheet "Obesity and overweight" and use its title |

### 3.5 Already-known leads, now resolved

| Lead (from the earlier §7.1–7.2 reports) | Outcome |
|---|---|
| Water article: CDC link points to the BMI calculator | Confirmed (W1) |
| Chronotypes: Roenneberg as a PubMed search link | Confirmed (S1) |
| Due date: NBK459351 unverified | Inconclusive; replacement proposed (I1) |
| Weight-loss timeline: Hall PMID 26399868 unverified | Confirmed wrong attribution (W5) |
| Lean body mass: PMC6021272 unverified | Confirmed wrong destination (W2) |
| WHR: WHO source year wrong | Still open in the moderate-risk report (a content correction, not a link failure: the URL resolves) |

## 4. Articles affected and release coupling

Articles with at least one §7.4 defect: `how-much-water-should-you-drink-a-day`, `lean-body-mass-calculator-guide`, `healthy-waist-to-height-ratio` (W3, D2, R1, plus the §6.3 wrong-primary gate), `how-to-keep-muscle-while-losing-weight`, `how-long-does-it-take-to-lose-weight`, `due-date-by-conception-date`, `alcohol-units-calculator`, `metabolic-age-calculator-guide`, `calories-burned-calculator-guide`, `hidden-calories-in-alcohol-and-weight-loss`, `how-to-build-a-meal-plan`, `sleep-chronotypes-explained`.

Four of them are among the **12 coupled articles** whose descriptions depend on PR #56: keep-muscle, weight-loss timeline, alcohol units and chronotypes. Apply their reference corrections in the same coordinated release as their description changes, after PR #56 is merged. The other corrections are independent of the frontend release.

## 5. Gates (unchanged)

- Applying any correction to the CMS: **owner authorization plus independent clinical review.**
- No CMS writes, drafts, publication or indexing requests were made.
- The audit can be repeated on demand via `workflow_dispatch`; it is not part of the release gate.
