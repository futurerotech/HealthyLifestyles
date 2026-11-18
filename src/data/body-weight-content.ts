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
    'World Health Organization. Waist circumference and waist–hip ratio: report of a WHO expert consultation, Geneva 8–11 December 2008 (published 2011), Annex A Table A1 and section 2.5.',
  url: 'https://www.who.int/publications-detail-redirect/9789241501491',
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
      question: 'What BMI range is considered a healthy weight for adults?',
      answer:
        'For U.S. adults age 20 and older, the CDC uses BMI 18.5 to below 25 as the healthy-weight screening category, 25 to below 30 as overweight, and 30 or above as obesity. Below 18.5 is underweight. BMI is based on weight and height and does not diagnose health or measure body fat directly.',
    },
    seoTitle: 'Adult BMI Calculator (Metric & Imperial)',
    metaDescription:
      'Calculate adult BMI from weight and height, view CDC cutoffs at 18.5, 25 and 30, and see an approximate reference-weight interval in kg or lb.',
    intro:
      'Calculate your body mass index using weight and height, with either kilograms/centimeters or pounds/feet/inches. The results use U.S. CDC screening categories for adults age 20 and older and are not a medical diagnosis.',
    sections: [
      {
        h2: 'The BMI formula and unit conversions',
        paragraphs: [
          'BMI = weight in kilograms ÷ (height in meters)². For a person who weighs 70 kg and measures 175 cm (1.75 m), BMI = 70 ÷ (1.75 × 1.75) = 22.86, usually shown as 22.9. The same calculation can use pounds and inches once the inputs are converted using 1 pound = 0.45359237 kilograms and 1 inch = 2.54 centimeters.',
          'The calculator uses metric units internally, and it classifies the unrounded BMI. If a value is close to a category boundary, the result may show additional decimals so a number rounded to 25.0 is not paired with the wrong category. Metric-to-imperial input toggles use extra precision to reduce unintended changes around a threshold, but no display conversion is perfectly lossless.',
        ],
      },
      {
        h2: 'Adult BMI categories and their exact boundaries',
        list: {
          intro:
            'The U.S. Centers for Disease Control and Prevention (CDC) publishes the following categories for adults age 20 and older:',
          items: [
            'BMI below 18.5: underweight screening category.',
            'BMI 18.5 to below 25: healthy-weight screening category.',
            'BMI 25 to below 30: overweight screening category.',
            'BMI 30 and above: obesity screening category, with additional classes at 35 and 40 in CDC guidance.',
          ],
        },
      },
      {
        h2: 'What the reference weight interval really means',
        paragraphs: [
          'At a given height, the BMI reference interval is calculated by multiplying the square of height (in meters) by 18.5 for the lower endpoint and by 25 for the upper endpoint. The upper endpoint is exclusive: a BMI of exactly 25 belongs to the overweight screening category. Displayed weights are rounded for readability, so the approximate endpoints are not precise health goals.',
          'For example, at 175 cm, the BMI-based interval spans about 56.7 kg to just under 76.6 kg. An individual’s appropriate weight cannot be determined by this formula alone. Do not interpret the result as advice to gain or lose weight, particularly if pregnancy, medical conditions or an eating disorder may be involved.',
        ],
      },
      {
        h2: 'What BMI cannot establish',
        paragraphs: [
          'BMI is a screening measure, not a measurement of body-fat percentage, muscle, bone or where fat is distributed. A muscular person can have a relatively high BMI without the same body composition as someone with less muscle; an older adult can have an average BMI and still need assessment of muscle strength or health. A BMI number does not by itself diagnose a disease.',
          'A clinician may consider waist circumference, other anthropometric measures, blood pressure, laboratory tests, medical history and symptoms. BMI-related risks vary among individuals and populations, and some groups can experience risk at lower BMI values; the universal categories are not personalized risk estimates.',
        ],
      },
      {
        h2: 'Age and other situations needing different interpretation',
        paragraphs: [
          'The CDC adult BMI calculator and its fixed categories are intended for ages 20 and older. U.S. children and teens ages 2 through 19 require BMI-for-age and sex-specific growth charts rather than adult cutoffs. The tool does not ask for age and cannot verify eligibility automatically.',
          'During pregnancy, ordinary adult BMI classification is not an appropriate substitute for prenatal guidance. If you have concerns about body weight or a large change, discuss them with a qualified healthcare professional rather than relying on a single screen or attempting an unplanned weight change.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the correct BMI formula?',
        a: 'Divide weight in kilograms by the square of height in meters. For imperial inputs, convert pounds to kilograms and feet/inches to meters first.',
      },
      {
        q: 'Does a BMI of exactly 18.5, 25 or 30 change categories?',
        a: 'Yes. 18.5 starts the CDC adult healthy-weight category, 25 starts overweight, and 30 starts obesity. The calculator uses the raw number for comparisons, not a rounded one.',
      },
      {
        q: 'Is the BMI-based reference weight a target weight?',
        a: 'No. It is a mathematical interval for BMI 18.5 up to but not including 25 at your height. Its displayed boundaries are rounded, and it is not a personalized weight recommendation.',
      },
      {
        q: 'Can I use adult BMI categories if I am 18 or 19?',
        a: 'The U.S. CDC adult BMI calculator is for people age 20 or older. For ages 2–19, CDC uses BMI-for-age and sex-specific growth charts.',
      },
      {
        q: 'Does BMI determine whether I have excess body fat or a disease?',
        a: 'No. BMI is a screening tool that does not measure body fat directly or diagnose disease. It should be considered with medical history, examinations and other relevant findings.',
      },
    ],
    sources: [
      {
        citation: 'Centers for Disease Control and Prevention. Adult BMI Categories (March 19, 2024): categories, boundaries, age scope and screening limitations.',
        url: 'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',
      },
      {
        citation: 'Centers for Disease Control and Prevention. Adult BMI Calculator (June 26, 2024): formula, imperial inputs, scope and interpretive cautions.',
        url: 'https://www.cdc.gov/bmi/adult-calculator/index.html',
      },
      {
        citation: 'World Health Organization. Obesity and overweight: adult BMI at or above 25 and 30 and pediatric-age interpretation.',
        url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
      },
    ],
  },

  // ============================================================
  'bmr-calculator': {
    seoTitle: 'BMR Calculator — Mifflin–St Jeor Resting Energy Estimate',
    metaDescription:
      'Estimate resting calorie expenditure with Mifflin–St Jeor in kg/cm or lb/ft/in and compare approximate activity-based TDEE scenarios, with clear limitations.',
    intro:
      'This BMR calculator uses the Mifflin–St Jeor equation to estimate resting energy expenditure (REE) from weight, height, age and sex. It also compares possible total daily energy expenditure (TDEE) levels using assumed activity factors. Neither result is a direct metabolic measurement or a personalized calorie prescription.',
    sections: [
      {
        h2: 'The Mifflin–St Jeor equation: weight, height, age and sex',
        paragraphs: [
          'The simplified equation predicts REE in kilocalories per day. For men: REE = (10 × weight in kg) + (6.25 × height in cm) − (5 × age in years) + 5. For women: REE = (10 × weight in kg) + (6.25 × height in cm) − (5 × age in years) − 161. The different sex constants are a feature of the original regression, not an adjustment to your personal hormone levels or body composition.',
          'For a 30-year-old man weighing 70 kg and measuring 175 cm, the equation gives 1,648.75 kcal/day, displayed as about 1,649 kcal/day. With the female equation and the same weight, height and age, it predicts about 1,483 kcal/day. The calculator converts pounds to kilograms and feet/inches to centimeters before calculation; its output always uses kcal/day.',
        ],
      },
      {
        h2: 'Why the BMR calculator actually estimates REE',
        paragraphs: [
          'Mifflin and colleagues developed their 1990 prediction using resting energy expenditure (REE) measured by indirect calorimetry in 498 healthy people ages 19–78. Basal metabolic rate (BMR) describes a more strictly controlled resting measurement, usually after waking and fasting; the terms are sometimes used interchangeably, but the equation itself predicts REE rather than directly measuring either one.',
          'A formula based on population data may overestimate or underestimate an individual result. It cannot identify your actual metabolic rate, infer body-fat percentage, or diagnose a thyroid disorder. Clinical conditions, pregnancy, medications, hydration, changes in body composition and age outside the original studied range may change its applicability.',
        ],
      },
      {
        h2: 'Resting energy versus total daily expenditure (TDEE)',
        paragraphs: [
          'TDEE includes energy used at rest along with movement and the thermic effect of food. The five rows above multiply predicted REE by illustrative factors of 1.2, 1.375, 1.55, 1.725 and 1.9. They are scenarios only: the calculator does not ask about actual activity and cannot know which factor, if any, represents your life.',
          'For the 30-year-old man in the example, multiplying 1,648.75 by 1.2 gives approximately 1,979 kcal/day, while multiplying by 1.55 gives about 2,556 kcal/day. These are estimates of daily expenditure, not measured values and not recommendations to eat exactly that number. Physical activity and energy needs can vary from day to day.',
        ],
      },
      {
        h2: 'Adult age ranges and responsible use',
        paragraphs: [
          'This tool accepts ages 19–100 as whole years, but the derivation study included people aged 19–78. Results above age 78 extend beyond that study sample and should be interpreted more cautiously. It is not designed as a pediatric energy-needs calculator; growing children and adolescents need developmentally appropriate methods.',
          'Do not interpret a lower resting calorie estimate as a safe minimum food intake. The result should not be used alone to plan a calorie deficit, a diet for pregnancy or breastfeeding, or nutritional treatment during illness. If you need individualized nutrition or energy targets, a qualified clinician or registered dietitian can interpret your health history and may arrange indirect calorimetry when appropriate.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is the Mifflin–St Jeor equation for men and women?',
        a: 'Both use 10 × weight (kg) + 6.25 × height (cm) − 5 × age (years). Add 5 for men or subtract 161 for women. The prediction is REE in kcal/day.',
      },
      {
        q: 'Is the BMR result a measured metabolism?',
        a: 'No. The original equation predicts resting energy expenditure (REE). A measured basal rate or indirect-calorimetry result is a different assessment requiring specific conditions.',
      },
      {
        q: 'Is the TDEE table a personalized activity calculation?',
        a: 'No. It compares five hypothetical activity multipliers; the tool has no activity input or observation. Actual expenditure and energy needs may differ substantially.',
      },
      {
        q: 'Why does the calculator start at age 19?',
        a: 'The original research recruited adults ages 19–78. Its simplified equation is adult-oriented, and predictions beyond the sampled age range, including ages over 78, require more caution.',
      },
      {
        q: 'Can I use this number as my daily calorie intake target?',
        a: 'Not by itself. REE estimates resting expenditure, not recommended food intake. A clinician or registered dietitian can help set an appropriate target when needed.',
      },
    ],
    sources: [
      {
        citation: 'Mifflin MD, St Jeor ST, Hill LA, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241–247. PMID 2305711.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
      },
      {
        citation: 'National Research Council. Recommended Dietary Allowances, 10th ed. Energy chapter: REE, basal conditions, physical activity and estimated total daily energy expenditure.',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK234938/',
      },
      {
        citation: 'National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK). About the Body Weight Planner: personalized energy plans, age and pregnancy exclusions.',
        url: 'https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner',
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
      'Calculate waist-to-height ratio with metric or imperial inputs, NICE reference bands, accurate measuring guidance and screening limitations.',
    intro:
      'Compare your waist circumference with your height to estimate central adiposity. Use a consistent tape measurement and read the result as a screening reference, not a diagnosis of heart disease or diabetes.',
    sections: [
      {
        h2: 'How to measure and calculate the ratio',
        paragraphs: [
          'Waist-to-height ratio (WHtR) is waist circumference divided by standing height, using the same units. For example, a 96.5 cm waist and a 170 cm height give 96.5 ÷ 170 = 0.568, displayed as 0.57. The tool also accepts inches and feet; imperial measurements are converted back into centimeters before dividing, so the ratio itself has no units.',
          'Follow the NICE measuring method: find the bottom of your ribs and the top of your hip bone, then measure the waist midway between them, normally just above the belly button. Keep the tape horizontal, snug but not pressing into the skin, and read after breathing out normally. This differs from measuring the narrowest point of the waist.',
        ],
      },
      {
        h2: 'Understanding the NICE reference bands',
        list: {
          intro:
            'The two-decimal value shown in the calculator is grouped into central-adiposity reference bands, not personal diagnoses:',
          items: [
            'Below 0.40: below the listed reference bands. This number alone does not diagnose underweight or confirm good health.',
            '0.40–0.49: within the reference range for central adiposity; this does not rule out other health risks.',
            '0.50–0.59: increased central adiposity, associated with increased cardiometabolic risk factors.',
            '0.60 and above: high central adiposity, associated with further increased risk. The chart expands its scale instead of hiding values above 0.70.',
          ],
        },
      },
      {
        h2: 'What the result does and does not mean',
        paragraphs: [
          'NICE recommends using waist-to-height ratio together with BMI in adults, particularly those with BMI below 35 kg/m². The ratio is a practical estimate of abdominal fat distribution associated with risk factors such as type 2 diabetes, high blood pressure and cardiovascular disease. It is not a direct measurement of visceral fat or a numerical probability that you will develop a disease.',
          'The calculator does not collect BMI, age, pregnancy status or medical history, so its bands cannot establish your individual risk. If you are pregnant, have a higher BMI, a condition changing height, or a history of disordered eating, seek tailored guidance rather than relying on this single value. A value below 0.50 should not be read as a guarantee against cardiometabolic problems.',
        ],
      },
      {
        h2: 'What to do with a higher measurement',
        paragraphs: [
          'The practical reminder is to aim for a waist measurement below half your height when that target is appropriate for you. If your result suggests increased central adiposity, consider discussing blood pressure, glucose, cholesterol and personal circumstances with a health professional rather than starting a drastic diet based on one reading.',
          'Small changes near 0.40, 0.50 or 0.60 may reflect tape placement, measurement precision or rounding. For a useful comparison over time, use the same anatomical location and measurement conditions. The category follows the displayed two-decimal ratio to avoid a mismatch between the visible number and its band.',
        ],
      },
    ],
    faq: [
      {
        q: 'How do you calculate waist-to-height ratio?',
        a: 'Divide waist circumference by height in the same units. For example, 85 cm ÷ 170 cm = 0.50. For imperial measurements, convert feet to inches before dividing; this calculator does the conversion for you.',
      },
      {
        q: 'Is a waist-to-height ratio of exactly 0.50 within the lower reference band?',
        a: 'No. NICE places 0.50 in the increased-central-adiposity band (0.50–0.59). A value of exactly 0.60 is in the high band.',
      },
      {
        q: 'Where should I measure my waist?',
        a: 'Measure halfway between the bottom of your ribs and the top of your hip bone, just above the belly button, after breathing out normally. Do not substitute the narrowest waist point.',
      },
      {
        q: 'Does a ratio below 0.50 mean I have no cardiovascular risk?',
        a: 'No. This is an estimate of central adiposity, not a clinical diagnosis. A clinician may assess BMI, blood pressure, blood tests, family history and other relevant factors.',
      },
    ],
    sources: [
      {
        citation: 'National Institute for Health and Care Excellence (NICE). Overweight and obesity management, guideline NG246: Identifying and assessing overweight, obesity and central adiposity (2025/2026).',
        url: 'https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity',
      },
      {
        citation: 'National Health Service. Calculate your waist to height ratio (reviewed February 2025).',
        url: 'https://www.nhs.uk/health-assessment-tools/calculate-your-waist-to-height-ratio',
      },
      {
        citation: 'NHS England Digital. Health Survey for England 2024: adults overweight and obesity, waist-to-height ratio categories.',
        url: 'https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity',
      },
    ],
  },

  // ============================================================
  'waist-to-hip-ratio-calculator': {
    seoTitle: 'Waist-to-Hip Ratio Calculator (WHO-Referenced Cutoffs)',
    metaDescription:
      'Calculate waist-to-hip ratio in centimeters or inches; see 0.90 male and 0.85 female reference cutoffs, measurement technique and limitations.',
    intro:
      'Compare waist and hip circumferences with a unit-free ratio. The tool shows sex-specific reference cutoffs cited in a WHO expert report, but does not measure visceral fat or diagnose a health condition.',
    sections: [
      {
        h2: 'How to calculate and measure waist-to-hip ratio',
        paragraphs: [
          'Waist-to-hip ratio (WHR) = waist circumference ÷ hip circumference, measured in the same unit. For example, a 90 cm waist and 100 cm hips give 0.90. Measurements in inches give the same ratio; the calculator converts both imperial lengths to centimeters before dividing. It does not use height, weight or BMI in its formula.',
          'WHO’s standardized method measures the waist halfway between the lower edge of the last palpable rib and the top of the iliac crest (hip bone). Measure the hips around the widest part of the buttocks. Keep a flexible, non-stretch tape level and snug without pressing into the skin; stand relaxed and read after a normal breath out. Measure twice; if readings are within 1 cm, take their average, otherwise repeat them.',
        ],
      },
      {
        h2: 'How to read the sex-specific reference cutoff',
        list: {
          intro:
            'Annex A, Table A1 of the WHO expert consultation report reproduces commonly cited reference cutoffs, rather than defining a new three-tier WHO risk score:',
          items: [
            'Men: WHR below 0.90 is below the reference cutoff; WHR of 0.90 or higher is at or above it.',
            'Women: WHR below 0.85 is below the reference cutoff; WHR of 0.85 or higher is at or above it.',
            'These cutoffs are population-level indicators of abdominal fat distribution and associated metabolic complications, not a diagnosis or individual disease probability.',
          ],
        },
      },
      {
        h2: 'What the ratio can—and cannot—tell you',
        paragraphs: [
          'A higher ratio often accompanies more abdominal fat distribution and is associated with cardiometabolic outcomes in population studies. It is not a direct test of visceral fat, diabetes, heart disease or the severity of a condition. The 2008 WHO expert consultation explicitly did not adopt new, definitive universal cutoffs; variation by ancestry, age, sex, body shape and measurement method matters.',
          'The chart therefore displays only two reference states, below or at/above the reported cutoff. It does not claim that 1.00 or 1.30 represents an additional WHO-defined risk category, nor that a value below the cutoff guarantees safety. The calculation compares the unrounded measurements with the cutoff and may show extra decimals near the boundary to prevent a misleading rounded match.',
        ],
      },
      {
        h2: 'Using the result alongside other measures',
        paragraphs: [
          'For clinical context, consider BMI, waist circumference, blood pressure, glucose, cholesterol, family history and individual circumstances. A clinician can interpret these together rather than making treatment decisions from the ratio alone.',
          'Because a small change in tape placement may change a result near 0.85 or 0.90, repeat waist and hip measurements consistently. Pregnancy, recent surgery, changes in body shape and other circumstances may call for individualized assessment rather than applying a general adult reference cutoff.',
        ],
      },
    ],
    faq: [
      {
        q: 'How do I calculate waist-to-hip ratio?',
        a: 'Divide waist circumference by hip circumference using the same units. For example, 90 cm ÷ 100 cm = 0.90; the units cancel.',
      },
      {
        q: 'Which waist-to-hip ratios are at the commonly cited WHO cutoff?',
        a: 'Annex A of the 2008 WHO expert consultation prints 0.90 or higher for men and 0.85 or higher for women. The consultation did not establish a new universal clinical diagnosis rule.',
      },
      {
        q: 'Where do I measure my waist and hips?',
        a: 'Measure the waist halfway between the bottom of the last palpable rib and the top of the hip bone. Measure the hips at the widest part of the buttocks. Keep the tape horizontal, and breathe out normally.',
      },
      {
        q: 'Does a ratio below the cutoff prove my cardiovascular risk is low?',
        a: 'No. Waist-to-hip ratio describes body proportions and correlates with some population risk outcomes. Individual health assessment also considers other measures and clinical history.',
      },
    ],
    sources: [
      WHO_WHR,
      {
        citation: 'Ross R, Neeland IJ, Yamashita S, et al. Waist circumference as a vital sign in clinical practice: a Consensus Statement from the IAS and ICCR Working Group on Visceral Obesity. Nat Rev Endocrinol. 2020;16:177–189.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7027970/',
      },
    ],
  },

  // ============================================================
  'weight-loss-percentage-calculator': {
    seoTitle: 'Weight Change Percentage Calculator (Loss or Gain)',
    metaDescription:
      'Calculate weight lost or gained as a percentage of starting weight, in kg or lb, with clear 5% and 10% reference milestones and cautions.',
    intro:
      'Compare starting and current weight to see the percent change in either direction. The tool reports weight lost, weight gained or no change and keeps the same starting weight as its denominator. A percentage cannot by itself tell you whether a change is healthy or how fast it happened.',
    sections: [
      {
        h2: 'How percentage change is calculated',
        paragraphs: [
          'Percent weight change from baseline = ((starting weight − current weight) ÷ starting weight) × 100. A positive value is weight lost and a negative value is weight gained. The calculator reports a positive magnitude with a separate direction label so gain is not mistaken for loss. The denominator is always starting weight, even if your current weight is higher.',
          'For example, starting at 90 kg and reaching 82 kg means 8 kg lost, or (90 − 82) ÷ 90 × 100 = 8.9% lost. Starting at 90 kg and reaching 99 kg means 9 kg gained, or (99 − 90) ÷ 90 × 100 = 10% gained. Those figures would be equivalent if you entered corresponding values in pounds, subject only to display rounding.',
        ],
      },
      {
        h2: 'How to understand the 5% and 10% reference milestones',
        paragraphs: [
          'Clinical weight-management programs sometimes use 5% and 10% reductions from baseline as reference milestones in adults who have overweight or obesity. For people with type 2 diabetes and excess weight, the American Diabetes Association 2026 Standards of Care report that sustained 5–7% loss can improve blood sugar and other intermediate cardiovascular risk factors, while larger sustained reductions may offer additional benefits. The association also emphasizes individualized goals and context.',
          'Reaching a threshold on a calculator does not prove you have improved blood pressure, blood glucose or other health outcomes, and it is not a reason to pursue weight loss when doing so would be inappropriate. The categories are descriptions of amount lost, not medical grades or universal targets. Near 5% or 10%, the display adds decimal precision so a rounded number does not obscure an underlying value below the milestone.',
        ],
      },
      {
        h2: 'What gain, no change and rapid change mean',
        paragraphs: [
          'If current weight exceeds starting weight, the calculator says "Weight gained" and reports both the percentage and absolute amount gained. Equal measurements are shown as "Weight unchanged" with a zero change, not as weight loss. This makes the tool useful for recording either direction without assuming that loss is always the goal.',
          'You cannot calculate a weekly pace from only two weights without dates. Weight can also fluctuate with fluid balance, meals, medication, pregnancy and illness; the percentage does not distinguish fat from muscle or body water. Unexpected or rapid changes deserve individualized medical attention.',
        ],
      },
      {
        h2: 'Making repeat measurements useful',
        paragraphs: [
          'Compare weights measured under reasonably similar circumstances and remember that a change in measured weight is not necessarily a change in fat. For people who are intentionally reducing weight as part of a suitable plan, the CDC describes gradual loss of about 1–2 pounds per week as more likely to be sustained than faster loss; that is not a prescription for every person.',
          'This calculator accepts adult-oriented weights within its input range, from 25 to 350 kg, with support for pounds. It refuses zero, negative or nonfinite values instead of creating an impossible percentage. Ask a clinician about an unexplained change, especially if symptoms or a relevant medical condition are present.',
        ],
      },
    ],
    faq: [
      {
        q: 'How is weight loss percentage calculated?',
        a: 'Take starting weight minus current weight, divide by starting weight, and multiply by 100. A positive result indicates weight loss; a negative result indicates gain.',
      },
      {
        q: 'What if I gained weight?',
        a: 'The tool labels it as weight gained, and reports the positive magnitude of the increase compared with your original starting weight. Gain does not automatically mean a health problem.',
      },
      {
        q: 'Does a 5% or 10% loss guarantee health benefits?',
        a: 'No. Those are common reference milestones in adult weight-management care, particularly for people with overweight or obesity. Benefits vary by the person, medical context and whether change is sustained.',
      },
      {
        q: 'Can this tool calculate my weekly weight-loss pace?',
        a: 'No. It has no dates or time interval. It calculates only the total percentage and amount gained or lost between two readings.',
      },
    ],
    sources: [
      {
        citation: 'American Diabetes Association. Standards of Care in Diabetes—2026. Section 8, Obesity and Weight Management for the Prevention and Treatment of Diabetes. Recommendations 8.1, 8.5 and 8.6.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12690172/',
      },
      {
        citation: 'Centers for Disease Control and Prevention. Steps for Losing Weight (January 17, 2025).',
        url: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html',
      },
      {
        citation: 'National Institute of Diabetes and Digestive and Kidney Diseases. Choosing a Safe and Successful Weight-loss Program.',
        url: 'https://www.niddk.nih.gov/health-information/weight-management/choosing-a-safe-successful-weight-loss-program',
      },
    ],
  },


};

