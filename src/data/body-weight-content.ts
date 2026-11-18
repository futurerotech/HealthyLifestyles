/**
 * Long-form, source-cited content for each Body & Weight tool page.
 * Each entry supplies SEO meta, an intro lede, 400–600 words of supporting
 * sections, an FAQ (also emitted as FAQPage JSON-LD), and references.
 */
import { pubmed, type Source, type ToolContent } from './content-types';

// ---- Shared, high-confidence references ----
const WHO_OBESITY: Source = {
  citation:
    'World Health Organization. "Obesity and overweight" fact sheet (BMI classification and health risks).',
  url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
};
const WHO_WHR: Source = {
  citation:
    'World Health Organization. "Waist Circumference and Waist–Hip Ratio: Report of a WHO Expert Consultation." Geneva, 8–11 December 2008.',
};

export const BODY_WEIGHT_CONTENT: Record<string, ToolContent> = {
  // ============================================================
  'weight-loss-timeline-calculator': {
    seoTitle: 'Weight Loss Timeline Calculator — Goal Date',
    metaDescription:
      'How long to lose the weight? Get a realistic goal date and a weight-over-time chart at a safe, sustainable pace — no crash diets. Free.',
    intro:
      'Enter your current weight, goal weight, and a weekly pace to see a realistic date you’d reach your goal — with a weight-over-time chart and milestone markers along the way.',
    sections: [
      {
        h2: 'How the timeline works',
        paragraphs: [
          'The planner projects your weight forward week by week at the pace you choose, estimates the number of weeks to your goal, and turns that into a target date. It also marks milestones — including the first 5% lost, which already brings real health benefits — so the journey feels concrete and motivating.',
          'To keep things healthy, the tool caps the pace at about 1% of your body weight per week. If you ask for something faster, it plans at that safe maximum instead and tells you — it won’t generate a crash-diet timeline.',
        ],
      },
      {
        h2: 'What’s a safe, sustainable pace?',
        paragraphs: [
          'The CDC describes gradual, steady weight loss of about 1 to 2 pounds (roughly 0.5–1 kg) per week as the most sustainable. Faster loss is tempting, but it tends to cost muscle, slow your metabolism, and rebound. A slightly slower pace you can actually stick to almost always beats an aggressive one you abandon.',
        ],
      },
      {
        h2: 'Why slower lasts',
        paragraphs: [
          'Real weight loss isn’t perfectly linear — it naturally slows as you get lighter, and the scale bounces day to day with water and food. A timeline gives you a realistic horizon and milestones to aim for, so a slow week doesn’t feel like failure. Pair it with the Calorie and Macro calculators to set the daily numbers behind the plan.',
        ],
      },
    ],
    faq: [
      { q: 'How long will it take to lose the weight?', a: 'At a safe pace of about 0.5–1 kg (1–2 lb) per week, you can estimate it as your total to lose divided by your weekly pace. The calculator does this and gives you a target date and chart.' },
      { q: 'What is a safe weekly weight-loss pace?', a: 'Around 1–2 pounds (0.5–1 kg) per week, or up to about 1% of your body weight. The tool caps faster requests at that safe maximum.' },
      { q: 'Why won’t it let me lose weight faster?', a: 'Very fast loss usually means losing muscle and tends to rebound. To keep results healthy and realistic, the planner won’t build a crash-diet timeline — it plans at a safe maximum pace instead.' },
      { q: 'Is the projected date a guarantee?', a: 'No — it’s a motivating estimate. Real loss isn’t linear and slows over time, so treat the date as a target to aim for, not a promise.' },
    ],
    sources: [
      { citation: 'Centers for Disease Control and Prevention (CDC). "Losing Weight" — aiming for 1 to 2 pounds per week.', url: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html' },
      WHO_OBESITY,
    ],
  },
  // ============================================================
  'bmi-calculator': {
    directAnswer: {
      question: 'What is a healthy BMI?',
      answer:
        'For most adults, a healthy BMI is 18.5–24.9. Below 18.5 is classed as underweight, 25–29.9 as overweight, and 30 or above as obesity (WHO/CDC categories). BMI is a screening measure, not a diagnosis — it can’t tell muscle from fat, so athletes and older adults should read it in context.',
    },
    seoTitle: 'Free BMI Calculator (Metric & Imperial)',
    metaDescription:
      'Calculate your BMI instantly and see your WHO weight category and healthy weight range. Free, accurate, metric or imperial — no signup.',
    intro:
      'Enter your height and weight to find your Body Mass Index (BMI), see which World Health Organization category it falls into, and learn the healthy weight range for your height.',
    sections: [
      {
        h2: 'How the BMI calculator works',
        paragraphs: [
          'Body Mass Index is a simple ratio of weight to height. The formula is BMI = weight (kg) ÷ height (m)². If you use imperial units, this tool converts your pounds and feet/inches to metric first, so the result is identical either way.',
          'BMI was developed in the 19th century by Adolphe Quetelet and is used worldwide as a quick, low-cost screen for weight-related health risk across large populations. Because it needs only two measurements you almost certainly already know, it remains the most widely cited starting point for a weight assessment.',
        ],
      },
      {
        h2: 'Reading your BMI category',
        list: {
          intro:
            'The World Health Organization groups adult BMI into four broad bands. The coloured gauge above shows where your value sits:',
          items: [
            'Under 18.5 — underweight, which can signal undernutrition or other health issues.',
            '18.5 to 24.9 — a healthy weight for most adults.',
            '25 to 29.9 — overweight, where risk of conditions such as type 2 diabetes begins to climb.',
            '30 and above — obese, linked to substantially higher risk of cardiovascular and metabolic disease.',
          ],
        },
      },
      {
        h2: 'The limits of BMI',
        paragraphs: [
          'BMI measures mass, not body composition, so it cannot tell muscle from fat. A muscular athlete may register as "overweight" while carrying very little fat, and an older adult with low muscle mass may sit in the healthy range yet carry excess fat. BMI also does not account for where fat is stored — and abdominal fat carries more risk than fat on the hips or thighs.',
          'For a fuller picture, pair your BMI with a body-fat estimate and a waist-based measure such as waist-to-height ratio. Thresholds also differ for some populations: many health bodies use a lower overweight cut-off (around 23) for people of South Asian descent. Treat BMI as a useful first flag, not a diagnosis, and discuss any concerns with a healthcare professional.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a healthy BMI?',
        a: 'For most adults, a BMI between 18.5 and 24.9 is considered healthy. Below 18.5 is underweight, 25–29.9 is overweight, and 30 or above is obese, according to the World Health Organization.',
      },
      {
        q: 'Is BMI accurate for athletes?',
        a: 'Not always. BMI counts muscle and fat the same way, so very muscular people can be classed as overweight despite low body fat. Athletes should also look at body-fat percentage and waist measures.',
      },
      {
        q: 'Does BMI work the same for men and women?',
        a: 'The BMI formula and adult categories are the same for men and women. Body composition differs between sexes, which is one reason BMI is best used alongside other measures.',
      },
      {
        q: 'Is BMI used for children?',
        a: 'Children and teens use age- and sex-specific BMI percentiles instead of the fixed adult categories. This adult calculator is intended for people aged 18 and over.',
      },
    ],
    sources: [
      WHO_OBESITY,
      {
        citation: 'Centers for Disease Control and Prevention (CDC). "About BMI" — adult categories, uses, and limitations.',
        url: 'https://www.cdc.gov/bmi/about/index.html',
      },
    ],
  },

  // ============================================================
  'bmr-calculator': {
    seoTitle: 'BMR Calculator – Mifflin-St Jeor Equation',
    metaDescription:
      'Find your Basal Metabolic Rate with the accurate Mifflin-St Jeor formula, plus daily calorie needs for your activity level. Free, metric or imperial.',
    intro:
      'Your Basal Metabolic Rate (BMR) is the number of calories your body burns at complete rest. Enter your details to calculate it with the Mifflin-St Jeor equation and see your estimated daily calorie needs.',
    sections: [
      {
        h2: 'How your BMR is calculated',
        paragraphs: [
          'This tool uses the Mifflin-St Jeor equation, which research has found to be the most accurate of the common BMR formulas for the general population. It uses weight, height, age and sex:',
          'For men: BMR = (10 × weight kg) + (6.25 × height cm) − (5 × age) + 5. For women: BMR = (10 × weight kg) + (6.25 × height cm) − (5 × age) − 161. The result is the energy, in calories per day, needed just to keep your body running — breathing, circulating blood, and maintaining temperature — if you did nothing else all day.',
        ],
      },
      {
        h2: 'From BMR to daily calories (TDEE)',
        paragraphs: [
          'BMR is only the baseline. Your Total Daily Energy Expenditure (TDEE) adds the calories you burn through movement and digestion. The table above multiplies your BMR by a standard activity factor — from 1.2 for a sedentary lifestyle up to 1.9 for hard daily training — to estimate how much you actually burn.',
          'To lose weight, most guidance suggests eating a few hundred calories below your TDEE; to gain, a modest surplus. A deficit of roughly 500 calories a day is a common, sustainable target for gradual fat loss, but very low intakes are best supervised by a professional.',
        ],
      },
      {
        h2: 'What affects your metabolism',
        paragraphs: [
          'Muscle is more metabolically active than fat, so people with more lean mass tend to have higher BMRs — one reason strength training helps with long-term weight management. BMR also naturally declines with age and is influenced by genetics, hormones and body size. These estimates are population averages and individuals can vary by 10% or more, so use the number as a planning guide rather than an exact prescription.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the difference between BMR and TDEE?',
        a: 'BMR is the calories you burn at complete rest. TDEE is your total daily burn including activity and digestion. TDEE is always higher and is found by multiplying BMR by an activity factor.',
      },
      {
        q: 'Why does this use the Mifflin-St Jeor equation?',
        a: 'Studies comparing BMR formulas have found Mifflin-St Jeor to be more accurate for most people than older equations such as Harris-Benedict, which is why it is widely recommended by dietitians.',
      },
      {
        q: 'How many calories should I eat to lose weight?',
        a: 'A common approach is to eat about 500 calories below your TDEE for gradual loss of roughly half a kilo (one pound) per week. Avoid very low intakes without professional guidance.',
      },
    ],
    sources: [
      {
        citation:
          'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. "A new predictive equation for resting energy expenditure in healthy individuals." Am J Clin Nutr. 1990;51(2):241–247.',
        url: pubmed('A new predictive equation for resting energy expenditure in healthy individuals'),
      },
    ],
  },

  // ============================================================
  'ideal-weight-calculator': {
    seoTitle: 'Ideal Weight Calculator (BMI + Devine)',
    metaDescription:
      'See your healthy weight range from the BMI method and the Devine clinical formula. Free ideal weight calculator in metric or imperial — no signup.',
    intro:
      'There is no single perfect number on the scale, but you can find a sensible target range. This tool shows the healthy weight range for your height using BMI, plus a single figure from the clinical Devine formula.',
    sections: [
      {
        h2: 'Two ways to estimate ideal weight',
        paragraphs: [
          'The first method is BMI-based. A healthy BMI is 18.5–24.9, so the healthy weight range is simply 18.5 × height (m)² to 24.9 × height (m)². This gives a realistic band rather than one rigid figure, which better reflects how healthy bodies actually vary.',
          'The second is the Devine formula, created in the 1970s to standardise medication dosing. For men it is 50 kg + 2.3 kg for every inch over 5 feet; for women, 45.5 kg + 2.3 kg per inch over 5 feet. It returns a single reference weight and is still used in clinical settings, though it tends to under-estimate for very tall or very short people.',
        ],
      },
      {
        h2: 'Which number should you use?',
        paragraphs: [
          'Treat the BMI range as your everyday target — anywhere inside it is reasonable for most adults. The Devine figure is useful as a quick reference point and is what many medical formulas rely on, but it was never designed as a personal fitness goal.',
          'Neither method accounts for muscle mass, frame size or body-fat distribution. A muscular person may sit above their "ideal" weight while being very healthy. If your goal is body composition rather than a scale number, pair this with a body-fat or lean-mass estimate.',
        ],
      },
      {
        h2: 'Setting a healthy goal',
        paragraphs: [
          'If your current weight is outside the healthy range, you do not need to reach the exact middle of it to benefit. Research shows that losing just 5–10% of body weight meaningfully improves blood pressure, blood sugar and cholesterol. Aim for steady, sustainable change of around 0.5–1 kg (1–2 lb) per week, and focus on habits — food quality, protein, sleep and movement — rather than a single target number.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is there really an "ideal" weight?',
        a: 'No single number is ideal for everyone of the same height. A healthy weight is best thought of as a range, which is why this tool shows the full BMI-based band alongside the Devine reference figure.',
      },
      {
        q: 'Why do the BMI range and Devine numbers differ?',
        a: 'They use different methods. The BMI range comes from population health data, while the Devine formula is a clinical dosing estimate. Small differences between them are normal and expected.',
      },
      {
        q: 'Does ideal weight depend on age or muscle?',
        a: 'These formulas use only height and sex, so they do not adjust for age, frame size or muscle mass. Athletes and older adults in particular should interpret the result alongside body-composition measures.',
      },
    ],
    sources: [
      WHO_OBESITY,
      {
        citation:
          'Devine BJ. "Gentamicin therapy" (origin of the ideal body weight formula). Drug Intell Clin Pharm. 1974;8(11):650–655.',
        url: pubmed('Devine ideal body weight gentamicin therapy'),
      },
    ],
  },

  // ============================================================
  'body-fat-calculator': {
    directAnswer: {
      question: 'How can I estimate body fat without calipers?',
      answer:
        'The historical U.S. Navy circumference equations estimate body-fat percentage from height, neck and abdomen measurements (plus hips for women). A tape measure makes the method accessible, but results vary with tape placement and body shape and should not be treated as a diagnosis or an official military assessment.',
    },
    seoTitle: 'Body Fat Calculator – U.S. Navy Method',
    metaDescription:
      'Estimate body fat with the historical U.S. Navy tape formula in metric or imperial units. Includes measuring guidance, limits and cautious interpretation.',
    intro:
      'Use a tape measure to estimate body-fat percentage with the historical U.S. Navy circumference equations. The result and general fitness reference band are educational estimates, not medical diagnoses or current Navy qualification scores.',
    sections: [
      {
        h2: 'How the historical U.S. Navy method works',
        paragraphs: [
          'The original Hodgdon–Beckett equations estimate body density from height and body circumferences. Men use the abdomen at the navel and neck. Women use the narrowest natural waist, widest hip circumference and neck. All circumference and height measurements use centimeters in the formulas below. Imperial entries are converted to centimeters before calculation.',
          'For men: %fat = 495 ÷ (1.0324 − 0.19077 × log₁₀(abdomen − neck) + 0.15456 × log₁₀(height)) − 450. For women: %fat = 495 ÷ (1.29579 − 0.35004 × log₁₀(waist + hip − neck) + 0.22100 × log₁₀(height)) − 450. The logarithms are base 10, not natural logs. Measure on bare skin where practical, keep the tape level without pressing into the skin, and read after a normal exhalation.',
        ],
      },
      {
        h2: 'What the fitness reference band means',
        paragraphs: [
          'The gauge preserves a broad, historical set of general fitness reference labels: essential fat, athletic, fitness, average and a higher range. These categories are descriptive, not population percentiles, medical risk diagnoses or individualized targets. They are not adjusted for age, body proportions, health conditions or measurement uncertainty. The value is an estimate, not a confirmed percentage.',
          'The calculator does not manufacture a 2% or 60% answer when measurements produce an impossible result. It instead asks you to recheck the inputs. An unusually low or high estimate that is still mathematically possible also deserves cautious interpretation rather than a label-based health conclusion.',
        ],
      },
      {
        h2: 'Measurement uncertainty and current Navy procedures',
        paragraphs: [
          'The estimate can shift when the tape is moved, tightened or read differently, especially when the abdomen or neck is close in size. Repeat measurements under similar conditions and look for trends rather than treating a tenth of a percentage point as a real physiological change. DXA and other clinical body-composition methods provide a different assessment and have their own limitations.',
          'The U.S. Navy now publishes a different official Body Composition Assessment (BCA) procedure, using waist-to-height screening followed when needed by a calculation using height, waist and weight. This historical neck-and-hip calculator is not suitable for Navy BCA certification, pass/fail decisions, diagnosis or treatment planning.',
        ],
      },
    ],
    faq: [
      {
        q: 'How accurate is the historical Navy body fat method?',
        a: 'It is a population-based estimate, not a direct measurement. Error can be meaningful for an individual, especially with unusual body proportions or inconsistent tape placement. Avoid treating small changes as precise.',
      },
      {
        q: 'Where do I measure my waist and neck?',
        a: 'For men, measure the abdomen horizontally at the navel, not at the narrowest point. For women, measure the narrowest natural waist and the widest hips. Measure the neck just below the larynx, with the tape level and not compressing the skin.',
      },
      {
        q: 'Do these fitness categories show whether I am healthy?',
        a: 'No. They are broad, non-age-adjusted general fitness reference bands, not clinical diagnoses or individual targets. A health assessment requires more context than a tape-measure estimate.',
      },
      {
        q: 'Can I use this calculator for the current U.S. Navy BCA?',
        a: 'No. The current official Navy BCA uses waist-to-height screening and a separate height, waist and weight calculation when required. Only the approved Navy procedures determine official results.',
      },
    ],
    sources: [
      {
        citation: 'Hodgdon JA, Beckett MB. Prediction of percent body fat for U.S. Navy men and women from body circumference measurements. Naval Health Research Center Reports 84-11 and 84-29, 1984.',
      },
      {
        citation: 'U.S. Navy. Guide-4: Body Composition Assessment. Current official BCA screening and calculation procedures.',
        url: 'https://www.mynavyhr.navy.mil/Portals/55/Support/Culture%20Resilience/Physical/Guide-4%20Body%20Composition%20Assessment.pdf',
      },
      {
        citation: 'Navy Medicine. General Body-fat Percentage Categories, ShipShape / NOFFS Active Living educational material (2019). Illustrative, not diagnostic fitness labels.',
        url: 'https://www.med.navy.mil/Portals/62/Documents/NMFA/NMCPHC/root/Documents/health-promotion-wellness/general-tools-and-programs/Webinars/1904-NMCPHC-Webinar-%20April-NOFFS-Active-Living.pdf',
      },
    ],
  },

  // ============================================================
  'lean-body-mass-calculator': {
    seoTitle: 'Lean Body Mass Calculator (Boer Formula)',
    metaDescription:
      'Estimate lean body mass using the Boer formula and view the derived fat-mass remainder. Metric or imperial, with clear limitations.',
    intro:
      'Estimate lean body mass from your weight, height and sex using Boer’s 1984 equation. The tool also shows a mathematically derived fat-mass remainder, not a measured body-fat or muscle result.',
    sections: [
      {
        h2: 'How the Boer formula works',
        paragraphs: [
          'The Boer equation predicts lean body mass from weight (kilograms), height (centimeters) and sex. Men: LBM (kg) = 0.407 × weight (kg) + 0.267 × height (cm) − 19.2. Women: LBM (kg) = 0.252 × weight (kg) + 0.473 × height (cm) − 48.3. The tool converts pounds and feet/inches to kilograms and centimeters before calculating, then converts mass results back into your selected units.',
          'For example, a man weighing 75 kg at 175 cm has an estimated lean body mass of 58.05 kg (displayed as 58.1 kg). The remaining 16.95 kg is shown as a derived fat-mass estimate. That remainder comes entirely from the prediction equation, not from a direct measurement of fat tissue.',
        ],
      },
      {
        h2: 'Why this split does not measure muscle change',
        paragraphs: [
          'Lean body mass includes more than skeletal muscle: it also involves water, organs, bone and other lean tissues. The exact definitions and compartments depend on the body-composition method. Neither figure in the calculator is an independently measured amount of muscle or fat.',
          'For someone whose sex and height remain the same, the Boer prediction changes automatically with weight: for every 1 kg change in body weight the equation assigns 0.407 kg to estimated lean mass for men, or 0.252 kg for women. That arithmetic is built in and cannot reveal whether a change was actually muscle, fat or water. Avoid treating these predictions as proof of muscle gain or fat loss.',
        ],
      },
      {
        h2: 'When an estimate does not fit',
        paragraphs: [
          'The calculator rejects invalid inputs or combinations implying nonpositive lean mass or zero/negative fat mass. It asks you to recheck height, weight and selected units instead of displaying a misleading zero-fat result. This is a mathematical consistency check, not a health threshold; other results can still be inaccurate for an individual.',
          'Boer’s original work studied a relatively small group of healthy adults in relation to body-fluid volume. Body proportions, age, hydration and illness can affect how well a population equation describes an individual. The result is educational and should not determine medical dosing, diagnosis, or treatment.',
        ],
      },
      {
        h2: 'How to interpret the estimate',
        paragraphs: [
          'For a more informative evaluation of body composition, a qualified clinician may consider an appropriate method such as DXA or bioelectrical impedance analysis. Those methods also have measurement uncertainty, preparation requirements, and method-specific definitions of lean tissue and fat mass.',
          'For changes over time, consider overall health, physical function and strength alongside weight rather than interpreting a change in this predicted value as a verified tissue change. This simple adult-oriented equation is not a substitute for individualized assessment during pregnancy, childhood or substantial medical/fluid changes.',
        ],
      },
    ],
    faq: [
      {
        q: 'What units does the Boer formula use?',
        a: 'It uses kilograms for weight and centimeters for height. The calculator converts pounds and feet/inches into metric units before applying the original coefficients.',
      },
      {
        q: 'Is lean body mass the same as muscle mass?',
        a: 'No. Lean body mass includes organs, water, bone and other nonfat tissues as well as muscle. The Boer equation cannot measure skeletal muscle.',
      },
      {
        q: 'Can the formula tell whether I lost fat or gained muscle?',
        a: 'No. It predicts lean mass using weight and height, then subtracts the prediction from weight. Changes in those results are partly imposed by the formula, not independently observed tissue changes.',
      },
      {
        q: 'What if my measurements are incompatible?',
        a: 'Check your weight, height and selected units. Some combinations make this linear equation predict more lean mass than the body weighs, so the tool refuses to display a false zero-fat result.',
      },
    ],
    sources: [
      {
        citation: 'Boer P. Estimated lean body mass as an index for normalization of body fluid volumes in humans. Am J Physiol. 1984;247(4 Pt 2):F632–F636.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/6496691/',
      },
      {
        citation: 'Obesity Medicine Association. Obesity history, physical exam, laboratory, body composition, and energy expenditure: Clinical Practice Statement (2022).',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10661987/',
      },
      {
        citation: 'Methodological standards for body composition assessment: expert-endorsed guide for bioimpedance, DXA, CT and ultrasound. Am J Clin Nutr (2026).',
        url: 'https://ajcn.nutrition.org/article/S0002-9165%2826%2900092-4/fulltext',
      },
    ],
  },

  // ============================================================
  'waist-to-height-ratio-calculator': {
    seoTitle: 'Waist-to-Height Ratio Calculator (WHtR)',
    metaDescription:
      'Check your waist-to-height ratio — a fast indicator of central fat risk. Keep your waist under half your height. Free, metric or imperial.',
    intro:
      'Your waist-to-height ratio (WHtR) is one of the simplest and most effective ways to gauge health risk from abdominal fat. Enter your waist and height to see your ratio and risk band.',
    sections: [
      {
        h2: 'How waist-to-height ratio works',
        paragraphs: [
          'The calculation could not be simpler: waist circumference ÷ height, using the same unit for both. A ratio of 0.5 means your waist is exactly half your height. The widely promoted public-health message is: "keep your waist to less than half your height."',
          'Because it scales waist size to your stature, WHtR works across different heights, ages and ethnic groups better than a raw waist measurement, and several studies have found it predicts cardiometabolic risk at least as well as BMI — sometimes better.',
        ],
      },
      {
        h2: 'Reading your ratio',
        list: {
          intro: 'The gauge above places your ratio into broad bands:',
          items: [
            'Below 0.4 — low, and occasionally a sign of being underweight.',
            '0.4 to 0.5 — healthy; this is the target zone for most adults.',
            '0.5 to 0.6 — increased risk, indicating excess central fat.',
            'Above 0.6 — high risk, strongly linked to heart and metabolic disease.',
          ],
        },
      },
      {
        h2: 'Why central fat matters',
        paragraphs: [
          'Fat stored around the abdomen (visceral fat) is more metabolically harmful than fat on the hips and thighs. It is associated with higher risk of type 2 diabetes, high blood pressure and cardiovascular disease — even in people whose BMI looks normal, sometimes described as "normal weight obesity." That is why a waist-based measure adds information that BMI alone misses.',
          'Measure your waist at the midpoint between the bottom of your ribs and the top of your hip bones, directly against the skin, after breathing out normally. If your ratio is above 0.5, reducing waist size through diet quality, regular activity and better sleep can lower your risk substantially.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a healthy waist-to-height ratio?',
        a: 'A ratio below 0.5 is considered healthy for most adults — in other words, your waist should be less than half your height. Ratios above 0.5 indicate increasing central-fat risk.',
      },
      {
        q: 'Is waist-to-height ratio better than BMI?',
        a: 'It is a useful complement. Because it captures abdominal fat, WHtR can flag risk in people with a normal BMI. Many researchers recommend using both together.',
      },
      {
        q: 'How do I measure my waist correctly?',
        a: 'Measure midway between your lowest rib and the top of your hip bone, against bare skin, keeping the tape level and snug but not compressing. Breathe out normally and read the measurement.',
      },
    ],
    sources: [
      {
        citation:
          'Ashwell M, Hsieh SD. "Six reasons why the waist-to-height ratio is a rapid and effective global indicator for health risks of obesity." Int J Food Sci Nutr. 2005;56(5):303–307.',
        url: pubmed('Six reasons why the waist-to-height ratio is a rapid and effective global indicator'),
      },
      WHO_OBESITY,
    ],
  },

  // ============================================================
  'waist-to-hip-ratio-calculator': {
    seoTitle: 'Waist-to-Hip Ratio Calculator (WHO)',
    metaDescription:
      'Calculate your waist-to-hip ratio and see your WHO health-risk band. Free WHR calculator with metric and imperial units — no signup.',
    intro:
      'The waist-to-hip ratio (WHR) compares the size of your waist to your hips to assess how your body stores fat. Enter your measurements to see your ratio and World Health Organization risk band.',
    sections: [
      {
        h2: 'How waist-to-hip ratio works',
        paragraphs: [
          'WHR is your waist circumference divided by your hip circumference, using the same unit for both. A higher ratio means more fat is carried around the middle (an "apple" shape) rather than the hips and thighs (a "pear" shape). Central fat is the pattern most strongly linked to health risk.',
          'Measure your waist at its narrowest point and your hips at their widest, keeping the tape horizontal and snug. Stand relaxed and breathe out normally before reading each measurement.',
        ],
      },
      {
        h2: 'WHO risk thresholds',
        list: {
          intro:
            'The World Health Organization considers abdominal obesity — and substantially increased health risk — to begin above these ratios:',
          items: [
            'Men: a ratio above 0.90 indicates increased risk.',
            'Women: a ratio above 0.85 indicates increased risk.',
            'Lower ratios (at or below those thresholds) are associated with lower risk.',
          ],
        },
      },
      {
        h2: 'What your ratio tells you',
        paragraphs: [
          'A high WHR is associated with greater risk of type 2 diabetes, high blood pressure, heart disease and stroke, independent of overall weight. Some large studies have found WHR predicts heart-attack risk more strongly than BMI, because it captures dangerous abdominal fat directly.',
          'WHR does have limits: it can be skewed by a naturally wide or narrow pelvis, and it is less reliable at very high BMIs. For a rounded view of central-fat risk, consider it alongside waist-to-height ratio and your BMI, and speak to a clinician if your ratio is above the WHO threshold.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a healthy waist-to-hip ratio?',
        a: 'The World Health Organization links increased health risk to a ratio above 0.90 for men and above 0.85 for women. Ratios at or below these levels are considered lower risk.',
      },
      {
        q: 'Is waist-to-hip ratio better than BMI?',
        a: 'WHR measures fat distribution, which BMI ignores. Some studies find it predicts cardiovascular risk better than BMI, but the two measures work best when used together.',
      },
      {
        q: 'How should I measure my waist and hips?',
        a: 'Measure your waist at its narrowest point and your hips at their widest, with the tape horizontal and snug against the skin. Breathe out normally and avoid pulling the tape tight.',
      },
    ],
    sources: [WHO_WHR, WHO_OBESITY],
  },

  // ============================================================
  'weight-loss-percentage-calculator': {
    seoTitle: 'Weight Loss Percentage Calculator (Free)',
    metaDescription:
      'Work out what percentage of your starting weight you have lost. Free weight loss percentage calculator in metric or imperial — track your progress.',
    intro:
      'Tracking weight loss as a percentage of your starting weight is a fairer way to measure progress than pounds or kilograms alone. Enter your starting and current weight to see your percentage and the amount lost.',
    sections: [
      {
        h2: 'How the calculation works',
        paragraphs: [
          'The formula is: weight loss % = ((starting weight − current weight) ÷ starting weight) × 100. So if you started at 90 kg and now weigh 82 kg, you have lost 8 kg, which is (8 ÷ 90) × 100 = 8.9% of your starting weight.',
          'Expressing loss as a percentage lets you compare progress fairly between people of very different sizes, and it is the measure used in clinical weight-management research and TV-style weight-loss challenges alike.',
        ],
      },
      {
        h2: 'Why percentage matters more than the scale',
        paragraphs: [
          'Health guidelines focus on percentage because the benefits scale with it. Losing just 5% of your body weight can lower blood pressure, improve blood sugar control and reduce cholesterol; losing 10% brings even larger improvements and can put some cases of type 2 diabetes into remission. You do not have to reach an "ideal" weight to gain real, measurable health benefits.',
          'The calculator above flags these milestones for you — 5% (clinically meaningful) and 10% (significant) — so you can see how close you are to the thresholds that matter most.',
        ],
      },
      {
        h2: 'Setting a healthy pace',
        paragraphs: [
          'A safe, sustainable rate of loss is generally 0.5–1 kg (1–2 lb) per week, or roughly 0.5–1% of body weight. Faster loss is more likely to come from water and muscle and tends to rebound. Weigh yourself under consistent conditions — same time of day, similar clothing — and expect normal day-to-day fluctuations of a kilo or more from water and food. Watching the weekly trend is far more useful than reacting to a single reading.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a good weight loss percentage?',
        a: 'Losing 5% of your starting weight is considered clinically meaningful, and 10% brings major health benefits. These targets matter more than reaching a specific "goal" weight.',
      },
      {
        q: 'How fast should I lose weight?',
        a: 'Most guidance recommends 0.5–1 kg (1–2 lb) per week, about 0.5–1% of body weight. Faster loss is harder to sustain and more likely to include muscle and water rather than fat.',
      },
      {
        q: 'Why track percentage instead of pounds?',
        a: 'Percentage accounts for your starting size, so it compares progress fairly between people and matches the way health benefits of weight loss are measured in research.',
      },
    ],
    sources: [
      WHO_OBESITY,
      {
        citation:
          'Magkos F, et al. "Effects of moderate and subsequent progressive weight loss on metabolic function and adipose tissue biology in humans with obesity." Cell Metab. 2016;23(4):591–601.',
        url: pubmed('Effects of moderate and subsequent progressive weight loss metabolic function adipose tissue'),
      },
    ],
  },
};

