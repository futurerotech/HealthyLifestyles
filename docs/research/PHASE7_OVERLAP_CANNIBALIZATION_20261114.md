# Phase 7 §11.3 — Existing-page overlap audit and cannibalization screen

Date: 2026-11-14 · Source: the published CMS inventory only (authorized, read-only). **No search data was used.**
- GSC/Trends-based steps of the §11.3 pipeline (verified observations, intent clustering from real queries, prioritization) remain **gated** on authorized access.
- Search volume and rankings are not estimated (§11.2).

## Method
- Script: `scripts/content/overlap-audit.mjs`, a step in the non-blocking audit workflow. Unit tests: `scripts/seo/__tests__/overlap-audit.test.mjs`.
- Per page: an intent token set built from the title, SEO title and slug, with stop words and plurals normalized. Pairs at Jaccard ≥ 0.5 among same-kind pages or pSEO pages are flagged. A tool and the article built around it are an intended pair and are not flagged.
- Also flagged: more than one article declaring the same primary tool.
- Run **43638753080** @ `886d52b`: 60 articles, 70 tool records, 0 published pSEO pages. 8 pairs flagged, 1 shared primary tool.

## Manual verdicts

| Flag | Verdict |
|---|---|
| 60 articles: no article–article pair ≥ 0.5 | **No article cannibalization** detected from titles and slugs |
| 7 tool pairs at 0.50: calorie vs calorie-deficit and alcohol-calorie; weight-loss timeline vs weight-loss percentage; waist-to-height vs waist-to-hip; target vs max heart rate; sleep vs sleep-debt; PHQ-9 vs GAD-7 | **Distinct tasks and intents.** Not cannibalization. The threshold is deliberately sensitive. |
| Two tool records resolve to `body-fat-calculator` (alias `body-fat-percentage-calculator`); a second alias, `how-much-protein-do-i-need`, resolves to `protein-intake-calculator` (70 records vs 68 canonical tools) | Already consolidated by **permanent 301 redirects** in `vercel.json` and by the contract aliases. Optional cleanup: unpublish or retire the two legacy CMS tool records. This **requires an authorized CMS write** and is not done. |
| Shared primary tool `lean-body-mass-calculator`: `lean-body-mass-calculator-guide` and `healthy-waist-to-height-ratio` (ID 37) | The known §6.3 wrong-primary gate, confirmed independently. The correction already prepared sets ID 37's primary tool to `waist-to-height-ratio-calculator`. |

## Conclusion and next gated step
The current inventory shows no content cannibalization requiring merges or redirects beyond those that already exist.
- The next §11.3 steps (search-intent clustering from observed queries, page-level opportunity prioritization, editorial briefs) need Search Console data for `healthylifesstyles.com`. **Owner action:** grant read access to GSC (or an export).
- Phase 8 §12.1 (search-led growth) depends on the same data.
