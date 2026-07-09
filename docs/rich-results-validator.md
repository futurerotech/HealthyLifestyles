# Rich Results Validator — Architecture & Activation Plan (Phase 10 · P3)

## Where we are

CI runs `scripts/seo/rich-results-check.ts` after every build (`promote.yml`, step
"Rich Results check (non-blocking)"). The script samples built pages, extracts
their JSON-LD, and POSTs it to an external validator. It is engineered so it can
**never strand the pipeline**:

- the script **always exits 0** — external problems become warnings;
- the CI step additionally has `continue-on-error: true` (double safety);
- an unreachable, rate-limited, or unrecognisable validator is reported as
  **"skipped/unavailable"**, never as a false pass.

Today no real validator is wired, so the step reports *skipped* on every run.
The hard structured-data gate remains `scripts/seo/validate-jsonld.ts`
(structural + YMYL-field validation — blocking, and unaffected by any of this).

## The contract the checker speaks

`rich-results-check.ts` POSTs and interprets responses defensively:

```
POST $RICH_RESULTS_VALIDATOR_URL
Content-Type: application/json

{ "url": "/wellness-hub/how-to-calculate-your-macros",
  "jsonld": ["<raw JSON-LD block>", "..."] }
```

Expected response: HTTP 200 with a JSON body containing error/warning-ish keys.
The checker counts numbers and array lengths under keys matching `/error/i` and
`/warning/i`, so the simplest valid implementation is:

```
200 OK
{ "errors": 0, "warnings": 2 }
```

(Richer shapes like `{"errors": [...], "warnings": [...]}` also work.)
Non-200, timeout, or a non-JSON body → treated as *unavailable* (non-blocking).

Tunables (env): `RICH_RESULTS_VALIDATOR_URL`, `RICH_RESULTS_SAMPLE`
(comma-separated paths), `RICH_RESULTS_TIMEOUT_MS` (default 15000),
`RICH_RESULTS_RETRIES` (default 2, with backoff; retries on 429).

## Options considered

| Option | Verdict |
|---|---|
| **Self-hosted proxy wrapping [schemarama](https://github.com/google/schemarama)** (Google's open-source structured-data validator; ships Google Rich Results validation profiles as ShEx/SHACL shapes) | **Recommended.** Legitimate, offline-capable, no quota, validates against the same profiles Google publishes. Small Node service; deploy anywhere (Hostinger alongside the CMS, a Vercel function, or a container). |
| Google Rich Results Test private endpoints | **Rejected.** Not a public API; brittle and against ToS to scrape. |
| Commercial APIs (e.g. schema validation SaaS) | Viable fallback; adds spend + a key to manage. Revisit only if schemarama profiles prove insufficient. |

## Activation plan

1. Implement the proxy: flesh out `scripts/seo/validators/schemarama-proxy.mjs`
   (stub committed — see below) by wiring `schemarama`'s validator with the
   Google Rich Results shapes; map its report to `{ errors, warnings, details }`.
2. Deploy it (any always-on host; it's stateless) and note its URL.
3. Set `RICH_RESULTS_VALIDATOR_URL=https://<host>/validate` as a **GitHub Actions
   repository variable** on the frontend repo (Settings → Secrets and variables →
   Actions → Variables), and expose it in the `promote.yml` step's `env:`.
4. Nothing else changes: the step stays `continue-on-error: true` and the script
   still exits 0 — live eligibility results appear in the CI log as information.
5. Optional later hardening: once the validator has run green for a while, add a
   `RICH_RESULTS_STRICT=1` mode that exits 1 on `errors > 0` — a deliberate,
   separate decision; do not enable it together with step 3.

## The stub (honest by design)

`scripts/seo/validators/schemarama-proxy.mjs` boots an HTTP server whose
`POST /validate` returns **501 Not Implemented** until real validation is wired.
This is deliberate: if someone points `RICH_RESULTS_VALIDATOR_URL` at the stub
prematurely, the checker reports *"validator unavailable (HTTP 501)"* — a skip,
never a fake `0 errors` pass. `GET /healthz` returns 200 for deploy probes.
