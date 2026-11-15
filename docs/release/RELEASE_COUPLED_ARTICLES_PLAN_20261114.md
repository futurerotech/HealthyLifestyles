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

**Superseded on 2026-11-15** by `RELEASE_PROCEDURE_20261115.md`, the single authoritative order. The earlier steps here (merge #56, then publish) would have deployed the new calculators next to old article text. Saving drafts on the production CMS before the CMS chain ships would also have sent unapproved indexing pings. The new procedure adds the release content lock (`scripts/content/release-content-lock.*`) and a tested rehearsal.

## What stays open

- WHO-5 stays suspended until the licensing hold is resolved.
- PHQ-9 item 9 must keep its alert path. It is covered by `tool-engine-integrity` and the browser QA scenario.
- Removing the gates from `article-tool-gates.json` is allowed only in the release branch, after Gate 2.
