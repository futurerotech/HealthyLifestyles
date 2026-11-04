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

## 5. Verified resolution of the Vercel Preview secret scope — 2026-11-04

**PASS — EXECUTED directly through authenticated Vercel connector, independently read back.** The owner completed explicit team access consent. No Codex CLI session or Codex credits were used. Target verified: team `healthy-lifestyles` ID `team_DuQjbVToWiyUCDUl2CUYK9qx`; project `healthy-lifestyles` ID `prj_9stLJyxbXEQeRxdykwMQKp3cePun`; official domains `www.healthylifesstyles.com` and `healthylifesstyles.com`.

Before changes, both sensitive project env records had exactly the `production` and `preview` targets and no custom-environment or branch overrides. Using the Vercel project's *edit environment variable* PATCH interface (the same target-only approach used by the fixed Vercel CLI 59.20.0; cf. https://github.com/vercel/vercel/issues/16622), two **sequential** calls submitted **only** `{ target: ["production"] }`. No `value`, `type`, `key`, or other replacement fields were supplied, and no secret value was read or logged.

Post-call metadata independently verified after **each** operation:

| Variable | Preserved record ID | Final targets | Result |
| --- | --- | --- | --- |
| `CMS_API_KEY` | `JiHf34zwse6o2XYk` | `["production"]` | PASS |
| `INTERNAL_API_KEY` | `6iDjkwkwCOHfHJlf` | `["production"]` | PASS |
| `CMS_URL` | `GBM67LZcHsYjUJc2` | `["production","preview"]` | UNCHANGED |

This proves the records remain assigned to Production and shows that no replacement secret value was transmitted. Because Vercel stored secrets are unreadable, a byte-for-byte comparison of secret contents was *not* possible; do not claim to have read or compared them. There was no deletion, regeneration, or redeployment.

Vercel team event log listed exactly the two `env-variable-edit` events in the latest project scope; it showed **no new deployment event** since 2026-11-03. Production deployment `dpl_G7zS66ihLZmC2MGR2v3kMDPYuShc` remained `READY`, branch `main`, SHA `d11131327ab12a04e5358fb8096e8deed7554c48`. Project-level SSO protection reports `enabled=true`, `deploymentType=all_except_custom_domains`.

### Critical legacy-Preview caveat

The existing PR #18 Preview `dpl_J6eKMMkfs3bayHpbBi4yYrRE4jCS` remained `READY`, SHA `15e495b0788c21dba59035247c2d7eda13bf1727`. Its published GitHub source had outbound-write-capable `/api/subscribe`, `/api/lead` and `/api/push-subscribe` routes, **without** PR #19's `external-write-policy.ts` guard. This old Preview was built when production-write keys were reportedly assigned to Preview. Official Vercel documentation (https://vercel.com/docs/environment-variables and https://vercel.com/docs/environment-variables/rotating-secrets) confirms environment-variable changes affect **new deployments only**, not earlier builds. Therefore the old deployment may retain the old keys. Team SSO protection is enabled, but this is not proof those authenticated legacy routes cannot write. Do not claim previous deployments were sanitized. Do **not** invalidate Production credentials, delete an old Preview, bypass SSO, or invoke any write route without separate owner authorization.

### Event and cost follow-up

Authenticated Vercel inventory reported **zero** team/project Webhooks, installed Integration Configurations, project Drains, and project Connector connections. GitHub Actions workflow inspection in the frontend and CMS main branches found no `deployment_status` or `repository_dispatch` triggers. External GitHub Apps/n8n consumers remain UNKNOWN: absence of configured Vercel webhook records and workflow listeners does not settle outside integrations.

Hobby build/deployment quota **remaining balance is UNKNOWN**; previous dashboard count `83 completed / 410 failed builds` was 30-day history, not remaining allowance. The Vercel billing charges endpoint returned `404 costs_not_found`, and the team metadata did not disclose a plan/remaining-quota counter. A rollback-candidate listing request returned `403` (not authorized); eligibility of a previous production rollback target remains unproven. Do not infer an expense or free capacity from these errors.

**Release status: NO-GO. Preview creation: still requires separate explicit owner approval.**

**NEXT STEP:** Verify or safely contain *legacy PR #18 Preview* exposure, verify any external event consumers and account-specific Hobby capacity, and establish rollback readiness with permissions available. Only then seek separate authorization for exactly ONE new clean Preview at the then-current reviewed SHA, with these future deployments lacking the two production-write keys. Do **not** repeat the completed credential-scoping operation or send the owner to Codex.

## 6. Remaining Preview / release blockers (after 2026-11-04 separation)

- **Deployment-event receivers:** GitHub frontend and CMS workflows inspected did not contain a `deployment_status` or `repository_dispatch` consumer; external GitHub Apps, n8n and third-party receivers remain unverified. Vercel project exposes a `Payload CMS Update` deploy hook targeting `main`. Do **not** invoke this hook; trace actual external consumers before claiming safe Preview.
- **Hobby quota:** owner-observed count was **83 completed / 410 failed builds in 30 days**, not an authoritative remaining 24-hour build/deployment allowance. Inspect the actual current limits and account usage before proposing an additional build; no resource upgrades or new charges.
- **Preview isolation:** the **project's future Preview configuration** now excludes both production-write secrets (PASS). Previous Preview deployments may still retain the old credentials; no new PR #19 Preview has been executed. Deployed runtime isolation and external consumers remain unverified.
- **Exact-SHA Preview acceptance:** a PR #18 deployment is not evidence for PR #19. Even after feasibility gates pass, **explicit separate owner authorization** is required to create ONE nonproduction Preview. Then match deployed source/content to the final reviewed SHA and test calculators, sharing, preflight, SEO, keyboard/mobile and data isolation.
- **Rollback:** existing older Ready deployment is not a verified eligible and compatible rollback target. Confirm actual Production deployment ID/SHA, known-good target, eligible provider action, domains and CMS/media compatibility, all without executing rollback.
- **Integration:** verify PR #17 → PR #18 → PR #19 chain and CI. Merge/release only in an owner-approved order; a Ready/CI status alone does not imply authorization.

## 7. End-of-session report contract

Use concise Arabic for reports; keep commands, code, identifiers and artifacts in English.

State: (a) exact verified GitHub SHA; (b) actual operations and files changed; (c) tests/CI run and current status; (d) provider evidence vs owner report vs unknown; (e) safety boundaries respected; (f) each remaining blocker; (g) **GO/NO-GO** and **NEXT STEP** as the final field. Record durable updates on PR #19 and update this file when the verified milestone changes. Do not claim infinite background continuation.

**Next immediate action after the 2026-11-04 checkpoint:** Do NOT repeat Vercel login or secret separation. Assess the legacy PR #18 Preview's historical credential exposure and the external event consumers, verify actual Hobby build/deployment capacity and authorized rollback readiness, and propose ONE clean PR #19 Preview only after separate owner approval.
