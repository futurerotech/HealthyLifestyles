# Phase 5 §9.2 research gate — Candidate 1: Smart Meal Plan & Grocery Budget Studio

Date: 2026-11-14 · Status: **research complete for steps 1–9 and 11; step 10 gated (no authorized search data); step 12 pending owner authorization.** No implementation has started.

## 1. Inventory of overlapping existing tools (step 1)

`/tools/meal-plan-generator` already exists, so this candidate is an **extension, not a new tool**.

| Module | What it already does |
|---|---|
| `src/islands/MealPlanGenerator.tsx` | Calorie and macro targets (pre-filled from the Macro/Calorie calculators via URL); diet styles (omnivore, vegetarian, vegan, keto, Mediterranean, halal); 3–5 meals a day; allergen and free-text exclusions; 7-day plan; per-meal swap; servings; regenerate; grocery list; optional AI path only when an endpoint is configured |
| `src/lib/mealplan.ts` | Deterministic seeded fitting to ±5% macros; 1,200 kcal safety floor; `groceryList()` |
| `src/data/recipes.ts` | 67 curated recipes with per-serving macros, meal slots, diet and allergen tags, and ingredient **names** |

Related tools: Recipe Nutrition Analyzer, Macro, Calorie and Protein calculators.

**Gaps relative to the candidate:**
- no ingredient quantities or units;
- no cost data or budget target;
- no household size;
- no substitution logic beyond swapping a whole meal;
- plans are not saved.

## 2. User problem (step 2)

People who already have calorie or macro targets want a week of meals **they can afford**, and a shopping list with quantities. The current list names ingredients but not how much to buy or roughly what it costs.

## 3. Competitors (step 3)

- **Eat This Much:** the free tier is limited to day-level planning. Automated grocery lists and the weekly planner are Premium (about $5–9 a month). A budget control exists in the paid product.
- **USDA Shop Simple with MyPlate:** free, with local savings and stores that accept SNAP EBT by ZIP code, plus tips and recipes for common foods. It is not a macro-targeted weekly planner.
- **Others** (Mealime, Samsung Food, Plan to Eat): recipe- or dinner-centric; macro-targeted planning is limited or paid.

## 4. Differentiation (step 4)

A free, account-free, macro-targeted weekly plan with **quantities, an estimated cost with its source and date, a household multiplier and a budget target**, in one transparent tool. Two parts already exist for free here (the weekly plan and the grocery list).

## 5. Data sources and licenses (step 5)

| Source | Use | License / cost |
|---|---|---|
| BLS CPI Average Price Data (about 70–100 U.S. food items, monthly, U.S. city average and 4 regions) | Unit prices for common ingredients | U.S. government work, public domain. The public API needs no key. **Plan: a bundled static snapshot, refreshed by a reviewed script; no runtime API calls.** |
| USDA FNS Food Plans: Cost of Food monthly reports (Thrifty, Low-Cost, Moderate, Liberal) | Benchmark: "your plan vs USDA thrifty and moderate weekly cost for your household" | U.S. government publication, free |
| USDA FoodData Central (already cited by the site) | Portion and gram conversions where needed | Public domain |

**Limitation to disclose:** average prices vary by region and store, so estimates are U.S. averages. Research found Thrifty Food Plan costs vary substantially across regions and cities.

## 6. Recurring costs (step 6)

**$0.** Static data bundled at build time. No paid APIs, accounts or databases. A refresh is a manual, reviewed data update.

## 7. Privacy and security (step 7)

- Browser-only computation; no account; nothing sent to the server.
- Optional saved plan in `localStorage` (wrapped in try/catch), never in the CMS or analytics. Inputs could reveal diet or health context.
- The existing optional AI path stays off unless configured, and must not receive household or budget data without a separate review.

## 8. Medical and claim risks (step 8)

- Keep the existing 1,200 kcal floor and the ±5% macro framing.
- Present costs as **estimates** with source and month, never as a price guarantee.
- No claim of "nutritionally complete" or "SNAP-adequate" plans. USDA food plans are cited only as a cost benchmark.
- Pregnancy, chronic kidney disease, diabetes, allergies and eating-disorder history: keep and extend the "work with a dietitian or clinician" guidance (aligned with the Phase 3 §7.7 draft for article 9).

## 9. Accessibility and mobile (step 9)

- The tool is already covered by the site-wide QA (390 px and desktop, contrast, focus, target size) in dev and in the production build.
- New controls must reuse existing field components (`--field-border`, global focus outline).
- The budget comparison must be readable as text, not color-only.

## 10. Search demand (step 10): **gated**

There is no authorized GSC or GA4 access in this session. No demand figures are claimed. The owner should provide GSC queries for `/tools/meal-plan-generator` and related pages before the scope is final.

## 11. Focused recommendation (step 11)

Extend the existing generator. **No new tool, no new route, no new dependency.**

1. Add quantities and units to the 67 recipes' ingredients, so grocery-list items are summed with units.
2. Add a price table (BLS public-domain snapshot, dated) mapping each ingredient to a unit price. Show the plan's estimated weekly cost and cost per day.
3. Add a household-size multiplier, plus a comparison with the USDA Thrifty and Moderate weekly cost for that household.
4. Add an optional budget target: when the plan exceeds it, suggest cheaper same-slot swaps from the existing tagged pool while keeping the macro tolerance.

**Acceptance:**
- unit tests for quantity summing, the cost model and budget swaps (deterministic seeds);
- the price snapshot carries a source and a date;
- site QA green;
- Lighthouse budget unchanged (the island stays `client:visible`).

**Phase 3 dependency:** the article `how-to-build-a-meal-plan` corrections (§7.4 G1/G2, §7.7) should ship with or before this.

## 12. Owner authorization (step 12): **pending**

Decision requested: approve the scope in §11 (or a subset) for implementation on a branch. Nothing will be merged or deployed without separate release authorization.

## 13. Implementation status (2026-11-15, owner-authorized non-production scope)

The feature is visible only when `PUBLIC_HLS_LAB=1`. It is not demand-validated, and the production lab-flag guard is unchanged.

**Price sources.** Both are public domain. They are never blended into a single "current" price.

| Source | What it is | Use |
|---|---|---|
| BLS CPI Average Price Data, U.S. city average | Monthly survey price, Oct 2026 | Preferred source. Two series were added: current "Butter, stick" (the grade AA series ended in 2012) and "Yogurt, per 8 oz". |
| USDA ERS Fruit and Vegetable Prices (Circana scanner data, CC0) | Annual national average. The CSV carries no year; ERS lists 2023 as its latest scanner year and has archived the 2022 tables, so the year is inferred and flagged as such. | Only for 20 foods with no current BLS series, and only on an exact food-and-form match. Not inflation-adjusted, because ERS says this data should not be used for price changes over time. The UI labels these prices "(2023 price)" and says they are likely low. |

**Preparation yields.**
- Portions are edible weights. Purchased weight = edible weight ÷ ERS preparation yield. This covers peel, trimming, and drained liquid in canned beans.
- The yield applies to BLS produce prices too, because those are also per purchased pound. The banana price, for example, rose by 1/0.64. Before this change, peeled and trimmed produce was under-costed.
- Lentil portions are dry weight, so their yield is 1.

**Deliberately unpriced:**
- bell peppers (color unknown, and the green and red prices differ);
- "berries" and "mixed vegetables" (the mix is unknown);
- corn and sweetcorn (form unknown);
- Greek yogurt (a different product from BLS "Yogurt");
- olive oil, nuts, fish, grains other than rice and pasta, and spices (no current public-domain retail series).

**Measured result** (tests in `grocery-cost.test.ts`):
- Comparable recipes (at least 60% of ingredients priced; threshold unchanged): 2 → **14 of 67**. With BLS only, the count is 4.
- In a generated omnivore 2,000 kcal week, 23% of grocery lines are priced, for $12.22 per week of priced items, of which $2.45 uses ERS prices.
- The estimate is therefore **incomplete**. The UI says "Incomplete estimate" and treats the figure as a lower bound.

**Tests:**
- unit conversion with yield;
- source precedence (BLS wins);
- household scaling;
- missing prices;
- vegan, allergen and exclusion pools (swaps never leave the pool);
- a synthetic fully priced swap, including the calorie-tolerance rejection;
- a coverage regression floor.

**Still open:**
- the USDA food-plan benchmark;
- demand validation (Search Console unavailable);
- owner decision on public release.

## Sources
- USDA ERS, Fruit and Vegetable Prices (data and documentation): https://www.ers.usda.gov/data-products/fruit-and-vegetable-prices/

- BLS Average Price Data (CPI): https://download.bls.gov/pub/time.series/ap/
- BLS Public Data API: https://www.bls.gov/developers/home.htm
- USDA FNS, USDA Food Plans: Cost of Food monthly reports: https://www.fns.usda.gov/cnpp/usda-food-plans-cost-food-monthly-reports
- USDA Shop Simple with MyPlate: https://www.myplate.gov/app/shopsimple
- Eat This Much (App Store listing): https://apps.apple.com/us/app/eat-this-much-meal-planner/id981637806
- Thrifty Food Plan regional variation (JNEB, via EurekAlert, June 2026): https://www.eurekalert.org/news-releases/1131313
