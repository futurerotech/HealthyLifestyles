# Coordinated release plan — PR #56, the five article-tool gates, and the 12 coupled articles (2026-11-14)

**Status: plan only.** It needs owner release authorization, isolated staging verification and clinical review. Nothing has been written to any CMS. Nothing has been published or submitted for indexing.

## Why these changes ship together

PR #56 changes the behavior of tools that 12 published articles describe. If #56 ships first, those articles describe behavior the tools no longer have. If the articles change first, they describe behavior the tools do not have yet. Either order is wrong, so both have to go out in one release.

The five article-tool gates are separate. Each fails the release preflight on its own, which keeps the release fail-closed. Article 32 is in both sets.

## Machine-readable inputs

| File | Content | Verified |
|---|---|---|
| `scripts/content/correction-packages/article-tool-gates.json` | Embed and primary-tool operations for IDs 27, 28, 29, 32 and 37 | `verify-correction-packages.mjs`, run in reference-audit run 43643424938 against the live published records. All 5 records were found and their identities matched. Tool relation IDs resolved: 65, 61, 8, 17 and 16. Errors after the patch: 0. |
| `scripts/content/correction-packages/release-coupled-articles.json` | The 12 coupled records (5, 7, 8, 10, 21, 25, 32, 46, 56, 57, 58, 69) with their `updated_at` baselines and links to the drafts | Baseline taken with a read-only SELECT on 2026-11-14 |
| `docs/editorial/PHASE3_*` | The text drafts for each article | Editorial drafting only, not clinical approval |

## Release sequence

Run only after authorization. Each step has to pass before the next one starts.

1. **Gate 0: staging.** Verify the Hostinger QA runtime, its Neon binding and R2 isolation, using CMS #65 `docs/release/HOSTINGER_STAGING_RUNTIME_EVIDENCE_20261114.md`. This step is currently **BLOCKED_EXTERNAL_ACCESS**.
2. **Gate 1: drift check.** Re-read the 17 records (5 gate records and 12 coupled records; 32 overlaps, so 16 unique). Any `updated_at` that differs from the baseline stops the release and sends that draft back for re-review.
3. **Gate 2: clinical sign-off.** A licensed reviewer has to approve the 12 coupled drafts and the related #56 tool changes, starting with PHQ-9 item 9, the water 100 kg cut-off and the 44-week bound. This step is **BLOCKED_CLINICAL_REVIEW**.
4. **Staging rehearsal.**
   - Apply both packages as **draft versions** of the same record IDs on staging. Create no new records.
   - Build the #56 frontend against staging.
   - Run the release preflight. The rehearsal passes only if `contentComplete` is true and `article-tool-gates.json` is emptied in the release branch only.
5. **Production, in this order:**
   1. Merge #56.
   2. Publish the 16 draft versions in one CMS session.
   3. Trigger a single rebuild.
   4. Run post-deploy reconciliation using CMS #34.
   5. Submit IndexNow only for the changed URLs, and only with explicit owner approval.
6. **Rollback.**
   - Revert the #56 merge commit.
   - Restore the previous published version of each of the 16 records. Payload keeps version history, and the baseline `updated_at` values identify the versions.
   - Rebuild.
   - Do not resubmit to indexing.

## What stays open

- WHO-5 stays suspended until the licensing hold is resolved.
- PHQ-9 item 9 must keep its alert path. It is covered by `tool-engine-integrity` and the browser QA scenario.
- Removing the gates from `article-tool-gates.json` is allowed only in the release branch, after Gate 2.
