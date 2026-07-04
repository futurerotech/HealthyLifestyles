/** Long-form, source-cited content for each Heart Health tool page. */
import { pubmed, type Source, type ToolContent } from './content-types';

const TANAKA: Source = {
  citation:
    'Tanaka H, Monahan KD, Seals DR. "Age-predicted maximal heart rate revisited." J Am Coll Cardiol. 2001;37(1):153–156.',
  url: pubmed('Age-predicted maximal heart rate revisited Tanaka'),
};
const KARVONEN: Source = {
  citation:
    'Karvonen MJ, Kentala E, Mustala O. "The effects of training on heart rate: a longitudinal study." Ann Med Exp Biol Fenn. 1957;35(3):307–315.',
  url: pubmed('effects of training on heart rate longitudinal study Karvonen'),
};
const AHA_BP: Source = {
  citation:
    'American Heart Association. "Understanding Blood Pressure Readings." (Blood pressure categories.)',
  url: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings',
};
const AHA_GUIDELINE: Source = {
  citation:
    'Whelton PK, Carey RM, Aronow WS, et al. "2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults." Hypertension. 2018;71(6):e13–e115.',
  url: pubmed('2017 ACC AHA Guideline High Blood Pressure in Adults Whelton'),
};

const AHA_HR: Source = {
  citation: 'American Heart Association. "All About Heart Rate (Pulse)" — normal resting heart rate is 60–100 bpm.',
  url: 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse',
};
const MAYO_HR: Source = {
  citation: 'Mayo Clinic. "What\'s a normal resting heart rate?" (Well-trained athletes may be 40–60 bpm.)',
  url: 'https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979',
};

export const HEART_CONTENT: Record<string, ToolContent> = {
  // ============================================================
  'resting-heart-rate-checker': {
    seoTitle: 'Resting Heart Rate Checker – Is Yours Healthy?',
    metaDescription:
      'Check your resting heart rate against age and sex benchmarks — athlete to below-average — with plain-English meaning. Educational, not a diagnosis.',
    intro:
      'Enter your resting heart rate with your age and sex to see how it compares with healthy adult benchmarks — from athlete level to below average — and what the number means.',
    notice:
      'Informational only — this does not diagnose any heart condition. A persistently very low or very high resting heart rate, or symptoms like dizziness, palpitations or breathlessness, should be checked by a doctor.',
    sections: [
      {
        h2: 'What is a normal resting heart rate?',
        paragraphs: [
          'Your resting heart rate (RHR) is how many times your heart beats per minute while you are at rest. For most adults the American Heart Association puts the normal range at 60 to 100 beats per minute. A lower resting rate generally points to better cardiovascular fitness and a more efficient heart — well-trained endurance athletes are often in the 40 to 60 range.',
          'The most accurate time to measure is first thing in the morning, before you get up: count your pulse for 30 seconds and double it, or use a fitness tracker’s resting figure.',
        ],
      },
      {
        h2: 'How to read your benchmark',
        paragraphs: [
          'This checker places your number into a fitness band — Athlete, Excellent, Good, Average, or Below average — adjusted slightly for sex (women average a few beats higher) and age. The bands are a general fitness guide, not a medical assessment.',
        ],
        list: {
          intro: 'What can move your resting heart rate:',
          items: [
            'Fitness — regular cardio lowers it over time.',
            'Stress, caffeine, and nicotine — raise it temporarily.',
            'Sleep, hydration, and illness or fever.',
            'Some medications (for example beta-blockers lower it).',
            'Air temperature and body position.',
          ],
        },
      },
      {
        h2: 'When to see a doctor',
        paragraphs: [
          'A single reading outside the range is rarely a concern on its own. But see a doctor if your resting heart rate is persistently above 100 bpm (tachycardia) or below 60 bpm without being athletic (bradycardia), or if you have symptoms such as dizziness, fainting, palpitations, chest discomfort or shortness of breath. These can have many causes, and only a clinician can assess them.',
        ],
      },
    ],
    faq: [
      { q: 'What is a good resting heart rate by age?', a: 'For most adults of any age, 60–100 bpm is normal, and lower (toward 50–60) tends to indicate better fitness. Benchmarks shift only slightly with age; symptoms matter more than the exact number.' },
      { q: 'Is a resting heart rate of 50 too low?', a: 'For a fit or athletic person, 50 bpm can be perfectly healthy. For someone who isn’t athletic, or who feels dizzy or faint, a rate that low is worth discussing with a doctor.' },
      { q: 'Why is my resting heart rate high?', a: 'Common causes include low fitness, stress, caffeine, dehydration, poor sleep, illness, or certain medications. A persistently high resting rate (over 100 bpm) should be checked by a doctor.' },
      { q: 'How do I lower my resting heart rate?', a: 'Regular aerobic exercise is the most reliable way, along with good sleep, stress management, hydration, and limiting caffeine and nicotine. Improvements usually show over weeks to months.' },
    ],
    sources: [AHA_HR, MAYO_HR],
  },
  // ============================================================
  'target-heart-rate-calculator': {
    seoTitle: 'Target Heart Rate Calculator – 5 Zones',
    metaDescription:
      'Find your 5 heart-rate training zones with the Karvonen method, using your age and resting heart rate. Free target heart rate calculator, no signup.',
    intro:
      'Training in the right heart-rate zone helps you get the most from every workout. Enter your age and resting heart rate to see your maximum heart rate and your five personalised training zones.',
    notice:
      'Informational only — not a diagnosis. If you have a heart condition, or take medication that affects your heart rate (such as beta-blockers), talk to your doctor before training by heart rate.',
    sections: [
      {
        h2: 'How heart rate zones work',
        paragraphs: [
          'Your training zones are built from two numbers: your maximum heart rate (the fastest your heart can safely beat) and your resting heart rate. The gap between them is your heart-rate reserve — the range you actually train within.',
          'This calculator uses the Karvonen method, which is more personalised than a simple percentage of maximum because it accounts for your resting heart rate. The formula is: target = ((max HR − resting HR) × intensity %) + resting HR. A fitter person with a low resting heart rate gets zones tailored to them.',
        ],
      },
      {
        h2: 'The five training zones',
        list: {
          intro: 'Each zone trains your body in a different way:',
          items: [
            'Zone 1 (50–60%) — very light: warming up, cooling down and recovery.',
            'Zone 2 (60–70%) — light: builds endurance and burns a high proportion of fat.',
            'Zone 3 (70–80%) — moderate: improves aerobic fitness and circulation.',
            'Zone 4 (80–90%) — hard: raises your anaerobic threshold and speed.',
            'Zone 5 (90–100%) — maximum: short, intense bursts for peak performance.',
          ],
        },
      },
      {
        h2: 'Using your zones',
        paragraphs: [
          'For general health, most of your training should sit in Zones 2 and 3, with shorter efforts in Zones 4 and 5 once you have a fitness base. The popular "fat-burning zone" (Zone 2) burns the highest share of calories from fat, but higher-intensity work burns more total calories — both have a place.',
          'Wear a heart-rate monitor or chest strap for accuracy; wrist readings can lag during quick changes in effort. Remember these zones are estimates: your true maximum heart rate can differ from the formula by 10–12 beats per minute, so use how you feel (the ability to talk, for example) as a cross-check.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the Karvonen method?',
        a: 'The Karvonen method calculates training zones using your heart-rate reserve (maximum minus resting heart rate): target = ((max − resting) × intensity) + resting. It personalises zones better than a flat percentage of maximum.',
      },
      {
        q: 'What is the best heart rate zone for fat loss?',
        a: 'Zone 2 (60–70%) burns the highest proportion of calories from fat, but higher zones burn more total calories. For weight loss, total calories burned matters most, so mix the zones.',
      },
      {
        q: 'How do I find my resting heart rate?',
        a: 'Measure your pulse for 60 seconds first thing in the morning, before getting out of bed. A typical adult resting heart rate is 60–100 bpm; fitter people are often lower.',
      },
    ],
    sources: [KARVONEN, TANAKA],
  },

  // ============================================================
  'max-heart-rate-calculator': {
    seoTitle: 'Max Heart Rate Calculator (220 − Age & Tanaka)',
    metaDescription:
      'Estimate your maximum heart rate from your age using the 220 − age and Tanaka formulas. Free, instant max heart rate calculator — no signup.',
    intro:
      'Your maximum heart rate is the highest your heart can beat during all-out effort, and it sets the ceiling for your training zones. Enter your age to estimate it with two trusted formulas.',
    notice:
      'Informational only — not a diagnosis. Estimated maximum heart rate is a general guide, not a medical assessment. See a doctor before starting intense exercise, especially if you have any heart concerns.',
    sections: [
      {
        h2: 'How maximum heart rate is estimated',
        paragraphs: [
          'The best-known formula is simply 220 minus your age. It is easy to remember and widely used, which is why most gym equipment relies on it. However, research has shown it can be off by 10–12 beats per minute for any individual.',
          'The Tanaka equation — 208 − (0.7 × age) — was developed from a large review of studies and tends to be more accurate, particularly for people over 40, where 220 − age increasingly underestimates the true maximum. This calculator shows both so you can compare.',
        ],
      },
      {
        h2: 'Why it matters',
        paragraphs: [
          'Maximum heart rate is the anchor for heart-rate training. Your zones — from easy recovery to all-out effort — are all calculated as percentages of this number, so a more accurate estimate gives you more useful zones.',
          'It is not a measure of fitness: a higher or lower maximum heart rate does not mean you are fitter. Maximum heart rate is largely determined by age and genetics and naturally declines as you get older, which is normal and expected.',
        ],
      },
      {
        h2: 'Measuring it accurately',
        paragraphs: [
          'Formulas are estimates. The only way to find your true maximum is a monitored maximal effort test — and that should only be done when you are healthy and, ideally, under professional supervision, as it pushes your heart to its limit.',
          'For everyday training, the formula estimate is perfectly adequate. If you are returning to exercise after a break, are over 40, or have any cardiovascular risk factors, check with your doctor before attempting high-intensity work near your maximum.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is 220 minus age accurate?',
        a: 'It is a useful rule of thumb but can be off by 10–12 bpm for any individual. The Tanaka formula (208 − 0.7 × age) is generally more accurate, especially for people over 40.',
      },
      {
        q: 'Does a higher maximum heart rate mean I am fitter?',
        a: 'No. Maximum heart rate is set mainly by age and genetics, not fitness. A higher or lower number does not indicate better or worse cardiovascular fitness.',
      },
      {
        q: 'Why does maximum heart rate fall with age?',
        a: 'Age-related changes in the heart’s electrical system gradually lower the maximum rate it can reach. This decline is normal and is why both formulas subtract from a baseline using your age.',
      },
    ],
    sources: [TANAKA, KARVONEN],
  },

  // ============================================================
  'blood-pressure-checker': {
    seoTitle: 'Blood Pressure Category Checker (AHA)',
    metaDescription:
      'Enter your systolic and diastolic numbers to see your American Heart Association blood pressure category, from Normal to Hypertensive Crisis. Free.',
    intro:
      'Blood pressure is given as two numbers — systolic over diastolic. Enter your reading to see which American Heart Association category it falls into and what it means.',
    notice:
      'Informational only — not a diagnosis. Only a healthcare professional can diagnose or treat high blood pressure. If your reading is very high or you feel unwell, seek medical care right away.',
    sections: [
      {
        h2: 'Understanding the two numbers',
        paragraphs: [
          'Blood pressure is measured in millimetres of mercury (mmHg) and written as systolic over diastolic, for example 120/80. The systolic (top) number is the pressure in your arteries when your heart beats; the diastolic (bottom) number is the pressure between beats, when the heart rests.',
          'Either number being high is enough to raise your category. This checker uses whichever of your two numbers falls into the higher band, exactly as clinicians do.',
        ],
      },
      {
        h2: 'The AHA blood pressure categories',
        list: {
          intro: 'The American Heart Association groups readings into five categories:',
          items: [
            'Normal: below 120 and below 80.',
            'Elevated: 120–129 and below 80.',
            'High Stage 1: 130–139 or 80–89.',
            'High Stage 2: 140 or higher, or 90 or higher.',
            'Hypertensive crisis: higher than 180 and/or higher than 120 — seek medical care.',
          ],
        },
      },
      {
        h2: 'What to do about your reading',
        paragraphs: [
          'A single reading does not diagnose high blood pressure. Levels rise and fall through the day with activity, stress, caffeine and even a full bladder. Take several measurements while seated and rested, on different days, and share the pattern with your doctor.',
          'If your reading is in the elevated or Stage 1 range, lifestyle changes — less salt, more activity, a healthy weight, less alcohol and not smoking — often help. Stage 2 usually needs medication alongside these changes. A hypertensive crisis (over 180/120) is a medical emergency, especially with symptoms such as chest pain, shortness of breath or trouble speaking.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a normal blood pressure?',
        a: 'The American Heart Association defines normal as a systolic reading below 120 and a diastolic below 80 mmHg. Readings above that fall into Elevated or one of the high blood pressure stages.',
      },
      {
        q: 'Which number is more important, systolic or diastolic?',
        a: 'Both matter, and your category is set by whichever is higher. Systolic pressure tends to be the stronger predictor of risk in adults over 50, but a high diastolic reading also needs attention.',
      },
      {
        q: 'What should I do in a hypertensive crisis?',
        a: 'A reading over 180/120 mmHg is dangerous. Wait five minutes and re-measure; if it is still that high, contact your doctor urgently. If you have chest pain, shortness of breath, weakness or trouble speaking, call emergency services immediately.',
      },
      {
        q: 'Can one high reading mean I have hypertension?',
        a: 'No. A diagnosis is based on multiple readings over time, taken correctly at rest. This tool is for information only — your doctor confirms any diagnosis of high blood pressure.',
      },
    ],
    sources: [AHA_BP, AHA_GUIDELINE],
  },

  // ============================================================
  'hrv-explainer-log': {
    seoTitle: 'HRV Explainer & Log — Track Your Heart Rate Variability',
    metaDescription:
      'Learn what HRV is, log readings from your own device, and see your trend over time. Educational — HRV cannot be calculated from age or pulse alone. Not medical advice.',
    intro:
      'Heart Rate Variability (HRV) reflects how flexible your autonomic nervous system is. This tool explains what HRV is, what affects it, and lets you log readings from your own device to track your personal trend over time.',
    notice:
      'HRV cannot be computed from your age or pulse alone — it requires a device that measures beat-to-beat intervals (chest strap, smartwatch, or ring). This tool does not estimate HRV. It helps you log and interpret readings from your own device. Educational only, not medical advice.',
    sections: [
      {
        h2: 'What HRV actually measures',
        paragraphs: [
          'HRV is the variation in time between consecutive heartbeats, measured in milliseconds. A higher HRV generally indicates better autonomic nervous system flexibility and recovery. A lower HRV can signal stress, fatigue, insufficient recovery, or illness.',
          'The most common metric is RMSSD (root mean square of successive differences). Your device may report RMSSD, SDNN, or LnRMSSD — these are different metrics and should not be compared directly. Stick with one metric from one device for meaningful trend tracking.',
        ],
      },
      {
        h2: 'Why your baseline matters more than one number',
        paragraphs: [
          'HRV is highly individual. Age, genetics, fitness level, and even body size affect it. A reading of 40 ms might be excellent for one person and below-average for another. There is no universal "good" HRV number.',
          'What matters is your personal trend over days and weeks. Is your HRV stable? Trending up? Dropping after poor sleep or stress? That context is far more useful than any single reading compared to population averages.',
        ],
      },
      {
        h2: 'Why absolute values vary by device',
        paragraphs: [
          'Different devices use different sensors (optical vs electrical), measurement durations, and algorithms. A chest strap (electrical) will generally give different RMSSD values than a wrist optical sensor or a ring. This is normal and expected.',
          'For meaningful trends, use the same device, measured at the same time of day (morning is standard), under similar conditions. Comparing a morning chest-strap reading to an evening wrist reading is not meaningful.',
        ],
      },
      {
        h2: 'How to use this log',
        paragraphs: [
          'Each morning (or at your chosen consistent time), enter the HRV reading from your device along with optional context: resting heart rate, hours slept, stress level, and whether you drank alcohol the evening before.',
          'After several entries, the trend chart shows whether your HRV is stable, improving, or declining. The interpretation text explains what the trend might mean in plain language. Over time, you will see which lifestyle factors correlate with your HRV changes.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can this tool calculate my HRV from my age or pulse?',
        a: 'No. That would be fake. HRV requires measuring the actual time intervals between heartbeats, which needs a device with the right sensor (chest strap, smartwatch, or ring). Any tool that claims to compute HRV from age and pulse is not measuring HRV — it is making up a number.',
      },
      {
        q: 'What is a "good" HRV number?',
        a: 'There is no universal good number. HRV depends on age, genetics, fitness, and the device used. A 25-year-old athlete might have 80+ ms RMSSD; a 60-year-old might have 20 ms and be perfectly healthy. What matters is your personal trend over time, not a single number.',
      },
      {
        q: 'Why do my chest strap and smartwatch give different HRV values?',
        a: 'Different sensors and algorithms produce different absolute values. Chest straps measure electrical signals; wrist watches use optical sensors. Both can track trends accurately, but their raw numbers should not be compared. Use the same device consistently.',
      },
      {
        q: 'My HRV dropped suddenly — should I worry?',
        a: 'A single low reading is not alarming. HRV drops with poor sleep, stress, alcohol, hard training, dehydration, or oncoming illness. Look at the pattern over several days. If it stays low with no obvious lifestyle cause, mention it to your doctor — but remember HRV is not a diagnostic metric.',
      },
      {
        q: 'Is HRV the same as heart rate?',
        a: 'No. Heart rate is beats per minute (e.g. 60 bpm). HRV is the variation in time between those beats (measured in milliseconds). Two people can have the same heart rate but very different HRV.',
      },
    ],
    sources: [
      {
        citation: 'Shaffer F, Ginsberg JP. "An Overview of Heart Rate Variability Metrics and Norms." Front Public Health. 2017;5:258.',
        url: pubmed('Overview Heart Rate Variability Metrics Norms Shaffer Ginsberg'),
      },
      {
        citation: 'Plews DJ, Laursen PB, Stanley J, Kilding AE, Buchheit M. "Training adaptation and heart rate variability in elite endurance athletes." Sports Med. 2013;43(9):773–781.',
        url: pubmed('Training adaptation heart rate variability elite endurance athletes Plews'),
      },
      {
        citation: 'Buchheit M. "Monitoring training status with HR measures: do all roads lead to Rome?" Front Physiol. 2014;5:73.',
        url: pubmed('Monitoring training status HR measures roads lead Rome Buchheit'),
      },
    ],
  },
};
