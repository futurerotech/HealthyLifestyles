# Phase 6 — Health Innovation Lab: evaluation of Hypotheses A, B, C

Date: 2026-11-14 · Status: **research only.** No prototype has been built or deployed. Implementation of any hypothesis requires an owner decision (Master Roadmap §10: "Build only an owner-approved, narrowly scoped prototype after the research gate").

Method:
- Desk research of authoritative public sources (links below) plus an inventory of the 68 existing HealthyLifeStyles tools.
- No search-volume, traffic or revenue figure is used or estimated: GSC, GA4 and Trends access is not available, so the "organic-discovery" half of criterion 5 is **insufficient evidence** for all three hypotheses.
- Scores are reviewer judgments on a 1–5 scale grounded in the evidence cited. They are not measurements.

## 1. Evidence per hypothesis

### A. Health Reality Lab (constraints-aware wellness choices)
- **Problem evidence (moderate):** barriers to healthy behavior are well documented.
  - A 2023 YouGov/World Cancer Research Fund poll of 2,086 UK adults reported: lack of motivation 38%, "too tired" 35%, food cost 30%, lack of time 26%, work/life balance 25%, cost of exercise 25%.
  - A NIOSH-funded workplace study found time constraints and lack of interest or motivation were the main barriers to physical activity, and lack of self-control, convenience and access to healthy foods the main barriers to healthy eating.
- **Evidence that a tool solves it:** insufficient. No source shows a constraint explorer changes behavior.
- **Overlap (high):** the inputs and outputs overlap existing tools: meal plan, walk-it-off, sitting reversal, sleep calculator, nap calculator, health score, lifestyle age, strength builder, fasting. The Board text explicitly rejects "merely combining popular features under a new name".
- **Scope risk:** time + budget + schedules + energy + caregiving + preferences is a broad, open-ended product with heavy editorial and safety surface.

### B. Appointment Clarity Composer (private visit-preparation notes)
- **Problem evidence (moderate, mixed outcomes):**
  - A systematic review (Sansoni et al., Patient Educ Couns 2015; 42 studies, 50 interventions) found a physician-endorsed question prompt list increased patient question asking. It found no consistent effect on recall, anxiety, satisfaction or consultation time.
  - A 2015 oncology review found QPL interventions effective for participation.
- **Competition (strong free incumbent):** AHRQ QuestionBuilder is free (web, iOS, Android), developed with consumer and clinician input, and stores data only on the user's device.
- **Overlap:** none with our tools. A possible link (bringing a user's own calculator results into their notes) would add sensitive-data handling and would need its own review.
- **Feasibility:** high (static content, local-only).

### C. Shift Work Health Constraint Explorer
- **Problem evidence (strong for prevalence and risk):**
  - BLS reports 16.4% of U.S. workers on non-daytime schedules: evening 5.9%, night 3.6%, rotating 2.4%, irregular 2.6%.
  - NIOSH links shift work and long hours to reduced sleep, circadian disruption, errors and accidents, and chronic disease. Its free nurse training teaches sleep scheduling, strategic naps and light control.
  - IARC classifies night shift work as "probably carcinogenic" (Group 2A, limited human evidence). This is a hazard classification, not a personal risk level.
- **Competition:**
  - Timeshifter Shift Work, a personalized circadian plan: 30-day trial, then $6.99/month or $69.99/year.
  - NIOSH: free training (education, not a planner). It notes rotating shifts vary too much for generic strategies and refers people who struggle to a sleep specialist.
- **Overlap (complementary, not duplicative):** the existing sleep calculator, nap calculator, caffeine curfew, chronotype quiz, sleep debt and fasting tools could be reused as building blocks. None of them models a work roster, commute or rest windows.
- **Safety constraint:** must not present circadian "prescriptions" or promise better sleep or health (Board text). Advice must stay at the level of NIOSH and AASM educational strategies.

## 2. Weighted evaluation (Board criteria and weights)

| Criterion (weight) | A. Reality Lab | B. Appointment Composer | C. Shift Work Explorer |
|---|---|---|---|
| Verified unmet user need (25%) | 3: barriers documented; tool benefit unproven | 3: QPL benefit for question asking; mixed other outcomes | 4: large affected group, documented risks, guidance exists but no free planner |
| Differentiation (20%) | 1: overlaps many existing tools | 2: strong free incumbent (AHRQ) | 4: main incumbent is paid; free resources are courses, not tools |
| Cost and technical feasibility (20%) | 2: broad scope, $0 data but high build and editorial effort | 5: static, local-only, $0 | 4: roster logic on top of existing tools, $0 |
| Privacy, trust, medical safety (15%) | 3: local-only possible; advice-drift risk | 4: local-only; must not infer diagnoses; sensitive free text | 3: local-only; over-claiming risk with circadian advice |
| Repeat-use and organic discovery (10%) | **insufficient** | **insufficient** | **insufficient** (repeat use plausible as rosters change, but unverified) |
| Accessibility and international usability (10%) | 2: complex multi-input workflow | 4: plain text, printable; QPLs need cultural adaptation (review gap) | 3: schedule grids need careful accessibility; 12/24 h time formats |
| **Weighted score over the 90% with evidence** (÷0.9) | **2.2** | **3.5** | **3.7** |

The B vs C difference (0.2) is within reviewer-judgment uncertainty. The ranking is provisional until search-demand and user evidence exist.

## 3. Recommendation

1. **C, Shift Work Health Constraint Explorer, is the leading candidate.** It has the strongest verified need and the clearest gap among free tools, and it reuses existing sleep, nap, caffeine and chronotype engines instead of duplicating them. Narrow prototype scope, if authorized:
   - roster input (fixed, night and rotating);
   - commute;
   - candidate sleep, nap and meal windows using NIOSH/AASM-level educational rules, with caffeine-curfew integration;
   - "see a sleep specialist" guidance when difficulty persists;
   - browser-only and local-only;
   - no outcome guarantees.
2. **B is a credible low-cost alternative,** but only with a reason to exist beside AHRQ QuestionBuilder (for example, deep links from our tool pages to a printable question list). Otherwise it duplicates a free government tool.
3. **A is not recommended as framed:** it duplicates existing tools and lacks a verified, specific user journey. Revisit only with first-party user research.

## 4. Gates before any build
- Owner decision on the hypothesis and the narrow scope.
- Search-demand evidence (GSC/Trends) and, ideally, a small privacy-respecting user check.
- Independent clinical review of any shift-work guidance text.
- Accessibility review of the roster UI.

## Sources
- BLS, Workers by shift usually worked (table): https://www.bls.gov/news.release/flex2.t07.htm
- NIOSH Training for Nurses on Shift Work and Long Work Hours: https://www.cdc.gov/niosh/work-hour-training-for-nurses/objectives.html
- NIOSH Science Blog, "A Hard Day's Night": https://blogs.cdc.gov/niosh-science-blog/?p=7380
- IARC Monographs Vol. 124, Night Shift Work (Q&A): https://www.iarc.who.int/wp-content/uploads/2019/07/QA_Monographs_Volume124.pdf
- Timeshifter shift work app pricing (Athletech News, Apr 2026): https://athletechnews.com/timeshifter-takes-circadian-app-from-jet-lag-to-night-shift-5-3m-raised-to-date/
- AHRQ QuestionBuilder and FAQ: https://www.ahrq.gov/questions/question-builder/index.html · https://www.ahrq.gov/questions/question-builder/faqs.html
- Sansoni JE et al., Question Prompt Lists in health consultations: a review, Patient Educ Couns 2015;98:1454–64: https://ro.uow.edu.au/ahsri/651
- Brandes K et al., QPL interventions in oncology, Psycho-Oncology 2015: https://dare.uva.nl/id/513f4521-4cf1-407a-829f-1ca756b77d86
- WCRF/YouGov barriers poll (Advisory Board summary, May 2023): https://www.advisory.com/daily-briefing/2023/05/18/lifestyle-changes
- Stankevitz K et al., Perceived barriers to healthy eating and physical activity, JOEM 2017 (CDC Stacks): https://stacks.cdc.gov/view/cdc/210647
