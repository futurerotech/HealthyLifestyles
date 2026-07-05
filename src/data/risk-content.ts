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
        'It’s a 0–100 summary of the everyday habits — physical activity, diet, sleep, smoking, alcohol, stress, and social connection — that public-health guidance links with more healthy, disease-free years. On this tool, 80+ is excellent, 50–79 good, and under 50 needs attention. It reflects habits only, never a medical prediction.',
    },
    seoTitle: 'Healthspan Score – Free Healthy-Habits Calculator',
    metaDescription:
      'Score your everyday habits (0–100) against WHO and CDC lifestyle guidance and see your 2–3 highest-impact next steps. Educational — not a lifespan prediction.',
    intro:
      'Answer ten quick questions about your everyday habits and get a transparent 0–100 healthspan-habits score — with a bar for every factor and your highest-impact next steps. It reflects habits linked with more healthy years, not a prediction of your lifespan.',
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
          'The score is a transparent points model over nine habit factors, anchored to public guidance on modifiable risk: physical activity (20 points, full credit at the WHO’s 150 minutes of moderate activity a week), fruit & vegetables (12 points, full credit at 5 servings — roughly the WHO’s 400 g a day), ultra-processed food (8), smoking (15), alcohol (10, using the Dietary Guidelines’ moderation thresholds by sex), sleep (15, full credit for 7–9 hours), self-rated stress (6), social connection (4), and — optionally — waist-to-height ratio (10, full credit under 0.5).',
          'The weights sum to exactly 100, so with every factor answered the visible points literally add up to your score. If you skip the optional waist-to-height factor the score is rescaled from 90, so skipping never counts against you. Age and sex are context only: sex sets the alcohol guideline, and age doesn’t change the score at all — good habits count at every age.',
        ],
      },
      {
        h2: 'How to read your result',
        list: {
          intro: 'Three bands, always shown as color plus text:',
          items: [
            '80–100 · Excellent — your habits strongly match healthy-aging guidance; protect them.',
            '50–79 · Good — a solid base with clear room to gain points; check your top next steps.',
            '0–49 · Needs attention — the good news: these are the habits with the biggest, best-evidenced payoff for change.',
          ],
        },
      },
      {
        h2: 'A worked example',
        paragraphs: [
          'Sam, 42: 60 minutes of activity a week (8/20), 3 servings of fruit & veg (7/12), ultra-processed food some days (4/8), never smoked (15/15), 5 drinks a week (8/10), 6.5 hours of sleep (9/15), high stress (0/6), some social connection (2/4), waist-to-height 0.54 (5/10). Total: 58/100 — Good.',
          'Sam’s top next steps, straight from the biggest point gaps: physical activity (+12 available), stress (+6), and sleep (+6). That’s the point of the tool — not the number, but knowing which two or three habits pay off most.',
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
        a: 'Because the score reflects habits, not biology — and the evidence says improving these habits pays off at every age. Age is collected only as context; sex is used solely to apply the correct alcohol guideline.',
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
        a: 'Each factor is anchored to public guidance: the WHO physical-activity and healthy-diet fact sheets, CDC activity and sleep guidance, and the Dietary Guidelines for Americans for alcohol. The weights themselves are editorial simplifications so the score stays transparent — they are documented on this page, not hidden.',
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
        citation: 'U.S. Dietary Guidelines for Americans — including moderation guidance on alcoholic beverages.',
        url: 'https://odphp.health.gov/our-work/nutrition-physical-activity/dietary-guidelines',
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
    seoTitle: 'Waist-Based Health Risk Calculator',
    metaDescription:
      'Combine your BMI and waist-to-height ratio into a clear, educational health-risk level. Free, metric or imperial — not a medical diagnosis.',
    intro:
      'BMI and waist size each tell part of the story; together they paint a fuller picture. Enter your measurements to see a combined, educational risk level — and what it means.',
    notice: NOTICE,
    sections: [
      {
        h2: 'Why combine BMI and waist?',
        paragraphs: [
          'BMI compares your weight to your height, but it can’t tell muscle from fat or show where fat is stored. Waist-to-height ratio fills that gap by flagging abdominal (visceral) fat — the type most strongly linked to heart disease and type 2 diabetes.',
          'Using both is more informative than either alone. Someone with a "normal" BMI but a large waist can still carry elevated risk, while a muscular person with a high BMI but a trim waist may not. This tool blends the two into a single, easy-to-read level.',
        ],
      },
      {
        h2: 'Reading your risk level',
        list: {
          intro: 'Your level reflects how far your BMI and waist-to-height ratio each sit above the healthy range:',
          items: [
            'Low — BMI under 25 and waist under half your height.',
            'Increased — one measure is moderately raised.',
            'High — both measures are raised, or one is substantially so.',
            'Very high — both BMI and waist are well above healthy levels.',
          ],
        },
      },
      {
        h2: 'What to do with the result',
        paragraphs: [
          'A higher level is a prompt to look at habits, not a verdict on your health. Even modest changes help: losing 5–10% of body weight, trimming your waist, moving more and improving diet quality all lower risk meaningfully.',
          'Crucially, this is a screening-style estimate, not a diagnosis. Many things this tool can’t see — blood pressure, cholesterol, blood sugar, family history and fitness — shape your true risk. Share any concerns with your doctor, who can run the right checks.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is a high risk level a diagnosis?',
        a: 'No. This is an educational estimate based on two body measurements. It cannot diagnose any condition. Only a healthcare professional can assess your real health risk.',
      },
      {
        q: 'Why use waist-to-height instead of waist alone?',
        a: 'Scaling waist to height makes the measure fairer across different body sizes. The simple guide is to keep your waist under half your height.',
      },
      {
        q: 'My BMI is fine but my waist is large — should I worry?',
        a: 'A large waist can signal raised risk even at a normal BMI, because abdominal fat is metabolically harmful. It’s worth discussing with your doctor.',
      },
    ],
    sources: [WHO_OBESITY, { citation: 'Ashwell M, Hsieh SD. "Six reasons why the waist-to-height ratio is a rapid and effective global indicator for health risks of obesity." Int J Food Sci Nutr. 2005;56(5):303–307.', url: pubmed('Six reasons waist-to-height ratio rapid effective global indicator') }],
  },

  // ============================================================
  'heart-disease-risk-calculator': {
    seoTitle: 'Heart Disease Risk Calculator (Educational)',
    metaDescription:
      'An educational, lifestyle-based heart disease risk estimate from age, smoking, activity, BMI and blood pressure. Not a diagnosis — see your doctor.',
    intro:
      'Several everyday factors shape your heart health. This educational tool turns them into a simple risk band, with guidance on what helps — it is not a clinical risk score or a diagnosis.',
    notice: NOTICE,
    sections: [
      {
        h2: 'What this tool does',
        paragraphs: [
          'It adds up points from five well-established lifestyle factors — age, smoking, physical activity, BMI and blood pressure — to place you in a low, moderate or elevated band. The breakdown shows how each factor contributes, so you can see what’s driving the result.',
          'This is deliberately simple and for education only. It is not the Framingham Risk Score, the ASCVD estimator, or any validated clinical tool — those also use cholesterol, diabetes status and other data, and should be run by a clinician.',
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
          'If your band is moderate or elevated, the good news is that most heart disease risk is modifiable. Not smoking, moving more, eating more whole foods and less salt, and keeping blood pressure in range can dramatically cut your real risk over time.',
          'Because this estimate leaves out key clinical data, treat it as a conversation-starter. Ask your doctor for a proper cardiovascular risk assessment, including a blood-pressure check and a cholesterol (lipid) test.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is this a real heart disease risk score?',
        a: 'No. It’s an educational, simplified estimate. Clinical scores such as Framingham or ASCVD also use cholesterol and other data and must be run by a healthcare professional.',
      },
      {
        q: 'What’s the single best thing I can do for my heart?',
        a: 'If you smoke, quitting has the biggest impact. Otherwise, regular activity, a healthy weight, good diet and controlled blood pressure all strongly protect your heart.',
      },
      {
        q: 'Should I see a doctor if my result is elevated?',
        a: 'Yes. An elevated educational band is a good reason to ask your doctor for a full cardiovascular check, including blood pressure and cholesterol testing.',
      },
    ],
    sources: [CDC_HEART, AHA_LE8],
  },

  // ============================================================
  'diabetes-risk-calculator': {
    seoTitle: 'Type 2 Diabetes Risk Calculator (Educational)',
    metaDescription:
      'An educational type 2 diabetes risk band from age, BMI, waist, family history and activity. Non-diagnostic — get a blood test from your doctor.',
    intro:
      'Type 2 diabetes often develops silently over years. This educational tool flags your risk level from a few key factors and points you toward proper screening — it cannot diagnose diabetes.',
    notice: NOTICE,
    sections: [
      {
        h2: 'How the estimate works',
        paragraphs: [
          'It scores five factors strongly linked to type 2 diabetes: age, BMI, waist-to-height ratio, family history, and physical activity. The total places you in a low, moderate or high band, and the breakdown shows each factor’s contribution.',
          'The approach is inspired by validated screening questionnaires such as FINDRISC, but it is simplified for education and is not the official test. It does not measure blood sugar — and only a blood test can.',
        ],
      },
      {
        h2: 'Why screening matters',
        paragraphs: [
          'Up to a third of people with type 2 diabetes don’t know they have it, and many more have prediabetes — higher-than-normal blood sugar that often has no symptoms. Caught early, prediabetes can frequently be reversed through diet, activity and weight loss.',
          'If your band is moderate or high, we strongly recommend asking your doctor for a simple blood test such as HbA1c or fasting glucose. It’s quick, and knowing early gives you the best chance to act.',
        ],
      },
      {
        h2: 'Lowering your risk',
        paragraphs: [
          'Risk factors like age and family history can’t be changed, but the most powerful ones can. Losing even 5–7% of body weight, being active for about 150 minutes a week, and eating more fibre and fewer refined carbohydrates substantially cut the risk of developing type 2 diabetes.',
          'This tool is a nudge toward those habits and toward a conversation with your doctor — not a diagnosis. Whatever your score, a professional screening is the only way to know your actual blood-sugar status.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can this calculator diagnose diabetes?',
        a: 'No. It is an educational risk estimate only. Diabetes and prediabetes can only be detected with a blood test ordered by a healthcare professional.',
      },
      {
        q: 'What blood test should I ask for?',
        a: 'Common screening tests are HbA1c (average blood sugar) and fasting plasma glucose. Your doctor will advise which is right for you, especially if your risk band is moderate or high.',
      },
      {
        q: 'Can type 2 diabetes risk be reduced?',
        a: 'Yes. Modest weight loss, regular activity and a higher-fibre, lower-refined-carb diet markedly reduce risk, and can even reverse prediabetes when caught early.',
      },
    ],
    sources: [CDC_DIABETES, ADA],
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
