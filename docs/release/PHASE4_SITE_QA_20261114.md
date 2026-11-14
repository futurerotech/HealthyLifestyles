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

---

# Phase 4 §8.2 follow-up — meal-plan LCP failure (review comment 6881556185)

**Failure:** run 43619235469 at docs-only head `ba7117f` failed the blocking Lighthouse budget on `/tools/meal-plan-generator`. LCP samples were 2271, 2268 and 1973 ms (median 2268) against ≤2000 ms. The budget was **not** changed.

**Evidence method:** a reporting-only step (`scripts/seo/lhci-summary.mjs`, runs after the blocking step) prints every sample per URL.

| Run | SHA | Meal-plan LCP (ms) | Meal-plan FCP (ms) | JS during load | Other 7 templates LCP |
|---|---|---|---|---|---|
| 43627861871 | 3326b91 | 1965 / 1968 / 2268 | 1361–1440 | **19 KB** | 1807–1969 |
| 43629211011 | 008e0f7 (engine CSS inlined) | 2114 / 2262 / 2262 ❌ | 1366–1439 | **19 KB** | 1810–1974 |
| **43630591566** | **f51c070** (client:visible) | **1959 / 1963 / 1964 ✅** | **1209–1214** | **0 KB** | 1811–1974 |

**Verdict:** a **reproducible bottleneck**, not only CI variance.
- Lighthouse's simulated throttling produces discrete steps. The ~2260 ms samples are one extra network round trip, not random noise.
- The meal plan was the only template that downloaded JavaScript before LCP: its engine mounted with `client:load` while the calculator sat below the fold on a phone viewport.
- A first hypothesis (a render-blocking per-engine stylesheet, inlined in `008e0f7`) was **disproved** by the next run. The inlining is kept as standard practice, but it was not the cause.

**Fix:** the 14 engines in `ToolPageLayout.astro` that used `client:load` now use `client:visible`, as the numeric calculators already did. Hydration of all 68 tool pages is verified by the site-wide browser QA in dev and in the production build.

**Remaining observation:** most templates measure ~1960 ms in lab conditions, a narrow but stable margin under the 2000 ms budget. Further gains (fonts, hero rendering) should be prioritized with field data (GA4/GSC/CrUX), which is still gated.

**Also found and fixed while triaging:** `src/consts.ts` read `process.env` at module load. It is bundled into the meal-plan and AI-assistant islands, so hydration threw `ReferenceError: process is not defined` in dev. Regression test: `client-safe-modules.test.mjs`.

---

# Phase 4 §8.1 — WCAG 2.2 AA contrast verification

**Method:** `scripts/seo/__tests__/contrast-audit.mjs`, executed inside the site-wide QA on 68 tools and 13 templates at 390 px and desktop, against the dev server and the production build.

| Check | Criterion | Threshold |
|---|---|---|
| Text, including placeholders | SC 1.4.3 | 4.5:1, or 3:1 for large text (≥24 px, or ≥18.66 px bold) |
| Form-field boundaries | SC 1.4.11 | 3:1 for the border, the fill, or the bordered wrapper |
| Focus indicators | SC 1.4.11 / 2.4.7 | 3:1 for what focus changes, on the control or its `:focus-within` wrapper |
| Hover-state text of buttons and links | SC 1.4.3 | as for text |

How measurements are taken:
- Focus is reached with real Tab presses. Focus and hover are measured with transitions paused, so settled styles are rated, not mid-transition frames.
- Colors are resolved as rendered through a canvas, so `color-mix` and other modern syntaxes are measured correctly. Translucent layers and opacity are composited.

What is not failed automatically:
- **Exempt:** disabled or inactive controls, hidden text, logos.
- **Indeterminate, reported for manual review:** text over a background image or gradient, or in a positioned layer over a painted sibling.

Before CI, the audit was checked against a local fixture with known ratios: 4.48 vs 4.54, translucency, opacity, placeholder, wrapper, and weak vs strong focus.

**Result:** first run 2,137 failures → **0** (run 43630591566: dev 21,928 text/field checks, 2,256 focus stops, 373 hover states; production build 22,819 / 2,259 / 361).

**Defects fixed:** all fixes reuse brand tokens or darker mixes of the same hues; no design-system replacement.

| Defect | Before | After |
|---|---|---|
| White text on green fills (24 buttons, skip link, toggles, result actions, diary, HRV) | #16a34a, 3.30:1 | `--green-700` #15803d, 5.02:1 |
| Focus indicator | 35% green ring only, 1.35:1 on white, 2.02:1 on dark; some controls had none (`outline: none` in about 19 component rules) | global 2px `--focus-outline` (green-700; accent on dark surfaces), which components may recolor but not remove; bordered field wrappers show it via `:focus-within` |
| Form-field boundaries | `--border` #e2e8f0, 1.2:1 | `--field-border` #64748b (4.8:1), re-scoped on controls and wrappers only |
| Category pills, badges, labels, zone tags, toggles in category colors | 1.9–4.47:1 | 55% darker mix of the same hue, ≥4.5:1 on tint and on white |
| Footer secondary text | 3.8:1 | #94a3b8, 7.1:1 |
| Eyebrow on mint | 3.15:1 | green-700, 4.8:1 |
| Footer newsletter field | 1.56:1 | 3.3:1 |
| Caffeine and timeline result heroes | `.card` could override the dark hero by stylesheet order (light text on white, 1.2–2.0:1) | compound selectors |
| Box-breathing label over a light gradient (large text) | ~1.6–2.8:1 | same sky hue, darker gradient |
| Strength builder: label of a lift toggled off, dimmed | 3.94:1 | only the inactive field dims |
| Caffeine dose, slate-400 note, sleep tag | 2.56–4.47:1 | indigo-700 / `--muted` |

**Manual-review list:** 93 indeterminate pairs (hero images, gradients, positioned layers). The breathing label was reviewed and fixed. The rest stay listed in CI logs (`[SITE_QA_MANUAL]`) for the independent accessibility review.

**Gates:** this is automated AI-run QA. Testing with real assistive technology and an independent accessibility review remain human gates. The unreachable `[data-theme='dark']` CSS (nothing sets the attribute) was not tested.
