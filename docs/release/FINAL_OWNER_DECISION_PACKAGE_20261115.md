# Final owner decision and release-readiness package (2026-11-15)

**Production status: NO-GO.** This package records the owner decisions that remain. It does not claim production readiness.

The per-item status is in `MASTER_ROADMAP_COMPLETION_MATRIX_20261114.md`. Nothing has been merged, deployed, published, emailed, written to production, or submitted for indexing.

## 1. Verified checkpoint

| Repository | PR | Head | CI |
|---|---|---|---|
| Frontend | #56 `integration/calculator-safety-20261114` | `d6c48a4` | Verify 43662380016: 27/27 |
| CMS | #34 `fix/unified-indexnow-postdeploy-20261028` | `603f192` | 43459577611: 31/31 |
| CMS | #64 `codex/indexnow-draft-safety-20261114` | `906070a` | 43559981416: 31/31 |
| CMS | #65 `codex/hostinger-runtime-evidence-20261114` | `50a9358` | 43561621197: 31/31 |
| CMS | #66 `codex/newsletter-suppression-20261115` | `51d001c` (code) | 43661483884: 31/31, 268 unit tests |

`3c4a501` on #66 is a documentation-only commit: the migration adds three consent columns, not two.

## 2. Technically complete (awaiting review or release, not blocked by engineering)

| Phase | Done in code | Remaining gate |
|---|---|---|
| 1 Indexing | Draft-safe IndexNow (#64), post-deploy reconciliation (#34), staging runtime checker (#65) | Staging evidence (§4), release |
| 2 Tools | Calculator, screener and date-tool fixes (#56); article-tool correction package verified in memory against live records | Clinical review |
| 3 Editorial | Audits, reference audit, drafts for the 12 coupled articles | Clinical review |
| 4 Quality | Site-wide QA: 23,902 automatic checks with 0 failures; Lighthouse budget; 13 manual contrast cases listed | Human accessibility review |
| 5 Candidate 1 | Grocery budget behind the lab flag: 14 of 67 recipes comparable, labeled as an incomplete estimate | Search demand data; owner decision to go public |
| 6 Hypothesis C | `/lab/shift-work` prototype behind the lab flag | Clinical review; owner decision to go public |
| 7 Search | Overlap screen, technical SEO, intent classification | Search Console data |
| 8 Growth | Privacy notice; signed unsubscribe; eligibility checked before every send; trusted consent provenance; UTM and channel briefs | Provider and policy decisions; security and privacy review |
| 9 Monetization | Consent gating for GA4 and AdSense, verified in code | Certified consent platform; affiliate decision |

## 3. Release coupling and integration sequence

Dependency order: `main` ← #34 ← #64 ← #65 ← #66. Frontend #56 follows #66.

1. Merge #34 into CMS `main`. Retarget #64, re-run CI, and require exact-head green. Repeat for #64 → #65 and #65 → #66.
2. Run the migration on isolated staging first. It is additive: three nullable columns, `IF NOT EXISTS`, and `down` keeps the data. The October ledger rehearsal expects 18 entries, or 16 after removing the two October entries.
3. Deploy the CMS to staging. Rehearse #56 built against staging, with the release preflight `contentComplete` true.
4. Apply the 16 article corrections as **drafts** on staging (§6). Re-run the preflight with the five gates removed, in the release branch only.
5. Production, only after §4 and §5 are closed:
   1. Merge and deploy the CMS chain and run the migration.
   2. Publish the 16 drafts in one session.
   3. Merge #56 and trigger one rebuild.
   4. Run post-deploy reconciliation.
   5. Submit IndexNow only for the changed URLs, with explicit approval.
6. **Rollback:**
   - Revert #56.
   - Restore the previous version of each of the 16 records; the `updated_at` baselines identify them.
   - Redeploy the previous CMS build.
   - Leave the migration columns in place (`down` is a no-op by design).
   - Do not resubmit for indexing.
7. **Acceptance after release:**
   - Every changed URL renders and has its canonical and correct indexing status.
   - The five gated articles embed their primary tool.
   - PHQ-9 item 9 alerts.
   - WHO-5 stays unavailable.
   - No lab route exists in production.
   - The newsletter signup creates records with consent evidence, and nothing is sent.

## 4. Required staging evidence (Hostinger / Neon / R2)

The CMS #65 procedure must show:
- the QA app at `cms-qa.healthylifesstyles.com` runs the reviewed SHA;
- its environment passes the checker;
- its `DATABASE_URI` reaches staging Neon `ep-plain-forest-bca0vqud` read-only, and not production `ep-lucky-voice-ad5egz8d`;
- its R2 token is limited to `healthylifestyles-staging-media`, and the production bucket is denied;
- no secret is shared with production: `INTERNAL_API_KEY`, `PAYLOAD_SECRET`, `SYNC_SHARED_SECRET`, `UNSUBSCRIBE_TOKEN_SECRET`, S3 keys;
- an authenticated smoke test and a rollback rehearsal pass;
- an IndexNow dry run only.

Already verified read-only: the two Neon projects are separate, and both R2 buckets exist.

## 5. Sign-offs (genuine qualified humans; none can be produced by AI review)

| Review | Scope |
|---|---|
| Licensed clinician | #56 tool changes, with PHQ-9 item-9 wording, the water 100 kg cut-off and the 44-week bound first; the 12 coupled article drafts; Shift Work Explorer before any public release |
| Security | Dependency update (Issue #52); the CMS chain; #66 tokens and endpoints |
| Privacy / legal | Consent provenance (`form-single-opt-in` is not mailbox-verified); legacy-subscriber policy; retention; affiliate disclosure |
| Accessibility | Human review, including the 13 manual contrast cases; field CrUX data after launch |

## 6. The 16 unique CMS article records

All 16 baselines matched the live records in reference run 43657706573. Re-check them immediately before applying.

- **Article-tool gates:** IDs 27, 28, 29, 32 and 37.
- **Coupled to #56:** IDs 5, 7, 8, 10, 21, 25, 32, 46, 56, 57, 58 and 69.

ID 32 is in both sets, so there are 16 unique records. Machine-readable packages: `scripts/content/correction-packages/`.

## 7. External dependencies

| Item | Status |
|---|---|
| WHO-5 | Suspended pending a license decision |
| Certified CMP for EEA/UK/CH | Required for personalized AdSense ads in those regions. AdSense's own certified message costs nothing extra but needs AdSense account access. |
| Search Console / GA4 | DATA UNAVAILABLE. Phase 5 demand, Phase 7 query work and Phase 8 prioritization wait on it. |
| Newsletter | Delivery is NO-GO until a provider is chosen; the opt-in policy (single or double) is set; the legacy-subscriber policy is set (fail-closed now: ineligible); staging proves the sender calls `subscriber-send-check` before every send; security and privacy approval is given. |
| Affiliate | Links are untagged. Whether to join a program, and its required disclosure, are owner decisions. |
