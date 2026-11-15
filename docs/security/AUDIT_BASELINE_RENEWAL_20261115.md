# npm audit baseline renewal — Issue #52 (2026-11-15)

Status: engineering re-review complete. **Human security sign-off: BLOCKED_HUMAN_REVIEW.**
This PR is a draft. It is not merged and nothing is deployed.

## Why the gate failed

`scripts/ci/audit-delta.ts` fails closed when `audit-baseline.json` passes its `reviewBy` date.
The previous baseline (created 2026-07-10, reviewBy 2026-10-08) expired. Every PR against
`main` therefore failed at "Audit delta", including guard PR #57. The gate was **not** bypassed,
skipped or silently extended.

## Real inventory (CI evidence, not local)

Source: `Guard evidence (not for merge)`, run 43683417978 (branch `codex/guard-evidence-20261115`,
lockfile identical to `main` 57f72ee), `npm audit --json`.

npm totals before: low 1, moderate 1, high 0, critical 0. There were 3 distinct advisories:

| Advisory | Severity | Package | Affected | Applicability to this site |
|---|---|---|---|---|
| GHSA-474x-hrwr-fgx4 (1246029) | low | fast-xml-parser ≤5.11.2 | build-time transitive dependency | CPU use on attacker-supplied XML. The site does not parse untrusted XML at runtime. |
| GHSA-mh32-jxcr-mh9f (1246685) | low | astro ≤7.4.4 | dynamic tag names built from user input | Static output; no user-controlled tag names. |
| GHSA-r3h5-4585-7x3w (1246686) | moderate | astro 5.14.3–7.4.6 | `@astrojs/node` image endpoint | The site uses `@astrojs/vercel`, not `@astrojs/node`. |

The site was not exposed in practice, but each advisory has a non-major fix, so we fix it
rather than accept it.

All 9 advisories in the old baseline are **resolved** in the current tree: path-to-regexp,
@astrojs/vercel, astro ×5, esbuild and @opentelemetry/core.

## Fix

The fix is a targeted `npm update astro @astrojs/vercel fast-xml-parser --package-lock-only`,
generated in CI (run 43683884066) and applied here as a reviewed patch.
`package.json` is unchanged: every resolution stays inside the declared semver ranges.

- astro 7.4.0 → 7.4.12
- @astrojs/vercel 11.0.15 → 11.0.22
- fast-xml-parser 5.11.2 → 5.12.1

The lockfile also moves their transitive dependencies (`git diff --stat`: 505+/331−).

After the fix, `npm audit` reports 0 advisories at every severity (same run). In that run, the
production-data build exactly as Vercel runs it (`npm run build`, with the content lock)
completed with `contentComplete: true`.

## Renewed baseline

`audit-baseline.json` has the format that `--write-baseline` produces: createdAt 2026-11-15,
reviewBy 2027-02-13 (the script's 90-day window), totals 0, advisories `[]`. An empty baseline
is the strictest possible setting: **any** new high or critical advisory fails the gate.

## What remains for humans

- Security sign-off on this renewal: BLOCKED_HUMAN_REVIEW. AI review is not a human security
  certification.
- Merge authorization: BLOCKED_OWNER_AUTHORIZATION.
- Full browser QA of the astro minor update runs in this PR's own CI. Its result is recorded
  in the PR comment for the exact head SHA.
