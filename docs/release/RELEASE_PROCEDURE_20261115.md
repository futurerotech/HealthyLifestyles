# Two-platform release procedure: CMS on Hostinger, frontend on Vercel (revised 2026-11-15)

This is the single authoritative release procedure. It replaces every earlier cutover order (see review comments 6887842807, 6888386743 and 6888834079). It is prepared, not executed. **Production is NO-GO.**

**Systems:**
- **A, CMS:** `futurerotech/healthylifestyles-cms`, Payload on Hostinger, Neon PostgreSQL for data, Cloudflare R2 for media.
- **B, Frontend:** `futurerotech/HealthyLifestyles`, Astro on Vercel. Article and tool pages are static and are baked from the published CMS content at build time. Only `/api/*` routes are server-rendered.

These five operations are distinct and are never combined:

| # | Operation | Effect |
|---|---|---|
| 1 | Deploy CMS code (Hostinger) | Changes CMS behavior only |
| 2 | Edit or publish CMS content (Payload) | Changes what the next frontend build reads |
| 3 | Build the frontend (Vercel) | Bakes a new snapshot of content and code together |
| 4 | Promote or alias a Vercel deployment | Changes what visitors see |
| 5 | Submit URLs for indexing | Changes nothing visible; needs explicit approval |

## 1. Root cause and every unsafe entrypoint

**Risk:** an artifact that pairs old calculator code with corrected article text, or the reverse. Only operation 3 creates artifacts. Operation 4 chooses which artifact is served.

| Entrypoint | What it builds or serves | Controlled by | Status |
|---|---|---|---|
| Push or merge to frontend `main` | Production build of that commit | Content lock in the commit's preflight. Proposed ruleset (§3). | The guard (PR #57) is needed on `main`. It is not merged. |
| Push to another branch | Vercel preview, except `codex/**` and `release/rc-**`, which have no build | Previews never receive the production alias unless promoted | Safe while not promoted |
| Vercel "Redeploy" of a deployment | Rebuilds that deployment's commit with current CMS content | The lock, **only if that commit contains it**. A pre-guard commit is unprotected. | **Needs Vercel control (§4)** |
| Vercel deploy hook, CMS `/api/deploy` | Builds the hook's branch (usually `main`) | The lock on that branch | Covered once the guard is on `main`. The CMS route is admin-only and debounced. |
| Vercel CLI or a manual deploy of any commit | Any commit | The lock, if that commit has it | **Needs Vercel control (§4)** |
| Promote a preview to production | That preview's artifact; Vercel may rebuild with production env | A rebuild re-runs that commit's preflight | **Owner verification (§4)** |
| Instant Rollback | Reassigns the alias to an existing artifact; no build | Old artifacts are internally consistent (frozen content and code) | Safe for consistency |
| CMS article save on **production CMS `main` (`1637680`)** | Pings IndexNow and Google immediately, drafts included (`afterChangeIndexingHook`, `notifyIndexNow`) | Fixed only by deploying the CMS chain | **No article edits until the chain runs on Hostinger** |
| CMS publish on the chain | Queues reconciliation only. No deploy. Push only on first publish (the 16 are already published). Drafts queue nothing. | Code verified at the chain head | Hostinger runtime SHA **not verified** |

**What a guard can and cannot do.** A content lock inside a commit protects every *build of that commit*. It cannot protect builds of older commits that lack it, and it cannot touch existing artifacts. Those need provider controls: Vercel deployment protection, roles and procedures. There is no cross-provider transaction. The only atomic step is Vercel's alias switch for one artifact. Content and code consistency comes from the lock making every *build* fail unless content and code match. The alias then points at a build that passed.

## 2. Guard-only pre-release update (PR #57, separate decision)

- Branch `codex/guard-content-lock-20261115`, based on production `main` `57f72ee`, has a 7-file diff. It adds:
  - the content lock in pre-release mode, with the reviewed digests;
  - the preflight wiring;
  - the host-independent fingerprint;
  - `buildCommand: npm run build`.
- It carries no #56 behavior.
- After merge and deploy, any build of `main` fails if the 16 records are early, partial or unreviewed. The previous deployment keeps serving.
- **CI status:** the guard PR's Verify fails at the pre-existing step `Audit delta`, because the baseline review expired on 2026-10-08. That step fails the same way for current `main` (Issue #52). This is a security-review decision. It is not bypassed here.
- Evidence of the guard's own build against live production comes from the evidence-only branch `codex/guard-evidence-20261115`, which is never merged.
- `npm audit --audit-level=high` passes, with 1 low and 1 moderate finding, so Vercel's `prebuild` does not fail.

## 3. Branch protection and exact-content promotion

- **Verified 2026-11-15:**
  - frontend `main` is not protected and has no rulesets;
  - the repository is owned by a **user** account, so GitHub merge queues are unavailable;
  - the default branch is `dev`.
- **Proposed ruleset** (`docs/release/branch-ruleset-main.json`, not applied):
  - pull request with 1 approval and last-push approval;
  - required `Verify` check in strict mode (branch must be up to date);
  - merge method `merge` only;
  - no force-push or deletion;
  - no bypass actors.
- This ruleset blocks a direct `git push origin R:main`. Promotion therefore uses a pull request, and the tested object is the **tree**:
  - Strict mode means R contains `main`, so GitHub's merge commit M has `tree(M) == tree(R)`.
  - The PR's Verify ran on the merge ref, which has that same tree.
  - `scripts/release/verify-promotion.mjs` (tested on a real git repository) runs on every push to `main` (`release-attestation.yml`). It proves the tree identity and the required checks, and requires RC acceptance for a release-mode lock.
  - Vercel's build of M re-runs the full preflight. That build is the artifact that receives the alias.
- **TOCTOU:** content could change between a CI check and the Vercel build. The check that decides is the one **inside the Vercel build**: the lock and the manifest-versus-inventory fingerprints compare the content actually baked into that artifact. A change during the build is caught by the post-build inventory re-read (`documentProof` against the manifest). No earlier green check substitutes for it.

## 4. Vercel controls and owner-assisted verification (BLOCKED_EXTERNAL_EVIDENCE)

The session's Vercel access returns 403. **None of these are verified.** The owner, or someone with authorized access, must record:

1. Production branch is `main`. Ignored Build Step is empty, or a value confirmed not to skip builds. The build command is not overridden in the dashboard (`vercel.json` pins it).
2. In a preview, a deliberately failing preflight keeps the previous production deployment serving, and the failed deployment never gets the alias.
3. "Redeploy" of an older deployment rebuilds with **current** CMS content. During the release window, restrict Redeploy, CLI deploys and deploy hooks to the release owner (team roles), or temporarily remove the deploy hook.
4. Instant Rollback changes the alias without a build. Record the deployment IDs before and after.
5. CDN: static HTML is revalidated on deploy, and hashed assets are immutable. Check that one old HTML page never references assets missing from the new deployment. Old deployment URLs stay reachable; restrict them with Deployment Protection if needed.
6. `/api/*` routes (subscribe, lead, unsubscribe) do not depend on article content.

## 5. CMS (Hostinger) facts and gaps

- **Code facts** (chain head and `main`) are in §1.
- **Not verified** (BLOCKED_EXTERNAL_EVIDENCE):
  - which commit Hostinger runs, and which branch deploys it;
  - whether the running CMS still behaves like `1637680`.
- The CMS chain must be deployed **and** verified on Hostinger before any production article edit, draft included. Required evidence:
  - the deployed SHA from the Hostinger panel;
  - a staging draft save that produces no IndexNow or Google request (`INDEXNOW_DRY_RUN`, outbound log);
  - Payload version restore of an article on staging.

## 6. Isolated staging mirror

| Component | State | Evidence |
|---|---|---|
| Read-only export (`scripts/content/staging-bootstrap-export.mjs`) | Implemented | Allowlisted collections. Media is derived from references. Secret-looking keys and email values are dropped. Embedded sensitive text (emails, tokens, API keys, credentialed URLs, phone numbers) **fails closed**. Unit tests: 5. Dry run against live public data in the reference-audit workflow. |
| Importer (CMS #67 `src/lib/staging-import.ts` @ `67cffb5`) | Implemented | The guard runs inside both import and cleanup: env plus the actually connected DB, before any I/O; denied paths make zero writes. Canonical checksums are recomputed; tampering, unknown fields and secrets are rejected. Content and sequences share one transaction (rollback before commit). An HMAC-signed creation journal is written before commit. A post-commit failure raises `ImportCommittedError`, followed by a **compensating** cleanup that is journal-scoped, refuses changed records and resumes after a partial failure. The ID flag is always restored. CI 43680747911: 32 unit tests and 9 **synthetic** integration tests. |
| Real staging import | **Not run** | Needs owner authorization and Hostinger, Neon and R2 isolation proof (CMS #65 procedure). Staging Neon has 0 tools and 0 articles. |
| Lock digest across hosts | Implemented | Media is compared by ID and file name, so a faithful mirror can match production's digests. |

Staging must run with:
- `HLS_ISOLATED_STAGING=true`;
- the staging Neon host `ep-plain-forest-bca0vqud`;
- a staging-only R2 token, with production denied;
- no IndexNow, Google, deploy-hook, n8n, VAPID or email credentials;
- `SERVER_URL=https://cms-qa.healthylifesstyles.com`.

## 7. The two release gates (independent, both fail closed)

- **Gate 1, release candidate.** `release-candidate.yml` builds R from the staging mirror. The preflight's `resolvePreflightOrigin` allows only an allowlisted mirror and refuses it in any `VERCEL_ENV=production` build. The build checks:
  - the exact SHA;
  - the 16 release digests;
  - gates resolved;
  - no drift;
  - render;
  - no outbound side effects (staging mode).

  A pass does not authorize production.
- **Gate 2, production promotion.** The normal Verify build of R against the production CMS. It is red until the 16 records are published on production, and it is never suppressed.

## 8. Procedure (owner and approval per step; each step must pass before the next)

| Step | Action | Owner and approval |
|---|---|---|
| A | Merge and deploy guard PR #57 to `main`, then confirm the production build passes with the pre-release lock | Owner release decision; security review of Issue #52 first |
| B | Apply the `main` ruleset (§3) | Owner |
| C | Prove staging isolation (CMS #65), then bootstrap the mirror (§6). The mirror build in pre-release mode must pass. | Owner authorization |
| D | Rehearse on staging: deploy the CMS chain; save drafts, publish, restore versions for the 16; run RC acceptance | Engineering, on authorized staging |
| E | Clinical, security, privacy and accessibility sign-offs on the exact drafts and code | Qualified humans |
| F | Freeze through provider controls, not reminders: restrict Vercel Redeploy, CLI and hooks to the release owner; pause the CMS `/api/deploy`; open no other PRs to `main` | Owner (Vercel team settings) |
| G | Deploy the CMS chain #34 → #64 → #65 → #66 to Hostinger, with the additive migration. Record the deployed SHA. Confirm a draft save pings nothing. | Owner authorization |
| H | Save the 16 corrections as drafts on production. Compute their digests. Confirm the published records still match the pre-release digests. | Editor, with clinical sign-off on these drafts |
| I | R = #56 plus release mode (gates emptied, release digests) on `release/rc-*`. Gate 1 must be green at R's exact SHA. | Engineering |
| J | Publish the 16 in one session. On any failure go to §9, case 4. | Editor |
| K | Re-run Gate 2 on R's PR; it must be green. Merge the PR (strict, `merge` method). `release-attestation` must pass on M. Vercel builds M; only a passing build gets the alias. | Owner release decision |
| L | Public acceptance: the 16 URLs; 5 embeds; PHQ-9 item-9 alert; WHO-5 unavailable; `/lab` 404; signup stores consent and sends nothing | Engineering and owner |
| M | Post-deploy reconciliation (#34). IndexNow for changed URLs only. | Owner approval |
| N | Unfreeze | Owner |

## 9. Failure and rollback matrix

| # | Case | Outcome | Evidence |
|---|---|---|---|
| 1 | All 16 still old | Old code builds; R fails Gate 2 | release-rehearsal, release-guard (synthetic) |
| 2 | All 16 match release | R builds; old code fails | release-rehearsal (synthetic) |
| 3 | 1 of 16 updated | Both code states fail ("partial state, 15 of 16") | release-guard (synthetic) |
| 4 | Publish fails at record 9 | Both fail closed; restore by version history; verify `preReleaseDigest` | release-rehearsal (synthetic); real restore needs staging (D) |
| 5 | Edit after review | "matches neither reviewed version" | release-rehearsal, release-guard (synthetic) |
| 6 | Wrong embedded calculator | Gate check fails (unlisted defect or wrong-primary) | correction-packages, release-rehearsal (synthetic) |
| 7 | Draft becomes public | Public reads are published-only; the lock catches an unreviewed published change | CMS pseo-rest test (draft isolation); lock (synthetic) |
| 8 | Indexing hook on draft save | Production `main` does ping (code fact); chain does not | Code; staging proof needed (G) |
| 9 | Build while some records corrected | Fails closed (partial state) | Synthetic |
| 10 | Old SHA rebuilt | Fails only if that SHA has the guard; pre-guard SHAs are unprotected | §1; Vercel control (§4) |
| 11 | Manual redeploy | Same as 10 | Vercel control (§4) |
| 12 | CMS deploy fails after migration | Migration is additive, `down` keeps data, old code ignores the new columns; redeploy the previous SHA | CMS ledger rehearsal CI (synthetic) |
| 13 | DB points at production | Importer and staging config refuse the production host | staging-import unit tests; `isolated-staging-database` |
| 14 | Staging R2 reaches production | `assertIsolatedStagingMedia` checks configuration; real token scope needs Cloudflare proof | BLOCKED_EXTERNAL_EVIDENCE |
| 15 | RC passes staging, fails production | Not merged; investigate; no production change | Gate design (§7) |
| 16 | Post-cutover acceptance fails | Instant Rollback (no build); restore the 16 and verify digests; revert `main` by PR | Synthetic; Vercel proof (§4) |
| 17 | Reverse partial publication | Payload version restore, then digest check | Synthetic; real restore needs staging (D) |
| 18 | Roll back frontend without rebuilding | Instant Rollback; never Redeploy an old commit while release content is published | §4 |

Synthetic tests use simulated or disposable data. They are not evidence about the real providers.
