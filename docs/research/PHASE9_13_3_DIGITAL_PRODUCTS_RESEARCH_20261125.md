# Phase 9 §13.3 — Low-risk educational digital products: research (2026-11-25)

Status: **research only.** No product, payment flow or download has been built.
- No revenue, conversion or demand figure is used: GA4, GSC and AdSense data are not available, and §13.4 requires observed performance first.
- Implementation needs an owner decision.

## 1. What already exists (reuse first)

| Capability | Where | Relevance |
|---|---|---|
| "Save as PDF" on tool pages, with a print stylesheet and print-only header and footer | `src/components/PrintButton.astro`, `src/styles/global.css` (@media print) | Every calculator result can already become a privacy-first printable report, generated in the browser. |
| Printable private logs | `src/islands/FoodSymptomDiary.tsx`, `src/islands/HRVLog.tsx` (window.print; local storage only) | Tracking templates already exist as interactive tools. |
| Downloadable result image | `src/components/ShareResult.tsx` → `/api/result-image` | Shareable summaries. |
| Newsletter with consent, unsubscribe and suppression | Frontend #67 and CMS #80 | The only compliant delivery channel for a free "lead magnet" guide. |

So the §13.3 examples are already about 70% covered for free:
- privacy-first downloadable reports: **yes**;
- tracking templates: **yes, for diet/symptom and HRV**;
- printable planners: **partial**;
- interactive planning worksheets: **partial**.

## 2. Options assessed

| Option | User value | Medical-claim risk | Cost / infrastructure | Privacy | Verdict |
|---|---|---|---|---|---|
| A. Free printable weekly planner pages from existing tools (meal plan + grocery list, strength week, sleep log) | High; reuses tool outputs | Low if outputs keep the tools' disclaimers | $0; print stylesheet only | Browser-only | **Recommended first.** It extends the existing print path. Bundle with C1/C3/C4 if those are approved. |
| B. Free downloadable guide as a newsletter opt-in (one existing, evidence-checked article, for example a calorie and protein basics guide) | Medium | Low; content must pass the same §7 standards and use existing citations | $0; static PDF from existing content | Consent via existing flow; no new data | Viable after the Phase 3 citation fixes (proposals F) for that article. |
| C. Paid templates or planners | Unknown without traffic data | Low | **Requires a payment processor, tax handling and terms. These are paid services and new legal arrangements that §14.1 forbids without authorization.** | Payment data out of scope | **Not now.** Revisit only with observed traffic and owner approval (§13.4). |
| D. Personalized "health reports" sold or emailed | — | High; drifts toward diagnosis (§13.3 prohibits diagnostic services) | Server storage of health data | High | **Rejected.** |

## 3. Constraints carried into any build
- Keep the "educational, not medical advice" footer on every printed page.
- Never print reviewer or credential claims that are not genuinely assigned (§7.3).
- Units and dates must match the on-screen result; print uses the same computed values.
- No tracking pixels or analytics inside downloadable files.
- Any revenue projection must be labeled as an estimate (§13.4).

## 4. Recommendation
Approve **Option A** together with whichever Phase 5 extension is chosen. Each approved tool gets a print-ready weekly page through the existing PrintButton path: no new dependencies, $0.
**Option B** follows once the chosen article's citations are corrected. **C and D** are not recommended.
