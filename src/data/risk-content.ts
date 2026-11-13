/**
 * Long-form content for Health Risk tools. These are EDUCATIONAL estimates only —
 * every page carries a non-diagnostic notice and recommends seeing a doctor.
 */
import { pubmed, type Source, type ToolContent } from './content-types';

const NOTICE =
  'Educational estimate only — this is NOT a medical diagnosis. It cannot tell you whether you have a condition; only a doctor can. Please discuss your health and any concerns with a qualified healthcare professional.';

const WHO_OBESITY: Source = {
  citation: 'World Health Organization. "Obesity and overweight" fact sheet.',
  url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
};
const AHA_LE8: Source = {
  citation: 'American Heart Association. "Life’s Essential 8" — key measures for cardiovascular health.',
  url: 'https://www.heart.org/en/healthy-living/healthy-lifestyle/lifes-essential-8',
};
const CDC_HEART: Source = {
  citation: 'Centers for Disease Control and Prevention (CDC). "Heart Disease" and "Know Your Risk for Heart Disease."',
};
const CDC_DIABETES: Source = {
  citation: 'Centers for Disease Control and Prevention (CDC). "Prediabetes — Your Chance to Prevent Type 2 Diabetes."',
};
const ADA: Source = {
  citation: 'American Diabetes Association. "Type 2 Diabetes Risk Test" and standards of care.',
};

export const RISK_CONTENT: Record<string, ToolContent> = {
  // ============================================================
  'healthspan-score': {
    directAnswer: {
      question: 'What is a healthspan score?',
      answer:
        'It’s a 0–100 summary of the everyday habits — physical activity, diet, sleep, smoking, alcohol, stress, and social connection — that public-health guidance links with more healthy, disease-free years. The point bands are labels defined by this tool, not validated clinical grades. The score is not a medical prediction.',
    },
    seoTitle: 'Healthspan Score – Free Healthy-Habits Calculator',
    metaDescription:
      'Score your everyday habits (0–100) against WHO and CDC lifestyle guidance and see which habits have the most remaining model points. Educational — not a lifespan prediction.',
    intro:
      'Answer ten quick questions about your everyday habits and get a transparent 0–100 healthspan-habits score — with a bar for every factor and your largest remaining point gaps. It reflects habits linked with more healthy years, not a prediction of your lifespan.',
    notice:
      'Educational habits score only. It is NOT a lifespan prediction, biological-age measurement, or medical diagnosis — it summarizes everyday habits that public-health guidance links with more healthy, disease-free years. Talk to a qualified professional about your health.',
    sections: [
      {
        h2: 'What is a healthspan score? (And what it isn’t)',
        paragraphs: [
          'Healthspan is the number of years lived in good health — free of major disease and disability — as opposed to lifespan, which is simply years lived. Nobody can compute your personal healthspan from a questionnaire, and this tool doesn’t try. What it does is simpler and honest: it scores the everyday, modifiable habits that public-health bodies consistently link with more healthy years.',
          'Every point is visible. Each factor shows exactly how many points it contributed as a bar, so you can see why your score is what it is — no black box, no hidden weighting, no predictions.',
        ],
      },
      {
        h2: 'How the score is calculated',
        paragraphs: [
          'The score is a transparent points model over nine habit factors, anchored to public guidance on modifiable risk: physical activity (20 points, full credit at the WHO’s 150 minutes of moderate activity a week), fruit & vegetables (12 points, full credit at 5 servings — roughly the WHO’s 400 g a day), ultra-processed food (8), smoking (15), alcohol (10 illustrative points using weekly bands that are not official Dietary Guidelines limits), sleep (15, full credit for 7–9 hours), self-rated stress (6), social connection (4), and — optionally — waist-to-height ratio (10, full credit under 0.5).',
          'The weights sum to exactly 100, so with every factor answered the visible points literally add up to your score. If you skip the optional waist-to-height factor the score is rescaled from 90, so skipping never counts against you. Age does not change the score. Sex affects only this tool’s illustrative alcohol points, not any official weekly drinking limit. All points and overall bands are editorial heuristics, not health-risk predictions.',
        ],
      },
      {
        h2: 'How to read your result',
        list: {
          intro: 'Three descriptive point bands defined by this tool, not clinical risk categories:',
          items: [
            '80–100 · Excellent (tool-defined) — reflects more earned model points, not a medical clearance.',
            '50–79 · Good (tool-defined) — use factor details to see how these points were assigned.',
            '0–49 · Needs attention (tool-defined) — this label does not classify clinical risk or determine which changes matter most for your health.',
          ],
        },
      },
      {
        h2: 'A worked example',
        paragraphs: [
          'Sam, 42: 60 minutes of activity a week (8/20), 3 servings of fruit & veg (7/12), ultra-processed food some days (4/8), never smoked (15/15), 5 drinks a week (8/10), 6.5 hours of sleep (9/15), high stress (0/6), some social connection (2/4), waist-to-height 0.54 (5/10). Total: 58/100 — Good.',
          'Sam’s largest unearned model points are physical activity (+12), sleep (+6), and stress (+6). These gaps do not rank expected medical benefits or substitute for personalized advice.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does this predict how long I will live?',
        a: 'No — and it doesn’t try to. It scores everyday habits that public-health guidance associates with more healthy years. Lifespan depends on many things a questionnaire cannot know (genetics, medical history, environment, luck).',
      },
      {
        q: 'Why doesn’t my age change the score?',
        a: 'Because the score reflects habits, not biology — and the evidence says improving these habits pays off at every age. Age is collected only as context; sex affects only the illustrative alcohol points in this tool; its weekly bands are not current official guidelines.',
      },
      {
        q: 'What counts as a "standard drink" and a "serving" of fruit or veg?',
        a: 'A standard drink is roughly 350 ml of beer, 150 ml of wine, or 45 ml of spirits. A serving of fruit or vegetables is about 80 g — a piece of fruit, half a cup of cooked vegetables, or a cup of salad.',
      },
      {
        q: 'Is skipping the waist-to-height question a disadvantage?',
        a: 'No. The score is rescaled to 0–100 without that factor, so skipping it never lowers your result. If you can measure, though, it adds a useful body-shape signal — a waist under half your height is the common healthy guide.',
      },
      {
        q: 'Where do the point values come from?',
        a: 'Public guidance informs the physical activity, diet and sleep examples. The 2025–2030 Dietary Guidelines for Americans advise consuming less alcohol but do not set the weekly point bands shown here. All weights, score bands and alcohol point thresholds are this tool’s editorial choices, not validated health outcomes.',
      },
    ],
    sources: [
      {
        citation: 'World Health Organization. "Physical activity" fact sheet — 150–300 minutes of moderate activity per week for adults.',
        url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
      },
      {
        citation: 'World Health Organization. "Healthy diet" fact sheet — at least 400 g (about 5 servings) of fruit and vegetables a day.',
        url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
      },
      {
        citation: 'Centers for Disease Control and Prevention (CDC). "Adult Activity: An Overview" — physical activity guidelines for adults.',
        url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',
      },
      {
        citation: 'U.S. Dietary Guidelines for Americans, 2025–2030 — consume less alcohol for better overall health.',
        url: 'https://odphp.health.gov/our-work/nutrition-physical-activity/dietary-guidelines/current-dietary-guidelines',
      },
    ],
  },
  // ============================================================
  'lifestyle-age-test': {
    seoTitle: 'Lifestyle Age Test – Free Body Age Estimate',
    metaDescription:
      'A free, educational lifestyle age test: see how your daily habits may be aging your body vs your real age. Not a biological-age or medical measurement.',
    intro:
      'Answer nine quick questions to see an educational estimate of how your daily habits may be aging your body — compared with your real age. It’s a guide to what you can change, not a medical or biological-age test.',
    notice:
      'Educational estimate based on lifestyle factors only. It does NOT measure biological age (there is no telomere or epigenetic testing here) and is not a medical assessment. For a real health check, see a qualified professional.',
    sections: [
      {
        h2: 'Is this a real biological age test? (No — and that matters)',
        paragraphs: [
          'It’s important to be upfront: this is not a biological age test. True biological age is estimated in a lab from biomarkers such as epigenetic "clocks" (DNA methylation), telomere length, or blood-based markers. This tool measures none of those.',
          'What it does is simpler and still useful: it takes your real age and adjusts it up or down based on the direction of well-established links between everyday habits and long-term health. Think of it as a fun, motivating snapshot of which habits are working for you and which are working against you — not a diagnosis or a measurement of how your cells are actually aging.',
        ],
      },
      {
        h2: 'How your lifestyle age is estimated',
        paragraphs: [
          'The estimate starts at your chronological age, then applies small, clearly heuristic year adjustments for each factor you enter. Protective habits — regular activity, good cardio fitness (a lower resting heart rate), 7–9 hours of sleep, a healthy waist-to-height ratio, plenty of fruit and veg, low stress, not smoking — pull the number down. Habits linked with faster aging push it up.',
          'The adjustments are deliberately modest, and the total swing is capped at ±12 years so the result never overclaims. You’ll see your three biggest drivers and exactly how to improve each.',
        ],
      },
      {
        h2: 'What raises and lowers the estimate',
        list: {
          intro: 'The factors it weighs, all based on population research:',
          items: [
            'Resting heart rate — a rough proxy for cardiovascular fitness',
            'Sleep — 7–9 hours is the sweet spot',
            'Waist-to-height ratio — central fat is a strong metabolic signal',
            'Physical activity level',
            'Smoking status',
            'Alcohol intake',
            'Fruit & vegetable servings per day',
            'Day-to-day stress',
          ],
        },
      },
      {
        h2: 'How to lower your number',
        paragraphs: [
          'The good news about a lifestyle estimate is that it’s entirely within your control. The same changes that lower it are simply good for you:',
        ],
        list: {
          items: [
            'Move most days — even a brisk 30-minute walk counts; check your zones with the Target Heart Rate calculator.',
            'Aim for 7–9 hours of sleep on a steady schedule (try the Sleep Calculator).',
            'Bring your waist under half your height (see the Waist-to-Height Ratio calculator).',
            'If you smoke, quitting is the single highest-impact change.',
            'Eat 5 servings of fruit & veg a day.',
            'Build in daily stress recovery — the Box-Breathing Timer is a quick start.',
          ],
        },
      },
      {
        h2: 'The research areas behind it',
        paragraphs: [
          'The adjustments reflect the general direction of findings in cardiovascular fitness (resting heart rate and mortality), physical activity and longevity, sleep and health, and metabolic health (waist-to-height ratio), along with the well-documented effects of smoking, heavy alcohol use, diet quality and chronic stress. These are population-level associations, not individual predictions — your real health depends on much more than nine inputs.',
        ],
      },
    ],
    faq: [
      { q: 'Is this a free biological age calculator?', a: 'It’s a free lifestyle-age estimate. A true biological age calculator needs lab biomarkers (epigenetic clocks, telomere length, or blood markers); this tool estimates how your habits compare with your age, which is different.' },
      { q: 'How old is my body, really?', a: 'No quiz can tell you that from habits alone. This gives an educational estimate of the direction your lifestyle is pushing — younger or older than your real age — to highlight what’s worth changing.' },
      { q: 'How is the result calculated?', a: 'It starts at your real age and applies small, conservative year adjustments for each habit based on published epidemiological associations, with the total capped at ±12 years.' },
      { q: 'Can I actually lower my body age?', a: 'You can lower this estimate by improving the habits it measures — and those habits (more activity, better sleep, a healthier waist, not smoking) are genuinely good for your long-term health regardless of any number.' },
      { q: 'Is this medically accurate or a diagnosis?', a: 'No. It’s for education and motivation only, and it can’t diagnose anything. For a real assessment of your health, see a qualified healthcare professional.' },
    ],
    sources: [
      AHA_LE8,
      WHO_OBESITY,
      { citation: 'Zhang G-Q, et al. "Association of resting heart rate and all-cause and cardiovascular mortality." (meta-analysis).', url: pubmed('resting heart rate all-cause cardiovascular mortality meta-analysis') },
      { citation: 'Lee I-M, et al. Physical activity and longevity / all-cause mortality.', url: pubmed('physical activity all-cause mortality dose response') },
      { citation: 'Cappuccio FP, et al. "Sleep duration and all-cause mortality: a systematic review and meta-analysis."', url: pubmed('sleep duration and all-cause mortality systematic review meta-analysis') },
    ],
  },
  // ============================================================
  'waist-health-risk-calculator': {
    seoTitle: 'BMI and Waist-to-Height Ratio Calculator',
    metaDescription:
      'Calculate BMI and waist-to-height ratio side by side. Learn what each measure means and its limits, without an unvalidated combined risk score.',
    intro:
      'BMI and waist-to-height ratio describe different aspects of body size. Compare both measurements and learn when a healthcare professional can help interpret them; this calculator does not predict your personal disease risk.',
    notice:
      'Educational body measurements only, not a medical diagnosis or a validated heart-disease/diabetes risk score. A lower BMI or waist-to-height ratio cannot rule out health conditions.',
    sections: [
      {
        h2: 'Why look at both BMI and waist-to-height ratio?',
        paragraphs: [
          'BMI compares body weight with height, but it does not measure body fat or distinguish muscle from fat. Waist-to-height ratio gives another practical measurement related to central adiposity; it does not directly measure visceral fat or determine your medical risk.',
          'The [NICE overweight and obesity guideline](https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity) recommends using waist-to-height ratio alongside BMI in adults with BMI below 35. These are separate measures, not a validated combined four-level risk score.',
        ],
      },
      {
        h2: 'Understanding the measurements',
        list: {
          intro: 'Interpret both values in context, rather than treating a custom combined band as a clinical prediction:',
          items: [
            'BMI is a weight-for-height measure, not a direct measurement of fat distribution or a diagnosis.',
            'For adults with BMI below 35, NICE describes waist-to-height ratio 0.4–0.49 as healthy central adiposity, 0.5–0.59 as increased, and 0.6 or above as high central adiposity.',
            'The simple waist guidance is to keep waist circumference below half of height, but a low ratio does not rule out all cardiometabolic risk.',
            'The NICE ratio classifications are not intended as a stand-alone classification when adult BMI is 35 or above; seek individualized clinical assessment.',
          ],
        },
      },
      {
        h2: 'What to do with your results',
        paragraphs: [
          'Changes to physical activity, nutrition and other behaviors may support cardiovascular and metabolic health. Health goals should fit your medical history and circumstances rather than a single body measurement.',
          'Blood pressure, glucose, cholesterol, family history and other factors affect health independently of these measurements. A clinician can interpret your waist measurement, BMI and individual risks; do not treat these results as a diagnosis or a guaranteed safe range.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does this calculator measure my heart-disease or diabetes risk?',
        a: 'No. It calculates BMI and waist-to-height ratio, not a validated combined risk probability. A medical assessment needs additional individual health information.',
      },
      {
        q: 'Why measure waist-to-height ratio as well as BMI?',
        a: 'Waist-to-height ratio adds information about central adiposity that BMI alone cannot directly show. For adults with BMI below 35, NICE recommends assessing both.',
      },
      {
        q: 'What if my BMI is lower but my waist-to-height ratio is high?',
        a: 'Waist-to-height ratio can indicate increased central adiposity even when BMI alone seems reassuring. Discuss concerns and appropriate screening with a healthcare professional.',
      },
    ],
    sources: [WHO_OBESITY, {
      citation: 'NICE NG246 (2025; updated 2026), identifying and assessing overweight, obesity and central adiposity.',
      url: 'https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity',
    }],
  },

  // ============================================================
  'heart-disease-risk-calculator': {
    seoTitle: 'Heart Disease Risk Factors Checklist (Educational)',
    metaDescription:
      'Review five heart-health factors using illustrative points, not a validated heart disease risk score. Ask your clinician about AHA PREVENT.',
    intro:
      'Explore five factors associated with cardiovascular health using an illustrative point tally. It does not classify your personal heart disease risk or predict cardiovascular events.',
    notice: 'Educational factor checklist only. The point total does NOT measure personal risk of heart disease, stroke or heart failure. A low tally cannot rule out cardiovascular disease or replace clinical assessment.',
    sections: [
      {
        h2: 'What this tool does',
        paragraphs: [
          'This checklist adds illustrative points for age, smoking, physical activity, BMI and a broad blood-pressure category. The weights and total are not validated cardiovascular predictions, and no point cutoff can classify medical risk. Review the individual factors rather than interpreting the tally as a diagnosis or percentage.',
          'The [American Heart Association PREVENT calculator](https://professional.heart.org/en/guidelines-and-statements/prevent-calculator) uses clinical measurements including sex, measured systolic blood pressure, cholesterol, kidney function, BMI, diabetes, smoking and medication status. This checklist lacks these inputs and cannot substitute for a validated risk estimate.',
        ],
      },
      {
        h2: 'The factors that matter',
        paragraphs: [
          'Smoking is one of the most powerful and most reversible risk factors — quitting begins to lower risk within a year. Regular physical activity, a healthy weight and well-controlled blood pressure all protect the heart, while age is a factor you can’t change but which makes the others matter more.',
          'The American Heart Association summarises the controllable pieces as "Life’s Essential 8": diet, activity, not smoking, healthy sleep, weight, cholesterol, blood sugar and blood pressure.',
        ],
      },
      {
        h2: 'Lowering your risk',
        paragraphs: [
          'Regardless of checklist points, avoiding tobacco, being active, choosing nutritious foods and managing blood pressure are useful preventive steps. A low tally is not proof that no further assessment is needed.',
          'This checklist cannot estimate 10-year or 30-year risk. Ask your clinician whether a formal cardiovascular assessment is appropriate, especially with personal risk factors, a family history or symptoms.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is this a real heart disease risk score?',
        a: 'No. The checklist points are neither a probability nor validated clinical categories. AHA PREVENT requires additional clinical measurements and supports conversations with healthcare professionals.',
      },
      {
        q: 'What’s the single best thing I can do for my heart?',
        a: 'If you smoke, quitting has the biggest impact. Otherwise, regular activity, a healthy weight, good diet and controlled blood pressure all strongly protect your heart.',
      },
      {
        q: 'Can a low point tally rule out heart disease risk?'
        a: 'No. Even a tally of 0 out of 12 cannot rule out cardiovascular disease. Discuss individual assessment with your clinician; the checklist omits important factors and measurements.',
      },
    ],
    sources: [CDC_HEART, AHA_LE8, { citation: 'American Heart Association. PREVENT Equations and required clinical inputs.', url: 'https://professional.heart.org/en/guidelines-and-statements/prevent-calculator' }],
  },

  // ============================================================
  'diabetes-risk-calculator': {
    seoTitle: 'Type 2 Diabetes Factors Checklist (Educational)',
    metaDescription:
      'Explore factors linked to type 2 diabetes with illustrative points, not a validated screening risk score. Learn about laboratory testing.',
    intro:
      'Diabetes and prediabetes may have no symptoms. Review five relevant factors as a discussion aid, not a validated disease-risk category or a substitute for laboratory testing.',
    notice:
      'Illustrative points only — not the validated CDC/ADA risk test and not a diagnosis. A tally of 0 does not rule out prediabetes or diabetes. Ask a healthcare professional about screening based on your health, symptoms and risk factors.',
    sections: [
      {
        h2: 'How the illustrative checklist works',
        paragraphs: [
          'This checklist adds custom points for age, BMI, waist-to-height ratio, family history and activity. The weights and total are illustrative only; they do not correspond to validated low, moderate or high risk categories. Review each factor rather than relying on the tally.',
          'The [CDC/ADA validated prediabetes risk test](https://www.cdc.gov/diabetes/widgets/risktest/how-your-test-is-scored.html) uses different questions, points and thresholds. This checklist is not that test, does not measure blood glucose and cannot establish disease probability. A1C or plasma-glucose testing evaluates glycemic status.',
        ],
      },
      {
        h2: 'Why screening matters',
        paragraphs: [
          'Prediabetes often has no clear symptoms; a reassuring checklist total cannot exclude it. The [CDC](https://www.cdc.gov/prediabetes/risktest/about-the-test.html) recommends appropriate screening, while evidence-based lifestyle programs can help prevent or delay type 2 diabetes.',
          'Ask a healthcare professional about A1C or fasting-plasma-glucose testing when recommended for your age, history, symptoms or clinical risk factors, regardless of this checklist total.',
        ],
      },
      {
        h2: 'Lowering your risk',
        paragraphs: [
          'Age and family history cannot be changed, but prevention can still help. For adults with excess weight and elevated diabetes risk, evidence-based programs often target 5–7% sustained weight reduction and at least 150 minutes per week of moderate physical activity, adjusted to individual needs.',
          'This checklist is a conversation aid, not a diagnosis or a validated screening result. Laboratory testing may be needed even if its tally is low; follow clinical screening recommendations.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can this calculator diagnose diabetes?',
        a: 'No. These are illustrative points, not the validated CDC/ADA risk test. Diabetes and prediabetes are assessed using laboratory A1C or plasma-glucose criteria.',
      },
      {
        q: 'What blood test should I ask for?',
        a: 'Common screening tests are A1C and fasting plasma glucose. Your clinician can advise which is appropriate based on your health and screening guidance; a low checklist tally cannot exclude the need for testing.',
      },
      {
        q: 'Can type 2 diabetes risk be reduced?',
        a: 'Evidence-based lifestyle changes, including physical activity and weight management when indicated, can prevent or delay type 2 diabetes in people at elevated risk. Ask a clinician about screening and individual prevention options.',
      },
    ],
    sources: [CDC_DIABETES, ADA,
      { citation: 'CDC. How Your Prediabetes Risk Test Is Scored.', url: 'https://www.cdc.gov/diabetes/widgets/risktest/how-your-test-is-scored.html' },
      { citation: 'ADA. Standards of Care in Diabetes—2026: Diagnosis and Classification.', url: 'https://doi.org/10.2337/dc26-s002' },
    ],
  },

  // ============================================================
  'smoking-cost-calculator': {
    seoTitle: 'Smoking Cost Calculator – Cost of Smoking',
    metaDescription:
      'See how much smoking costs you per week, year and over time — plus the health benefits of quitting and free quitline help. Educational, no signup.',
    intro:
      'The money spent on cigarettes adds up fast. Enter your habit to see the running total — and the health you’d reclaim by stopping.',
    notice: NOTICE,
    sections: [
      {
        h2: 'What smoking really costs',
        paragraphs: [
          'Enter your packs per day, the price per pack in your local currency, and how long you’ve smoked. The calculator multiplies it out to show your spend per week, per month, per year, and over the whole period — often a genuinely startling figure.',
          'And that’s only the direct cost. Smoking also raises spending on healthcare, insurance and lost earnings, none of which are included here. The money saved by quitting can be redirected to almost anything you value more.',
        ],
      },
      {
        h2: 'The health benefits of quitting',
        list: {
          intro: 'Your body starts to recover remarkably quickly after your last cigarette:',
          items: [
            '20 minutes: heart rate and blood pressure begin to drop.',
            '12 hours: carbon-monoxide levels in your blood return to normal.',
            '2–12 weeks: circulation improves and lung function increases.',
            '1 year: your risk of coronary heart disease is about half that of a smoker.',
            '5–15 years: stroke and many cancer risks fall toward those of a non-smoker.',
          ],
        },
      },
      {
        h2: 'Getting free help to quit',
        paragraphs: [
          'Quitting is hard, but support roughly doubles your chances. Free, confidential quitlines offer coaching and a plan: in the US call 1-800-QUIT-NOW (1-800-784-8669), in the UK call the NHS on 0300 123 1044, and most countries have an equivalent service.',
          'Your doctor or pharmacist can also help with proven stop-smoking medicines and nicotine-replacement therapy. This calculator is for motivation and education only — it is not medical advice, and a professional can tailor a quit plan to you.',
        ],
      },
    ],
    faq: [
      {
        q: 'How much could I save by quitting?',
        a: 'Enter your habit above to see your personal total. A pack-a-day smoker often spends several thousand in their local currency every year — money freed up the moment you stop.',
      },
      {
        q: 'How quickly does health improve after quitting?',
        a: 'Very quickly: heart rate drops within 20 minutes, carbon monoxide clears within a day, and within a year your heart-disease risk is roughly halved compared with continuing to smoke.',
      },
      {
        q: 'Where can I get help to stop smoking?',
        a: 'Free quitlines (US 1-800-QUIT-NOW; UK 0300 123 1044) offer coaching, and your doctor or pharmacist can provide proven medicines and nicotine-replacement therapy.',
      },
    ],
    sources: [
      { citation: 'Centers for Disease Control and Prevention (CDC). "Benefits of Quitting" smoking.' },
      { citation: 'World Health Organization. "Tobacco" fact sheet.', url: 'https://www.who.int/news-room/fact-sheets/detail/tobacco' },
    ],
  },

  // ============================================================
  'alcohol-units-calculator': {
    seoTitle: 'Alcohol Units Calculator (Weekly Units)',
    metaDescription:
      'Convert your weekly beer, wine and spirits into alcohol units and check them against low-risk drinking guidelines. Educational, no signup.',
    intro:
      'It’s easy to underestimate how much you drink. Enter your typical week and this calculator totals your alcohol units and compares them with low-risk guidelines.',
    notice: NOTICE,
    sections: [
      {
        h2: 'How units are calculated',
        paragraphs: [
          'One UK alcohol unit is 10 ml (8 g) of pure alcohol. The number of units in a drink depends on its size and strength, so a pint of regular beer is about 2.3 units, a 175 ml glass of wine about 2.1, and a single 25 ml measure of spirits about 1 unit.',
          'The calculator multiplies how many of each you drink per week by these values and adds them up. Counting units this way is far more accurate than counting "drinks," because drink sizes and strengths vary so widely.',
        ],
      },
      {
        h2: 'Low-risk drinking guidelines',
        paragraphs: [
          'The UK Chief Medical Officers advise drinking no more than 14 units a week, for both men and women, ideally spread over three or more days rather than "saved up." There is no completely safe level of drinking — 14 units is the point below which risk is considered low, not zero.',
          'Guidance differs by country. The US measures "standard drinks" of 14 g of alcohol and advises limits in those terms, while Australia uses 10 g standard drinks. Whatever the unit, the principle is the same: less is better for your health.',
        ],
      },
      {
        h2: 'Cutting down',
        paragraphs: [
          'If your total is above the guideline, small changes add up: have several drink-free days each week, choose smaller measures or lower-strength drinks, and alternate alcoholic drinks with water. Tracking your units — as you’ve just done — is itself one of the most effective steps.',
          'Drinking above the guidelines raises the risk of liver disease, several cancers, high blood pressure and dependence. This tool is educational only; if you find it hard to cut back, please talk to your doctor, who can offer confidential support.',
        ],
      },
    ],
    faq: [
      {
        q: 'How many alcohol units are safe per week?',
        a: 'UK guidance is to keep to 14 units a week or fewer, spread over several days, for both men and women. No level of drinking is completely risk-free, so less is always better.',
      },
      {
        q: 'How many units are in a glass of wine or a pint?',
        a: 'Roughly: a pint of regular-strength beer is about 2.3 units, a 175 ml glass of wine about 2.1 units, and a single 25 ml spirit measure about 1 unit. Stronger or larger drinks contain more.',
      },
      {
        q: 'What’s the difference between a unit and a standard drink?',
        a: 'A UK unit is 8 g of pure alcohol; a US "standard drink" is 14 g and an Australian one is 10 g. They measure the same thing in different sizes, so guideline numbers differ by country.',
      },
    ],
    sources: [
      { citation: 'UK Chief Medical Officers. "UK Chief Medical Officers’ Low Risk Drinking Guidelines." 2016.' },
      { citation: 'U.S. National Institute on Alcohol Abuse and Alcoholism (NIAAA). "Rethinking Drinking" — standard drink sizes and limits.' },
    ],
  },
};
