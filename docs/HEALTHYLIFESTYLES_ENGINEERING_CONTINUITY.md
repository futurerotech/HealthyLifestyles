# HealthyLifeStyles — Engineering Master Continuity and Release Gate

**Owner instruction, recorded 2026-11-04.** Read this document before editing either project. This is the durable handoff for Codex and any succeeding engineer. It consolidates the owner's *current release-stage instructions*, not a license to disregard safety, existing project instructions, or newer explicit owner decisions.

## 1. Non-negotiable working contract

1. **Stay within the approved HealthyLifeStyles objective.** Resume the latest verified work, follow the owner's established engineering master prompt and scope. Do not pivot to Free1APK, MyRecipee, unrelated feature creation, DNS changes or speculative staging infrastructure.
2. **Work, do not just plan.** Read the actual files, reproduce a defect before changing code, implement narrowly, test the affected scope, commit to an authorized development branch, verify outcomes and record exact evidence. Do not invent fixes to create commits.
3. **Preserve successful work.** Do not repeat passing tests without a concrete regression reason. CI may run automatically after any approved branch push; distinguish that from intentionally rerunning tests.
4. **Keep the established architecture.** Frontend: Astro + Vercel, `futurerotech/HealthyLifestyles`, public host `https://www.healthylifesstyles.com` (exact spelling). CMS: Next.js/Payload + Hostinger, `futurerotech/healthylifestyles-cms`, `https://cms.healthylifesstyles.com`. Neon PostgreSQL and Cloudflare R2 are separate production services.
5. **Strict release boundaries.** Never merge PRs, push directly to `main`, deploy Production, promote Preview, roll back Production, change DNS, alter Hostinger deployment, mutate production CMS/Neon/R2 records, invoke production deploy hooks, submit indexing, reveal secrets, add a paid service, or change billing without a fresh explicit owner decision. A passing test does not authorize release.
6. **Conditional Preview-only secret authorization.** The owner approved removing `CMS_API_KEY` and `INTERNAL_API_KEY` from Vercel Preview **only** if the existing Production assignments and secret values remain intact, with `CMS_URL` unchanged. Uncertainty means stop without saving. This does **not** authorize creating a Preview.
7. **SEO / medical / site preservation.** Protect published content, calculator formulas and embed relationships, canonical URLs, sitemap, robots, security rules, current ads, truthful medical authorship, internal/external references and accessibility. Avoid bulk rewrites or false physician review claims.
8. **Honest gates and continuity.** Label verified facts, owner-reported observations, inferred risks and unknowns separately. If blocked, document the exact blocker once and continue only independent in-scope safe work. Never claim unattended background execution. End **every** engineering report with a single specific **NEXT STEP**.

## 2. Mandatory source-of-truth reading

- Frontend PR #19: https://github.com/futurerotech/HealthyLifestyles/pull/19 — check actual current head, base, comments and CI.
- Stacked frontend dependency: PR #17 → PR #18 → PR #19. They were open at the last verification; do not assume any current mergeability or deployment without checking.
- Current repository `AGENTS.md` (this directive appears first); existing `docs/DEPLOY.md` (contains older snapshots: check dates and current code).
- HealthyLifeStyles Google Drive engineering/indexing journal: https://docs.google.com/document/d/1IdjhFWGoEWHDmwKwJK0MslQ3ZFHWuEpseF2HMKIOUVU/edit . Its last checked update was 2026-11-02; older entries are historical, not automatic approval.
- Medical editorial charter: https://docs.google.com/document/d/1GW7_ndGwiNHEbfuOM84XwxTdLSaUPrrEtuYVpySAnv8/edit .
- Official Vercel scoped-secret deletion regression: https://github.com/vercel/vercel/issues/16622 . A maintainer states the fix is in `vercel@59.20.0`; verify exact installed version and current behavior before any authenticated operation.

## 3. Last independently verified GitHub checkpoint — 2026-11-04

| Field | Verified state |
| --- | --- |
| Repository | `futurerotech/HealthyLifestyles` |
| Active release PR | #19, draft, open; head branch `codex/article-primary-calculator-20261103` |
| Last reviewed application source HEAD | `533b9836c1c18e366b2a24992d5b624df4d6d7be` |
| CI for application source HEAD | https://github.com/futurerotech/HealthyLifestyles/actions/runs/41669576686 — completed SUCCESS |
| PR dependency | PR #18 is the base branch for #19; PR #18 contains #17 work |
| Production frontend SHA (dashboard evidence reported 2026-11-03) | `d11131327ab12a04e5358fb8096e8deed7554c48`, Ready — reverify before using |
| Older Ready Production deployment reported | `3c5dd198cb66c944d483ccefb271d490a39bd526` — **not proven eligible for Instant Rollback** |
| Most recently observed Preview | PR #18 SHA `15e495b0788c21dba59035247c2d7eda13bf1727`, **not** a Preview of PR #19 |
| Preview creation | BLOCKED; no exact-SHA PR #19 Preview observed |
| Production release | **NO-GO** |

The documentation-only commit containing this handoff is *not* itself a new application release validation. After this commit, the branch HEAD will differ from the last validated application SHA above. Record the new HEAD and CI state, but do not falsely reclassify an earlier CI run as its validation.

## 4. Completed functionality and passing checks (do not redo without cause)

- Article primary-tool embeds, no duplicate authored embeds; smaller paginated real CMS reads.
- Real Chrome calculator hydration and keyboard-driven numeric output change on desktop/mobile.
- X/Facebook hydrated share URL correction; result-image invalid XML control-character handling; explicit Astro `OPTIONS` preflight for `/api/lead`.
- Server-only external write policy at `src/lib/external-write-policy.ts`: only `VERCEL_ENV=production` allows external writes from `/api/lead`, `/api/subscribe`, `/api/push-subscribe`, and `/api/analyze-recipe`. Preview/unknown environments return 503 prior to outbound requests.
- Targeted proof reported: API tests **12/12**, CMS snapshot **13/13**, no outbound CMS/n8n writes from those guarded Preview routes even with mocked credentials/spoofed headers; public CMS reads without write secrets. Real CMS build, Chrome, SEO and blocking Lighthouse in the exact application-head CI PASS.
- At that build, 60 published articles and 68 generated calculator routes were reported. Recheck content inventory when release-stage evidence requires it; do not hardcode these numbers as permanent facts.
- `vercel.json` intentionally disables automatic Git deployments for `codex/**`. Do not remove that guard to force a Preview.

## 5. Current exact blocker: Vercel authentication / secret scope

**Last owner-supplied Codex status** (not independently proven in this session): Vercel CLI `59.20.0` was installed and executable in an isolated directory; an official device authorization page was opened for the owner. The owner has **not supplied confirmation that the device authorization completed**. An authenticated browser is not automatically an authenticated CLI; a separate ChatGPT session cannot inherit a Codex host CLI session. This handoff does not establish current CLI access.

**Vercel variable evidence from authenticated browser report:** `CMS_URL`, `CMS_API_KEY`, and `INTERNAL_API_KEY` are assigned to both Production and Preview; there were no linked shared variables at that inspection. Secrets are write-only in the UI. Editing with an empty value is **not proven** to retain the Production value; no change was saved. Public published-content GET returned 60 published articles without credentials; this does not demonstrate a complete Preview build.

**Safe continuation sequence:**

1. In the same authorized Codex/local host environment, confirm the official device-flow login completed. Check `vercel whoami` using the isolated verified executable, without printing session tokens. If login is still pending, the **one owner action** is to finish the authorized Vercel device confirmation in that exact session.
2. Confirm actual installed `vercel --version >= 59.20.0`, the target Vercel account/team, existing project `healthy-lifestyles`, project ID and clean isolated working-directory link. Never create a new project or link/alter the owner checkout blindly.
3. Inspect only environment-variable metadata: identities, types, target arrays and branch overrides for `CMS_API_KEY` and `INTERNAL_API_KEY`. Do not display, retrieve, re-enter, export or rotate secret values.
4. Inspect the precise provider operation for **removing only the Preview target from a multi-target record**, preserving Production and value. Vercel CLI releases **before 59.20.0** had a documented destructive cross-target bug; never use them. Verify the chosen version and effective operation, and, if needed, an isolated synthetic nonproduction rehearsal. A command with an environment flag is *not sufficient proof* unless the implementation is known and tested.
5. Only if preservation is demonstrably guaranteed and account/project/record identity is exact, carry out the owner's **already conditional, scoped authorization**. Stop without modification otherwise. Recheck Production still has both variables, Preview has neither, `CMS_URL` unchanged, and no deploy/hook fired. Do not claim secret-value identity from hidden UI fields; support it with operation semantics/provider evidence.
6. If this environment lacks the Codex CLI/authenticated Vercel access, do not fabricate access or request account credentials in chat. Continue read-only evidence checks and maintain the blocker for the same authorized session.

## 6. Further Preview / release blockers

- **Deployment-event receivers:** GitHub frontend and CMS workflows inspected did not contain a `deployment_status` or `repository_dispatch` consumer; external GitHub Apps, n8n and third-party receivers remain unverified. Vercel project exposes a `Payload CMS Update` deploy hook targeting `main`. Do **not** invoke this hook; trace actual external consumers before claiming safe Preview.
- **Hobby quota:** owner-observed count was **83 completed / 410 failed builds in 30 days**, not an authoritative remaining 24-hour build/deployment allowance. Inspect the actual current limits and account usage before proposing an additional build; no resource upgrades or new charges.
- **Preview isolation:** provider Preview must not contain CMS write secrets or produce unintended build/runtime outbound writes. Code-level tests pass; deployed environment and event consumers remain unverified.
- **Exact-SHA Preview acceptance:** a PR #18 deployment is not evidence for PR #19. Even after feasibility gates pass, **explicit separate owner authorization** is required to create ONE nonproduction Preview. Then match deployed source/content to the final reviewed SHA and test calculators, sharing, preflight, SEO, keyboard/mobile and data isolation.
- **Rollback:** existing older Ready deployment is not a verified eligible and compatible rollback target. Confirm actual Production deployment ID/SHA, known-good target, eligible provider action, domains and CMS/media compatibility, all without executing rollback.
- **Integration:** verify PR #17 → PR #18 → PR #19 chain and CI. Merge/release only in an owner-approved order; a Ready/CI status alone does not imply authorization.

## 7. End-of-session report contract

Use concise Arabic for reports; keep commands, code, identifiers and artifacts in English.

State: (a) exact verified GitHub SHA; (b) actual operations and files changed; (c) tests/CI run and current status; (d) provider evidence vs owner report vs unknown; (e) safety boundaries respected; (f) each remaining blocker; (g) **GO/NO-GO** and **NEXT STEP** as the final field. Record durable updates on PR #19 and update this file when the verified milestone changes. Do not claim infinite background continuation.

**Next immediate action at this checkpoint:** finish/verify Vercel CLI device-flow authentication in the **same Codex host session**, then read-only verify the Vercel account, existing project and the two multi-target secret records before any conditional Preview-only scope removal. If that host session is not available, leave the secrets unchanged and request the single access action.
