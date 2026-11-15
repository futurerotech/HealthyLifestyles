# Release procedure: #56, the CMS chain and the 16 article records (2026-11-15)

**This is the single authoritative cutover order.** It replaces the production steps in `RELEASE_COUPLED_ARTICLES_PLAN_20261114.md` §Release sequence and `FINAL_OWNER_DECISION_PACKAGE_20261115.md` §3, which gave conflicting orders. It is prepared but not executed, and production remains **NO-GO** (see review comment 6887842807).

## 1. Verified behavior the order depends on

| Fact | Evidence |
|---|---|
| Visitor-facing article and tool pages are static. CMS content is baked in at build time, and no server route renders articles. | `astro.config.mjs` uses `output: 'static'`. The only `prerender = false` routes are `src/pages/api/*`: subscribe, lead, unsubscribe, push, vitals, result-image, analyze-recipe. |
| Merging into frontend `main` triggers an automatic **production** build. Other branches get preview builds, and `codex/**` gets none. | `vercel.json` `git.deploymentEnabled` |
| A production build runs the release preflight. If it fails, the build fails and the previous deployment keeps serving. | `postbuild` runs `content:preflight`. This commit pins `"buildCommand": "npm run build"` in `vercel.json`, so Vercel runs the same npm lifecycle as CI and never a bare `astro build` that would skip the preflight. Vercel's keep-previous-deployment-on-failure behavior must be confirmed in an owner-authorized preview or staging deployment (§3a). |
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

**Revised 2026-11-15** after review comment 6888386743. The earlier version deadlocked: it required release commit R to be green at the exact head *before* publication, while the only CI build reads production, where R's release-mode lock must fail until publication. Release acceptance now has two separate, labeled gates:

- **Release-candidate (RC) acceptance.** `release-candidate.yml` builds R from an **isolated staging mirror** (`HLS_PREFLIGHT_CMS_ORIGIN`, allowlisted in `scripts/content/staging-mirror.json`), where the 16 reviewed release versions are published. A pass proves the R code against the release content. It **cannot** authorize production: a production build (`VERCEL_ENV=production`) refuses a mirror origin.
- **Production promotion gate.** This is the normal Verify build of R against the production CMS. It is red until the 16 records are published on production. That is expected, it is never suppressed, and R is not merged while it is red. It turns green only once production holds exactly the release set.

1. **CMS code only.** Deploy the chain #34 → #64 → #65 → #66 to staging, then to production, with its additive migration. Content does not change, and the frontend is untouched. Confirm on staging that saving a draft article queues nothing and pings nothing.
2. **Staging mirror** (§6): bootstrap, then verify. The mirror build in **pre-release** mode must pass, which shows the mirror holds production's exact digests.
3. **Freeze:**
   - stop manual `/api/deploy` calls;
   - stop CMS publishing outside this release;
   - stop pushes to frontend `main`;
   - do not use Vercel "Redeploy".
4. **Drafts on production.** Save the 16 corrections as drafts of the same IDs. Drafts are invisible, queue nothing and send no push. Then:
   - Read the drafts back with an authenticated read and compute `lockDigest`.
   - Confirm the published records still match `preReleaseDigest`.
   - Get the clinical sign-off on exactly these drafts.
5. **Release commit R** on the #56 branch: gates emptied, `releaseDigest` filled, `mode: "release"`.
   - The lifecycle test (`release-rehearsal.test.mjs`) accepts both committed states and rejects mixed ones.
   - Apply the same 16 versions on the staging mirror and publish them there.
   - Push R to `release/rc-<date>`, which runs RC acceptance. Vercel previews are disabled for these branches. **RC acceptance must be green at R's exact SHA.**
6. **Publish the 16 on production** in one CMS session. Visitors see no change: pages are static, and no build is triggered.
   - If any publish fails, stop and go to §4.A.
7. **Production promotion gate.** Re-run Verify for R. It must now be green at the exact SHA against production content. If it is red, go to §4.A.
8. **Promote.** Fast-forward `main` to R (`git push origin R:main`, where main's head is R's parent), so production builds exactly the tested SHA. A GitHub merge commit would be an untested SHA. The automatic Vercel production build runs the same preflight. Vercel assigns the production domain only to a successful build, and that is the single cutover.
9. **Acceptance** (on the live site):
   - the 16 URLs render the corrected content;
   - the 5 articles embed their primary tool;
   - PHQ-9 item 9 alerts;
   - WHO-5 stays unavailable;
   - `/lab` returns 404;
   - signup creates a consent-stamped record and nothing is sent.
10. **Indexing.** Run post-deploy reconciliation (#34). Submit IndexNow only for the changed URLs, and only with explicit owner approval.
11. **Unfreeze.**

**Residual risk.** Between steps 6 and 8, a build of the old `main`, which has no lock, would bake the new articles in next to the old calculators. Only the freeze prevents this. To make it fail closed as well, the owner may first release a small guard commit to `main`: the pre-release lock plus the pinned `buildCommand`, with no behavior change. After that, any stray build during the window fails and the old deployment keeps serving.

## 3a. CI, branch protection and Vercel facts (verified 2026-11-15)

- `main` has **no branch protection and no rulesets**: `GET /branches/main/protection` returns 404, and required checks are empty. GitHub would allow merging a red PR, so "green before merge" is enforced by procedure only. **Owner decision:** enable protection that requires the `Verify` check on `main`. Under that protection, R could merge only after step 7, which is the intended order.
- PR checks run on `pull_request` to `main`, which tests GitHub's merge ref, not the head. The fast-forward in step 8 makes the production build use the tested SHA.
- Vercel: `main` pushes build production, `codex/**` and `release/rc-**` do not build, and other branches build previews. `buildCommand` is pinned to `npm run build`, so the postbuild preflight always runs. A failed build is not assigned the production domain, so the previous deployment keeps serving. The Vercel team returns 403 from this session, so this standard behavior is **not verified here**. It must be shown in an owner-authorized preview or staging deployment before step 8.

## 4. Failure and rollback

- **A. Partial publish (step 6):**
  - The site is unaffected: the old build is still served, and R cannot build because the lock reports a partial state.
  - Restore each already-published record to its pre-release version from Payload version history.
  - Verify that every record matches its `preReleaseDigest` (the release content lock CLI prints the digests).
  - `main` has not changed: R is merged only after step 7. Either fix and republish, or stay on the pre-release state.
  - **Never** build pre-#56 code while any record is in its release version.
- **B. Problem after cutover:**
  1. Use Vercel instant rollback to the previous production deployment. No build runs, and the old artifact is internally consistent.
  2. Restore the 16 records to their pre-release versions and verify the digests.
  3. Revert `main` to R's parent. Its pre-release lock matches the restored content, so it builds again.
  4. Leave the migration columns in place (`down` is a no-op by design).
  5. Do not resubmit for indexing.
- **C. Drift found at step 4 or 7:** an unreviewed edit to a locked record. Stop, re-review the record, and regenerate the digest. Never edit the lock to match unreviewed content.

## 5. Tested now (no network, no CMS writes)

`scripts/seo/__tests__/release-rehearsal.test.mjs` (8 tests, including both committed lifecycle states and RC versus production acceptance), `preflight-origin.test.mjs` (3) and `staging-bootstrap.test.mjs` (3) runs on a simulated, versioned CMS with the real lock and gate checks. It covers:
- drafts stay invisible;
- a publish failure at record 9 of 16 blocks both code states, and the partial batch can be rolled back;
- after a complete publish, only R builds;
- post-review drift is caught;
- a full rollback is verified by content digest, even though timestamps change;
- an incomplete or unknown lock never passes.

Not tested here: a real staging CMS, real Vercel failure semantics, and real Payload version restore. Those are gates 0 and 3 of the staging evidence above.

## 6. Isolated staging bootstrap (prepared, NOT run)

This needs separate owner authorization, plus proof of Hostinger, Neon and R2 isolation (CMS #65 procedure).

1. **Export.** Run `scripts/content/staging-bootstrap-export.mjs` (`buildBundle`).
   - It reads only the public, unauthenticated production API.
   - Allowlisted content: published articles, tools, categories, authors, tags, pages, pSEO pages and redirects, plus the public globals settings, ad-management and lead-gen.
   - IDs, slugs and relations are kept.
   - Secret-looking keys and email values are dropped and listed in `dropped` for review.
   - Every record gets a checksum.
   - Private collections are refused, by test: users, subscribers, leads, push data, profiles, usage and audit logs, indexing queue, deploy logs, link-building data, prompts.
   - Media is referenced by its public URL. Production R2 is never accessed with credentials.
2. **Import** inside the Hostinger QA app only, with `HLS_ISOLATED_STAGING=true`, the staging `DATABASE_URI` (Neon `small-hall-15225012`) and a staging-only R2 token. Write the records with their original IDs. Only after the import, set each sequence above the maximum ID.
3. **Verify** with a mirror-scope build in pre-release mode (§3, step 2). It must report `contentComplete: true`, which proves the same IDs, slugs, relations and the 16 pre-release digests.
4. **Release versions.** Apply and publish the same 16 reviewed release versions on the mirror, then run RC acceptance (§3, step 5).
5. **Teardown or retain** the bundle as review evidence. It contains public content only.

Current staging state, read-only on 2026-11-15: 0 tools, 0 articles, none of the 16 IDs.
