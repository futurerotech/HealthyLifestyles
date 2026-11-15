# Release procedure: #56, the CMS chain and the 16 article records (2026-11-15)

**This is the single authoritative cutover order.** It replaces the production steps in `RELEASE_COUPLED_ARTICLES_PLAN_20261114.md` §Release sequence and `FINAL_OWNER_DECISION_PACKAGE_20261115.md` §3, which gave conflicting orders. It is prepared but not executed, and production remains **NO-GO** (see review comment 6887842807).

## 1. Verified behavior the order depends on

| Fact | Evidence |
|---|---|
| Visitor-facing article and tool pages are static. CMS content is baked in at build time, and no server route renders articles. | `astro.config.mjs` uses `output: 'static'`. The only `prerender = false` routes are `src/pages/api/*`: subscribe, lead, unsubscribe, push, vitals, result-image, analyze-recipe. |
| Merging into frontend `main` triggers an automatic **production** build. Other branches get preview builds, and `codex/**` gets none. | `vercel.json` `git.deploymentEnabled` |
| A production build runs the release preflight. If it fails, the build fails and the previous deployment keeps serving. | `postbuild` runs `content:preflight`. This commit pins `"buildCommand": "npm run build"` in `vercel.json`, so Vercel runs the same npm lifecycle as CI and never a bare `astro build` that would skip the preflight. Vercel's keep-previous-deployment-on-failure behavior must be confirmed in a preview (§3, step 0). |
| **Production CMS `main` (`1637680`) pings IndexNow and Google on every article create or update, drafts included** (`afterChangeIndexingHook` + `notifyIndexNow` on Articles). | `git show origin/main:src/collections/Articles.ts`, line 245 |
| The CMS chain head (#64 to #66) removes these per-save pings from Articles. Publishing only queues a pending change for post-deploy reconciliation (#34). Drafts and isolated staging queue nothing. | `src/collections/Articles.ts` (afterChange: `trackPendingChange`, `afterPublishPushHook`); `src/hooks/trackPendingChange.ts` |
| Publishing on the CMS chain does **not** trigger a frontend deploy. Deploys are manual: `POST /api/deploy`, admin only, debounced. `triggerVercelDeploy` is defined but registered nowhere. | `src/app/api/deploy/route.ts`; `git grep triggerVercelDeploy` |
| Push notifications fire only on an article's **first** publish. The 16 records are already published, so publishing a new version sends no push. | `src/lib/push.ts` `afterPublishPushHook` (`wasPublished` returns early) |
| The #56 preflight fails if a gated article-tool defect is fixed but its gate is still listed. It also fails if a defect appears that is not listed. | `checkArticleToolGates` |
| **New:** the #56 preflight enforces the release content lock. All 16 records must equal one reviewed set: pre-release (today) or release. A partial or drifted state fails. | `scripts/content/release-content-lock.{mjs,json}`. The pre-release digests come from reference run 43667642490 and match the `updated_at` baselines. |

**Consequences:**
- **(a)** No article edit, draft included, may be made on the production CMS before the CMS chain is deployed. Otherwise it sends unapproved indexing requests.
- **(b)** A build of pre-#56 frontend code has no lock. It must never run while release content is published.
- **(c)** Merging #56 into `main` with the pre-release lock deploys new calculators next to old article text. That is the incompatible pair the 12 coupled corrections exist to prevent. The release commit therefore uses the **release** lock.

## 2. Preconditions (external gates)

1. Clinical, security, privacy and accessibility sign-offs.
2. Hostinger, Neon and R2 isolation evidence (CMS #65 procedure).
3. **A populated, writable, isolated staging CMS.** Read-only inspection on 2026-11-15 found the staging Neon project `small-hall-15225012` with 0 tools, 0 articles and none of the 16 IDs, and 17 migration ledger entries. Production has 70 tools, 60 articles and 15 ledger entries. **No content rehearsal is possible on staging until it is bootstrapped** from published production content, preserving IDs, slugs and relations. That needs an owner-authorized staging write path through the Hostinger QA app. The read-only checker in #65 does not provide one, and production credentials must not be reused.
4. Owner release authorization.

## 3. Procedure (each step must pass before the next)

0. **Preview proof.** Build the release commit R (step 4) as a Vercel **preview**, before content is published. It must fail at the preflight, which shows that the lock blocks it. Confirm that production still serves the previous deployment.
1. **CMS code only.** Deploy the chain #34 → #64 → #65 → #66 (§4 of the CMS newsletter doc), first to staging and then to production. Run the additive migration (three nullable columns). Content does not change, and the frontend is untouched and stays consistent. Confirm that saving an article draft on staging queues nothing and pings nothing.
2. **Freeze.** Pause manual `/api/deploy`, other CMS publishing, and frontend `main` pushes.
3. **Drafts.** Save the 16 corrected versions as **drafts** of the same record IDs. Drafts are invisible: no queue entry and no public change.
   - Read the drafts back with an authenticated read and compute their `lockDigest`.
   - Run the drift check: the published records still match their `preReleaseDigest`.
   - Clinical sign-off applies to exactly these drafts.
4. **Release commit R** on the #56 branch:
   - empty the gates in `article-tool-gates.json`;
   - fill every `releaseDigest`;
   - set `mode: "release"`;
   - require CI green at the exact head.
5. **Merge R into `main`.** The production build runs and **fails at the preflight**, because the content is still pre-release. Production keeps serving the old consistent build. This failure is expected. It proves the gate holds.
6. **Publish the 16 drafts** in one CMS session. The site does not change, because it is static and no deploy is triggered.
   - If any publish fails, stop and go to §4.A.
7. **Redeploy `main`** (R). The preflight requires all 16 records to match their release digests, all gates resolved, and the rest of the preflight to pass. Only then does Vercel switch the production alias. That single atomic switch is the cutover.
8. **Acceptance** (on the live site):
   - the 16 URLs render the corrected content;
   - the 5 articles embed their primary tool;
   - PHQ-9 item 9 alerts;
   - WHO-5 stays unavailable;
   - `/lab` returns 404;
   - signup creates a consent-stamped record and nothing is sent.
9. **Indexing.** Run post-deploy reconciliation (#34). Submit IndexNow only for the changed URLs, and only with explicit owner approval.
10. **Unfreeze.**

## 4. Failure and rollback

- **A. Partial publish (step 6):**
  - The site is unaffected: the old build is still served, and R cannot build because the lock reports a partial state.
  - Restore each already-published record to its pre-release version from Payload version history.
  - Verify that every record matches its `preReleaseDigest` (the release content lock CLI prints the digests).
  - Then revert `main` to the pre-merge SHA, or fix and republish.
  - **Never** build pre-#56 code while any record is in its release version.
- **B. Problem after cutover:**
  1. Use Vercel instant rollback to the previous production deployment. No build runs, and the old artifact is internally consistent.
  2. Restore the 16 records to their pre-release versions and verify the digests.
  3. Revert `main`.
  4. Leave the migration columns in place (`down` is a no-op by design).
  5. Do not resubmit for indexing.
- **C. Drift found at step 3 or 7:** an unreviewed edit to a locked record. Stop, re-review the record, and regenerate the digest. Never edit the lock to match unreviewed content.

## 5. Tested now (no network, no CMS writes)

`scripts/seo/__tests__/release-rehearsal.test.mjs` (6 tests) runs on a simulated, versioned CMS with the real lock and gate checks. It covers:
- drafts stay invisible;
- a publish failure at record 9 of 16 blocks both code states, and the partial batch can be rolled back;
- after a complete publish, only R builds;
- post-review drift is caught;
- a full rollback is verified by content digest, even though timestamps change;
- an incomplete or unknown lock never passes.

Not tested here: a real staging CMS, real Vercel failure semantics, and real Payload version restore. Those are gates 0 and 3 of the staging evidence above.
