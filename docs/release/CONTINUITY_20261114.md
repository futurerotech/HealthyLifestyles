# HealthyLifeStyles — engineering continuity record (2026-11-14)

Durable resume point for the next session. Evidence only; nothing here is a
merge, deployment, publication, legal or clinical approval.

## Frontend — PR #56 `integration/calculator-safety-20261114`

| Commit | What | CI |
|---|---|---|
| `a054092` | Integrated calculator safety work (#53–#55), screener engine fix, pregnancy dating, focus styles | 43565044508 ✅ |
| `a0aef49` | Review #6873310811: future raw dates rejected per method; strict dates and integer bounds; no sharing of PHQ-9/GAD-7/WHO-5 results; WHO-5 licence hold | 43568758128 ✅ |
| `e936b48` | Phase 2: BMI, body fat, ideal weight, calorie and BMR audit fixes | 43569328123 ❌ (Chrome debugger start timeout before any page; unit 267/267) |
| `8a6d942` | Browser QA: 60 s Chrome debugger wait plus one logged relaunch (no assertion relaxed) | **43569710818 ✅** (unit 267/267; browser QA 0 failures; no relaunch needed) |

### Phase 2 findings fixed at `e936b48`
- **BMI:** category bounds were inclusive (18.5 → Underweight, 25.0 → Normal, 30.0 → Overweight). Now WHO/CDC "under Y", classified on the displayed value. Adds an adult-use note.
- **Body fat (U.S. Navy):** same boundary defect against the page's ACE table. Out-of-range results (outside 2–60%) were clamped and are now withheld.
- **Ideal weight:** Devine is not defined below 5 ft (it previously showed a flat 50/45.5 kg).
- **Calorie:** when TDEE is at or below the floor, the "lose" figure exceeded maintenance. No deficit is now offered. A clamped target shows its real weekly loss.
- **BMR:** formula verified exact. An accuracy note was added.
- **Tests:** `scripts/seo/__tests__/body-metrics-audit.test.ts`.

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
Phase 2 continuation: audit the next body and nutrition group against their page copy and formulas. That group is lean body mass, waist-to-height, waist-to-hip, weight-loss %, macro, protein, calorie-deficit and keto.
