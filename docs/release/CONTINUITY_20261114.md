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
| `7a2b3fe` | Muscle preservation: always-visible kidney-disease caution beside the 1.6–2.4 g/kg target; weight bounds | **43577837753 ✅** (unit 297/297; browser QA 0 failures) |

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

### Tooling note
`/home/claude/tools/tsdiag.cjs` is syntax-only and missed the `b1c9614` type error. `tscheck.cjs` (semantic; drops unresolved-module noise) reproduces it and is now used before pushing.

## CMS
- **PR #64** `codex/indexnow-draft-safety-20261114` @ `906070a`: CI 43559981416 ✅ (31/31).
- **PR #65** `codex/hostinger-runtime-evidence-20261114` @ `50a9358`: CI 43561621197 ✅ (31/31).
- The offline SEO title corrections are in `docs/content/CMS_SEO_CORRECTIONS_20261114.md`. No live record was changed.

## External gates (pending; not claimed)
1. Owner merge authorization: frontend #56; CMS #65 → #64 → #34 → main.
2. WHO-5 reuse decision (WHO CC BY-NC-SA 3.0 IGO vs. an ad-supported site) or written WHO permission. The hold stays until then.
3. Independent clinical review: screeners, pregnancy and cycle tools, body-metric categories and wording.
4. Independent security review. The expired audit baseline is untouched.
5. Real Hostinger staging access and R2 token scope. Phase 1 staging runtime is unverified.
6. Owner authorization for draft CMS SEO updates.

GO/NO-GO: **NO-GO for release** until gates 1–4 are closed.

## Next main-roadmap milestone
Phase 2 continuation: the remaining untested standalone tools. These are lifestyle age, strength program, chronotype, sleep calculator, breathing timer and recipe analyzer.
