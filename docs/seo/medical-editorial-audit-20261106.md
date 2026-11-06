# Ten-article medical editorial and SEO audit — 2026-11-06

Status: **READ-ONLY AUDIT** of public CMS article blocks and rendered production pages. Production CMS content was not modified. This source PR fixes only one template-level editorial citation link bug. Scientific spot-checks against first-party guidance do **not** constitute comprehensive clinical review or medical credential verification.

Source of truth: frontend `futurerotech/HealthyLifestyles` main SHA `57f72ee7935bbe7f76043d36f96b7d25ae14c731`, live Payload `https://cms.healthylifesstyles.com` public published records, and public `https://www.healthylifesstyles.com/wellness-hub/<slug>`. CMS 60 published articles / 70 enabled tools / 68 distinct tools in published directory (two historical aliases redirect permanently); all 60 article and 68 tool manifest paths occur in sitemap. These facts do not prove Google's indexing.

## Verified public CMS/editorial structure
All **10/10** selected articles are publicly rendered with an exact self-canonical and page-level meta robots `max-image-preview:large` (no page-level `noindex`). All **10/10** public CMS rows have ONE `toolEmbed` pointing to the exact same numeric relationship ID as the `primaryTool`; the rendered page includes "Try it" content. That proves relationship structure and visible embed chrome, **not** real browser hydration/input/output for all ten.

The following counts refer only to **ordinary paragraph** Markdown links; sidebar, header, sources-list, tool embed, FAQ and structured data links **are deliberately excluded**. "Words" are approximate words in paragraph text blocks, not total displayed document words. Link count alone cannot establish scientific citation adequacy.

| Priority | Exact article slug | Paragraph words | Contextual internal links | Inline external research links | CMS sources | FAQs in PAA block | Explicit safety callouts |
|---|---|---:|---:|---:|---:|---:|---:|
| P2 | `pregnancy-week-by-week-guide` | ~2,000 | 7 | 6 | 5 | 5 | 1 |
| P2 | `ovulation-calculator-fertile-window-guide` | ~2,031 | 5 | 6 | 5 | 5 | 1 |
| P2 | `pregnancy-weight-gain-calculator-healthy-range-guide` | ~2,360 | 6 | 5 | 5 | 5 | 1 |
| **P1** | `due-date-by-conception-date` | **~227** | **1** (tool, 0 articles) | **0** | 3 | 3 | 0 |
| P2 | `what-does-your-heart-disease-risk-score-mean` | ~1,965 | 6 | 9 | 5 | 5 | 2 |
| **P1** | `what-do-your-blood-pressure-numbers-mean` | **~827** | 5 (all tools; **0 articles**) | **0** | 3 | **0** | 1 generic |
| P2 | `what-does-type-2-diabetes-risk-score-mean` | ~2,039 | 6 | 9 | 5 | 5 | 3 |
| P2 | `how-to-calculate-target-heart-rate-zones-karvonen` | ~1,809 | 6 | 5 | 5 | 5 | 2 |
| P2 | `normal-resting-heart-rate-by-age` | ~1,974 | 7 | 5 | 5 | 5 | 3 |
| P2 | `what-does-your-waist-based-health-risk-level-mean` | ~1,670 | 6 | 6 | 5 | 5 | 1 |

Note: P2 denotes no *structural* defects found in this scoped audit, NOT a clinical signoff. Each of the ten articles has visible external source destinations; for P1 articles they appear in the Sources list only, not near the claims in ordinary text. Public Source links include AHA, CDC, ACOG, NIDDK, NICE and MedlinePlus as applicable. URL presence alone is not scientific validation.

## Verified template defect fixed on THIS isolated branch

- Production `src/components/ArticleBody.astro` wraps **all medically selected, nonsponsored reference-list destinations** in `<a ... target="_blank" rel="noopener nofollow">`, wrongly instructing crawlers not to treat regular editorial references normally. Google Search Central describes unqualified ordinary outbound links as requiring no `nofollow`; `sponsored` and `ugc` apply to distinct content categories. In this branch change only the editorial Sources-list link to `rel="noopener noreferrer"`. No source href, citation label, ad/affiliate link, CMS field, navigation, canonical, robots or production setting changes.
- Add regression test to the existing `truthful-medical-review.test.mjs` run by `npm run test:seo`. The test requires exact Sources heading, safe `noopener noreferrer`, and no blanket `nofollow` on editorial source links.
- **Release gate:** This is a Draft PR/code proposal only. There is NO deployed result or live link-rel verification after this change, no Preview created, no merge or production push.

Official Google source: https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links

## High-priority CONTENT correction backlog — not changed on live CMS

**P1 — Due Date by Conception Date (CMS article ID 6).** There is no contextual external link inside the five paragraph blocks, no dedicated clinical safety/limitations callout and only 3 PAA answers. Expand with claim-adjacent links to ACOG's **Methods for Estimating the Due Date**, detail how LMP+280 days and known conception+~266 days are conventions not certain birth dates, IVF transfer formulas (day-5+261; day-3+263), first-trimester ultrasound precedence, irregular cycles, and dating with care teams. ACOG supports first-trimester ultrasound as most accurate; avoid claims a calendar tool can assign final prenatal due dates. Add a meaningful pregnancy-week and other actually published article link where context supports it. Existing broad ACOG womens-health homepage in the CMS `sources` should become a **direct verified page** on an authorized CMS revision. Original source: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date

**P1 — Blood Pressure Numbers (CMS article ID 26).** The article uses 2024-labelled background sources, 0 inline external citations and no real PAA block (despite a plain heading "People Also Ask"). Replace with claim-adjacent links to the **2025 AHA/ACC high blood pressure guideline** and current AHA monitoring/emergency guidance. Correct classification: normal <120 **AND** <80, elevated 120–129 **AND** <80, Stage 1 130–139 **OR** 80–89, Stage 2 ≥140 **OR** ≥90. Above 180 and/or 120 with warning symptoms merits emergency services; without symptoms first repeat after a minute and promptly contact clinician, not automatic ambulance for every isolated reading. Do not present the site's `metabolic-age-calculator` as a validated measurement of cardiovascular aging; the existing paragraph calling it a "gut-check" of whether the cardiovascular system is aging faster is **not justified** by the cited BP references. Clarify that treatment depends on overall CVD risk and associated conditions, not just a three-to-six-month lifestyle trial. Add 4–5 genuine reader FAQs, two meaningful published article links and a specific emergency callout. No unsanctioned rewrite of live data.
AHA: https://professional.heart.org/en/science-news/2025-high-blood-pressure-guideline/top-things-to-know
AHA symptoms: https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/when-to-call-911-for-high-blood-pressure

## Targeted claim-evidence checks for other eight

- **Pregnancy week dating:** described LMP-based dating, cautious clinical interpretation; consistent with ACOG's first-trimester ultrasound preference; individual gestational claims not exhaustively checked.
- **Ovulation window:** calendar-derived estimate, not confirmation or reliable birth control; matches ACOG's warning that fertile windows and method effectiveness vary: https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning .
- **Pregnancy weight gain:** pre-pregnancy BMI and singleton/multiple distinction reflected in intro; CDC's general single-pregnancy BMI-dependent ranges include normal 25–35 lb: https://www.cdc.gov/maternal-infant-health/pregnancy-weight/ . Medical tailoring still required.
- **Heart disease risk educational score:** clearly states its own 0–12 points are NOT a validated predicted percentage, unlike clinical AHA PREVENT which uses laboratory and clinical variables: https://professional.heart.org/en/guidelines-and-statements/about-prevent-calculator .
- **Type 2 diabetes risk educational score:** clear that scores do not diagnose diabetes or estimate a validated individual probability; screening/diagnostic blood tests are separate. Detailed scoring math not externally validated in this pass.
- **Target heart-rate zones:** describes Karvonen/heart-rate-reserve as exercise estimates, not medical clearance. Numerical training prescriptions and contraindications require further specialist check.
- **Resting heart-rate by age:** introduces usual adult 60–100 bpm and caveats about training, medication and symptoms; no claim of diagnostic specificity accepted.
- **Waist-based health risk:** explicitly calls site classifications educational rather than diagnosis/probabilities; NICE NG246 supports interpreting waist-to-height for central adiposity with BMI limitations: https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity .

## Human review attribution: important distinction, no fabricated defect

CMS public records show `reviewedByHuman=true` on all ten records, but the CMS field's **actual schema description** says it acknowledges human editorial review of the **AI draft** and hides an "AI draft" banner; it is NOT a medical licence or clinical sign-off. The `reviewer` relationship on these records points only at author IDs 1 or 2 (organizations: Editorial Team, "Medical Review Board"), not verifiably credentialed physicians. Frontend `assignedReviewer` intentionally **does not** display the "Medically reviewed by" claim for organization accounts; **none of the ten sampled live pages displayed that claim**. Preserve this fail-closed behavior. Flag reviewer data provenance for later CMS cleanup if evidence is lacking, but DO NOT label all ten pages falsely reviewed on their actual public output.

## Governance and next primary-plan task

Existing public CMS content is authoritative. Neither `reviewedByHuman` nor being listed in `sources` is proof that a human physician verified clinical claims. **Do not** apply changes to live CMS, Neon/R2, original production branches, or any Vercel Preview in this isolated PR; no indexing submissions.

**NEXT STEP in PRIMARY ROADMAP:** Prepare medically precise, source-linked **draft revisions** for the two verified P1 articles (IDs 6 and 26), check every factual formula, source URL and existing internal link, and obtain the solo owner's separate authorization before editing existing CMS drafts/records. Keep interactive `toolEmbed` and `primaryTool` intact, and keep reviewer attribution truthful. Other eight can receive deeper claim-by-claim audit later; there is no need to repeat green Chrome/CI or revisit unrelated security reviewer recruitment.
