# Health Reality Lab — unlisted, local-only implementation

This is a **working, limited planning feature**, not a medical calculator and not a production release. It was added to the non-production `dev` review flow at `/embed/health-reality-lab-preview` only. It has no catalog listing, CMS content record, API, persistence, signup, subscription or tracking code.

## Scope
- Build short seven-day menus from a practical time limit, number of available days, energy, seated-activity preference, shift schedule, goal and spending preference.
- All activities are optional, low-pressure and require no purchase; no clinical effectiveness claims or market prices.
- Timing is relative to waking/breaks/main sleep to avoid assuming night-shift workers sleep at night.
- Pure deterministic JavaScript planner in `src/lib/health-reality-lab.mjs`; no secrets or remote input/output.
- Node tests: `node --test tests/health-reality-lab.test.mjs`.
- The route is covered by the existing `/embed/` sitemap exclusion, has `noindex,nofollow,noarchive` and is not linked from the public navigation.

## Release gate
Keep PR in Draft; the URL is **unlisted, not access-controlled**, so no real private health information should be entered. Do not deploy it to production, merge it into a published branch or claim that user interviews, clinical review or live accessibility audit have happened. Real user research, privacy/accessibility validation, a clinically qualified review of all suggested actions and owner approval are still required before a public release. This feature is additive; 68 existing frontend tool routes and their CMS relationships remain unchanged.
