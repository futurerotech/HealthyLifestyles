# Master Roadmap completion matrix (updated 2026-11-15)

**Frontend:** `integration/calculator-safety-20261114` (PR #56, draft, not merged). Last code head `dbb624e`:
- Verify 43676076920: 27/27 passed.
- Guard PR #57 @ `d62b935`: Verify 43684122977 PASS 24/24, after the Issue #52 fix in draft PR #58 (`ddd0d0d`, Verify 43684072370 PASS).
- CMS staging importer #67: CI 43675263717 passed 31/31.
- The authoritative procedure is `RELEASE_PROCEDURE_20261115.md`.
- Release-candidate acceptance (`release-candidate.yml`, staging mirror) has not run yet: the mirror is empty, and its bootstrap is an owner-authorized gate.
- Release order: `RELEASE_PROCEDURE_20261115.md` (the single authoritative order).

**CMS:** chain #65 → #64 → #34, plus #66 stacked on #65. All four are draft and not merged.
- #66 `codex/newsletter-suppression-20261115` @ `51d001c`, CI 43661483884: 31/31 passed (268 unit tests). Ancestry is verified as main `1637680` ← #34 `603f192` ← #64 `906070a` ← #65 `50a9358` ← #66 (6 commits).
- The chain heads are unchanged since their green runs: #34 `603f192`, #64 `906070a`, #65 `50a9358`. CMS main is still `1637680`, and frontend main is still `57f72ee`.
- GitHub shows "unstable" on #34 and #64 only because the external Vercel preview status failed. Their `ci` checks are green. The Vercel team returns 403 from this session, so the preview failure cannot be inspected here.

Nothing has been merged, deployed, published, written to a CMS or submitted for indexing.

**Statuses:** VERIFIED_COMPLETE (verified in CI or code in the accessible environment), IMPLEMENTED_AWAITING_REVIEW, BLOCKED_EXTERNAL_ACCESS, BLOCKED_OWNER_RELEASE, BLOCKED_CLINICAL_REVIEW, BLOCKED_SECURITY_REVIEW, BLOCKED_LEGAL_OR_LICENSE, NOT_STARTED.

| # | Phase / milestone | Status | Evidence |
|---|---|---|---|
| 1.1 | IndexNow draft safety | IMPLEMENTED_AWAITING_REVIEW | CMS #64 `906070a`, CI 43559981416: 31/31 |
| 1.2 | Post-deploy reconciliation, sitemap and canonical | IMPLEMENTED_AWAITING_REVIEW | CMS #34 `603f192`, CI 43459577611: 31/31 |
| 1.3 | Hostinger runtime identity checker | IMPLEMENTED_AWAITING_REVIEW | CMS #65 `50a9358`, CI 43561621197: 31/31 |
| 1.4 | Hostinger QA app, Neon binding, R2 token scope, authenticated smoke test, rollback | BLOCKED_EXTERNAL_ACCESS | No Hostinger access |
| 1.5 | Merge the CMS chain; real IndexNow submission | BLOCKED_OWNER_RELEASE | — |
| 2.1 | Calculator audits and fixes | IMPLEMENTED_AWAITING_REVIEW | PR #56 |
| 2.2 | PHQ-9 item-9 alert, scoring cut-offs, water and pregnancy bounds | BLOCKED_CLINICAL_REVIEW | — |
| 2.3 | Five article-tool gates (IDs 27, 28, 29, 32, 37) | IMPLEMENTED_AWAITING_REVIEW | Reference run 43657706573, dry run against live records. The package covers exactly the gated defects, and the after-patch check returns 0 problems. Scope guard: only `primaryTool` and `toolEmbed` change. Five offline tests. The gates stay in force. |
| 2.4 | CMS SEO metadata package | BLOCKED_OWNER_RELEASE | — |
| 2.5 | WHO-5 | BLOCKED_LEGAL_OR_LICENSE | Suspended |
| 2.6 | Dependency update / Issue #52 | Engineering VERIFIED_PASS (PR #58: 0 advisories, empty baseline); human sign-off BLOCKED_HUMAN_REVIEW | 43684072370 |
| 3.1–3.2 | Editorial audits; reference audit and lint | VERIFIED_COMPLETE (editorial drafting) | `docs/editorial/PHASE3_*` |
| 3.3 | 12 release-coupled articles | BLOCKED_CLINICAL_REVIEW → BLOCKED_OWNER_RELEASE | Drift check passes: all 12 baselines matched the live records in reference run 43657706573 and in a read-only SELECT on 2026-11-15. Also locked: the content lock covers all 16 records (pre-release digests from run 43667642490), and a 6-test cutover rehearsal checks partial publish, drift and rollback. |
| 4.1–4.3 | Site-wide QA, lab performance budget, contrast | VERIFIED_COMPLETE | 23,902 automatic text and field checks on the production build: 0 failures. |
| 4.4 | Indeterminate contrast cases | BLOCKED_EXTERNAL_ACCESS (human visual check) | **94 → 13**, without changing any threshold. The closed mobile-nav overlay, which paints nothing, was a false trigger, and its text is now checked automatically. Every remaining case is listed below. |
| 4.5 | Human accessibility review; CrUX field data | BLOCKED_EXTERNAL_ACCESS | — |
| 5.1 | Candidate 1: grocery budget | IMPLEMENTED_AWAITING_REVIEW (lab flag only; not demand-validated) | `6dcdc68`. Added USDA ERS produce prices (2023, year inferred, not inflation-adjusted), preparation yields, and current BLS butter and yogurt. Comparable recipes: 2 → 14 of 67. A typical week is still only 23% priced and is shown as "Incomplete estimate". The USDA food-plan comparison is withheld while coverage is this low, because comparing a lower bound with a complete food plan would mislead. |
| 5.2 | Other Phase 5 candidates | NOT_STARTED (needs demand data) | — |
| 6.1 | Hypothesis C prototype | IMPLEMENTED_AWAITING_REVIEW | `/lab/shift-work`, lab flag only |
| 6.2 | Public release of C | BLOCKED_CLINICAL_REVIEW → BLOCKED_OWNER_RELEASE | — |
| 7.1 | Overlap, technical SEO, intent classification | VERIFIED_COMPLETE | — |
| 7.2 | Query-level demand | BLOCKED_EXTERNAL_ACCESS (DATA UNAVAILABLE) | No GSC or GA4 connector |
| 8.1 | Privacy notice at signup | IMPLEMENTED_AWAITING_REVIEW | — |
| 8.2a | Unsubscribe, suppression and consent provenance (provider-independent) | IMPLEMENTED_AWAITING_REVIEW | CMS #66 and frontend `cb47f50`. Covers signed, expiring unsubscribe links; suppression kept separate from marketing eligibility; and fail-closed handling of legacy, imported and unknown-consent records. Consent is captured only by the trusted proxy, which sends the internal key and the capture header; a client `source` cannot set it. The newsletter proxy accepts the first-party Origin only. Consent evidence is frozen, and suppression is one-way. Review comment 6886950310 is addressed. |
| 8.2b | Email delivery, single versus double opt-in, retention, legacy-record policy, end-to-end proof in staging that the sender enforces send-check | BLOCKED_OWNER_RELEASE + BLOCKED_SECURITY_REVIEW (independent security and privacy approval) | Newsletter delivery is **NO-GO**. Integration sequence: `docs/release/NEWSLETTER_SUPPRESSION_20261115.md` (CMS). |
| 8.3 | UTM convention, Pinterest and Shorts briefs | VERIFIED_COMPLETE (preparatory) | — |
| 9.1 | Consent gating for GA4 and AdSense | VERIFIED_COMPLETE (code) | — |
| 9.2 | Certified TCF CMP for EEA/UK/CH | BLOCKED_OWNER_RELEASE | — |
| 9.3 | Affiliate tags and disclosure | BLOCKED_LEGAL_OR_LICENSE | — |

## The 13 manual contrast cases (production build, run 43657706598)

| Page | Element |
|---|---|
| `/`, `/about`, `/nutrition`, `/sleep`, `/tools` | `section.cta-band` (gradient) |
| `/` | `section.hero` |
| `/health-score` | `section.hsx-hero` |
| `/tools/box-breathing-timer` | layer over `div.breathe__circle` |
| `/tools/caffeine-curfew-calculator` | `div.cc__hero` and `span.cc__hero-time` |
| `/tools/intermittent-fasting-calculator` | `div.if__timer` (fasting state) |
| `/tools/weight-loss-timeline-calculator` | `div.wt__hero` |
| `/unsubscribe` | layer over `footer.site-footer` |

## The 12 final release gates (preserved)

1. Merge #56.
2. Merge the CMS chain #65 → #64 → #34, then #66.
3. Hostinger, Neon and R2 staging verification.
4. The five article-tool gates.
5. The 12 coupled corrections.
6. WHO-5 licensing.
7. Clinical review.
8. Security review.
9. Human accessibility review.
10. CMS SEO package authorization.
11. IndexNow submission approval.
12. Production deploy and rollback rehearsal.

**GO/NO-GO: NO-GO.**
