# HealthyLifeStyles — engineering continuity record (2026-11-14)

Durable resume point for the next session. Evidence only; nothing here is a
merge, deployment, publication, legal or clinical approval.

## Frontend — PR #56 `integration/calculator-safety-20261114`

| Commit | What | CI |
|---|---|---|
| `a054092` | Integrated calculator safety work (#53–#55), screener engine fix, pregnancy dating, focus styles | 43565044508 ✅ |
| `a0aef49` | Review #6873310811: future raw dates rejected per method; strict dates and integer bounds; no sharing of PHQ-9/GAD-7/WHO-5 results; WHO-5 licence hold | 43568758128 ✅ |
| `e936b48` | Phase 2: BMI, body fat, ideal weight, calorie and BMR audit fixes | 43569328123 ❌ (Chrome debugger start timeout before any page; unit 267/267) |
| `8a6d942` | Browser QA: 60 s Chrome debugger wait plus one logged relaunch (no assertion relaxed) | 43569710818 ✅ (unit 267/267; browser QA 0 failures; no relaunch needed) |
| `b1c9614` | Phase 2 group 2: ratio thresholds, macro and keto consistency, American-English copy | 43570406469 ❌ (tsc: untyped test tuple) |
| `58f641f` | Typed test tuple | 43570774734 ✅ (unit 273/273; browser QA 0 failures) |
| `47e0d0d` | Heart group: BP gaps vs. the 2025 AHA/ACC guideline | 43575235796 ❌ (browser QA: BP page 560px wide at 390px) |
| `6a81aad` | Source lists wrap long citation tokens; overflow detector scans `<main>` | 43575635618 ✅ |
| `db53357` | Last untested calculators: alcohol units, smoking cost, anti-inflammatory score, blue light (+ weight-loss %, deficit pins) | 43576208355 ✅ (unit 284/284; browser QA 0 failures) |
| `6bc4db1` | Weight-loss timeline: no plan to a goal below BMI 18.5 or an impossible weight (goal 0 kg had a date) | 43576743663 ✅ (288/288; new browser scenario passed) |
| `ff0eee3` | Fasting medicine caution; caffeine 400 mg wording, >400 mg single-dose flag, pregnancy <200 mg | 43577338507 ✅ (unit 294/294; browser QA 0 failures) |
| `7a2b3fe` | Muscle preservation: always-visible kidney-disease caution beside the 1.6–2.4 g/kg target; weight bounds | 43577837753 ✅ (unit 297/297; browser QA 0 failures) |
| `b2d1ded` | Last six standalone tools: lifestyle age, strength program, chronotype, sleep, breathing timer, recipe analyzer | 43583898160 ✅ (306/306; new browser scenarios passed) |
| `e2fd47f` | Preflight verifies article tool embeds render a live calculator (Roadmap 6.3); embed/page engine parity guard | 43584650891 ✅ (307/307; live-content preflight `errors: []`) |
| `52f393c` | Article embeds pass the tool name (share text bug found in the editorial audit) | **43601997553 ✅** (308/308; browser QA 0 failures; live preflight `errors: []`) |

### Phase 2 findings fixed at `e936b48`
- **BMI:** category bounds were inclusive (18.5 → Underweight, 25.0 → Normal, 30.0 → Overweight). Now WHO/CDC "under Y", classified on the displayed value. Adds an adult-use note.
- **Body fat (U.S. Navy):** same boundary defect against the page's ACE table. Out-of-range results (outside 2–60%) were clamped and are now withheld.
- **Ideal weight:** Devine is not defined below 5 ft (it previously showed a flat 50/45.5 kg).
- **Calorie:** when TDEE is at or below the floor, the "lose" figure exceeded maintenance. No deficit is now offered. A clamped target shows its real weekly loss.
- **BMR:** formula verified exact. An accuracy note was added.
- **Tests:** `scripts/seo/__tests__/body-metrics-audit.test.ts`.

### Phase 2 group 2 findings fixed at `b1c9614`
- **Waist-to-height:** 0.50 was "Healthy". Bands are now <0.4 / 0.4–0.49 / 0.5–0.59 / ≥0.6, and the page copy matches.
- **Waist-to-hip:** 0.90 (men) and 0.85 (women) were "Low risk", and the copy said "above". The cited WHO 2008 report sets risk **at or above** these values. Tool and copy now match, and the invented second tiers are removed.
- **Macro:** a cut could exceed maintenance, and the cut message appeared on Maintain. At high weights the macros were larger than the calories shown and the meal-plan link carried those numbers. Fat is now reduced to fit and the totals always match.
- **Keto:** carbs are capped at the tool's own 50 g ceiling. The caution now names pregnancy and diabetes or blood-pressure medicine.
- **Copy:** British spellings converted to American English. Cited titles are kept. `american-english-copy.test.mjs` guards this.
- **Open question for clinical review:** per-kg protein and fat use total body weight even at a high BMI. A goal or adjusted weight may suit better. This is not changed without a clinical decision.

Audited with no defect found: weight-loss %, calorie deficit (3,500 kcal/lb rule labelled as an estimate, with unsafe-pace warnings), protein intake.

### Heart-health group (`47e0d0d`, `6a81aad`)
- **Reused, not repeated:** #37 (BP, AHA 2025), #39 (resting HR), #40 (Karvonen), #41 (max HR) are ancestors of #56, and their tests run in CI.
- **#38 (one-rep max) is superseded** by #53's `83eab50` and the `one-rep-max-integrity` test (comment 6874535056). Close it after #56 merges.
- **BP gaps vs. 2025 AHA/ACC (Jones et al., Hypertension 2025):**
  - zone labels now say "and"/"or" exactly (the classification itself was already right);
  - added validated upper-arm cuff advice and the cuffless/smartwatch non-recommendation;
  - categories are based on the average of 2+ readings on 2+ occasions;
  - the primary guideline is now cited.
- The new citation's 60-character token overflowed the page at 390px. Fixed site-wide: source-list items get `min-width:0; overflow-wrap:anywhere`.

### Remaining calculators (`db53357`)
All 38 calculators in `defs.ts` now have dedicated audit tests.
- **Alcohol:** the unsourced, sex-blind 35-unit tier is removed.
- **Smoking:** the off-step stepper is fixed.
- **Anti-inflammatory:** claims reworded to associations.
- **Blue light:** no penalty for an unused device or filter.

### Standalone tools (`6bc4db1`, `ff0eee3`)
- **Weight-loss timeline:** any goal was accepted, and 0 kg got a "Goal reached" date. It now takes a height field and plausible bounds (25–350 kg, 120–230 cm). Goals below BMI 18.5 are not planned; the user is offered a doctor or dietitian instead. Covered by `weight-timeline-safety.test.ts` and a browser scenario.
- **Fasting:** arithmetic verified. The safety notice now names medicine that lowers blood sugar or must be taken with food. Covered by `fasting-schedule.test.ts`.
- **Muscle preservation:** the high-protein targets (highest for ages 60+) had no kidney caution. Non-dialysis CKD is usually protein-limited (KDOQI 2020: about 0.55–0.8 g/kg). An always-visible note and a page notice were added, and the weight input now uses the site bounds. Covered by `muscle-preservation-safety.test.ts`.
- **Caffeine:** half-life maths verified. A dose over 400 mg is now flagged. "Safe limit" became the FDA's "general daily amount for healthy adults", and pregnancy is stated as under 200 mg a day (ACOG). Covered by `caffeine-plan.test.ts`.

### Last six standalone tools (`b2d1ded`)
- **Lifestyle age:** the pulse scoring now matches the RHR checker. Below 40 bpm is not rewarded; above 100 bpm prompts a medical review.
- **Strength:** below-bar weights are flagged, and warm-ups are always lighter than the working sets.
- **Chronotype:** the framework is attributed to Breus and described as not validated (MEQ/MCTQ are used in research). The unsourced population shares are removed, and the Dolphin profile points to insomnia care.
- **Sleep debt:** blank or out-of-range nights are reported. The contradictory tips are fixed, and cycle variability is stated.
- **Breathing:** pause now resumes; only phase changes are announced; the heading is correct; a breath-hold caution was added.
- **Recipe:** no silent 5,000-character truncation; the visitor address is forwarded, so the CMS limit is per visitor.
- **Security review item (CMS not changed):** the CMS rate limiter trusts a client-supplied `X-Forwarded-For` on direct calls to `/api/analyze-recipe`. That endpoint calls a paid AI parser, so the limit can be bypassed (cost risk). Fixing it needs a trusted-proxy or shared-secret design and belongs to the independent security review.

### Phase 2 acceptance (§6.1 inventory, §6.3 article-to-tool) — from live content
- CI run 43584650891 built against the production CMS (read-only).
- **Tools:** 70 routes, of which 68 are rendered pages. The other 2 are intentional permanent aliases: `body-fat-percentage-calculator` → `body-fat-calculator` and `how-much-protein-do-i-need` → `protein-intake-calculator`.
- **Articles:** 60 published. Three legacy `/articles/` URLs redirect permanently to rendered canonical pages.
  - *Correction:* commit `e2fd47f`'s message says "30 Wellness Hub articles". The preflight count is 60; history was not rewritten.
- **Release preflight:** `errors: []`. It now also requires every article `toolEmbed` to render its canonical tool with a live calculator island, and that check passed on all live articles.
- **Embed parity:** article embeds render the same engines as tool pages, guarded by a test.
- **Phase 2 engineering is complete.** Clinical sign-off, owner merge and real staging remain external gates.

### Phase 3 started
- `docs/editorial/PHASE3_RISK_CLASSIFICATION_20261114.md` classifies all 60 published articles (12 high / 33 moderate / 15 lower) and names the §7.2 ten-article audit sample.
- **Blocker:** article bodies exist only in the CMS, and this session's shell cannot reach the CMS host. Fetching the public article pages needs owner approval, which was requested and went unanswered.

### Phase 3 §7.2 — initial ten-article audit (`docs/editorial/PHASE3_AUDIT_10_ARTICLES_20261114.md`)
- **Access:** public published pages, read-only, under the owner's authorization of 2026-11-14. No CMS records, drafts or credentials were touched.
- **High (4):**
  - Blood-pressure article: 2017-era "hypertensive crisis/urgency" wording; "/" in place of "or"; 46% prevalence (CDC now 47.7%); no validated-cuff or cuffless guidance; follow-up only at 140/90.
  - Pregnancy week-by-week: omits CDC's "thoughts of harming yourself or your baby" urgent sign.
  - Due date: omits ACOG CO 700's rule that IVF dates are not ultrasound-re-dated, and the re-dating thresholds; thin; unrelated related-guides.
  - Intermittent fasting: no medication warning (article and tool now disagree); comparison table not rendering.
- **Low (4):** optional ADA screening note (diabetes); missing source entry (ovulation); taxonomy tags (resting HR, Karvonen).
- **No defect (2):** heart-disease risk; pregnancy weight gain. Every worked example in the ten articles was recomputed.
- **Attribution:** all ten are bylined "Editorial Team" with no reviewer claimed, which complies with §7.3.
- **Offline draft corrections are in the report; nothing was written to the CMS.**
- **Moderate-risk audit, all 33 articles** (`docs/editorial/PHASE3_AUDIT_MODERATE_ARTICLES_20261114.md`): 4 high (waist-to-height embeds the wrong tool; waist-to-hip uses the WHO cutoffs as 'above'; VO2 max fitness age; three numerical errors in alcohol units), 13 moderate, 10 low, 6 none. Release coupling X3: seven article drafts must ship with #56.
- **Addendum, the remaining high-risk pair:** maximum heart rate is low (taxonomy tag only; all numbers verified); caffeine is low (FDA wording; add an ACOG pregnancy source; energy-drink can size; large-dose warning; missing source entry). All 12 high-risk articles are now audited.

### Tooling note
`/home/claude/tools/tsdiag.cjs` is syntax-only and missed the `b1c9614` type error. `tscheck.cjs` (semantic; drops unresolved-module noise) reproduces it and is now used before pushing.

## CMS
- **PR #64** `codex/indexnow-draft-safety-20261114` @ `906070a`: CI 43559981416 ✅ (31/31).
- **PR #65** `codex/hostinger-runtime-evidence-20261114` @ `50a9358`: CI 43561621197 ✅ (31/31).
- The offline SEO title corrections are in `docs/content/CMS_SEO_CORRECTIONS_20261114.md`. No live record was changed.

## External gates (pending; not claimed)
0. Phase 1 infrastructure verification remains pending until real Hostinger/Neon/R2 evidence exists. WHO-5 remains suspended pending licensing clearance.
1. Owner merge authorization: frontend #56; CMS #65 → #64 → #34 → main.
2. WHO-5 reuse decision (WHO CC BY-NC-SA 3.0 IGO vs. an ad-supported site) or written WHO permission. The hold stays until then.
3. Independent clinical review: screeners, pregnancy and cycle tools, body-metric categories and wording.
4. Independent security review. The expired audit baseline is untouched.
5. Real Hostinger staging access and R2 token scope. Phase 1 staging runtime is unverified.
6. Owner authorization for draft CMS SEO updates.

GO/NO-GO: **NO-GO for release** until gates 1–4 are closed.

## Next main-roadmap milestone
Phase 3 continuation: §7.2 audit of the 15 lower-risk articles, then the remaining Phase 3 requirements (§7.3 American-English pass over CMS copy, §7.4 reference link validity, §7.5 content-quality items such as the thin 2–3-minute articles).
