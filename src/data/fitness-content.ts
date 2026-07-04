/** Long-form, source-cited content for each Fitness tool page. */
import { pubmed, type Source, type ToolContent } from './content-types';

const COMPENDIUM: Source = {
  citation:
    'Ainsworth BE, Haskell WL, Herrmann SD, et al. "2011 Compendium of Physical Activities: a second update of codes and MET values." Med Sci Sports Exerc. 2011;43(8):1575–1581.',
  url: pubmed('2011 Compendium of Physical Activities MET values Ainsworth'),
};
const UTH: Source = {
  citation:
    'Uth N, Sørensen H, Overgaard K, Pedersen PK. "Estimation of VO2max from the ratio between HRmax and HRrest — the Heart Rate Ratio Method." Eur J Appl Physiol. 2004;91(1):111–115.',
  url: pubmed('Estimation of VO2max ratio HRmax HRrest Heart Rate Ratio Method Uth'),
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
      'How long to walk off that food? Enter a food or calories and your weight to see the minutes of walking, running, or cycling to burn it. Free.',
    intro:
      'Ever wondered how long you’d have to move to burn off a treat? Pick a food (or enter calories) and your weight to see the minutes of walking, running, or cycling it takes.',
    sections: [
      {
        h2: 'How it works',
        paragraphs: [
          'The calculator takes the calories in your chosen food and works out how long each activity would take to burn that many calories for someone your weight, using standard MET (metabolic equivalent) values. Heavier people burn a little more per minute, so the time is personalized to you.',
          'It’s a fun, eye-opening way to picture energy balance — not a rule that you must "earn" every bite.',
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
      { q: 'How long does it take to walk off a slice of pizza?', a: 'A ~285-calorie slice takes most people roughly 60–75 minutes of brisk walking, or about 30 minutes of running — the exact time depends on your weight and pace.' },
      { q: 'Is it accurate?', a: 'It’s a solid estimate based on MET values and your body weight. Real burn varies with intensity, fitness, and terrain, so treat the numbers as a ballpark.' },
      { q: 'Should I exercise to “burn off” food?', a: 'It’s fine as motivation, but try not to treat exercise as punishment. Movement is valuable on its own, and overall habits matter more than any single food.' },
    ],
    sources: [COMPENDIUM],
  },
  // ============================================================
  'sitting-disease-reversal-calculator': {
    seoTitle: 'Sitting Disease Calculator – Offset Sitting (NEAT)',
    metaDescription:
      'Sitting too much? Get a personalized movement recipe — micro-breaks and extra daily steps (NEAT) to offset desk time, plus calories reclaimed. Free.',
    intro:
      'Long days at a desk add up. Enter your sitting hours, weight, and step count to get a personalized "movement recipe" — how often to break, how many extra steps to add, and the calories you’d reclaim.',
    notice:
      'General wellness education, not medical advice. Calorie figures are rough estimates that assume an average walking pace. If you have a health condition, check with a professional before changing your activity.',
    sections: [
      {
        h2: 'What is “sitting disease”?',
        paragraphs: [
          '"Sitting disease" is a popular term for the health risks tied to too much sedentary time. Research links long uninterrupted sitting with higher cardiometabolic risk — and, importantly, some of that risk is independent of whether you exercise. You can be an "active couch potato": a daily workout is great, but it doesn’t fully cancel out 9+ hours of sitting the rest of the day.',
          'The encouraging part is that how you sit matters as much as how long. Breaking sitting into shorter chunks, and adding everyday movement, meaningfully changes the picture.',
        ],
      },
      {
        h2: 'How micro-breaks help',
        paragraphs: [
          'Studies that interrupt prolonged sitting every 30–60 minutes with just 2–5 minutes of light movement show improvements in things like post-meal blood sugar and blood pressure compared with sitting straight through. The muscle contractions from simply standing and walking switch on processes that idle when you’re seated.',
          'This calculator turns that into a simple cadence: a target number of short breaks across your sitting hours, and how many minutes that puts you on your feet each day.',
        ],
      },
      {
        h2: 'NEAT: how steps offset sitting',
        paragraphs: [
          'NEAT — non-exercise activity thermogenesis — is all the energy you burn from everyday movement that isn’t formal exercise: walking, fidgeting, taking the stairs, chores. It can vary by hundreds of calories a day between people, and it’s the easiest lever for desk workers to pull.',
          'A practical way to offset a sedentary day is to add roughly 3,000–4,000 steps beyond your current count, outside of any structured workout. The tool scales that to your sitting hours and estimates the calories those added steps and breaks reclaim — modest day to day, but it compounds over a week and a year.',
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
      { q: 'How many steps offset a day of sitting?', a: 'A common target is an extra 3,000–4,000 steps beyond your current daily count, taken as everyday movement outside structured exercise. The more you sit, the more it helps — this tool scales it to your hours.' },
      { q: 'How often should I take a break from sitting?', a: 'Aim to stand and move for about 2–5 minutes roughly every 30–60 minutes of sitting. Frequent short breaks appear to matter more than one long one.' },
      { q: 'What is NEAT?', a: 'NEAT is non-exercise activity thermogenesis — the calories you burn through everyday movement like walking, fidgeting, and chores. Increasing it is one of the most practical ways to offset a desk job.' },
      { q: 'Can extra steps undo the harm of too much sitting?', a: 'Movement clearly lowers the risks linked to sedentary time, but it’s best to both add activity and reduce total sitting where you can. Think "move more and sit less," not one or the other.' },
      { q: 'Is a standing desk enough?', a: 'Standing is better than sitting still, but the bigger wins come from actually moving — breaks, steps, and light activity. Use a standing desk as a prompt to move, not a substitute for it.' },
    ],
    sources: [
      { citation: 'Dunstan DW, et al. "Breaking up prolonged sitting reduces postprandial glucose and insulin responses." Diabetes Care. 2012.', url: pubmed('Breaking up prolonged sitting reduces postprandial glucose insulin Dunstan') },
      { citation: 'Diaz KM, et al. "Patterns of sedentary behavior and mortality in US adults." Ann Intern Med. 2017.', url: pubmed('Patterns of sedentary behavior and mortality US adults Diaz') },
      { citation: 'Levine JA. "Non-exercise activity thermogenesis (NEAT)." Best Pract Res Clin Endocrinol Metab. 2002.', url: pubmed('Non-exercise activity thermogenesis NEAT Levine') },
      { citation: 'Ekelund U, et al. "Does physical activity attenuate the association between sitting time and mortality? A harmonised meta-analysis." Lancet. 2016.', url: pubmed('physical activity attenuate sitting time mortality harmonised meta-analysis Ekelund') },
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
      'Calculate running pace, finish time, or distance from the other two — with a full split table. Free pace calculator in km or miles, no signup.',
    intro:
      'Whatever you know — your distance and pace, or a goal time — this calculator works out the missing piece and shows your splits. Choose what to solve for and enter the other two values.',
    sections: [
      {
        h2: 'How the pace calculator works',
        paragraphs: [
          'Pace, time, and distance are linked by one simple relationship: time = distance × pace. Give the calculator any two and it solves the third — your finish time from a target pace, the pace you’d need to hit a goal time, or how far you’d travel at a set pace.',
          'Pace is shown as minutes and seconds per kilometre or per mile (switch units at the top), while speed is shown in km/h or mph for comparison. Everything is calculated assuming an even effort across the whole distance.',
        ],
      },
      {
        h2: 'Using your splits',
        paragraphs: [
          'The split table shows the cumulative time you should reach at each kilometre or mile if you hold a steady pace. Runners use splits to pace races: glance at your watch at each marker and you’ll know instantly whether you’re ahead of or behind schedule.',
          'A classic strategy is the "even split" — running the second half at the same pace as the first — or a slight "negative split," finishing faster than you started. Going out too fast and fading is the most common pacing mistake, and a split sheet helps you avoid it.',
        ],
      },
      {
        h2: 'Pacing common race distances',
        paragraphs: [
          'To find a goal pace, set the calculator to "Pace," enter the race distance and your target time, and read the pace you need to hold. For example, a sub-2-hour half-marathon (21.1 km) needs about 5:41 per kilometre; a 4-hour marathon needs roughly 5:41 per kilometre too, sustained for 42.2 km.',
          'Remember that real races include hills, wind, and fatigue, so train across a range of paces rather than only your goal pace. Build endurance with easy runs, and use the calculator to set realistic, achievable targets based on your recent times.',
        ],
      },
    ],
    faq: [
      {
        q: 'How do I calculate my running pace?',
        a: 'Divide your time by your distance. This calculator does it for you — choose "Pace," enter the distance you ran and the time it took, and it returns your pace per kilometre or mile.',
      },
      {
        q: 'What is a negative split?',
        a: 'A negative split means running the second half of a race faster than the first. It’s widely considered the most efficient way to race and helps avoid burning out early.',
      },
      {
        q: 'Can I switch between kilometres and miles?',
        a: 'Yes. Use the km/mi toggle at the top of the calculator; pace, distance, and splits all update to your chosen unit.',
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
    seoTitle: 'Calories Burned Calculator (METs)',
    metaDescription:
      'Estimate calories burned for running, cycling, swimming, HIIT and more using MET values and your body weight. Free, metric or imperial.',
    intro:
      'See how many calories an activity burns for your body weight. Pick what you did and how long for, and the calculator uses scientific MET values to estimate your energy use.',
    sections: [
      {
        h2: 'How calories burned are calculated',
        paragraphs: [
          'The calculation uses MET (Metabolic Equivalent of Task) values: calories burned = METs × weight in kilograms × time in hours. One MET is roughly the energy you use sitting quietly, so an activity rated at 8 METs burns about eight times that.',
          'MET values come from the Compendium of Physical Activities, a research database used by exercise scientists worldwide. Because heavier bodies use more energy to move, your weight is a key part of the equation.',
        ],
      },
      {
        h2: 'MET values for common activities',
        list: {
          intro: 'A few examples from the Compendium (higher means more intense):',
          items: [
            'Yoga ≈ 3.0, walking (3.5 mph) ≈ 3.5',
            'Weightlifting ≈ 5.0, hiking ≈ 6.0',
            'Cycling (moderate) ≈ 7.5, tennis ≈ 7.3, dancing ≈ 7.8',
            'Swimming ≈ 8.0, HIIT ≈ 8.0, running (6 mph) ≈ 9.8',
            'Jumping rope ≈ 12.3 — one of the most demanding common activities',
          ],
        },
      },
      {
        h2: 'Why it’s an estimate',
        paragraphs: [
          'MET values are population averages measured in labs, so your real burn depends on intensity, fitness, age, body composition, and even the weather. Two people doing "moderate cycling" can burn quite different amounts.',
          'Use the result to compare activities and plan rather than to count calories to the last unit. If you’re tracking energy for weight management, pair this with your daily calorie needs and adjust based on real-world results over a few weeks.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a MET?',
        a: 'A MET (Metabolic Equivalent of Task) is a unit of energy expenditure. One MET equals your energy use at rest; an activity of 8 METs uses about eight times as much energy as sitting quietly.',
      },
      {
        q: 'Does body weight affect calories burned?',
        a: 'Yes. Heavier bodies use more energy to perform the same activity, which is why the formula multiplies the MET value by your weight in kilograms.',
      },
      {
        q: 'How accurate is the calorie estimate?',
        a: 'It’s a solid estimate based on average MET values, but your true burn varies with intensity, fitness and body composition. Treat it as a guide for comparing and planning activities.',
      },
    ],
    sources: [COMPENDIUM],
  },

  // ============================================================
  'one-rep-max-calculator': {
    seoTitle: 'One-Rep Max Calculator (Epley & Brzycki)',
    metaDescription:
      'Estimate your one-rep max from a set with the Epley and Brzycki formulas, plus a 50–100% training table. Free 1RM calculator, no signup.',
    intro:
      'Your one-rep max (1RM) is the most weight you can lift once. Instead of attempting a risky maximal lift, estimate it from a lighter set — enter the weight and reps to get your 1RM and a full percentage table.',
    sections: [
      {
        h2: 'How your 1RM is estimated',
        paragraphs: [
          'This calculator uses two of the most validated formulas. Epley: 1RM = weight × (1 + reps ÷ 30). Brzycki: 1RM = weight × 36 ÷ (37 − reps). Both convert a "reps to failure" set into an estimated single-rep maximum.',
          'The two formulas agree closely at low reps and diverge a little as reps climb. Accuracy is best when your set is 10 reps or fewer — beyond that, factors like muscular endurance muddy the estimate. For the most reliable number, use a hard set of 3–6 reps.',
        ],
      },
      {
        h2: 'Training with percentages of your 1RM',
        paragraphs: [
          'Most strength programs prescribe loads as a percentage of 1RM, which is why the table above matters. As a rough guide: 85–100% builds maximal strength (1–5 reps), 70–85% builds muscle (6–12 reps), and 50–70% develops muscular endurance (12+ reps).',
          'Knowing your 1RM lets you pick the right weight for the goal of each session and progress in a structured way, rather than guessing. Recalculate every few weeks as you get stronger.',
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
        a: 'Both are well validated and agree closely at low reps. Epley tends to read slightly higher at higher reps. Using a set of 5 reps or fewer makes both more accurate.',
      },
      {
        q: 'How often should I recalculate my 1RM?',
        a: 'Every four to six weeks, or whenever your working weights climb noticeably. Re-estimating keeps your training percentages accurate as you get stronger.',
      },
    ],
    sources: [BRZYCKI, ONERM_VALIDITY],
  },

  // ============================================================
  'ffmi-calculator': {
    seoTitle: 'FFMI Calculator — Fat-Free Mass Index for Athletes',
    metaDescription:
      'Calculate your Fat-Free Mass Index (FFMI) and height-normalized FFMI. A useful fitness metric for lifters and athletes — not a medical diagnosis.',
    intro:
      'FFMI measures how much lean mass you carry relative to your height. Enter your weight, height and body-fat percentage to see your FFMI, your height-normalized score, and where you sit on the athlete reference scale.',
    notice:
      'Educational fitness metric only — not a health diagnosis. If you are unsure of your body-fat percentage, estimate it first with the Body Fat Calculator.',
    sections: [
      {
        h2: 'What is FFMI?',
        paragraphs: [
          'Fat-Free Mass Index (FFMI) is your lean body mass divided by your height in metres squared. It is similar in shape to BMI, but instead of comparing total body weight it compares only your fat-free mass — muscle, bone, organs and water. That makes it more meaningful for athletes and lifters, who can be heavy but metabolically healthy because of extra muscle.',
          'Because taller people have more frame to fill, FFMI also includes a height correction (the “normalized” score) so a 165 cm lifter and a 195 cm lifter can be compared on the same scale.',
        ],
      },
      {
        h2: 'How the calculation works',
        paragraphs: [
          'First we subtract your fat mass from your total weight to get lean body mass (LBM). Then we divide LBM by height² to get FFMI. The normalized version adds 6.1 × (1.8 − height in metres) to correct for stature.',
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
          'The reference bands are calibrated to common population and athlete data. Most untrained adults fall in the 17–19 range; trained natural lifters often sit around 20–23. Values above ~25 are very unusual for natural athletes and usually mean the body-fat estimate is too low, so re-check your input before drawing any conclusion.',
          'FFMI is best used to track your own progress over time, not to compare yourself to outliers online.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a good FFMI?',
        a: 'For most men, 18–20 is average, 20–22 is athletic, and 22–25 is highly muscular. For women, subtract roughly 1.5–2 points because of higher essential body fat. The most useful comparison is your own trend over time.',
      },
      {
        q: 'Why normalize FFMI for height?',
        a: 'Taller people naturally have more bone and muscle mass. The normalized score adds a height correction so FFMI can be compared fairly across short and tall individuals.',
      },
      {
        q: 'Can FFMI tell if someone is natural?',
        a: 'No. Extremely high values are uncommon for natural athletes, but they can also come from an inaccurate body-fat estimate, unusual genetics, or measurement error. FFMI is not a diagnostic or judgment tool.',
      },
      {
        q: 'How do I estimate body-fat percentage?',
        a: 'You can use the Body Fat Calculator here, which estimates body fat from a few tape measurements, or a reliable smart scale, DEXA scan, or skinfold callipers for a more accurate number.',
      },
    ],
    sources: [
      {
        citation: 'Schutz Y, Kyle UU, Pichard C. "Fat-free mass index and fat mass index percentiles in Caucasians aged 18–98 y." Int J Obes Relat Metab Disord. 2002.',
        url: pubmed('Fat-free mass index percentiles Caucasians Schutz'),
      },
      {
        citation: 'Kouri EM, Pope HG Jr, Katz DL, Oliva P. "Fat-free mass index in users and nonusers of anabolic-androgenic steroids." Clin J Sport Med. 1995.',
        url: pubmed('Fat-free mass index anabolic androgenic steroids Kouri'),
      },
    ],
  },
  // ============================================================
  'recovery-time-calculator': {
    seoTitle: 'Recovery Time Calculator — Rest Between Workouts',
    metaDescription:
      'Estimate how long to rest before training the same muscle group again. A transparent heuristic from sports-science recovery principles. Free, no signup.',
    intro:
      'Enter your workout type, effort, and how your body feels to get a suggested recovery window. This is general guidance from sports-science principles — not a medical prescription.',
    notice:
      'General fitness guidance, not medical advice. Sharp pain, joint pain, or pain that worsens with activity is not normal soreness — stop and consult a qualified professional.',
    sections: [
      {
        h2: 'How recovery time is estimated',
        paragraphs: [
          'This calculator uses a transparent heuristic built on well-known recovery principles. Heavy resistance training typically needs 48–72 hours of recovery per muscle group before it is trained hard again. HIIT and endurance work usually need a little less, and light sessions recover quickly.',
          'We start from a base recovery time for your workout type, then adjust it up or down for five factors: how hard you pushed (RPE), how long the session lasted, your training age, your sleep quality, and how sore you currently feel. The result is a range, not a single number, because individual recovery varies.',
        ],
      },
      {
        h2: 'What changes your recovery',
        list: {
          intro: 'The five factors and how they move the estimate:',
          items: [
            'Intensity (RPE): higher effort means more muscle damage and central nervous system fatigue, so more recovery time.',
            'Duration: a 2-hour session needs more recovery than a 30-minute one, all else equal.',
            'Training age: beginners generally need more recovery — their muscles are less conditioned to repeated hard work. Advanced athletes recover faster for the same stimulus.',
            'Sleep: most muscle repair and adaptation happens during deep sleep. Poor sleep is one of the biggest recovery killers.',
            'Soreness (DOMS): if you are still sore from a previous session, your body is telling you it is not finished repairing yet.',
          ],
        },
      },
      {
        h2: 'Tips to recover faster',
        list: {
          intro: 'Recovery is not just waiting — you can actively improve it:',
          items: [
            'Prioritize 7–9 hours of quality sleep — it is the single most impactful recovery tool. Use the Sleep Debt Calculator to track shortfalls.',
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
        a: 'For heavy resistance training, the general guideline is 48–72 hours before hitting the same muscle group hard again. This calculator personalises that starting point based on your effort, duration, training age, sleep, and soreness.',
      },
      {
        q: 'Can I train while still sore?',
        a: 'Mild soreness is usually fine for a different muscle group or a lighter session. Moderate or severe soreness means you should either rest, train a different muscle group, or do active recovery. Training the same hard session on a severely sore muscle increases injury risk.',
      },
      {
        q: 'Does sleep really affect muscle recovery?',
        a: 'Yes — significantly. Most muscle repair, protein synthesis, and anabolic hormone release happen during deep sleep. Consistently sleeping less than 7 hours demonstrably slows recovery and reduces strength and muscle gains over time.',
      },
      {
        q: 'Why do beginners need more recovery?',
        a: 'Beginners experience more muscle damage and soreness (DOMS) from a given workout because their muscles are not yet adapted to the stress. As training age increases, the body becomes more efficient at repairing and adapting, so recovery times shorten for the same relative effort.',
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
    ],
  },
  // ============================================================
  'push-up-test-calculator': {
    seoTitle: 'Push-Up Test Calculator — Score by Age & Sex Norms',
    metaDescription:
      'Score your push-up test against ACSM age and sex normative tables. See your percentile band, how to improve, and when to retest. Free fitness self-assessment.',
    intro:
      'The push-up test measures upper-body muscular endurance. Enter your age, sex, and the number of strict push-ups you completed to see where you rank against published norms.',
    notice:
      'Fitness self-assessment, not a medical test. Stop immediately if you feel chest pain, dizziness, or severe shortness of breath — these are red flags that need medical care.',
    sections: [
      {
        h2: 'How to do the test properly',
        paragraphs: [
          'Form matters more than the number. A rep only counts if you lower your body until your chest is about fist height above the floor, keep your body in a straight line from head to heels, and push back up to full arm extension. If your hips sag, your chin leads, or you half-rep, the number is not comparable to the norms.',
          'Do the test after a short warm-up (arm circles, a few easy reps). Pace yourself — most people do better with a steady rhythm than an explosive start that burns them out early. Rest between reps in the plank position, not on the floor.',
        ],
      },
      {
        h2: 'Reading your percentile band',
        paragraphs: [
          'Your result is compared to the ACSM push-up test norms for your age and sex, which are based on population data collected from thousands of adults. The bands run from "Below average" through "Average," "Above average," and "Good" to "Excellent" (roughly the 90th percentile or higher).',
          'If you land in "Below average" or "Average," that is common — most adults do not train push-ups regularly. The good news is that push-up capacity responds quickly to consistent training; most people see measurable improvement in 4–6 weeks.',
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
          'A 3–5 rep improvement in a month is solid progress. If your score stalls for two consecutive tests, change your training stimulus: add volume, increase frequency, or address weak points like core or triceps strength.',
        ],
      },
    ],
    faq: [
      {
        q: 'What counts as a proper push-up rep?',
        a: 'Your body must stay in a straight line from head to heels, your chest must lower to about fist height above the floor, and you must push back to full arm extension. Hips sagging, knees touching, or half-range reps do not count toward the normative comparison.',
      },
      {
        q: 'Can women do the standard push-up test?',
        a: 'Yes. The norms here use the standard (knees-off-the-floor) push-up position for both men and women. If you are not yet strong enough for standard push-ups, start with knee push-ups or incline push-ups and work toward the full version before comparing to these norms.',
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
  'steps-to-calories-calculator': {
    seoTitle: 'Steps to Calories & Distance Calculator',
    metaDescription:
      'Convert your daily steps into distance walked and calories burned, using your height and weight. Free steps calculator in km or miles.',
    intro:
      'Turn a step count into something meaningful. Enter your steps along with your height and weight to estimate how far you walked and how many calories you burned.',
    sections: [
      {
        h2: 'From steps to distance',
        paragraphs: [
          'Distance depends on your stride length, which scales with your height. This calculator estimates stride as your height × 0.413 for women and × 0.415 for men — a widely used research-based ratio. Multiplying your stride by your step count gives the distance you covered.',
          'Taller people cover more ground per step, so two people taking 10,000 steps can walk noticeably different distances. Using your own height makes the estimate far more personal than a generic "2,000 steps per mile" rule.',
        ],
      },
      {
        h2: 'From steps to calories',
        paragraphs: [
          'Calories are estimated from the distance you walked and your body weight, using the MET method (about 3.5 METs for a steady walk). Heavier bodies and longer distances burn more, which the calculation reflects.',
          'This assumes a moderate walking pace. Walking faster, uphill, or carrying weight all increase the burn, so treat the figure as a reasonable estimate rather than an exact count.',
        ],
      },
      {
        h2: 'How many steps should you aim for?',
        paragraphs: [
          'The famous "10,000 steps" target began as a marketing slogan, but research does support more steps meaning better health. Benefits rise steadily from around 7,000–8,000 steps a day for adults, with gains continuing higher, especially for older adults at lower counts.',
          'Fewer than 5,000 steps a day is generally considered sedentary. If you’re starting low, adding 1,000–2,000 steps a day is a realistic, effective goal — every extra walk counts.',
        ],
      },
    ],
    faq: [
      {
        q: 'How many calories does 10,000 steps burn?',
        a: 'Very roughly 300–500 calories for most adults, depending on your weight, height and walking speed. This calculator personalises the estimate to your own measurements.',
      },
      {
        q: 'How is distance from steps calculated?',
        a: 'It multiplies your step count by your stride length, estimated as height × 0.413 (women) or × 0.415 (men). Taller people cover more distance per step.',
      },
      {
        q: 'Are 10,000 steps a day necessary?',
        a: 'No — it’s a popular target, not a medical rule. Health benefits build from around 7,000–8,000 steps a day, and any increase from a low baseline helps.',
      },
    ],
    sources: [COMPENDIUM],
  },

  // ============================================================
  'vo2-max-calculator': {
    seoTitle: 'VO₂ Max Calculator (Heart Rate Method)',
    metaDescription:
      'Estimate your VO₂ max from your resting and maximum heart rate using the Uth–Sørensen method. Free cardio fitness calculator, no test required.',
    intro:
      'VO₂ max is the gold-standard measure of aerobic fitness — how much oxygen your body can use during hard exercise. Estimate it without a lab test using just your age and resting heart rate.',
    sections: [
      {
        h2: 'How this estimate works',
        paragraphs: [
          'This tool uses the Uth–Sørensen "Heart Rate Ratio Method": VO₂ max ≈ 15.3 × (maximum heart rate ÷ resting heart rate). Maximum heart rate is estimated as 220 − age, and a lower resting heart rate — a hallmark of good fitness — produces a higher VO₂ max.',
          'The result is expressed in millilitres of oxygen per kilogram of body weight per minute (ml/kg/min). It’s a convenient estimate that needs no exercise test, which makes it easy to track over time.',
        ],
      },
      {
        h2: 'What your number means',
        paragraphs: [
          'Higher VO₂ max means your heart, lungs and muscles deliver and use oxygen more efficiently. As a general guide for adults, under 30 is below average, 40–50 is good, and above 60 is found in well-trained endurance athletes. Healthy ranges shift with age and differ between men and women, so compare yourself mainly to your own trend.',
          'VO₂ max is strongly linked to long-term health: higher cardiorespiratory fitness is associated with lower risk of heart disease and death from all causes.',
        ],
      },
      {
        h2: 'Improving your VO₂ max',
        paragraphs: [
          'The most effective way to raise VO₂ max is regular aerobic training, especially interval work that pushes you close to your maximum heart rate, balanced with longer steady sessions. Consistency over months is what moves the number.',
          'Because this method relies on an accurate resting heart rate, measure your pulse first thing in the morning before getting up, ideally averaged over a few days. As your fitness improves and your resting heart rate falls, your estimated VO₂ max will rise.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a good VO₂ max?',
        a: 'It varies with age and sex, but as a general guide for adults, 40–50 ml/kg/min is good and above 60 is excellent. Compare your result mainly against your own progress over time.',
      },
      {
        q: 'How accurate is the heart-rate VO₂ max estimate?',
        a: 'The Uth–Sørensen method is a useful, non-exercise estimate but less precise than a lab test. Its accuracy depends heavily on an accurate resting heart rate measurement.',
      },
      {
        q: 'How can I improve my VO₂ max?',
        a: 'Regular aerobic exercise — particularly interval training near your maximum heart rate, combined with steady endurance work — raises VO₂ max over weeks and months of consistent training.',
      },
    ],
    sources: [UTH],
  },
};
