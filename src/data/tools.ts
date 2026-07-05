/**
 * Tool catalogue. Each entry maps 1:1 to a statically generated /tools/[slug] page.
 * `related` is optional — when omitted, helpers fall back to same-category tools.
 * `icon` (a lucide name) + `gradient` (a color-family key, see ToolIcon.astro)
 * give each tool a distinct, semantically matching gradient tile; the gradient
 * stays consistent within a category so the grid still reads as organized.
 */

export interface Tool {
  slug: string;
  title: string;
  /** Card / hero one-liner (plain English, active voice). */
  blurb: string;
  category: string; // Category.id
  keywords: string[];
  /** Lucide icon name for the tool's gradient tile (see Icon.astro). */
  icon?: string;
  /** Gradient color-family key for the tile (see ToolIcon.astro GRADIENTS). */
  gradient?: string;
  popular?: boolean;
  related?: string[];
  /** True once the tool has a built /tools/[slug] page. Gates links to avoid 404s. */
  live?: boolean;
  /** YMYL risk tier from the CMS — sizes the medical disclaimer (high = prominent). */
  riskLevel?: 'low' | 'medium' | 'high';
  /** CMS semantic entities — emitted as DefinedTerm `about` in the tool JSON-LD. */
  semanticEntities?: { term: string; url?: string }[];
}

export const TOOLS: Tool[] = [
  // ---- Nutrition ----
  {
    slug: 'intermittent-fasting-calculator',
    title: 'Intermittent Fasting Calculator & Timer',
    blurb: 'Pick a protocol (16:8, 18:6, OMAD, 5:2), set your eating window, and run a live fasting timer.',
    category: 'nutrition',
    icon: 'hourglass',
    gradient: 'indigo',
    keywords: ['intermittent fasting calculator', '16 8 fasting schedule', 'fasting timer', 'eating window calculator', 'if schedule'],
    popular: true,
    related: ['meal-plan-generator', 'calorie-calculator', 'caffeine-curfew-calculator'],
    live: true,
  },
  {
    slug: 'meal-plan-generator',
    title: '7-Day Meal Plan Generator',
    blurb: 'Turn your calorie and macro targets into a free, personalized week of meals with a grocery list.',
    category: 'nutrition',
    icon: 'utensils',
    gradient: 'orange',
    keywords: ['meal plan', '7 day meal plan', 'free meal plan', 'high protein meal plan generator', 'keto meal plan free', 'meal plan to lose weight'],
    popular: true,
    related: ['macro-calculator', 'calorie-calculator', 'protein-intake-calculator'],
    live: true,
  },
  {
    slug: 'muscle-preservation-calculator',
    title: 'Muscle Preservation Calculator',
    blurb: 'Keep muscle while losing weight — get your protein target, a muscle-loss risk check, and an action plan.',
    category: 'nutrition',
    icon: 'beef',
    gradient: 'orange',
    keywords: ['keep muscle while losing weight', 'prevent muscle loss', 'glp-1 muscle loss protein', 'protein to keep muscle', 'muscle preservation'],
    popular: true,
    related: ['protein-intake-calculator', 'macro-calculator', 'calorie-deficit-calculator'],
    live: true,
  },
  {
    slug: 'calorie-calculator',
    title: 'Calorie Calculator',
    blurb: 'Find your daily calorie target (TDEE) for losing, maintaining, or gaining weight.',
    category: 'nutrition',
    icon: 'flame',
    gradient: 'orange',
    keywords: ['calories', 'daily calories', 'tdee', 'maintenance calories', 'weight loss'],
    popular: true,
    live: true,
  },
  {
    slug: 'macro-calculator',
    title: 'Macro Calculator',
    blurb: 'Split your calories into protein, carbs, and fat that fit your goal.',
    category: 'nutrition',
    icon: 'pie-chart',
    gradient: 'orange',
    keywords: ['macros', 'macronutrients', 'protein carbs fat', 'iifym'],
    popular: true,
    live: true,
  },
  {
    slug: 'protein-intake-calculator',
    title: 'Protein Intake Calculator',
    blurb: 'Get your daily protein target based on body weight and activity.',
    category: 'nutrition',
    icon: 'egg',
    gradient: 'orange',
    keywords: ['protein', 'protein intake', 'grams of protein'],
    live: true,
  },
  {
    slug: 'water-intake-calculator',
    title: 'Water Intake Calculator',
    blurb: 'Find how much water to drink each day, in liters and fluid ounces.',
    category: 'nutrition',
    icon: 'droplet',
    gradient: 'cyan',
    keywords: ['water intake', 'hydration', 'daily water', 'liters', 'ounces'],
    popular: true,
    live: true,
  },
  {
    slug: 'calorie-deficit-calculator',
    title: 'Calorie Deficit Calculator',
    blurb: 'See the daily deficit needed to lose a target weight by your chosen date.',
    category: 'nutrition',
    icon: 'trending-down',
    gradient: 'orange',
    keywords: ['calorie deficit', 'deficit calculator', 'weight loss calories'],
    live: true,
  },
  {
    slug: 'keto-calculator',
    title: 'Keto Calculator',
    blurb: 'Get your ketogenic macros (70/25/5) and daily net carb limit.',
    category: 'nutrition',
    icon: 'wheat',
    gradient: 'amber',
    keywords: ['keto', 'ketogenic', 'keto macros', 'net carbs', 'low carb'],
    live: true,
  },
  {
    slug: 'vitamin-d-sun-calculator',
    title: 'Vitamin D & Sun Exposure Calculator',
    blurb: 'Estimate your vitamin D synthesis potential from sun, skin type, and diet. Educational — does not measure blood levels.',
    category: 'nutrition',
    icon: 'gauge',
    gradient: 'amber',
    keywords: ['vitamin d calculator', 'sun exposure vitamin d', 'vitamin d synthesis', 'fitzpatrick skin type', 'sun vitamin d'],
    related: ['uv-index-sun-safety', 'dri-calculator', 'water-intake-calculator', 'calorie-calculator'],
    live: true,
  },
  {
    slug: 'gut-health-score',
    title: 'Gut Health Score',
    blurb: 'Score your gut-friendly habits — fiber, plant diversity, fermented foods, sleep, stress, and more. Lifestyle self-check, not a microbiome test.',
    category: 'nutrition',
    icon: 'percent',
    gradient: 'green',
    keywords: ['gut health score', 'gut health calculator', 'microbiome diet', 'fiber gut bacteria', 'digestive health score'],
    related: ['fiber-intake-calculator', 'anti-inflammatory-score', 'water-intake-calculator', 'vitamin-d-sun-calculator'],
    live: true,
  },
  {
    slug: 'anti-inflammatory-score',
    title: 'Anti-Inflammatory Diet Score',
    blurb: 'Score your diet for anti-inflammatory vs pro-inflammatory foods — vegetables, fish, olive oil vs processed meat, sugar, fried food.',
    category: 'nutrition',
    icon: 'heart',
    gradient: 'teal',
    keywords: ['anti inflammatory diet', 'anti inflammatory score', 'mediterranean diet score', 'inflammation diet', 'dietary inflammation'],
    related: ['mediterranean-diet-score', 'dash-score', 'recipe-nutrition', 'gut-health-score'],
    live: true,
  },
  {
    slug: 'food-symptom-diary',
    title: 'Food & Symptom Diary',
    blurb: 'Log meals, timing, and symptoms over days. Print a clean timeline for your doctor or dietitian. A tracker — not a diagnostic test.',
    category: 'nutrition',
    icon: 'utensils',
    gradient: 'amber',
    keywords: ['food diary', 'symptom diary', 'food symptom tracker', 'food allergy diary', 'diet diary'],
    related: ['anti-inflammatory-score', 'gut-health-score', 'fiber-intake-calculator', 'meal-plan-generator'],
    live: true,
  },
  {
    slug: 'recipe-nutrition-analyzer',
    title: 'Recipe Nutrition Analyzer',
    blurb: 'Paste any recipe and get estimated nutrition per serving. AI parses ingredients, USDA FoodData Central provides the numbers. Free, no signup.',
    category: 'nutrition',
    icon: 'utensils',
    gradient: 'green',
    keywords: ['recipe nutrition', 'recipe calorie calculator', 'nutrition analyzer', 'recipe macros', 'ingredient nutrition calculator'],
    related: ['macro-calculator', 'calorie-calculator', 'meal-plan-generator', 'anti-inflammatory-score'],
    live: true,
  },
  {
    slug: 'bmr-calculator',
    title: 'BMR Calculator',
    blurb: 'Calculate the calories your body burns completely at rest.',
    category: 'body-weight',
    icon: 'flame',
    gradient: 'blue',
    keywords: ['bmr', 'basal metabolic rate', 'resting calories'],
    live: true,
  },

  // ---- Body & Weight ----
  {
    slug: 'weight-loss-timeline-calculator',
    title: 'Weight Loss Timeline Calculator',
    blurb: 'See a realistic goal date and a weight-over-time chart at a safe, sustainable pace.',
    category: 'body-weight',
    icon: 'calendar-clock',
    gradient: 'blue',
    keywords: ['weight loss timeline calculator', 'how long to lose weight', 'weight loss goal date', 'weight loss predictor', 'goal weight date'],
    popular: true,
    related: ['calorie-deficit-calculator', 'calorie-calculator', 'weight-loss-percentage-calculator'],
    live: true,
  },
  {
    slug: 'bmi-calculator',
    title: 'BMI Calculator',
    blurb: 'Check your body mass index and what your healthy weight range looks like.',
    category: 'body-weight',
    icon: 'scale',
    gradient: 'blue',
    keywords: ['bmi', 'body mass index', 'healthy weight'],
    popular: true,
    live: true,
  },
  {
    slug: 'body-fat-calculator',
    title: 'Body Fat Calculator',
    blurb: 'Estimate your body fat percentage using the U.S. Navy method.',
    category: 'body-weight',
    icon: 'percent',
    gradient: 'blue',
    keywords: ['body fat', 'body fat percentage', 'navy method'],
    popular: true,
    live: true,
  },
  {
    slug: 'ideal-weight-calculator',
    title: 'Ideal Weight Calculator',
    blurb: 'See your healthy weight range from BMI and the Devine formula.',
    category: 'body-weight',
    icon: 'target',
    gradient: 'blue',
    keywords: ['ideal weight', 'healthy weight', 'goal weight', 'devine formula'],
    live: true,
  },
  {
    slug: 'lean-body-mass-calculator',
    title: 'Lean Body Mass Calculator',
    blurb: 'Find how much of your weight is muscle, bone, and organs — not fat.',
    category: 'body-weight',
    icon: 'dumbbell',
    gradient: 'blue',
    keywords: ['lean body mass', 'lbm', 'fat free mass', 'boer formula'],
    live: true,
  },
  {
    slug: 'waist-to-height-ratio-calculator',
    title: 'Waist-to-Height Ratio Calculator',
    blurb: 'A quick check of central fat risk — your waist should be under half your height.',
    category: 'body-weight',
    icon: 'ruler',
    gradient: 'blue',
    keywords: ['waist to height ratio', 'whtr', 'central obesity'],
    live: true,
  },
  {
    slug: 'waist-to-hip-ratio-calculator',
    title: 'Waist-to-Hip Ratio Calculator',
    blurb: 'Measure body-shape health risk with your waist and hip measurements.',
    category: 'body-weight',
    icon: 'person-standing',
    gradient: 'blue',
    keywords: ['waist to hip ratio', 'whr', 'body shape'],
    live: true,
  },
  {
    slug: 'weight-loss-percentage-calculator',
    title: 'Weight Loss Percentage Calculator',
    blurb: 'See what percentage of your starting weight you’ve lost so far.',
    category: 'body-weight',
    icon: 'trending-down',
    gradient: 'blue',
    keywords: ['weight loss percentage', 'percent weight lost', 'progress'],
    live: true,
  },

  // ---- Fitness ----
  {
    slug: 'walk-it-off-calculator',
    title: 'Walk It Off Calculator',
    blurb: 'Enter a food or calories to see the minutes of walking, running, or cycling to burn it.',
    category: 'fitness',
    icon: 'cookie',
    gradient: 'green',
    keywords: ['walk it off calculator', 'how long to walk off food', 'food to exercise calculator', 'calories to steps', 'burn off calories'],
    popular: true,
    related: ['steps-to-calories-calculator', 'calories-burned-calculator', 'running-pace-calculator'],
    live: true,
  },
  {
    slug: 'strength-program-builder',
    title: 'Strength Program Builder',
    blurb: 'Turn your 1RM into a free 4-week progressive-overload plan with exact working weights.',
    category: 'fitness',
    icon: 'trending-up',
    gradient: 'green',
    keywords: ['workout plan generator', 'progressive overload calculator', '4 week strength program', 'free workout program', 'periodization'],
    popular: true,
    related: ['one-rep-max-calculator', 'calories-burned-calculator', 'protein-intake-calculator'],
    live: true,
  },
  {
    slug: 'sitting-disease-reversal-calculator',
    title: 'Sitting Disease Reversal Calculator',
    blurb: 'Offset desk time with micro-breaks and extra NEAT steps — get a personalized movement recipe.',
    category: 'fitness',
    icon: 'armchair',
    gradient: 'green',
    keywords: ['sitting too much calculator', 'how many steps to offset sitting', 'neat calculator', 'sitting disease', 'sedentary lifestyle'],
    popular: true,
    related: ['steps-to-calories-calculator', 'calories-burned-calculator', 'target-heart-rate-calculator'],
    live: true,
  },
  {
    slug: 'one-rep-max-calculator',
    title: 'One-Rep Max Calculator',
    blurb: 'Estimate your 1RM with Epley and Brzycki, plus a full % training table.',
    category: 'fitness',
    icon: 'dumbbell',
    gradient: 'green',
    keywords: ['one rep max', '1rm', 'max lift', 'strength', 'epley', 'brzycki'],
    popular: true,
    live: true,
  },
  {
    slug: 'ffmi-calculator',
    title: 'FFMI Calculator',
    blurb: 'Calculate your Fat-Free Mass Index and height-normalized FFMI for athletes and lifters.',
    category: 'fitness',
    icon: 'dumbbell',
    gradient: 'green',
    keywords: ['ffmi calculator', 'fat free mass index', 'ffmi natural limit', 'muscle index', 'lean mass index'],
    related: ['body-fat-calculator', 'lean-body-mass-calculator', 'one-rep-max-calculator', 'strength-program-builder'],
    live: true,
  },
  {
    slug: 'recovery-time-calculator',
    title: 'Recovery Time Calculator',
    blurb: 'Estimate how long to rest before training the same muscle group again — a heuristic from sports-science recovery principles.',
    category: 'fitness',
    icon: 'heart-pulse',
    gradient: 'green',
    keywords: ['recovery time calculator', 'muscle recovery time', 'rest between workouts', 'doms recovery', 'recovery window'],
    related: ['strength-program-builder', 'one-rep-max-calculator', 'sleep-debt-calculator', 'protein-intake-calculator'],
    live: true,
  },
  {
    slug: 'push-up-test-calculator',
    title: 'Push-Up Test Calculator',
    blurb: 'Score your push-up test against ACSM age and sex norms — see your percentile band and how to improve.',
    category: 'fitness',
    icon: 'person-standing',
    gradient: 'green',
    keywords: ['push up test', 'push up norms', 'muscular endurance test', 'push up score', 'push up percentile'],
    related: ['one-rep-max-calculator', 'strength-program-builder', 'vo2-max-calculator', 'recovery-time-calculator'],
    live: true,
  },
  {
    slug: 'flexibility-mobility-score',
    title: 'Flexibility & Mobility Score',
    blurb: 'Test your flexibility at home with four quick tests — get an overall score, per-area breakdown, and targeted stretch suggestions.',
    category: 'fitness',
    icon: 'activity',
    gradient: 'green',
    keywords: ['flexibility test', 'mobility score', 'sit and reach', 'shoulder mobility test', 'flexibility self assessment'],
    related: ['recovery-time-calculator', 'strength-program-builder', 'sitting-disease-reversal-calculator'],
    live: true,
  },
  {
    slug: 'running-pace-calculator',
    title: 'Running Pace Calculator',
    blurb: 'Solve pace, finish time, or distance — and see your splits.',
    category: 'fitness',
    icon: 'timer',
    gradient: 'green',
    keywords: ['running pace', 'pace calculator', 'marathon time', 'splits'],
    live: true,
  },
  {
    slug: 'calories-burned-calculator',
    title: 'Calories Burned Calculator',
    blurb: 'Estimate calories burned by activity using MET values and your weight.',
    category: 'fitness',
    icon: 'flame',
    gradient: 'green',
    keywords: ['calories burned', 'exercise calories', 'met'],
    live: true,
  },
  {
    slug: 'vo2-max-calculator',
    title: 'VO₂ Max Calculator',
    blurb: 'Estimate your cardio fitness from your resting and max heart rate.',
    category: 'fitness',
    icon: 'wind',
    gradient: 'green',
    keywords: ['vo2 max', 'cardio fitness', 'aerobic capacity', 'uth sorensen'],
    live: true,
  },
  {
    slug: 'steps-to-calories-calculator',
    title: 'Steps to Calories Calculator',
    blurb: 'Turn your step count into distance walked and calories burned.',
    category: 'fitness',
    icon: 'footprints',
    gradient: 'green',
    keywords: ['steps to calories', 'step calculator', 'walking calories', 'distance'],
    live: true,
  },

  // ---- Heart & Vitals ----
  {
    slug: 'target-heart-rate-calculator',
    title: 'Target Heart Rate Calculator',
    blurb: 'Find your five heart-rate training zones for fat burn and cardio.',
    category: 'heart-vitals',
    icon: 'activity',
    gradient: 'red',
    keywords: ['target heart rate', 'heart rate zones', 'cardio zone', 'karvonen'],
    popular: true,
    live: true,
  },
  {
    slug: 'max-heart-rate-calculator',
    title: 'Max Heart Rate Calculator',
    blurb: 'Estimate your maximum heart rate from your age.',
    category: 'heart-vitals',
    icon: 'heart',
    gradient: 'red',
    keywords: ['max heart rate', 'mhr', 'maximum heart rate', 'tanaka'],
    live: true,
  },
  {
    slug: 'blood-pressure-checker',
    title: 'Blood Pressure Checker',
    blurb: 'See which AHA blood-pressure category your reading falls into.',
    category: 'heart-vitals',
    icon: 'gauge',
    gradient: 'red',
    keywords: ['blood pressure', 'bp category', 'hypertension', 'aha'],
    live: true,
  },
  {
    slug: 'resting-heart-rate-checker',
    title: 'Resting Heart Rate Checker',
    blurb: 'Compare your resting heart rate against healthy age and sex benchmarks.',
    category: 'heart-vitals',
    icon: 'heart-pulse',
    gradient: 'red',
    keywords: ['resting heart rate', 'rhr', 'pulse', 'normal heart rate', 'resting heart rate by age'],
    related: ['target-heart-rate-calculator', 'max-heart-rate-calculator', 'vo2-max-calculator'],
    live: true,
  },
  {
    slug: 'hrv-explainer-log',
    title: 'HRV Explainer & Log',
    blurb: 'Learn what HRV is and log readings from your own device to track your trend. Honest — does not invent HRV from age or pulse. Educational, not medical.',
    category: 'heart-vitals',
    icon: 'activity',
    gradient: 'blue',
    keywords: ['hrv', 'heart rate variability', 'hrv tracker', 'hrv log', 'rmssd', 'hrv chart'],
    related: ['resting-heart-rate-checker', 'stress-level-check', 'sleep-quality-check'],
    live: true,
  },

  // ---- Metabolic Health ----
  {
    slug: 'metabolic-age-calculator',
    title: 'Metabolic Age Calculator',
    blurb: 'Estimate your metabolic age from your BMR vs the average for your age (illustrative).',
    category: 'metabolic',
    icon: 'gauge',
    gradient: 'teal',
    keywords: ['metabolic age', 'metabolism', 'bmr age', 'metabolic age calculator', 'how old is my metabolism'],
    related: ['bmr-calculator', 'calorie-calculator', 'macro-calculator'],
    live: true,
  },
  {
    slug: 'alcohol-calorie-calculator',
    title: 'Alcohol Calorie Calculator',
    blurb: 'Add up the hidden calories in your weekly drinks — per week, month, and year.',
    category: 'metabolic',
    icon: 'wine',
    gradient: 'amber',
    keywords: ['alcohol calories', 'drink calories', 'beer wine calories', 'calories in alcohol', 'alcohol calorie calculator'],
    related: ['alcohol-units-calculator', 'calorie-calculator', 'calorie-deficit-calculator'],
    live: true,
  },

  // ---- Women's Health ----
  {
    slug: 'due-date-calculator',
    title: 'Pregnancy Due Date Calculator',
    blurb: 'Estimate your due date from your last period, conception, or IVF transfer.',
    category: 'womens-health',
    icon: 'baby',
    gradient: 'pink',
    keywords: ['due date', 'pregnancy', 'edd', 'gestation', 'naegele'],
    popular: true,
    live: true,
  },
  {
    slug: 'pregnancy-week-calculator',
    title: 'Pregnancy Week-by-Week',
    blurb: 'See your current gestational week and what’s developing right now.',
    category: 'womens-health',
    icon: 'calendar-days',
    gradient: 'pink',
    keywords: ['pregnancy week', 'gestational age', 'week by week'],
    live: true,
  },
  {
    slug: 'ovulation-calculator',
    title: 'Ovulation Calculator',
    blurb: 'Predict your ovulation and fertile window from your cycle length.',
    category: 'womens-health',
    icon: 'calendar-heart',
    gradient: 'pink',
    keywords: ['ovulation', 'fertile window', 'fertility'],
    popular: true,
    live: true,
  },
  {
    slug: 'period-calculator',
    title: 'Period Calculator',
    blurb: 'Predict your next three periods from your cycle length.',
    category: 'womens-health',
    icon: 'droplet',
    gradient: 'pink',
    keywords: ['period', 'menstrual cycle', 'period tracker'],
    live: true,
  },
  {
    slug: 'pregnancy-weight-gain-calculator',
    title: 'Pregnancy Weight Gain Calculator',
    blurb: 'See your recommended weight-gain range by pre-pregnancy BMI (IOM).',
    category: 'womens-health',
    icon: 'weight',
    gradient: 'pink',
    keywords: ['pregnancy weight gain', 'gestational weight', 'iom'],
    live: true,
  },

  // ---- Sleep & Recovery ----
  {
    slug: 'sleep-chronotype-quiz',
    title: 'Sleep Chronotype Quiz',
    blurb: 'Are you a Lion, Bear, Wolf, or Dolphin? Find your type and your ideal daily schedule.',
    category: 'sleep',
    icon: 'moon-star',
    gradient: 'purple',
    keywords: ['sleep chronotype quiz', 'chronotype test', 'lion bear wolf dolphin', 'am i a morning person', 'sleep type'],
    popular: true,
    related: ['caffeine-curfew-calculator', 'sleep-calculator', 'sleep-debt-calculator'],
    live: true,
  },
  {
    slug: 'caffeine-intake-calculator',
    title: 'Caffeine Intake Calculator',
    blurb: 'Add up your daily caffeine from coffee, tea, and energy drinks vs the ~400 mg safe limit.',
    category: 'sleep',
    icon: 'coffee',
    gradient: 'brown',
    keywords: ['caffeine calculator', 'how much caffeine per day', 'caffeine tracker', 'daily caffeine limit', '400 mg caffeine'],
    popular: true,
    related: ['caffeine-curfew-calculator', 'sleep-calculator', 'sleep-quality-check'],
    live: true,
  },
  {
    slug: 'caffeine-curfew-calculator',
    title: 'Caffeine Curfew Calculator',
    blurb: 'See when to stop caffeine and how to time light for better sleep — with a shareable daily timeline.',
    category: 'sleep',
    icon: 'clock',
    gradient: 'brown',
    keywords: ['caffeine cutoff calculator', 'when to stop drinking coffee before bed', 'circadian rhythm calculator', 'caffeine curfew', 'caffeine half life'],
    popular: true,
    related: ['sleep-calculator', 'sleep-debt-calculator', 'nap-calculator'],
    live: true,
  },
  {
    slug: 'sleep-calculator',
    title: 'Sleep Calculator',
    blurb: 'Find the best bedtime or wake-up time using 90-minute sleep cycles.',
    category: 'sleep',
    icon: 'moon',
    gradient: 'purple',
    keywords: ['sleep calculator', 'sleep cycle', 'bedtime', 'wake up time'],
    popular: true,
    live: true,
  },
  {
    slug: 'nap-calculator',
    title: 'Nap Calculator',
    blurb: 'Get the ideal wake-up time for a power nap or a full sleep cycle.',
    category: 'sleep',
    icon: 'bed',
    gradient: 'purple',
    keywords: ['nap calculator', 'power nap', 'nap time'],
    live: true,
  },
  {
    slug: 'sleep-debt-calculator',
    title: 'Sleep Debt Calculator',
    blurb: 'Add up the sleep you owe over a week and how to repay it.',
    category: 'sleep',
    icon: 'alarm-clock',
    gradient: 'purple',
    keywords: ['sleep debt', 'sleep deficit', 'catch up on sleep'],
    live: true,
  },
  {
    slug: 'blue-light-exposure-estimator',
    title: 'Blue Light Exposure Estimator',
    blurb: 'Score your evening light hygiene — screen time before bed, night mode, room lighting. Get specific tips to reduce blue light for better sleep.',
    category: 'sleep',
    icon: 'moon-star',
    gradient: 'indigo',
    keywords: ['blue light', 'screen time sleep', 'evening light hygiene', 'night mode', 'blue light filter', 'melatonin screen'],
    related: ['caffeine-curfew-calculator', 'sleep-chronotype-quiz', 'sleep-calculator'],
    live: true,
  },

  // ---- Health Risk (educational, non-diagnostic) ----
  {
    slug: 'lifestyle-age-test',
    title: 'Lifestyle Age Test',
    blurb: 'See how your habits may be aging your body vs your real age — an educational, shareable estimate.',
    category: 'health-risk',
    icon: 'hourglass',
    gradient: 'amber',
    keywords: ['biological age calculator', 'how old is my body', 'real age test', 'body age test', 'lifestyle age'],
    popular: true,
    related: ['waist-to-height-ratio-calculator', 'heart-disease-risk-calculator', 'resting-heart-rate-checker'],
    live: true,
  },
  {
    slug: 'healthspan-score',
    title: 'Healthspan Score',
    blurb: 'A transparent 0–100 score of the everyday habits linked with more healthy years — with per-factor bars and your top next steps.',
    category: 'health-risk',
    icon: 'activity',
    gradient: 'teal',
    keywords: ['healthspan score', 'healthspan calculator', 'healthy years habits', 'lifestyle score', 'healthy habits score'],
    popular: false,
    related: ['lifestyle-age-test', 'metabolic-age-calculator', 'waist-to-height-ratio-calculator', 'calories-burned-calculator'],
    live: true,
    riskLevel: 'medium',
  },
  {
    slug: 'waist-health-risk-calculator',
    title: 'Waist-Based Health Risk',
    blurb: 'Combine your BMI and waist-to-height ratio into a risk-level explainer.',
    category: 'health-risk',
    icon: 'ruler',
    gradient: 'amber',
    keywords: ['health risk', 'bmi waist', 'waist to height', 'obesity risk'],
    live: true,
  },
  {
    slug: 'heart-disease-risk-calculator',
    title: 'Heart Disease Risk (Educational)',
    blurb: 'An educational lifestyle-based heart risk estimate — not a diagnosis.',
    category: 'health-risk',
    icon: 'heart',
    gradient: 'amber',
    keywords: ['heart disease risk', 'cardiovascular risk', 'lifestyle risk'],
    live: true,
  },
  {
    slug: 'diabetes-risk-calculator',
    title: 'Type 2 Diabetes Risk (Educational)',
    blurb: 'A non-diagnostic diabetes risk band — and why to get screened.',
    category: 'health-risk',
    icon: 'droplet',
    gradient: 'amber',
    keywords: ['diabetes risk', 'type 2 diabetes', 'prediabetes risk'],
    live: true,
  },
  {
    slug: 'smoking-cost-calculator',
    title: 'Smoking Cost Calculator',
    blurb: 'See what smoking costs you over time — and the benefits of quitting.',
    category: 'health-risk',
    icon: 'cigarette',
    gradient: 'amber',
    keywords: ['smoking cost', 'cost of smoking', 'quit smoking savings'],
    live: true,
  },
  {
    slug: 'alcohol-units-calculator',
    title: 'Alcohol Units Calculator',
    blurb: 'Convert your weekly drinks into units and check low-risk guidelines.',
    category: 'health-risk',
    icon: 'beer',
    gradient: 'amber',
    keywords: ['alcohol units', 'drink units', 'low risk drinking'],
    live: true,
  },

  // ---- Mental Wellness (self-reflection, not diagnostic) ----
  {
    slug: 'sleep-quality-check',
    title: 'Sleep Quality Self-Check',
    blurb: 'A short check-in on how restful your sleep has been, with tips.',
    category: 'mental-wellness',
    icon: 'moon',
    gradient: 'sky',
    keywords: ['sleep quality', 'sleep self check', 'sleep hygiene'],
    live: true,
  },
  {
    slug: 'stress-level-check',
    title: 'Stress Level Self-Check',
    blurb: 'Reflect on your stress with a few questions and coping ideas.',
    category: 'mental-wellness',
    icon: 'gauge',
    gradient: 'sky',
    keywords: ['stress check', 'stress level', 'coping'],
    live: true,
  },
  {
    slug: 'burnout-self-check',
    title: 'Burnout Self-Check',
    blurb: 'A gentle reflection on energy and workload — and where to get support.',
    category: 'mental-wellness',
    icon: 'battery-low',
    gradient: 'sky',
    keywords: ['burnout', 'burnout check', 'work stress'],
    live: true,
  },
  {
    slug: 'phq-9-depression-screener',
    title: 'PHQ-9 Depression Screener',
    blurb: 'The validated PHQ-9 — 9 questions about depression symptoms over the past 2 weeks. Screening only, not a diagnosis. Crisis resources included.',
    category: 'mental-wellness',
    icon: 'gauge',
    gradient: 'sky',
    keywords: ['phq-9', 'depression screener', 'depression test', 'depression screening', 'phq9 questionnaire'],
    related: ['gad-7-anxiety-screener', 'who-5-wellbeing-screener', 'stress-level-check'],
    live: true,
    riskLevel: 'high',
  },
  {
    slug: 'gad-7-anxiety-screener',
    title: 'GAD-7 Anxiety Screener',
    blurb: 'The validated GAD-7 — 7 questions about anxiety symptoms over the past 2 weeks. Screening only, not a diagnosis. Crisis resources included.',
    category: 'mental-wellness',
    icon: 'wind',
    gradient: 'sky',
    keywords: ['gad-7', 'anxiety screener', 'anxiety test', 'anxiety screening', 'gad7 questionnaire'],
    related: ['phq-9-depression-screener', 'who-5-wellbeing-screener', 'stress-level-check'],
    live: true,
    riskLevel: 'high',
  },
  {
    slug: 'who-5-wellbeing-screener',
    title: 'WHO-5 Well-Being Index',
    blurb: 'The validated WHO-5 — 5 questions about well-being over the past 2 weeks. Low scores suggest further screening. Not a diagnosis.',
    category: 'mental-wellness',
    icon: 'heart',
    gradient: 'sky',
    keywords: ['who-5', 'wellbeing index', 'wellbeing screener', 'who5 questionnaire', 'mental wellbeing'],
    related: ['phq-9-depression-screener', 'gad-7-anxiety-screener', 'stress-level-check'],
    live: true,
    riskLevel: 'high',
  },
  {
    slug: 'box-breathing-timer',
    title: 'Box Breathing Timer',
    blurb: 'A guided 4-4-4-4 and 4-7-8 breathing tool to help you calm down.',
    category: 'mental-wellness',
    icon: 'wind',
    gradient: 'sky',
    keywords: ['box breathing', 'breathing timer', '4-7-8 breathing', 'calm'],
    live: true,
  },
];

// ---------- Helpers ----------

export const TOTAL_TOOLS = TOOLS.length;

export const getTool = (slug: string): Tool | undefined =>
  TOOLS.find((t) => t.slug === slug);

export const getToolsByCategory = (categoryId: string): Tool[] =>
  TOOLS.filter((t) => t.category === categoryId);

export const countByCategory = (categoryId: string): number =>
  getToolsByCategory(categoryId).length;

/** Tools that have a built page — used for getStaticPaths and live links. */
export const getLiveTools = (): Tool[] => TOOLS.filter((t) => t.live);

export const isToolLive = (slug: string): boolean => !!getTool(slug)?.live;

export const getPopularTools = (limit = 6): Tool[] =>
  TOOLS.filter((t) => t.popular).slice(0, limit);

/** Which categories pair well — used to cross-link related tools across categories. */
const AFFINITY: Record<string, string[]> = {
  nutrition: ['body-weight', 'fitness'],
  'body-weight': ['nutrition', 'fitness'],
  fitness: ['heart-vitals', 'nutrition'],
  'heart-vitals': ['fitness', 'health-risk'],
  metabolic: ['nutrition', 'body-weight'],
  sleep: ['mental-wellness', 'health-risk'],
  'womens-health': ['body-weight', 'nutrition'],
  'health-risk': ['heart-vitals', 'mental-wellness'],
  'mental-wellness': ['sleep', 'health-risk'],
};

/**
 * Up to `limit` related (live) tools that cross-link categories: explicit
 * `related` first, then same-category siblings, then at least one tool from an
 * affine category, then fill. Only live tools, so links never 404.
 */
export const getRelatedTools = (slug: string, limit = 4): Tool[] => {
  const tool = getTool(slug);
  if (!tool) return [];
  const out: Tool[] = [];
  const push = (t?: Tool) => {
    if (t && t.live && t.slug !== slug && !out.includes(t)) out.push(t);
  };

  (tool.related ?? []).forEach((s) => push(getTool(s)));
  // Keep a slot free for a cross-category suggestion.
  const sameLimit = Math.max(1, limit - 1);
  for (const t of getToolsByCategory(tool.category)) { if (out.length >= sameLimit) break; push(t); }
  // Pull one tool from an affine category (prefer a popular one).
  for (const cat of AFFINITY[tool.category] ?? []) {
    if (out.length >= limit) break;
    const cross = getToolsByCategory(cat).filter((t) => t.live);
    push(cross.find((t) => t.popular) ?? cross[0]);
  }
  // Fill any remaining slots.
  for (const t of getToolsByCategory(tool.category)) { if (out.length >= limit) break; push(t); }
  for (const t of getLiveTools()) { if (out.length >= limit) break; push(t); }
  return out.slice(0, limit);
};
