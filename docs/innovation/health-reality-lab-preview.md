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

## Portable plan and print view
- The seven-day overview explicitly marks unscheduled days as open/rest days.
- Copy uses the browser Clipboard API. If permissions deny access, the interface explains the alternative rather than claiming success.
- Save as text creates a Blob URL in browser memory; it does not upload a file.
- Print uses the browser print dialog; print CSS removes inputs and action controls.
- Rebuilding the plan updates all three actions to use the latest selection.
- The downloaded text is a user-controlled local artifact. Do not enter private clinical details in this unlisted preview.

## Weekday availability
The user can uncheck days they cannot commit to. The planner schedules only among the remaining valid days; it refuses a request for more sessions than available days. The default preserves seven available days and distributes sessions across the week. This is an optional preference in the deterministic engine and is never transmitted.
