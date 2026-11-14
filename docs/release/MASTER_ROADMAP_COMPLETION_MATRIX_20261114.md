# Master Roadmap completion matrix (2026-11-14)

Frontend branch: `integration/calculator-safety-20261114` (PR #56, draft, not merged).

CMS chain: #65 → #64 → #34. All three are draft and not merged. Nothing has been merged, deployed, published, written to a CMS or submitted for indexing.

**Statuses:** VERIFIED_COMPLETE (verified in CI or code in the accessible environment), IMPLEMENTED_AWAITING_REVIEW, BLOCKED_EXTERNAL_ACCESS, BLOCKED_OWNER_RELEASE, BLOCKED_CLINICAL_REVIEW, BLOCKED_SECURITY_REVIEW, BLOCKED_LEGAL_OR_LICENSE, NOT_STARTED.

| # | Phase / milestone | Status | Evidence |
|---|---|---|---|
| 1.1 | IndexNow draft safety (legacy hook no longer pings for drafts, Pages or Categories) | IMPLEMENTED_AWAITING_REVIEW | CMS #64 `906070a`, CI 43559981416 31/31 |
| 1.2 | Post-deploy reconciliation, sitemap and canonical | IMPLEMENTED_AWAITING_REVIEW | CMS #34 `603f192`, CI 43459577611 31/31 |
| 1.3 | Hostinger runtime identity checker | IMPLEMENTED_AWAITING_REVIEW | CMS #65 `50a9358`, CI 43561621197 31/31 |
| 1.4 | Hostinger QA app, Neon binding, R2 token scope, authenticated smoke and rollback | BLOCKED_EXTERNAL_ACCESS | No Hostinger access; staging DB has the owner role only |
| 1.5 | Merge #65 → #64 → #34 → main; real IndexNow submission | BLOCKED_OWNER_RELEASE | — |
| 2.1 | Calculator audits and fixes (24 calculators, 3 screeners, 4 date tools, plus the remaining set) | IMPLEMENTED_AWAITING_REVIEW | PR #56; CI green on every head |
| 2.2 | PHQ-9 item-9 alert, scoring cut-offs, water and pregnancy bounds | BLOCKED_CLINICAL_REVIEW | Code and tests on #56 |
| 2.3 | Five article-tool gates (IDs 27, 28, 29, 32, 37) | IMPLEMENTED_AWAITING_REVIEW | Package verified in memory against live records, run 43643424938: 0 errors after the patch. The gates stay in force. |
| 2.4 | CMS SEO metadata package (14 tools) | BLOCKED_OWNER_RELEASE | `docs/content/cms-seo-corrections-20261114.json` |
| 2.5 | WHO-5 | BLOCKED_LEGAL_OR_LICENSE | Suspended |
| 2.6 | Dependency update / Security Issue #52 | BLOCKED_SECURITY_REVIEW | 0 vulnerabilities, no baseline exception; independent review pending |
| 3.1 | Risk classification and editorial audits (all articles) | VERIFIED_COMPLETE (editorial drafting) | `docs/editorial/PHASE3_*` |
| 3.2 | Reference audit and editorial lint (CI) | VERIFIED_COMPLETE | `reference-audit.yml` |
| 3.3 | 12 release-coupled article corrections | BLOCKED_CLINICAL_REVIEW → BLOCKED_OWNER_RELEASE | `RELEASE_COUPLED_ARTICLES_PLAN_20261114.md` and manifest |
| 4.1 | Site-wide QA (68 tools and 13 templates, dev server and production build) | VERIFIED_COMPLETE | `PHASE4_SITE_QA_20261114.md` |
| 4.2 | Lab performance budget (8 URLs, blocking) | VERIFIED_COMPLETE | Lighthouse step |
| 4.3 | Contrast: 2,137 failures → 0 | VERIFIED_COMPLETE | Site QA |
| 4.4 | 93 indeterminate contrast cases (gradients, images) | BLOCKED_EXTERNAL_ACCESS (human visual check) | Listed in CI as `[SITE_QA_MANUAL]`; they cannot be computed automatically, and thresholds were not changed |
| 4.5 | Human accessibility review; field CrUX data | BLOCKED_EXTERNAL_ACCESS | — |
| 5.1 | Candidate 1: meal-plan grocery budget (quantities, BLS snapshot, household, budget, swaps, limitations) | IMPLEMENTED_AWAITING_REVIEW (lab flag only; not demand-validated) | `462af6d`. Measured limit: 2 of 67 recipes have enough price coverage. The USDA food-plan benchmark and ERS produce prices are not yet added. |
| 5.2 | Other Phase 5 candidates | NOT_STARTED (needs demand data) | Phase 7 DATA UNAVAILABLE |
| 6.1 | Hypothesis C Shift Work Explorer prototype (`/lab/shift-work`, noindex) | IMPLEMENTED_AWAITING_REVIEW | `462af6d`; 4 deterministic tests; dev-server site QA. CI fails if `dist/client/lab` exists. |
| 6.2 | Public release of C | BLOCKED_CLINICAL_REVIEW, then BLOCKED_OWNER_RELEASE | — |
| 7.1 | Overlap, technical SEO, intent classification | VERIFIED_COMPLETE | `PHASE7_OVERLAP_*`, `PHASE7_9_*` |
| 7.2 | Query-level demand, cannibalization and briefs from data | BLOCKED_EXTERNAL_ACCESS (DATA UNAVAILABLE) | No GSC/GA4 connector |
| 8.1 | Newsletter privacy notice at signup | IMPLEMENTED_AWAITING_REVIEW | This commit |
| 8.2 | Unsubscribe mechanism, consent record, retention, double opt-in | BLOCKED_OWNER_RELEASE | Gap documented |
| 8.3 | UTM convention, Pinterest and Shorts briefs | VERIFIED_COMPLETE (preparatory) | `PHASE7_9_*` |
| 9.1 | Consent gating for GA4 and AdSense | VERIFIED_COMPLETE (code) | `Analytics.astro`, `AdsLoader.astro` |
| 9.2 | Google-certified TCF CMP for EEA/UK/CH | BLOCKED_OWNER_RELEASE | Needs AdSense account access |
| 9.3 | Affiliate tags and program disclosure | BLOCKED_LEGAL_OR_LICENSE | Links are untagged search URLs |

## The 12 final release gates (preserved)

1. Merge #56.
2. Merge the CMS chain #65 → #64 → #34.
3. Hostinger, Neon and R2 staging verification.
4. Five article-tool gates.
5. 12 coupled corrections.
6. WHO-5 licensing.
7. Clinical review.
8. Security review.
9. Human accessibility review.
10. CMS SEO package authorization.
11. IndexNow submission approval.
12. Production deploy and rollback rehearsal.

**GO/NO-GO: NO-GO** until gates 1–12 are closed by their owners.
