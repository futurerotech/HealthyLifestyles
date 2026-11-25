# Phases 7–9 — search intelligence, growth preparation and monetization readiness (2026-11-14)

This is preparatory work. It makes no demand, traffic or revenue claims.

## Phase 7 — search intelligence

**Search Console / GA4: DATA UNAVAILABLE.**
- No Search Console or GA4 connector is installed in this session. The only registry matches are third-party, often paid, aggregators, and none was connected.
- Demand-dependent decisions therefore stay open. These include Phase 5 step 10, new-page prioritization and query-level cannibalization.
- No figures are estimated in their place.

**Completed without query data:**
- Overlap and cannibalization screen: `PHASE7_OVERLAP_CANNIBALIZATION_20261114.md`. No article cannibalization was found, and the 2 legacy alias tools already return 301 redirects.
- Technical SEO:
  - The CI blocks on internal links, JSON-LD, metadata, size budgets and date integrity.
  - The 8-URL Lighthouse budget is blocking.
  - Canonical and sitemap changes are covered by CMS #34 post-deploy reconciliation, which is not merged.

**Intent classification of the 72 tools** (by category; this is a rule, not measured demand):

| Intent | Categories (tools) | Page requirement |
|---|---|---|
| Transactional-calculate ("X calculator") | body-weight 9, fitness 12, nutrition 14, metabolic 2 | Tool above the fold, formula and limits, one worked example |
| Informational-health ("what does my X mean") | heart-vitals 5, health-risk 7, sleep 7 | Lead with meaning and limits; tool second; clinician threshold |
| Sensitive / YMYL | mental-wellness 7, womens-health 5 | Crisis or clinical path first; no ranking-driven expansion without clinical review |

**Brief template** for new pages. It applies once query data exists:
- target query and intent;
- SERP features;
- existing URL to extend first;
- primary tool;
- evidence sources;
- clinician threshold;
- what the page must not claim.

No new drafts were written, because every new page needs demand evidence (Board rule) and none is available.

## Phase 8 — growth channel preparation

| Item | Result |
|---|---|
| Newsletter notice | **Fixed in code:** the signup form now links to the Privacy Policy at the point of collection. |
| Newsletter unsubscribe | **Gap:** both forms promise "unsubscribe anytime". The CMS has an `unsubscribedAt` field, but no unsubscribe endpoint or link mechanism exists in either repository. Before any email is sent, the owner must decide the sending provider. That provider's unsubscribe, or a signed-token endpoint, then has to set `unsubscribedAt` and be honored in sends. → **BLOCKED_OWNER_RELEASE** |
| Consent record | Subscribers have no stored consent timestamp or notice version. Recommendation: store `consentAt` and `noticeVersion` at creation. This is a CMS schema change and needs a migration plus authorization. |
| Double opt-in | Not implemented. Recommended for EU/UK sign-ups. This is an owner decision. |
| Retention | No retention rule exists. Proposed: delete unconfirmed or unsubscribed records after 24 months. This is a policy decision. |
| UTM convention | `utm_source={pinterest\|youtube\|instagram\|newsletter}`, `utm_medium={social\|email}`, `utm_campaign={tool-slug}-{yyyymm}`, `utm_content={pin\|short\|issue-NN}`. Lowercase and hyphenated. Never place personal data in UTMs. |
| Pinterest concepts (3) | 1. "How many hours until your caffeine curfew?", a vertical diagram linking to `caffeine-curfew`. 2. "Waist-to-height ratio in one tape measure", a how-to-measure graphic linking to `waist-to-height-ratio-calculator`, published only after the coupled release. 3. "A 7-day budget meal plan (estimates)", only if Phase 5 Candidate 1 is approved for public release. |
| Shorts/Reels briefs (2) | 1. "Box breathing, 4 × 4", a 30-second guided count with no health claims beyond relaxation practice. 2. "Night shift: when to sleep", a 45-second walk-through of Hypothesis C, only if it is approved for public release. Each brief needs on-screen limits and a link to the tool, and makes no outcome promises. |

## Phase 9 — monetization readiness audit

| Item | Finding | Status |
|---|---|---|
| Consent gating | GA4 (`Analytics.astro`) and AdSense (`AdsLoader.astro`) load only after an explicit "Accept all". "Reject" reloads the page to stop scripts. Users can re-open their choice from the footer ("Cookie choices"). | Verified in code |
| EEA/UK/CH ad serving | The banner is custom, not a Google-certified CMP using IAB TCF, and it sends no Consent Mode v2 signals. Since 16 Jan 2024 (EEA/UK) and 31 Jul 2024 (Switzerland), only traffic through a Google-certified TCF CMP is eligible for personalized AdSense ads (support.google.com/adsense/answer/13554116). AdSense's own "Privacy & messaging" European regulations message is certified and has no extra cost. Using it means replacing the custom banner for those regions and requires the owner's AdSense access. | BLOCKED_OWNER_RELEASE |
| ads.txt | `google.com, pub-6864777783219495, DIRECT, f08c47fec0942fa0` is present. Whether it matches the account in use needs the owner's AdSense access. | BLOCKED_EXTERNAL_ACCESS |
| Affiliate links | Every link in `src/data/affiliates.ts` is a **plain Amazon search URL with no affiliate tag**. The page still shows "we may earn from qualifying purchases". Links use `rel="sponsored nofollow noopener"`, which is correct. | Finding |
| Affiliate disclosure | If the Amazon Associates program is used, its operating agreement requires its own disclosure wording. The tags and the program itself are owner decisions. | BLOCKED_LEGAL_OR_LICENSE |
| Health-adjacent ads | Recommendations next to clinical tools (protein powder beside a kidney caution, for example) need editorial rules: none on mental-wellness or pregnancy tools. This is a policy decision. | Proposal |

No new ad networks, no affiliate sign-ups and no revenue projections.
