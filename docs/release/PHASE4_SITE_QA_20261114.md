# Phase 4 §8.3 — Site-wide responsive and accessibility QA

Date: 2026-11-14 · Branch `integration/calculator-safety-20261114` (PR #56)

## What now runs in CI (blocking)

`scripts/seo/__tests__/site-qa-browser.test.mjs` runs twice per CI run, with the shared harness `browser-harness.mjs`:

1. **Dev server** (offline, CMS disabled) — in `npm run test:browser`.
2. **Production build** (`dist/client` after `npm run build` with the complete published CMS content) — the new step "Production-build browser QA". In this mode a hydration retry counts as a failure.

Coverage: all **68 supported tool pages** plus **13 templates** (home, /tools, /wellness-hub, two category hubs, about, methodology, contact, health score, sitemap, three articles), each at **390×844 and 1440×900** = 162 page views per mode.

For every page and viewport the suite checks:
- no horizontal overflow;
- accessible names for all controls in `<main>`;
- WCAG 2.2 SC 2.5.8 target size (24×24 CSS px, with the inline-text and spacing exceptions);
- `alt` on images;
- exactly one `h1` and no skipped heading level;
- calculator hydration;
- no uncaught exceptions.

The 28 calculators in `calculator-browser-qa.test.mjs` keep their deeper interaction and keyboard-focus checks.

## Defects found and fixed

| Defect | Fix |
|---|---|
| Strength program builder: 4 unlabeled 1RM inputs | `aria-label` "Bench press 1-rep max (kg)" etc. |
| HRV explainer/log: h1→h3 | Section headings are h2 |
| Category hubs (/nutrition, /sleep, …): h1→h3 | Visually hidden h2 before the tool grid |
| /wellness-hub at 390px: 11px horizontal overflow | Search field `min-width: 0`; button does not shrink |
| /tools "View category": 23px target | `min-height: 24px` |
| Article table of contents: 18px targets | 24px hit area |
| /sitemap list links: 17px targets | 24px hit area |
| Breadcrumb links: 22px when the trail wraps at 390px | 24px hit area |

Test-harness defects found along the way: `scrollIntoView()` on `astro-island` (`display: contents`) is a no-op, and a hidden `client:visible` island never loads. Both were fixed in the test, not the product.

## Evidence

| Run | SHA | Result |
|---|---|---|
| 43610246120 | 4e24dfa | first run: 19 failures (156 page views) |
| 43611335262 | 16f5b55 | 7 |
| 43612102073 | 1f98b44 | 6 (overflow fixed) |
| 43615606004 | 34e0084 | 1 (breadcrumb) |
| **43616480371** | **025e00f** | **✅ dev 162/0, production build 162/0; unit 314/314; content 17/17; preflight; Lighthouse** |

Note: in dev mode only, the meal plan (`client:load`) hydrates after one reload because of on-demand compilation. In the production build it hydrates on first load.

## Not done here (needs data or authorization)

- §8.2 performance prioritization by real traffic needs authorized GA4/GSC/CrUX field data (not available in this session). Lab evidence continues via the blocking Lighthouse budget.
- Screen-reader testing with real assistive technology and independent accessibility review remain human gates.
