/** Long-form, source-cited content for each Fitness tool page. */
import { pubmed, type Source, type ToolContent } from './content-types';

const COMPENDIUM: Source = {
  citation:
    'Ainsworth BE, Haskell WL, Herrmann SD, et al. "2011 Compendium of Physical Activities: a second update of codes and MET values." Med Sci Sports Exerc. 2011;43(8):1575–1581.',
  url: pubmed('2011 Compendium of Physical Activities MET values Ainsworth'),
};
const COMPENDIUM_2024: Source = {
  citation: 'Herrmann SD, Willis EA, Ainsworth BE, et al. "2024 Adult Compendium of Physical Activities: A third update of the energy costs of human activities." J Sport Health Sci. 2024;13(1):6–12.',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10818145/',
};
const WHO_SEDENTARY: Source = {
  citation: 'World Health Organization. WHO guidelines on physical activity and sedentary behaviour. 2020 — adult sedentary behaviour recommendations.',
  url: 'https://www.ncbi.nlm.nih.gov/books/NBK566046/',
};
const STEPS_2025: Source = {
  citation: 'Ding D, Nguyen B, Nau T, et al. "Daily steps and health outcomes in adults: a systematic review and dose-response meta-analysis." Lancet Public Health. 2025;10:e668–e681.',
  url: 'https://pubmed.ncbi.nlm.nih.gov/40713949/',
};
const AHA_HRMAX: Source = {
  citation: 'American Heart Association. Target Heart Rates Chart. Age-predicted heart rate values are population averages, not individual measured maxima.',
  url: 'https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates',
};
const UTH: Source = {
  citation:
    'Uth N, Sørensen H, Overgaard K, Pedersen PK. "Estimation of VO2max from the ratio between HRmax and HRrest — the Heart Rate Ratio Method." Eur J Appl Physiol. 2004;91(1):111–115.',
  url: 'https://pubmed.ncbi.nlm.nih.gov/14624296/',
};
const AHA_PULSE_VO2: Source = {
  citation: 'American Heart Association. "All About Heart Rate (Pulse)." (Resting heart rate, beta blockers, and urgent symptoms.)',
  url: 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse',
};
const HR_RATIO_LIMITS: Source = {
  citation: 'Viik et al. "Estimating Maximal Oxygen Uptake from the Ratio of Heart Rate at Maximal Exercise to Heart Rate at Rest in Middle-Aged Men." 2021. (Other populations require recalibration.)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/32777866/',
};
const BRZYCKI: Source = {
  citation:
    'Brzycki M. "Strength testing — predicting a one-rep max from reps-to-fatigue." JOPERD. 1993;64(1):88–90.',
  url: pubmed('Brzycki strength testing predicting one repetition maximum'),
};
const ONERM_VALIDITY: Source = {
  citation:
    'LeSuer DA, McCormick JH, Mayhew JL, et al. "The accuracy of prediction equations for estimating 1-RM performance in the bench press, squat, and deadlift." J Strength Cond Res. 1997;11(4):211–213.',
  url: pubmed('accuracy of prediction equations estimating 1-RM bench press squat deadlift'),
};

export const FITNESS_CONTENT: Record<string, ToolContent> = {
  // ============================================================
  'walk-it-off-calculator': {
    seoTitle: 'Walk It Off Calculator — Food to Exercise Time',
    metaDescription:
      'Explore illustrative walking, running, and cycling time using estimated extra activity energy above rest. Food is not something you must earn or burn off.',
    intro:
      'Explore approximate activity-time equivalents for a food calorie amount, calculated using energy above rest. These estimates are educational comparisons, not prescriptions for how much you need to exercise after eating.',
    sections: [
      {
        h2: 'How it works',
        paragraphs: [
          'The calculator estimates how long it could take to expend a similar number of calories above resting energy at a selected activity intensity. The formula is minutes = calories ÷ [(MET − 1) × body weight in kilograms] × 60. The resting 1 MET is subtracted so this illustration does not count energy you would have used while resting. The [2024 Adult Compendium of Physical Activities](https://pmc.ncbi.nlm.nih.gov/articles/PMC10818145/) explains the MET framework; the simplified activity values used here are population averages, not measurements of an individual.',
          'Do not interpret this as an exercise requirement or a promise that movement cancels out eating. Food intake and energy expenditure interact across days, not as a direct one-meal transaction.',
        ],
      },
      {
        h2: 'Walking vs running vs cycling',
        paragraphs: [
          'Running burns the most calories per minute, then cycling, then walking — so the same food takes far longer to walk off than to run off. But the best activity is the one you’ll actually do: a longer walk you enjoy beats a hard run you dread and skip.',
        ],
      },
      {
        h2: 'A healthier way to think about it',
        paragraphs: [
          'Exercise has huge benefits beyond burning calories, and food is about more than fuel. Use this as motivation to move, not as punishment for eating. If you’re managing weight, your overall daily calories and activity matter far more than offsetting any single food.',
        ],
      },
    ],
    faq: [
      { q: 'How long does it take to walk off a slice of pizza?', a: 'For a 70-kg adult, a 285-kcal slice corresponds mathematically to about 87 minutes of walking at 3.8 METs or 28 minutes of running at 9.8 METs above rest. These are illustrative estimates, not instructions to exercise after eating.' },
      { q: 'Is it accurate?', a: 'It is a rough activity-time comparison based on standard MET values and body weight, not a personalized measurement. Resting metabolism, movement efficiency, intensity, terrain and many other factors vary.' },
      { q: 'Should I exercise to “burn off” food?', a: 'No. Eating never creates an obligation to exercise, and activity should not be used as punishment or as a promised way to cancel out a meal. Movement has benefits unrelated to calorie balance.' },
    ],
    sources: [COMPENDIUM, COMPENDIUM_2024],
  },
  // ============================================================
  'sitting-disease-reversal-calculator': {
    seoTitle: 'Sitting & Movement Break Planner — Optional Steps and NEAT',
    metaDescription:
      'Explore optional breaks and step ideas for a sitting day. No step count guarantees reversal of sitting-related health effects; calories are approximate.',
    intro:
      'Enter your sitting hours, weight, and usual steps to explore optional movement ideas. The step increments and break cadence are illustrative heuristics, not evidence-based prescriptions, clinical categories, or a way to undo sedentary-health risk.',
    notice:
      'Educational planning only, not a validated health-risk score. Displayed calories use gross MET approximations (including rest) and can overlap when walking occurs during breaks. They are not additional calories to eat or proof of reduced disease risk.',
    sections: [
      {
        h2: 'What is “sitting disease”?',
        paragraphs: [
          '"Sitting disease" is a popular term for the health risks tied to too much sedentary time. Research links long uninterrupted sitting with higher cardiometabolic risk — and, importantly, some of that risk is independent of whether you exercise. You can be an "active couch potato": a daily workout is great, but it doesn’t fully cancel out 9+ hours of sitting the rest of the day.',
          'Moving more and sitting less can benefit health. The [WHO sedentary behaviour guidance](https://www.ncbi.nlm.nih.gov/books/NBK566046/) does not set an exact safe sitting-hour threshold or prescribe a specific break duration; make movement choices that fit your abilities and circumstances.',
        ],
      },
      {
        h2: 'How micro-breaks help',
        paragraphs: [
          'Studies that interrupt prolonged sitting every 30–60 minutes with just 2–5 minutes of light movement show improvements in things like post-meal blood sugar and blood pressure compared with sitting straight through. The muscle contractions from simply standing and walking switch on processes that idle when you’re seated.',
          'This tool illustrates one optional break cadence. It is not a validated schedule or a guarantee of improved blood sugar, blood pressure, or long-term outcomes.',
        ],
      },
      {
        h2: 'NEAT: how steps offset sitting',
        paragraphs: [
          'NEAT — non-exercise activity thermogenesis — is all the energy you burn from everyday movement that isn’t formal exercise: walking, fidgeting, taking the stairs, chores. It can vary by hundreds of calories a day between people, and it’s the easiest lever for desk workers to pull.',
          'The tool suggests roughly 3,000–4,500 steps for positive sitting-hour inputs as a planning example, not an official step target. The exact number of steps needed to reduce health risk cannot be calculated from sitting hours alone. Its calorie estimates are gross energy and may double-count walking done during movement breaks.',
        ],
      },
      {
        h2: 'Easy ways to move more at a desk',
        list: {
          items: [
            'Take phone and video calls walking or standing.',
            'Set an hourly nudge to stand, roll your shoulders, and stretch your hips.',
            'Do 10 sit-to-stands or some calf raises each break.',
            'Park further away, take the stairs, and add a lap on bathroom/coffee trips.',
            'Alternate sitting and standing if you have a height-adjustable desk — and still move.',
          ],
        },
      },
    ],
    faq: [
      { q: 'How many steps offset a day of sitting?', a: 'There is no validated number of steps that cancels out a day of sitting. WHO does not specify a universal sedentary-time cutoff or precise break cadence. This calculator offers optional planning ideas, not a formula for reversing health risk.' },
      { q: 'How often should I take a break from sitting?', a: 'Short, comfortable movement breaks may be useful. This tool illustrates 3 minutes about every 45 minutes, but WHO has not established an exact medically required interval or duration; adapt your routine to your abilities and needs.' },
      { q: 'What is NEAT?', a: 'NEAT means non-exercise activity thermogenesis: energy used in everyday movement such as walking and chores. It is not a measure of how much disease risk is reversed by activity.' },
      { q: 'Can extra steps undo the harm of too much sitting?', a: 'No number of steps guarantees that sitting-related health effects are reversed. Activity is beneficial, and reducing sedentary time where possible can help; think "move more and sit less," not "erase" a measured number of sitting hours.' },
      { q: 'Is a standing desk enough?', a: 'Standing is better than sitting still, but the bigger wins come from actually moving — breaks, steps, and light activity. Use a standing desk as a prompt to move, not a substitute for it.' },
    ],
    sources: [
      { citation: 'Dunstan DW, et al. "Breaking up prolonged sitting reduces postprandial glucose and insulin responses." Diabetes Care. 2012.', url: pubmed('Breaking up prolonged sitting reduces postprandial glucose insulin Dunstan') },
      { citation: 'Diaz KM, et al. "Patterns of sedentary behavior and mortality in US adults." Ann Intern Med. 2017.', url: pubmed('Patterns of sedentary behavior and mortality US adults Diaz') },
      { citation: 'Levine JA. "Non-exercise activity thermogenesis (NEAT)." Best Pract Res Clin Endocrinol Metab. 2002.', url: pubmed('Non-exercise activity thermogenesis NEAT Levine') },
      { citation: 'Ekelund U, et al. "Does physical activity attenuate the association between sitting time and mortality? A harmonised meta-analysis." Lancet. 2016.', url: pubmed('physical activity attenuate sitting time mortality harmonised meta-analysis Ekelund') },
      WHO_SEDENTARY,
    ],
  },
  // ============================================================
  'strength-program-builder': {
    seoTitle: 'Free 4-Week Strength Program Builder',
    metaDescription:
      'A free workout plan generator: turn your 1RM into a 4-week progressive-overload program with exact working weights, sets, reps, warm-ups and a deload.',
    intro:
      'Turn your one-rep max into a structured 4-week training block with the exact working weight for every set. Pick your lifts, goal, and training days — then progress week by week and finish with a deload.',
    notice:
      'Estimates only. Prioritize proper form, warm up thoroughly, never train through pain, and consult a qualified coach. Beginners should start conservatively and add weight slowly.',
    sections: [
      {
        h2: 'What is progressive overload?',
        paragraphs: [
          'Progressive overload is the core principle behind getting stronger or building muscle: you gradually increase the demand on your muscles over time, rather than doing the same workout forever. The most common lever is load — lifting a little more weight as you adapt — but you can also add sets, reps, or training frequency.',
          'This builder applies overload across a 4-week block by raising the intensity (percent of your 1RM) week to week, then pulling it back for a planned deload so you recover and come back stronger.',
        ],
      },
      {
        h2: 'How the 4-week program works',
        paragraphs: [
          'Everything is anchored to your one-rep max (1RM) for each lift. Each week prescribes a percentage of that 1RM, and the builder multiplies it out and rounds to the nearest loadable weight (2.5 kg or 5 lb) so you know exactly what to put on the bar.',
        ],
        list: {
          intro: 'The intensity ramps then deloads:',
          items: [
            'Strength: around 4–5 sets of 3–5 reps at 80% → 82% → 85%, with a week-4 deload near 65%.',
            'Hypertrophy: around 3–4 sets of 8–12 reps at 65% → 70% → 72%, with a week-4 deload.',
            'Beginners are capped at lower percentages and fewer sets to build the habit and protect form.',
            'Every lift includes a warm-up ramp and rest guidance.',
          ],
        },
      },
      {
        h2: 'Strength vs hypertrophy — which to pick',
        paragraphs: [
          'Choose Strength if your goal is to lift heavier: it uses higher percentages and lower reps, with longer rests. Choose Hypertrophy if your goal is muscle size: moderate percentages, higher reps, and shorter rests to keep tension on the muscle. Both use the same progressive-overload structure — they just sit at different points on the load-vs-reps scale.',
        ],
      },
      {
        h2: 'Warm up and progress safely',
        list: {
          intro: 'A few rules keep this productive and safe:',
          items: [
            'Always warm up to your working weight with the ramp shown for each lift.',
            'Add weight only when you complete all prescribed sets with good form.',
            'Leave a rep or two in reserve — you should never grind to failure on these.',
            'Never train through joint pain; stop and reassess.',
            'Take the week-4 deload — it is part of the program, not optional.',
          ],
        },
      },
      {
        h2: 'After the four weeks',
        paragraphs: [
          'When the block ends, re-test or re-estimate your 1RM (the 1RM Calculator can do this from a recent set), nudge it up by a few percent, and run the block again with the new numbers. Over several blocks this steady, structured progression adds up to real gains — far more reliably than random workouts.',
        ],
      },
    ],
    faq: [
      { q: 'Is this workout plan generator free?', a: 'Yes — completely free, no signup. Enter your 1RMs and you get a full 4-week program with exact weights you can print or download as a PDF.' },
      { q: 'How does a progressive overload calculator work?', a: 'It takes a percentage of your 1RM for each week and increases that percentage as the block progresses, so the weight on the bar climbs steadily before a deload week.' },
      { q: 'Do I need to know my one-rep max?', a: 'Yes, per lift — but you don’t need to actually max out. Estimate it from a recent set of a few reps using the free 1RM Calculator, then bring that number here.' },
      { q: 'What weight should I lift each week?', a: 'The builder shows the exact working weight (percent of your 1RM, rounded to the nearest 2.5 kg / 5 lb) for every week and lift, plus a warm-up ramp.' },
      { q: 'Is this suitable for beginners?', a: 'Yes — choose the Beginner setting and it caps intensities lower and uses fewer sets. Still, prioritize form, start light, and consider a session or two with a qualified coach.' },
    ],
    sources: [
      { citation: 'American College of Sports Medicine. "Progression Models in Resistance Training for Healthy Adults." Med Sci Sports Exerc. 2009.', url: pubmed('Progression models in resistance training for healthy adults ACSM position stand') },
      { citation: 'Schoenfeld BJ, et al. "Loading recommendations for muscle strength, hypertrophy, and local endurance." Sports Med / training reviews.', url: pubmed('Schoenfeld loading recommendations strength hypertrophy endurance') },
      BRZYCKI,
      ONERM_VALIDITY,
    ],
  },
  // ============================================================
  'running-pace-calculator': {
    seoTitle: 'Running Pace Calculator (with Splits)',
    metaDescription:
      'Calculate running pace, finish time, or distance from the other two, with cumulative split checkpoints. Converts km and miles without relabeling the run.',
    intro:
      'Enter two known quantities to calculate running pace, time or distance. Switching kilometers and miles converts the same physical run; split times assume a constant pace and are estimates, not race predictions.',
    sections: [
      {
        h2: 'How the pace calculator works',
        paragraphs: [
          'Pace, time, and distance are linked by one simple relationship: time = distance × pace. Give the calculator any two and it solves the third — your finish time from a target pace, the pace you’d need to hit a goal time, or how far you’d travel at a set pace.',
          'Pace is shown as minutes and seconds per kilometer or per mile (switch units at the top), while speed is shown in km/h or mph for comparison. Everything is calculated assuming an even effort across the whole distance.',
        ],
      },
      {
        h2: 'Using your splits',
        paragraphs: [
          'The table shows cumulative times at whole kilometers or miles at a steady pace. For distances longer than 60 units it shows the first 60 checkpoints plus the actual finish marker; the finish is never omitted. The times are mathematical pacing targets, not forecasts of an individual athlete’s race readiness.',
          'A classic strategy is the "even split" — running the second half at the same pace as the first — or a slight "negative split," finishing faster than you started. Going out too fast and fading is the most common pacing mistake, and a split sheet helps you avoid it.',
        ],
      },
      {
        h2: 'Pacing common race distances',
        paragraphs: [
          'To find a goal pace, set the calculator to "Pace," enter the race distance and your target time, and read the pace you need to hold. For example, a sub-2-hour half-marathon (21.1 km) needs about 5:41 per kilometer; a 4-hour marathon needs roughly 5:41 per kilometer too, sustained for 42.2 km.',
          'Remember that real races include hills, wind, and fatigue, so train across a range of paces rather than only your goal pace. Build endurance with easy runs, and use the calculator to set realistic, achievable targets based on your recent times.',
        ],
      },
    ],
    faq: [
      {
        q: 'How do I calculate my running pace?',
        a: 'Divide your time by your distance. This calculator does it for you — choose "Pace," enter the distance you ran and the time it took, and it returns your pace per kilometer or mile.',
      },
      {
        q: 'What is a negative split?',
        a: 'A negative split means running the second half of a race faster than the first. It’s widely considered the most efficient way to race and helps avoid burning out early.',
      },
      {
        q: 'Can I switch between kilometers and miles?',
        a: 'Yes. The km/mi toggle converts distance and minutes-per-unit pace while keeping the same physical run and projected total time. Inputs show rounded seconds; the model uses full conversion precision until you edit an input.',
      },
    ],
    sources: [
      {
        citation: 'American College of Sports Medicine. "ACSM’s Guidelines for Exercise Testing and Prescription." 11th ed. Wolters Kluwer; 2021.',
        url: pubmed('ACSM Guidelines for Exercise Testing and Prescription'),
      },
    ],
  },

  // ============================================================
  'calories-burned-calculator': {
    seoTitle: 'Calories Burned Calculator — Gross vs Above-Rest METs',
    metaDescription:
      'Estimate gross activity energy and illustrative above-rest calories for exercise using MET values, weight and duration. Includes metric/imperial inputs.',
    intro:
      'Choose an activity, weight and duration to compare estimated gross energy used during exercise with an approximate amount above standardized resting expenditure. These are population-based MET estimates, not measured personal calorie burn or a weight-loss target.',
    sections: [
      {
        h2: 'How calories burned are calculated',
        paragraphs: [
          'The original model estimates gross activity energy as MET × body mass (kg) × hours. Gross includes energy your body would expend at rest over the same period. A separately labeled, approximate above-rest figure uses (MET − 1) × kg × hours, subtracting standardized 1-MET rest; it is not an individualized net expenditure measurement.',
          'METs are standardized activity-intensity estimates from Compendium research, not a precise measurement of your metabolism. The example coefficients are retained from the original tool; observed costs vary with pace, terrain, technique and individual physiology. The 2024 Adult Compendium lists walking at 3.5–3.9 mph as approximately 4.8 MET, so the unchanged tool’s 3.5-MET walking preset is labeled walking for pleasure rather than a precise 3.5-mph pace.',
        ],
      },
      {
        h2: 'MET values for common activities',
        list: {
          intro: 'Illustrative fixed values used in this tool (not individualized pace or work-rate measurements):',
          items: [
            'Yoga ≈ 3.0, walking for pleasure ≈ 3.5',
            'Weightlifting (example intensity) ≈ 5.0, hiking ≈ 6.0',
            'Cycling (moderate) ≈ 7.5, tennis ≈ 7.3, dancing ≈ 7.8',
            'Swimming ≈ 8.0, HIIT ≈ 8.0, running (6 mph) ≈ 9.8',
            'Jumping rope ≈ 12.3 — one of the most demanding common activities',
          ],
        },
      },
      {
        h2: 'Why it’s an estimate',
        paragraphs: [
          'MET values summarize activity categories rather than measuring your metabolism. Gross energy includes rest; above-rest energy subtracts a standard resting reference, not your actual resting metabolic rate. The estimates vary with age, activity intensity, fitness, body composition, terrain and weather, and a long exercise duration is not a recommendation.',
          'Use the results to understand relative activity-energy demand, not as a prescription to compensate for food, an exercise-clearance test, or a guaranteed weight-loss prediction. The existing article on daily energy expenditure provides broader context; avoid double-counting resting energy when combining activity calories with daily totals.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a MET?',
        a: 'A MET expresses the estimated metabolic demand of an activity relative to a standardized 1-MET resting reference. The calculator’s 8-MET example gives gross activity energy of roughly eight times that reference, not eight times each individual’s measured resting rate.',
      },
      {
        q: 'Does body weight affect calories burned?',
        a: 'Body weight is part of the original MET estimate, so two different entered weights give different gross and approximate above-rest calculations. This is a simplified model, not an individual measurement of walking efficiency or body composition.',
      },
      {
        q: 'How accurate is the calorie estimate?',
        a: 'The values are illustrative, not measured personal calories. Gross includes estimated energy at rest; the above-rest figure subtracts a standardized 1 MET and is still approximate. Use both only to compare activity assumptions, not to prescribe exercise or offset a meal.',
      },
    ],
    sources: [
      COMPENDIUM,
      {
        citation: 'Herrmann SD, et al. The 2024 Adult Compendium of Physical Activities: A third update of the energy costs of human activities. J Sport Health Sci. 2024.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38242596/',
      },
      {
        citation: '2024 Compendium of Physical Activities. Walking activity codes and MET values.',
        url: 'https://pacompendium.com/walking/',
      },
    ],
  },

  // ============================================================
  'one-rep-max-calculator': {
    seoTitle: 'One-Rep Max Calculator (Epley & Brzycki)',
    metaDescription:
      'Estimate your one-rep max from a set with the Epley and Brzycki formulas, plus a 50–100% training table. Free 1RM calculator, no signup.',
    intro:
      'Estimate a one-rep maximum from a completed multi-repetition set without attempting a risky true max. Enter the load and whole reps; for a single completed rep, this tool shows the lifted load, which is not necessarily a true maximum. Percentage loads are planning examples, not a training prescription.',
    sections: [
      {
        h2: 'How your 1RM is estimated',
        paragraphs: [
          'The tool uses two widely studied prediction formulas for sets of 2–15 reps: Epley = lifted weight × (1 + reps / 30); Brzycki = lifted weight × 36 / (37 − reps). These were developed for challenging sets near repetition failure. For one completed repetition, no extrapolation is made, because a successful single does not prove it was maximal.',
          'Estimates become more uncertain as repetition counts increase. A study of bench-press and leg-press prediction found that linear equations should not use more than 10 reps in those movements. The calculator still allows 11–15 whole reps for comparison but displays a caution. Controlled low-rep working sets can be informative; do not train to failure or attempt a true maximum solely for a calculator.',
        ],
      },
      {
        h2: 'Training with percentages of your 1RM',
        paragraphs: [
          'Some strength programs organize loads by percentage of an estimated 1RM. Actual repetition capacity and adaptation vary by exercise and individual; the displayed 50–100% table is an arithmetic planning reference, not a guarantee of how many reps you can complete or an instruction to lift a particular weight.',
          'Record which exercise, equipment and load produced the estimate. A percentage table cannot determine an individually safe working weight; use appropriate technique, gradual progression and conservative loads instead of chasing the highest calculated figure.',
        ],
      },
      {
        h2: 'Lifting safely',
        paragraphs: [
          'An estimated 1RM is a planning tool, not a target to chase recklessly. True maximal attempts carry real injury risk and should only be done with proper warm-up, good technique and a spotter — which is exactly why estimating from a submaximal set is so useful.',
          'Always warm up thoroughly, keep your form strict, and increase load gradually. If a weight feels wrong, stop. Beginners in particular gain plenty from moderate weights and don’t need to test true maxes.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a one-rep max?',
        a: 'Your one-rep max (1RM) is the heaviest weight you can lift for a single repetition of an exercise with good form. It’s the standard benchmark for maximal strength.',
      },
      {
        q: 'Which is better, Epley or Brzycki?',
        a: 'Both are commonly studied but can differ by rep count and exercise. For 80 kg × 5, Epley predicts 93.3 kg while Brzycki predicts 90 kg; they coincide mathematically at 10 reps, and Brzycki rises above Epley for some longer sets. Neither provides a guaranteed true maximum.',
      },
      {
        q: 'How often should I recalculate my 1RM?',
        a: 'About every four to six weeks is a practical, optional training-log interval, not a medical schedule. Recalculate only when you have a comparable recent set with sound technique; neither estimate should determine a mandatory heavy lift.',
      },
    ],
    sources: [
      BRZYCKI,
      ONERM_VALIDITY,
      {
        citation: 'Reynolds JM, Gordon TJ, Robergs RA. Prediction of one repetition maximum strength from multiple repetition maximum testing and anthropometry. J Strength Cond Res. 2006.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16937972/',
      },
    ],
  },

  // ============================================================
  'ffmi-calculator': {
    seoTitle: 'FFMI Calculator — Fat-Free Mass Index for Athletes',
    metaDescription:
      'Calculate your Fat-Free Mass Index (FFMI) and height-normalized FFMI. A useful fitness metric for lifters and athletes — not a medical diagnosis.',
    intro:
      'FFMI estimates fat-free mass relative to height. Enter weight, height and estimated body-fat percentage to see raw FFMI, site-adjusted FFMI and estimated fat-free and fat mass, without nonvalidated population grades.',
    notice:
      'Educational body-composition estimate only, not a diagnosis, skeletal-muscle measurement, anabolic-steroid screen, or fitness percentile. Body-fat estimates vary; the Body Fat Calculator is also an estimate.',
    sections: [
      {
        h2: 'What is FFMI?',
        paragraphs: [
          'FFMI is estimated fat-free mass divided by height in meters squared; BMI uses total body weight. Fat-free mass includes muscle but also body water, bone, blood and organs. FFMI alone cannot establish metabolic health, strength or how much skeletal muscle a person carries.',
          'Normalized FFMI applies this website’s published 6.1 × (1.80 − height in meters) correction. It does not make different ages, sexes or body-composition measurement methods directly comparable. The original small male-athlete study used 6.3 instead.',
        ],
      },
      {
        h2: 'How the calculation works',
        paragraphs: [
          'First we subtract your fat mass from your total weight to get lean body mass (LBM). Then we divide LBM by height² to get FFMI. The normalized version adds 6.1 × (1.8 − height in meters) to correct for stature.',
        ],
        list: {
          intro: 'The formulas are:',
          items: [
            'LBM = weight × (1 − body fat %)',
            'FFMI = LBM ÷ height(m)²',
            'Normalized FFMI = FFMI + 6.1 × (1.8 − height m)',
          ],
        },
      },
      {
        h2: 'Reading your result',
        paragraphs: [
          'There is no universal FFMI grade suitable for all adults. A study of 5,635 Swiss adults found median raw FFMI values of 18.9 among younger adult men and 15.4 among younger adult women; these describe the study population, not clinical targets. The often-quoted value of 25 came from normalized FFMI in a small study of male athletes and cannot establish steroid use.',
          'FFMI is best used to track your own progress over time, not to compare yourself to outliers online.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a good FFMI?',
        a: 'There is no single medically validated good FFMI. Research percentiles differ by sex, age and population, with medians of 18.9 for younger adult men and 15.4 for younger adult women in one Swiss study. This tool does not collect sex or age and therefore does not assign an average grade or percentile. Compare results using a consistent method.',
      },
      {
        q: 'Why normalize FFMI for height?',
        a: 'The normalized score uses this website’s documented coefficient 6.1 for the height adjustment, not the 6.3 used in the original athlete study. Neither coefficient corrects for sex, age, measurement error or differences in anatomy.',
      },
      {
        q: 'Can FFMI tell if someone is natural?',
        a: 'No. A normalized score near 25 appeared in a small observational study of male athletes, not as an established universal limit. Body-fat uncertainty, hydration and genetics affect individual results. Do not use FFMI to accuse or medically classify another person.',
      },
      {
        q: 'How do I estimate body-fat percentage?',
        a: 'You can use the Body Fat Calculator here, which estimates body fat from a few tape measurements, or a reliable smart scale, DEXA scan, or skinfold callipers for a more accurate number.',
      },
    ],
    sources: [
      {
        citation: 'Schutz Y, Kyle UU, Pichard C. "Fat-free mass index and fat mass index percentiles in Caucasians aged 18–98 y." Int J Obes Relat Metab Disord. 2002.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/12080449/',
      },
      {
        citation: 'Kouri EM, Pope HG Jr, Katz DL, Oliva P. "Fat-free mass index in users and nonusers of anabolic-androgenic steroids." Clin J Sport Med. 1995.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/7496846/',
      },
    ],
  },
  // ============================================================
  'recovery-time-calculator': {
    seoTitle: 'Recovery Time Calculator — Rest Between Workouts',
    metaDescription:
      'Explore a site-defined recovery planning estimate for hard workouts. Understand limits, effort, sleep and soreness; not a validated healing timer.',
    intro:
      'Compare workouts, perceived effort, sleep and soreness using an illustrative recovery-planning range. This site-defined formula does not measure muscle repair or determine when an injury has healed.',
    notice:
      'Do not rely on a numeric recovery time if soreness limits normal movement. Stop hard training for severe or worsening pain and seek medical evaluation; marked swelling, significant weakness or dark urine after intense exertion requires urgent assessment. This tool cannot diagnose injuries.',
    sections: [
      {
        h2: 'How recovery time is estimated',
        paragraphs: [
          'This calculator starts with site-defined example times (48 hours for heavy resistance, 36 for HIIT, 30 for steady endurance, and 18 for light activity). Those category numbers are modeling assumptions, not trial-derived measurements of when an individual has fully recovered. A common training guideline is to separate hard sessions for the same muscle group by about 48 hours, but demanding endurance events and unusual loads can require more rest.',
          'The estimator applies fixed adjustments for perceived effort (RPE), session duration, training experience, sleep and mild/moderate soreness. Its plus-or-minus 15 percent margin is a display rule chosen by the site, not a statistically measured prediction interval. It does not issue numeric estimates when soreness severely affects normal movement.',
        ],
      },
      {
        h2: 'What changes your recovery',
        list: {
          intro: 'The five factors and how they move the estimate:',
          items: [
            'Intensity (RPE): hard exercise can increase fatigue, but a reported effort score does not directly quantify muscle injury or time to heal.',
            'Duration: longer sessions may add fatigue, but duration and difficulty must be considered together rather than mapping every extra minute to a known recovery requirement.',
            'Training age: unfamiliar training often produces greater soreness; experienced athletes may still need substantial recovery after demanding or high-volume sessions.',
            'Sleep: inadequate or disrupted sleep can impair performance and perceived readiness; the calculator cannot measure how much muscle repair happened during any sleep stage.',
            'Soreness (DOMS): soreness alone cannot establish tissue damage or full recovery. Severe pain that limits movement needs assessment instead of a clock-based estimate.',
          ],
        },
      },
      {
        h2: 'Tips to recover faster',
        list: {
          intro: 'Recovery is not just waiting — you can actively improve it:',
          items: [
            'Prioritize adequate sleep and a consistent schedule; many adults need about 7–9 hours. The Sleep Debt Calculator helps review sleep patterns, not biological repair time.',
            'Eat enough protein spread across the day — aim for 0.25 g per kg per meal, 3–4 meals. Use the Protein Intake Calculator to find your target.',
            'Stay hydrated — even mild dehydration increases perceived effort and slows recovery. Use the Water Intake Calculator for your daily target.',
            'Use active recovery — light walking, cycling, or mobility work on rest days increases blood flow without adding damage.',
            'Manage total training load — if you are constantly under-recovered, you may be doing too much, too often.',
          ],
        },
      },
      {
        h2: 'Listening to your body',
        paragraphs: [
          'No calculator can replace your own feedback. The most reliable signs that you are ready to train hard again: soreness is fading, your heart rate and perceived effort on a warm-up set feel normal, and your motivation is high.',
          'Conversely, if your resting heart rate is elevated, you feel sluggish or weak, or performance drops from your last session, those are signs to rest longer. Pushing through persistent fatigue does not speed up progress — it tends to slow it down or lead to injury.',
        ],
      },
    ],
    faq: [
      {
        q: 'How many rest days between training the same muscle group?',
        a: 'About 48 hours between demanding sessions of the same muscle group is a useful starting guideline, not a guarantee of readiness. The calculator adjusts a site-defined planning number using self-reported inputs; it does not measure muscle healing or prescribe an exact return date.',
      },
      {
        q: 'Can I train while still sore?',
        a: 'Mild soreness may allow easier movement or work for a different muscle group. If soreness is severe enough to limit normal movement, the calculator deliberately withholds a time estimate: avoid hard exercise of the affected area and seek professional advice for severe or worsening pain, swelling or weakness.',
      },
      {
        q: 'Does sleep really affect muscle recovery?',
        a: 'Sleep matters for energy, performance and recovery, but an individual night of sleep does not map to a proven number of muscle-repair hours. The tool uses a transparent, unvalidated sleep adjustment and should not be treated as a physiological measurement.',
      },
      {
        q: 'Why do beginners need more recovery?',
        a: 'A new or unfamiliar exercise may cause more soreness before you adapt (the repeated-bout effect). Training experience alone cannot predict recovery time: high volume, intensity, illness and sleep disruption can affect experienced athletes too.',
      },
    ],
    sources: [
      {
        citation: 'American College of Sports Medicine. "Progression Models in Resistance Training for Healthy Adults." Med Sci Sports Exerc. 2009.',
        url: pubmed('Progression models in resistance training for healthy adults ACSM position stand'),
      },
      {
        citation: 'Helms J, Arsenault J, Trexler E, Fitschen P. ' +
          '"Recommendations for natural bodybuilding contest preparation: nutrition and supplementation." J Int Soc Sports Nutr. 2014.',
        url: pubmed('Recommendations natural bodybuilding contest preparation nutrition Helms'),
      },
      {
        citation: 'Dattilo M, Antunes HK, Medeiros A, et al. ' +
          '"Sleep and muscle recovery: endocrinological and behavioral basis." Med Hypotheses. 2011.',
        url: pubmed('Sleep muscle recovery endocrinological behavioral basis Dattilo'),
      },
      {
        citation: 'Cleveland Clinic. Delayed Onset Muscle Soreness (DOMS): What It Is & Treatment. Updated December 19, 2025.',
        url: 'https://my.clevelandclinic.org/health/diseases/delayed-onset-muscle-soreness',
      },
      {
        citation: 'CDC/NIOSH. Signs and Symptoms of Rhabdomyolysis. Updated October 28, 2026.',
        url: 'https://www.cdc.gov/niosh/rhabdo/signs-symptoms/',
      },
    ],
  },
  // ============================================================
  'push-up-test-calculator': {
    seoTitle: 'Push-Up Test Calculator — Score by Age & Sex Norms',
    metaDescription:
      'Compare whole-repetition push-up scores with ACSM age- and protocol-specific reference categories for adults 20–69. Learn how to test, train, and retest safely.',
    intro:
      'The push-up test measures upper-body muscular endurance. To compare your result with the ACSM adult reference categories, men perform standard toe-supported push-ups and women perform modified knee-supported push-ups. Those are different testing protocols, not equivalent physical workloads. Enter whole repetitions; ages outside 20–69 receive a raw score without an age-based rating.',
    notice:
      'Educational fitness self-assessment, not a medical test. Stop for chest pain, faintness, unusual severe breathlessness, palpitations, or sharp joint pain; call emergency services for persistent chest pain or suspected heart attack symptoms. Do not attempt a maximal test against medical advice.',
    sections: [
      {
        h2: 'How to do the test properly',
        paragraphs: [
          'Follow the exact protocol for the reference category you select. The ACSM method starts men in a standard toe-supported push-up and women in a modified knee-supported push-up. Keep the back aligned, lower until the chin reaches the mat without resting the abdomen on it, and press to fully straightened elbows. Count only complete repetitions; do not compare knee-supported and toe-supported scores as equivalent.',
          'Warm up gently with shoulder movement and a few comfortable practice repetitions. The ACSM test counts consecutive proper repetitions without rest; stop if you cannot maintain correct technique. If you have shoulder or wrist pain, recent surgery, known cardiovascular disease, or exercise restrictions, ask a qualified clinician whether maximal testing is appropriate.',
        ],
      },
      {
        h2: 'Reading your reference category (not a percentile)',
        paragraphs: [
          'The ACSM 10th-edition Table 4.11 groups adults ages 20–69 into Poor, Fair, Good, Very good, and Excellent based on their age and the correct test protocol. These descriptive categories are not exact percentiles and do not establish medical risk, overall fitness, or a specific health benefit. For ages 15–19 or 70 and older, the calculator preserves your repetition count but does not invent a category.',
          'An age-reference category is only meaningful when the test is performed in the same way as its source. A female user who performs full toe-supported push-ups can track that achievement, but should not interpret those repetitions using this modified-knee reference table. Focus on pain-free, repeatable technique and progress over time rather than using a label as a judgment of health.',
        ],
      },
      {
        h2: 'How to improve your push-up score',
        list: {
          intro: 'The most effective strategies:',
          items: [
            'Train push-ups 2–3 times per week — frequency drives adaptation more than marathon sets.',
            'Use progressive overload: add 1–2 reps per session, or add a weighted vest or resistance band once bodyweight sets of 15+ are easy.',
            'Supplement with bench press and overhead press to build the triceps, chest, and shoulder strength that push-ups demand.',
            'Include triceps dips and plank holds to strengthen the lockout position and core stability.',
            'Use the Strength Program Builder to turn your current max into a structured 4-week progression.',
          ],
        },
      },
      {
        h2: 'When to retest',
        paragraphs: [
          'Retest every 4–6 weeks under the same conditions: same time of day, same warm-up, same surface. Progress in muscular endurance is real but gradual — testing too often just measures daily variation.',
          'Progress depends on practice, sleep, recovery, body mass, and how consistently you repeat the test. If your score stalls, review form and recovery before adding workload; avoid increasing intensity when joint pain persists.',
        ],
      },
    ],
    faq: [
      {
        q: 'What counts as a proper push-up rep?',
        a: 'Keep the back aligned, lower until the chin reaches the mat without resting the abdomen, and press to full elbow extension. ACSM reference testing uses toe-supported reps for men and modified knee-supported reps for women. Do not count half-range reps or rest between repetitions.',
      },
      {
        q: 'Can women do the standard push-up test?',
        a: 'Yes, women may train and perform full standard push-ups. But the ACSM female comparison in this calculator is based on modified push-ups from the knees. Full and modified repetitions are not interchangeable; for this reference result, use the test protocol shown for the selected sex, or simply track the full repetition count separately without treating its category as validated.',
      },
      {
        q: 'Why does the norm change with age?',
        a: 'Muscular endurance naturally declines with age as muscle mass and neural efficiency decrease. The norms account for this — a "Good" score at 55 is lower in absolute reps than at 25, but represents the same relative fitness for your age group.',
      },
      {
        q: 'Is the push-up test safe?',
        a: 'For most healthy adults, yes. But stop immediately if you feel chest pain, dizziness, irregular heartbeat, or severe shortness of breath. These are not signs of effort — they are red flags that need medical evaluation. If you have heart disease risk factors, check with your doctor before maximal-effort testing.',
      },
    ],
    sources: [
      { citation: 'ACSM Guidelines for Exercise Testing and Prescription, 10th ed., Table 4.11 (2018), adult age- and protocol-specific reference categories.', url: 'https://www.exercisescienceacademy.online/_files/ugd/86c999_6c889a821c004e86bd71c8e3debfab50.pdf' },
      { citation: 'Development of a Standard Push-up Scale for College-Aged Females (2022), discussion of standard vs modified push-up protocols.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9362895/' },
      {
        citation: 'American College of Sports Medicine. "ACSM\'s Health-Related Physical Fitness Assessment Manual." 5th ed. Lippincott Williams & Wilkins; 2021.',
        url: pubmed('ACSM Health-Related Physical Fitness Assessment Manual push-up test norms'),
      },
      {
        citation: 'American College of Sports Medicine. "ACSM\'s Guidelines for Exercise Testing and Prescription." 11th ed. Wolters Kluwer; 2021.',
        url: pubmed('ACSM Guidelines Exercise Testing Prescription muscular fitness push-up'),
      },
    ],
  },
  // ============================================================
  'flexibility-mobility-score': {
    seoTitle: 'Flexibility & Mobility Score — At-Home Test Battery',
    metaDescription:
      'Check four at-home movements with a 9-point raw tally and transparent, site-defined adjusted index out of 10. Educational, not clinical norms.',
    intro:
      'Four at-home movement checks — sit-and-reach, shoulder, ankle, and hip mobility — yield up to 9 raw points and an illustrative age-adjusted index out of 10. No sex-dependent formulas, diagnostic claims, or validated population norms are used.',
    notice:
      'Never force movement or stretch through pain. Sharp pain means stop. This site-defined educational index and its age bonus are not a clinical assessment, validated age/sex norms, or injury-risk prediction.',
    sections: [
      {
        h2: 'The four tests',
        paragraphs: [
          'Each test targets a different area that commonly tightens from sitting, training, or aging. You do not need any equipment — a wall, the floor, and your own body are enough.',
        ],
        list: {
          intro: 'How to do each one:',
          items: [
            'Sit-and-reach (hamstrings): Sit on the floor, legs straight, feet flat against a wall or box. Reach forward along your legs. Where do your fingertips reach?',
            'Shoulder mobility (zipper test): Reach one arm over your shoulder and down your back; reach the other up your back from below. Can your fingertips touch or overlap?',
            'Ankle mobility (knee-to-wall): Stand facing a wall, one foot 10 cm back. Keeping the heel down, drive the knee toward the wall. Does it touch? Move to 12 cm and try again.',
            'Hip mobility (deep squat): With feet shoulder-width, squat as low as possible. Can you reach a full deep squat with heels down and chest upright?',
          ],
        },
      },
      {
        h2: 'How the score works',
        paragraphs: [
          'Each test earns points: the sit-and-reach is scored 0–3 (can\'t reach toes → palms flat), and the shoulder, ankle, and hip tests are each scored 0–2 (fail → pass). The maximum raw score is 9.',
          'The four observed tasks total up to 9 raw points. The website then adds an illustrative +0.5 points for ages 40–49 or +1 for ages 50+, making the displayed adjusted index out of 10. This bonus and the five descriptive bands are site-defined heuristics, not validated age- or sex-specific population norms. Use the four task results to track your own comfortable movement over time.',
        ],
      },
      {
        h2: 'Reading your per-area breakdown',
        paragraphs: [
          'The bars show each area individually, colored by how you scored. Red or amber areas are where to focus your work; green and blue areas are strengths to maintain.',
          'Most people who sit for long hours will find their hip flexors, hamstrings, and ankles are the tightest. Desk workers in particular benefit from daily hip and chest mobility work — the Sitting Disease Reversal Calculator can help you build movement into your day.',
        ],
      },
      {
        h2: 'How to improve',
        list: {
          intro: 'Targeted suggestions based on your weakest areas:',
          items: [
            'Hamstrings: seated forward fold and standing hamstring stretch. Hold 30 seconds × 3 reps, daily.',
            'Shoulders: doorway chest stretch, thread-the-needle, and wall slides. 2 sets daily.',
            'Ankles: wall calf stretch, ankle circles, and foam rolling. 2 sets daily.',
            'Hips: 90/90 hip stretch, deep squat hold, and couch hip flexor stretch. 2 sets daily.',
            'Consistency beats intensity: 10 minutes of daily mobility work outperforms one long stretching session per week.',
          ],
        },
      },
    ],
    faq: [
      {
        q: 'How often should I test my mobility?',
        a: 'Every 4–6 weeks, under the same conditions (same time of day, same warm-up). Mobility changes gradually — testing more often just measures daily variation, which is affected by sleep, temperature, and recent activity.',
      },
      {
        q: 'Should I stretch before or after exercise?',
        a: 'Do dynamic mobility (leg swings, arm circles, deep squat holds) before exercise to prepare joints. Save static stretching (holding a stretch 30+ seconds) for after exercise or as a standalone session, when muscles are warm.',
      },
      {
        q: 'Why does flexibility decline with age?',
        a: 'Connective tissue loses elasticity, and years of sitting and repetitive movement create adaptive shortening in certain muscles. The good news: regular stretching and mobility work can maintain and even restore range of motion at any age.',
      },
      {
        q: 'Is it normal to feel tight on one side but not the other?',
        a: 'Yes — asymmetry is common, especially if you have a dominant side or favor one leg in sport. Work the tighter side a little more to bring it toward symmetry, which helps prevent injury.',
      },
    ],
    sources: [
      {
        citation: 'American College of Sports Medicine. "ACSM\'s Guidelines for Exercise Testing and Prescription." 11th ed. Wolters Kluwer; 2021. (Flexibility assessment and norms.)',
        url: pubmed('ACSM Guidelines Exercise Testing Prescription flexibility assessment sit and reach'),
      },
      {
        citation: 'American Alliance for Health, Physical Education, Recreation and Dance. "Health-Related Physical Fitness Test Manual." (Sit-and-reach norms.)',
        url: pubmed('sit and reach test norms flexibility AAHPERD'),
      },
      {
        citation: 'Page P, Frank CC, Lardner R. "Assessment and Treatment of Muscle Imbalance: The Janda Approach." Human Kinetics; 2010.',
        url: pubmed('Assessment Treatment Muscle Imbalance Janda Approach Page'),
      },
    ],
  },
  // ============================================================
  'steps-to-calories-calculator': {
    seoTitle: 'Steps to Calories & Distance Calculator',
    metaDescription:
      'Convert steps to approximate walking distance, gross energy and above-rest energy from height and weight. Kilometers or miles; no measured calorie claims.',
    intro:
      'Enter a whole-number step count from one walk or a full day, plus height and weight. See estimated distance, gross walking calories and approximate above-rest energy. These are model outputs, not measured active calories.',
    sections: [
      {
        h2: 'From steps to distance',
        paragraphs: [
          'Distance is approximated by multiplying steps by a population-derived step-length shortcut: height × 0.413 for women, or × 0.415 for men. Actual step length can differ; a measured route or calibrated device provides a more personal distance estimate.',
          'Taller people cover more ground per step, so two people taking 10,000 steps can walk noticeably different distances. Using your own height makes the estimate far more personal than a generic "2,000 steps per mile" rule.',
        ],
      },
      {
        h2: 'From steps to calories',
        paragraphs: [
          'This fixed model assumes 4.8 km/h (about 3 mph), 3.5 MET, and every reported step is level walking. Gross kcal = 3.5 × body mass (kg) × estimated hours, including simplified resting energy. Estimated above-rest kcal = (3.5 − 1) × kg × hours, shown separately. Neither value is a measurement of your actual calorie use.',
          'Your actual walking pace, slope, load, stops and gait can change the energy cost per step. The model cannot detect them or confirm the exact time walked. The gross kcal figure should not automatically be added to a food budget that already includes daily activity.',
        ],
      },
      {
        h2: 'How many steps should you aim for?',
        paragraphs: [
          'The popular 10,000-step daily goal is optional, not a medical requirement. Published adult step-per-day bands describe full-day totals, not the steps from one walking session; none is a clinical diagnosis or a personalized safe exercise target.',
          'The original adult pedometer categories describe fewer than 5,000 steps/day as sedentary, 5,000–7,499 as low active, 7,500–9,999 somewhat active, 10,000–12,499 active and 12,500 or more highly active. Increase gradually from your own starting level rather than treating a band as a health verdict.',
        ],
      },
    ],
    faq: [
      {
        q: 'How many calories does 10,000 steps burn?',
        a: 'For the calculator’s 72 kg, 170 cm male example, 10,000 steps produce about 370 gross kcal under the assumed walking pace and MET. Actual gross and additional above-rest calories vary with gait, terrain, pace and individual circumstances.',
      },
      {
        q: 'How is distance from steps calculated?',
        a: 'It multiplies your step count by your stride length, estimated as height × 0.413 (women) or × 0.415 (men). Taller people cover more distance per step.',
      },
      {
        q: 'Are 10,000 steps a day necessary?',
        a: 'No. It is an optional goal, not a medical threshold. Gradual progress from your own baseline is useful, and adult step-count categories only apply to full-day totals, not one walk or a health diagnosis.',
      },
    ],
    sources: [
      COMPENDIUM,
      {
        citation: 'Tudor-Locke C, Bassett DR. How many steps/day are enough? Preliminary pedometer indices for public health. Sports Med. 2004.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/14715035/',
      },
      {
        citation: 'Herrmann SD, et al. 2024 Adult Compendium of Physical Activities: a third update. J Sport Health Sci. 2024.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10818145/',
      },
    ],
  },

  // ============================================================
  'vo2-max-calculator': {
    seoTitle: 'VO₂ Max Calculator (Heart Rate Method)',
    metaDescription:
      'Get a rough VO₂ max estimate from your age and resting heart rate using the Uth–Sørensen heart-rate ratio. An illustration, not a lab test or fitness grade.',
    intro:
      'VO₂ max is a measure of maximal oxygen uptake. This calculator estimates it indirectly from age and resting pulse, not from a laboratory test; the result is a number with its inputs shown, not a fitness grade, fitness age or clinical assessment.',
    notice:
      'For adults 18+. The underlying HR-ratio estimate was studied in well-trained men aged 21–51 and is not equally validated for other ages, sexes or conditions. A very low or high resting pulse, medications or an irregular rhythm can distort the estimate. Call emergency services for chest pain, severe breathlessness, fainting or other serious new symptoms.',
    sections: [
      {
        h2: 'How this estimate works',
        paragraphs: [
          'This tool uses the Uth–Sørensen heart-rate ratio: VO₂ max ≈ 15.3 × (estimated maximum heart rate ÷ resting heart rate), with maximum heart rate approximated as 220 − age. The original study examined 46 well-trained men aged 21–51, so accuracy for other ages, sexes, fitness levels and medication use is uncertain. A lower resting pulse may reflect training, medicines or a medical condition; it does not automatically prove better fitness.',
          'The result is expressed in milliliters of oxygen per kilogram per minute (mL/kg/min). It is a rough numerical estimate rather than a direct metabolic measurement. Resting pulse near or above age-predicted maximum cannot support a meaningful ratio, so that input combination is not graded.',
        ],
      },
      {
        h2: 'What your number means',
        paragraphs: [
          'Laboratory-measured VO₂ max describes aerobic oxygen uptake. This calculator does not grade the estimate against sex- or age-adjusted reference values, and it does not compute a fitness age. A predicted VO₂ max must not be treated as a validated norm for an individual; it can change simply because resting pulse changes.',
          'Measured cardiorespiratory fitness has been associated with long-term outcomes in research, but this two-input estimate does not independently predict an individual person’s lifespan, disease status or biological age.',
        ],
      },
      {
        h2: 'Improving your VO₂ max',
        paragraphs: [
          'Aerobic activity can improve cardiovascular fitness over time. Very demanding intervals are not necessary for every person and should not be treated as a prescription based on a calculated VO₂ max or a predicted maximum heart rate.',
          'For consistent tracking, measure resting pulse after waking under similar conditions over several mornings. Changes in medication, illness, hydration and rhythm can change the computed score independently of measured oxygen uptake; if your pulse is repeatedly unusually low, high or irregular, seek professional guidance.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a good VO₂ max?',
        a: 'Reference values for measured VO₂ max vary with age, sex and testing methods. This two-input calculator does not apply validated age- and sex-specific norms, so it does not label your result as good or poor.',
      },
      {
        q: 'How accurate is the heart-rate VO₂ max estimate?',
        a: 'It uses a heart-rate ratio originally tested in well-trained men aged 21–51. Replacing measured maximum pulse with 220 minus age and applying the same factor to other populations adds uncertainty; laboratory gas-analysis testing is a different level of evidence.',
      },
      {
        q: 'How can I improve my VO₂ max?',
        a: 'Regular appropriately paced aerobic activity can help improve capacity; build progressively. High-intensity intervals are not necessary for everyone, and exertional symptoms or heart conditions require individualized advice.',
      },
    ],
    sources: [UTH, HR_RATIO_LIMITS, AHA_HRMAX, AHA_PULSE_VO2],
  },
};
