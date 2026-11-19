/**
 * Long-form, source-cited content for each Nutrition tool page.
 */
import { pubmed, type Source, type ToolContent } from './content-types';

const MIFFLIN: Source = {
  citation:
    'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. "A new predictive equation for resting energy expenditure in healthy individuals." Am J Clin Nutr. 1990;51(2):241–247.',
  url: pubmed('A new predictive equation for resting energy expenditure in healthy individuals'),
};
const ISSN_PROTEIN: Source = {
  citation:
    'Jäger R, Kerksick CM, Campbell BI, et al. "International Society of Sports Nutrition Position Stand: protein and exercise." J Int Soc Sports Nutr. 2017;14:20.',
  url: pubmed('International Society of Sports Nutrition Position Stand protein and exercise'),
};
const MORTON_PROTEIN: Source = {
  citation:
    'Morton RW, Murphy KT, McKellar SR, et al. "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength." Br J Sports Med. 2018;52(6):376–384.',
  url: pubmed('protein supplementation resistance training muscle mass strength meta-analysis Morton'),
};

export const NUTRITION_CONTENT: Record<string, ToolContent> = {
  // ============================================================
  'intermittent-fasting-calculator': {
    directAnswer: {
      question: 'How does 16:8 intermittent fasting work?',
      answer:
        'You fast for 16 hours and eat within an 8-hour window — for example, eating between 12 pm and 8 pm, then fasting overnight until noon. Water, black coffee, and plain tea are generally considered fine during the fast. This tool maps your exact eating and fasting windows from your chosen start time, with a live countdown.',
    },
    seoTitle: 'Intermittent Fasting Calculator & Timer (16:8)',
    metaDescription:
      'Free intermittent fasting calculator: pick 16:8, 18:6, OMAD or 5:2, set your eating window, and run a live fasting timer. Educational, not medical advice.',
    intro:
      'Pick a fasting protocol and your eating-window start time to see your exact eating and fasting windows — plus a live countdown timer so you always know how long until your next meal or fast.',
    notice:
      'Educational only, not medical advice — and intermittent fasting isn’t for everyone. It’s not recommended during pregnancy or breastfeeding, under 18, with a history of disordered eating, or with diabetes or other conditions affected by meal timing. Check with a professional first.',
    sections: [
      {
        h2: 'How your fasting window is calculated',
        paragraphs: [
          'Pick a protocol (16:8, 18:6, 20:4, OMAD, or 5:2) and the time you want your eating window to open. The tool adds the protocol’s eating-window length to that start time to get your closing time; everything outside it is your fasting window, and the countdown simply tracks where “now” falls in that cycle.',
          'The math is deliberately simple clock arithmetic — nothing is personalized to your metabolism. Evidence suggests the protocol you can actually stick to matters far more than the exact hours, so choose the window that fits your life (see the FAQ for what does and doesn’t break a fast).',
        ],
      },
      {
        h2: 'What is intermittent fasting?',
        paragraphs: [
          'Intermittent fasting (IF) is about when you eat, not just what. You alternate periods of eating and fasting — most commonly a daily window, like eating within 8 hours and fasting for 16 (that’s 16:8). The idea is to give your body an extended daily break from food.',
          'This tool turns your chosen protocol and start time into clear windows and a live timer, so the schedule is effortless to follow.',
        ],
      },
      {
        h2: 'The popular protocols',
        list: {
          items: [
            '14:10 — fast 14 hours, eat within 10. A gentle, beginner-friendly start.',
            '16:8 — fast 16, eat within 8. The most popular daily window.',
            '18:6 and 20:4 — longer fasts with tighter eating windows.',
            'OMAD — one meal a day (a ~1-hour window).',
            '5:2 — eat normally 5 days; eat lightly (~500/600 kcal) on 2 non-consecutive days.',
          ],
        },
      },
      {
        h2: 'What breaks a fast?',
        paragraphs: [
          'During your fasting window, water, black coffee, and plain tea are generally fine and won’t meaningfully break a fast. Anything with calories — milk, sugar, snacks — starts the eating window. When you’re eating, focus on balanced, protein-rich whole foods rather than cramming in junk; IF is a timing tool, not a license to overeat.',
        ],
      },
    ],
    faq: [
      { q: 'What is the 16:8 fasting schedule?', a: 'You fast for 16 hours and eat all your food within an 8-hour window — for example eating between noon and 8 p.m. and fasting overnight until noon the next day.' },
      { q: 'Does this have a live fasting timer?', a: 'Yes — set your eating-window start and the tool shows a live countdown to either the end of your eating window or the end of your fast, updating every second.' },
      { q: 'Does coffee break a fast?', a: 'Black coffee, plain tea, and water are generally considered fine during a fast. Adding milk, sugar, or anything with calories breaks it.' },
      { q: 'Is intermittent fasting safe?', a: 'For many healthy adults it’s well tolerated, but it isn’t for everyone — including during pregnancy, with diabetes, or with a history of disordered eating. Check with a healthcare professional before starting.' },
    ],
    sources: [
      { citation: 'de Cabo R, Mattson MP. "Effects of Intermittent Fasting on Health, Aging, and Disease." N Engl J Med. 2019.', url: pubmed('Effects of intermittent fasting on health aging and disease de Cabo Mattson') },
      { citation: 'Patterson RE, Sears DD. "Metabolic Effects of Intermittent Fasting." Annu Rev Nutr. 2017.', url: pubmed('Metabolic effects of intermittent fasting Patterson Sears') },
    ],
  },
  // ============================================================
  'muscle-preservation-calculator': {
    seoTitle: 'Muscle Preservation Calculator (Weight Loss)',
    metaDescription:
      'Keep muscle while losing weight: your protein target, a muscle-loss risk check, and an action plan for any calorie deficit. Not medical advice.',
    intro:
      'Losing weight too fast or without enough protein costs you muscle, not just fat. Enter your details to get your protein target, a muscle-loss risk check, and a simple plan to hold onto the muscle you have.',
    notice:
      'Educational only, not medical advice. This tool gives general nutrition guidance and says nothing about any medication, dose, or timing. If you’re on a weight-loss program or medication, follow your prescriber’s and dietitian’s guidance — do not change your treatment based on this tool.',
    sections: [
      {
        h2: 'The three levers that keep muscle',
        paragraphs: [
          'When you lose weight, some of what you drop can be muscle rather than fat. How much depends almost entirely on three things you control:',
        ],
        list: {
          items: [
            'Protein — enough to signal your body to keep muscle (far more than the basic RDA).',
            'Resistance training — the strongest signal of all that your muscle is still needed.',
            'Pace — losing too fast tips the balance toward muscle loss.',
          ],
        },
      },
      {
        h2: 'How much protein to keep muscle in a deficit',
        paragraphs: [
          'Protein needs go up, not down, when you’re cutting calories. The research supports roughly 1.6–2.4 g of protein per kg of body weight per day to preserve (or even build) muscle while losing fat — toward the higher end if you’re losing quickly or you’re older, since both make muscle harder to hold. A controlled trial found that a higher-protein group training in a steep deficit actually gained a little lean mass while losing fat, where a lower-protein group did not.',
          'The calculator turns that into a daily gram target for your body weight and shows the gap versus what you eat now, so you know exactly how much to add.',
        ],
      },
      {
        h2: 'Keeping muscle on a GLP-1 or any rapid weight-loss plan',
        paragraphs: [
          'If you’re losing weight with the help of a GLP-1 medication (such as semaglutide or tirzepatide), the same three levers apply — and they matter even more. Appetite suppression can make it genuinely hard to eat enough protein, and faster weight loss can mean a larger share of it comes from muscle. So protein, resistance training, and a sensible pace are exactly where to focus.',
          'Important: this tool offers only general nutrition guidance. It does not advise on whether to use any medication, or on any dose or timing. Always follow your prescriber and a registered dietitian, and never change your treatment based on a calculator.',
        ],
      },
      {
        h2: 'Don’t lose too fast',
        paragraphs: [
          'A good general target is to lose around or below 1% of your body weight per week. Beyond that, the convenience of fast results comes at the cost of more lean mass — which lowers your metabolism and can leave you "skinny-fat." If your pace is faster than that, the calculator flags it and suggests easing off (and, if a program set that pace, raising it with your provider).',
        ],
      },
      {
        h2: 'Resistance training is non-negotiable',
        paragraphs: [
          'Protein supplies the building blocks, but resistance training is the signal that tells your body to keep the muscle. Two to three sessions a week covering the major muscle groups is plenty for most people losing weight — bodyweight, bands, or machines all count. You’re training to maintain, not to set records.',
        ],
      },
    ],
    faq: [
      { q: 'How do I keep muscle while losing weight?', a: 'Eat enough protein (about 1.6–2.4 g/kg of body weight), do resistance training 2–3 times a week, and keep your loss to around or below 1% of body weight per week.' },
      { q: 'How much protein prevents muscle loss in a deficit?', a: 'Roughly 1.6–2.4 g of protein per kg of body weight per day, leaning higher if you’re losing quickly or are older. The calculator works out your exact target.' },
      { q: 'How do I keep muscle on Ozempic or a GLP-1 medication?', a: 'The nutrition principles are the same: hit your protein target despite reduced appetite, do resistance training, and keep a sensible pace. This is general guidance only — follow your prescriber and dietitian, and don’t change your treatment based on this tool.' },
      { q: 'Does losing weight fast cause muscle loss?', a: 'Yes — the faster you lose, the larger the share that tends to come from muscle. Keeping the pace near or below 1% of body weight per week, with enough protein and training, protects lean mass.' },
      { q: 'Do I have to lift weights to keep muscle?', a: 'Resistance training is the single most effective signal to retain muscle in a deficit. If you can’t lift, prioritize protein even more, but some form of resistance work is strongly recommended.' },
    ],
    sources: [
      ISSN_PROTEIN,
      MORTON_PROTEIN,
      { citation: 'Longland TM, et al. "Higher compared with lower dietary protein during an energy deficit combined with intense exercise promotes greater lean mass gain and fat mass loss." Am J Clin Nutr. 2016.', url: pubmed('Higher protein during energy deficit intense exercise lean mass Longland') },
      { citation: 'Cava E, Yeat NC, Mittendorfer B. "Preserving Healthy Muscle during Weight Loss." Adv Nutr. 2017;8(3):511–519.', url: pubmed('Preserving healthy muscle during weight loss Cava Mittendorfer') },
    ],
  },
  // ============================================================
  'meal-plan-generator': {
    seoTitle: 'Free 7-Day Meal Plan Generator (Any Diet)',
    metaDescription:
      'Build a free, personalized 7-day meal plan from your calorie and macro targets — high-protein, keto, vegan or Mediterranean — with a grocery list.',
    intro:
      'Turn your calorie and macro targets into a full, free week of meals. Pick your diet style, set any allergies, and get a balanced 7-day plan with a grocery list — editable and downloadable, no signup.',
    notice:
      'This generator is for general healthy eating, not clinical or therapeutic diets. If you have a medical condition, a serious food allergy, or are pregnant, plan your meals with a doctor or registered dietitian.',
    sections: [
      {
        h2: 'How the meal plan generator works',
        paragraphs: [
          'You give it three things — your daily calories, your protein/carbs/fat targets, and your preferences — and it assembles seven days of meals for you. It splits each day’s calories across your meals (for example 25% breakfast, 35% lunch, 30% dinner, 10% snack), then chooses recipes from a tagged food database and scales the portion sizes so each day lands close to your numbers.',
          'It aims to keep every day within about ±5% of your calorie target and as close as possible on protein, carbs, and fat, while making sure the week stays varied instead of repeating the same meal. The real totals are always shown with a progress bar against your target, so nothing is hidden or faked.',
        ],
        list: {
          intro: 'Out of the box you get:',
          items: [
            'A 7-day plan matched to your calories and macros',
            'Six diet styles: omnivore, vegetarian, vegan, keto, Mediterranean and halal',
            'Allergy and exclusion filters (dairy, gluten, nuts, shellfish, egg, soy, fish, plus free text)',
            'A swap button on every meal and adjustable serving sizes',
            'An automatic grocery list and a downloadable PDF',
          ],
        },
      },
      {
        h2: 'A free 7-day meal plan to lose weight',
        paragraphs: [
          'For weight loss, the plan only works as well as the calorie target you give it. Find a sustainable number first: use the Calorie Calculator for your maintenance calories (TDEE) and subtract a moderate deficit, or let the Macro Calculator set your protein, carbs and fat — then send those numbers straight here. Keeping protein high while you’re in a deficit protects muscle and keeps you full.',
          'We will not build a plan below roughly 1,200 calories a day, because very-low-calorie diets are easy to get wrong and tend to backfire. If you need to lose weight quickly for a medical reason, that should be supervised by a professional, not a generator.',
        ],
      },
      {
        h2: 'High-protein, keto, vegan and other styles',
        paragraphs: [
          'Because the generator fits to whatever macros you enter, it doubles as a high-protein meal plan generator: set a high protein target and it will favor protein-dense meals to reach it. Choose Keto and it draws only from low-carb, higher-fat recipes; choose Vegan and every meal is plant-based; Mediterranean leans on fish, vegetables, legumes and olive oil. The diet style filters the recipe pool, and your macro targets shape the day.',
        ],
      },
      {
        h2: 'Make it yours: swap, scale and shop',
        paragraphs: [
          'Nothing is locked in. Don’t fancy a meal? Hit Swap for another option that fits the same slot. Bigger or smaller appetite? Step the servings up or down and the day’s totals update instantly. When you’re happy, the grocery list gathers every ingredient for the week into one deduplicated list, and Download PDF gives you the plan plus the shopping list to take to the store.',
        ],
      },
      {
        h2: 'Tips for sticking to your plan',
        list: {
          items: [
            'Batch-cook proteins and grains once or twice a week to save time.',
            'Repeat breakfasts and snacks — variety matters most at lunch and dinner.',
            'Shop from the generated list to avoid impulse buys.',
            'Treat the plan as a flexible template, not a rulebook — swap freely.',
            'Re-check your calorie target every few weeks as your weight changes.',
          ],
        },
      },
    ],
    faq: [
      { q: 'Is this meal plan generator really free?', a: 'Yes — it’s completely free with no signup, no email, and no data stored. It runs in your browser from a built-in recipe library.' },
      { q: 'How do I make a high-protein meal plan?', a: 'Enter a high protein target (for fat loss, many people use about 1.6–2.4 g per kg of body weight) and the generator will favor protein-rich meals to reach it across the day.' },
      { q: 'Can it make a free keto or vegan meal plan?', a: 'Yes. Choose Keto and it uses only low-carb, higher-fat recipes; choose Vegan and every meal is plant-based. You can layer allergy filters on top of any diet style.' },
      { q: 'How accurate are the calories and macros?', a: 'Each day is built to land within roughly ±5% of your calorie target, with protein, carbs and fat kept as close as possible. The true totals are shown against your target on a progress bar, so you always see how close each day is.' },
      { q: 'What calorie level should I use to lose weight?', a: 'Start from your maintenance calories (use the Calorie Calculator) and subtract a moderate deficit of about 250–500 per day. The generator will not build a plan below about 1,200 calories for safety.' },
      { q: 'Is this suitable for a medical or therapeutic diet?', a: 'No. It’s for general healthy eating. Diets for diabetes, kidney disease, allergies, pregnancy, or other medical needs should be planned with a doctor or registered dietitian.' },
    ],
    sources: [
      { citation: 'U.S. Department of Agriculture & HHS. "Dietary Guidelines for Americans, 2020–2025."', url: 'https://www.dietaryguidelines.gov/' },
      { citation: 'Academy of Nutrition and Dietetics. "How to Build a Healthy Eating Routine."', url: 'https://www.eatright.org/' },
      { citation: 'CDC. "Healthy Weight: losing weight at about 1–2 pounds per week."', url: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html' },
      MIFFLIN,
      ISSN_PROTEIN,
    ],
  },
  // ============================================================
  'calorie-calculator': {
    directAnswer: {
      question: 'How does a calorie calculator estimate daily energy needs?',
      answer:
        'This calculator predicts resting energy expenditure (REE) using the Mifflin–St Jeor equation, then multiplies it by a selected activity factor to estimate total daily energy expenditure (TDEE). It cannot measure your metabolism or prescribe how many calories you should eat. The optional 500-kcal examples are arithmetic illustrations, not predicted weekly weight changes.',
    },
    seoTitle: 'Calorie Calculator — Estimated Daily Energy (TDEE)',
    metaDescription:
      'Estimate adult resting energy and daily expenditure with Mifflin–St Jeor, metric or imperial inputs, activity scenarios and clear non-prescriptive limitations.',
    intro:
      'Estimate daily energy expenditure from height, weight, age, sex and a selected activity scenario. The main result is a model estimate of total daily energy expenditure (TDEE), not a measured calorie requirement. Illustrative values 500 kcal below or above that number are not diet or weight-change prescriptions.',
    sections: [
      {
        h2: 'Step 1: predict resting energy with Mifflin–St Jeor',
        paragraphs: [
          'The simplified Mifflin–St Jeor equation predicts resting energy expenditure (REE) in kilocalories per day from weight in kilograms, height in centimeters, age in years, and a sex-specific regression constant. For men: REE = 10 × weight + 6.25 × height − 5 × age + 5. For women: REE = 10 × weight + 6.25 × height − 5 × age − 161. The original study included adults ages 19–78; this calculator allows ages 19–100 but estimates above that sample range are less certain.',
          'For a man age 30, weight 70 kg and height 175 cm, REE is 1,648.75 kcal/day, rounded to 1,649. For a woman with the same measurements, the simplified equation gives 1,482.75 kcal/day. These are predicted resting values, not measured basal metabolic rates. The form converts pounds to kilograms and feet/inches to centimeters before calculating.',
        ],
      },
      {
        h2: 'Step 2: estimate TDEE using an activity scenario',
        paragraphs: [
          'TDEE is daily energy expenditure from resting processes, food digestion and physical activity. The calculator uses TDEE = predicted REE × a selected activity multiplier. Its five existing illustrative factors are 1.2, 1.375, 1.55, 1.725 and 1.9; they are rough choices rather than measurements of individual physical activity levels. Exercise days per week do not capture every difference in work, movement, exercise intensity and physiology.',
          'For the 70-kg, 175-cm, age-30 male example, the 1.375 scenario yields approximately 2,267 kcal/day, while the 1.2 scenario yields approximately 1,979 kcal/day. Changing the activity selection changes the estimate, not your measured energy needs. No activity option guarantees the estimate will match a specific person.',
        ],
        list: {
          intro: 'The existing selector supplies these conventional model assumptions:',
          items: [
            'Sedentary: predicted REE × 1.2.',
            'Lightly active: predicted REE × 1.375.',
            'Moderately active: predicted REE × 1.55.',
            'Very active: predicted REE × 1.725.',
            'Extra active: predicted REE × 1.9.',
          ],
        },
      },
      {
        h2: 'Why the 500-kcal examples are not weight-loss or gain promises',
        paragraphs: [
          'The result panel retains two arithmetic scenarios, 500 kcal/day lower or higher than the selected TDEE estimate, to show how a fixed difference changes a number. Neither is a recommended intake. A 500-kcal daily deficit cannot be converted reliably into exactly 1 lb (0.45 kg) of weight loss every week, and an equal surplus does not ensure the same rate of weight gain. Appetite, activity, energy expenditure and body composition change over time.',
          'NIH researcher Kevin Hall and colleagues have shown that fixed 3,500-kcal-per-pound rules often overpredict long-term weight loss because the energy balance changes. The NIDDK Body Weight Planner accounts for dynamic responses and additional personal details. Use clinical judgment before acting on any number rather than treating a simple subtraction or addition as an instruction.',
        ],
      },
      {
        h2: 'Why there is no universal 1,200- or 1,500-calorie safety floor',
        paragraphs: [
          'Older adult weight-management protocols sometimes used ranges around 1,200–1,500 kcal/day for women and 1,500–1,800 for men under specific treatment conditions. Those numbers do not establish a universal safe minimum for every person. Required energy and nutrient adequacy depend on age, body size, pregnancy status, health conditions, activity and a person’s overall diet.',
          'This tool no longer silently raises a calculated 500-kcal subtraction to a sex-based floor and calls that a safe goal. As a conservative display guard, it withholds illustrative intake numbers below 1,000 kcal/day, a level the NIH NIDDK Body Weight Planner flags for nutrient adequacy. That withholding threshold is NOT a declaration that 1,000 kcal or any higher amount is safe for an individual. Very low modeled expenditure also triggers a warning rather than being presented as a meal plan.',
        ],
      },
      {
        h2: 'How to interpret the estimate responsibly',
        paragraphs: [
          'Use the output to understand assumptions, not to diagnose a condition or calculate a treatment diet. People who are pregnant or breastfeeding, still growing, managing medical conditions or recovering from illness need tailored advice. The equation was developed in healthy adults; the calculator cannot measure actual calorie burn, muscle mass or nutritional adequacy.',
          'If changing weight is an appropriate goal, a registered dietitian or clinician can help consider blood pressure, medications, current nutrition, activity, weight history and follow-up. There is no direct conversion from these three modeled numbers to a guaranteed body-weight timeline.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is TDEE the same thing as resting energy or BMR?',
        a: 'No. Mifflin–St Jeor predicts resting energy expenditure (REE); TDEE multiplies that predicted value by an assumed activity factor to approximate all-day expenditure. Neither is a direct measurement.',
      },
      {
        q: 'Do 500 fewer calories guarantee one pound of weight loss each week?',
        a: 'No. The fixed 3,500-kcal-per-pound rule neglects dynamic energy and body-weight changes. The result panel shows arithmetic examples only, with no guaranteed loss or gain rate.',
      },
      {
        q: 'Why does the calculator not impose 1,200 or 1,500 calories as a minimum?',
        a: 'Those numbers appear in some clinical weight-management programs, not as universal safety rules. Nutritional requirements vary; the tool does not set diets or personal safety thresholds.',
      },
      {
        q: 'Why might a 500-kcal example be hidden?',
        a: 'The tool withholds examples under 1,000 kcal/day because of concerns flagged by the NIDDK Body Weight Planner about meeting nutrient targets. This is a display guard, not proof that other calorie levels are safe.',
      },
      {
        q: 'Which measurements and units should I enter?',
        a: 'Enter weight in kg or lb and height in cm or feet/inches, plus age in whole years (19–100) and one of the listed activity scenarios. The formula runs internally with kilograms and centimeters.',
      },
    ],
    sources: [
      {
        citation: 'Mifflin MD, St Jeor ST, Hill LA, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241–247.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
      },
      {
        citation: 'Hall KD. Why is the 3500 kcal per pound weight loss rule wrong? Int J Obes. 2013;37:1614–1615.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3859816/',
      },
      {
        citation: 'National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK). Body Weight Planner and nutrient-adequacy cautions.',
        url: 'https://www.niddk.nih.gov/bwp',
      },
      {
        citation: 'National Heart, Lung, and Blood Institute (NHLBI). Following DASH: estimated daily calorie needs by age, sex and activity.',
        url: 'https://www.nhlbi.nih.gov/health/dash/following-dash',
      },
    ],
  },

  // ============================================================
  'macro-calculator': {
    directAnswer: {
      question: 'How does this macro calculator calculate grams of protein, carbs and fat?',
      answer:
        'It predicts adult resting energy expenditure with Mifflin–St Jeor, applies a selected activity factor and illustrates a maintenance, lower-energy or higher-energy scenario. The original per-kilogram protein and fat assumptions are applied first; carbohydrate gets the remaining calories at 4 kcal/g. If the numbers cannot reconcile, the calculator withholds the result instead of displaying a false split.',
    },
    seoTitle: 'Macro Calculator — Protein, Carbs & Fat Estimates',
    metaDescription:
      'Explore a mathematically consistent adult macro split with Mifflin REE, activity-based TDEE, kg or lb inputs and clear nutrition limitations.',
    intro:
      'Explore example daily protein, carbohydrate and fat amounts using a predicted adult energy budget. Choose an activity scenario and an example of maintaining, reducing or increasing the energy number. This tool does not measure metabolic needs or prescribe a diet; it withholds any result whose components do not fit its calculated budget.',
    sections: [
      {
        h2: 'How the daily energy illustration is calculated',
        paragraphs: [
          'The existing Mifflin–St Jeor equation predicts resting energy expenditure (REE) from weight in kilograms, height in centimeters, age in whole years and a sex-specific model coefficient. For men, REE = 10 × kg + 6.25 × cm − 5 × years + 5; for women the last term is −161. This is a prediction of REE, not a direct measurement of basal metabolic rate (BMR). The original study included people ages 19–78, so estimates at older ages are less certain.',
          'The calculator then multiplies REE by one of five existing illustrative activity factors (1.2, 1.375, 1.55, 1.725 or 1.9) to estimate total daily energy expenditure (TDEE). These multipliers describe assumed activity, not measured expenditure. The maintain example uses that TDEE number; the cut and bulk examples subtract 500 kcal/day or add 300 kcal/day for arithmetic comparison, not because either change is automatically appropriate or produces a guaranteed weight change.',
        ],
      },
      {
        h2: 'Why protein and fat are allocated before carbohydrate',
        paragraphs: [
          'The tool preserves its existing illustrative coefficients by goal: cut uses 2.2 g protein/kg plus 0.8 g fat/kg; maintain uses 1.8 g protein/kg plus 0.9 g fat/kg; bulk uses 1.6 g protein/kg plus 1.0 g fat/kg. Those inputs are not a user-selected percentage split and are not the same as individualized dietary requirements. Evidence on protein for healthy exercising adults supports a range of intakes, but appropriate protein and fat depend on energy availability, training and health.',
          'The energy arithmetic uses 4 kcal per gram of protein and carbohydrate and 9 kcal per gram of fat. The carbohydrate remainder is (illustrative calories − 4 × protein grams − 9 × fat grams) ÷ 4. For a 70-kg, 175-cm, 30-year-old man with the lightly active factor (1.375), estimated TDEE is about 2,267 kcal/day. At maintain, 126 g protein (504 kcal) and 63 g fat (567 kcal) leave about 299 g carbohydrate (1,196 kcal). The sum of unrounded macro energies equals the estimated budget.',
        ],
      },
      {
        h2: 'What happens if the macro energy budget does not work',
        paragraphs: [
          'Some combinations of weight, model age, physical activity and selected scenario leave fewer modeled calories than the protein and fat assumptions already require. Simply changing negative carbohydrate grams to zero would not solve the inconsistency: it would still present more macro calories than the displayed total. The calculator now withholds the split and meal-plan link in that case, with an explanation, instead of reporting impossible targets.',
          'The tool also withholds scenarios where the modeled TDEE or illustrated energy amount is under 1,000 kcal/day. The NIDDK Body Weight Planner warns about meeting food-group and nutrient goals below 1,000 kcal/day in its model. This is a conservative display guard, not a minimum intake proven safe for everyone: a number at or above it can still be inappropriate, and no food plan follows from a formula alone.',
        ],
      },
      {
        h2: 'Nutrition ranges and the limits of a fixed macro equation',
        paragraphs: [
          'North American Dietary Reference Intakes describe general adult acceptable macronutrient distribution ranges of 10–35% energy from protein, 45–65% from carbohydrate and 20–35% from fat. These are broad reference ranges for generally healthy populations, not a requirement that an individual calculator must always return those exact percentages. Body-weight-based protein allocations may fall outside them, especially at low energy budgets, and the tool does not assess nutrient adequacy.',
          'The International Society of Sports Nutrition position stand discusses roughly 1.4–2.0 g/kg/day of protein for most exercising adults, with some higher intakes studied in energy-restricted resistance training. Those findings do not mean that 2.2 g/kg or any particular split is necessary, safe or superior for every user. Conditions such as kidney disease, pregnancy, eating disorders or therapeutic diets require individualized advice.',
        ],
      },
      {
        h2: 'How to use units and results responsibly',
        paragraphs: [
          'You can enter mass in kilograms or pounds and height in centimeters or feet/inches. Conversion uses exact unit definitions before calculation. The display may round grams and calorie totals to whole numbers, so adding calories back from the displayed rounded grams can differ slightly from the model budget even though its unrounded internal accounting is consistent.',
          'The three options are scenarios, not physician-approved eating plans. A fixed 500-kcal reduction does not guarantee one pound of loss each week because energy balance and body composition change over time. If a result is mathematically feasible, you may preview the approximate numbers in the existing meal planner, but that link is an educational convenience and does not validate medical suitability.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does this macro calculator let me choose a protein/carbs/fat percentage?',
        a: 'No. It uses fixed body-weight-based protein and fat coefficients for three scenarios, then assigns the remaining modeled energy to carbohydrate. It does not offer custom percentage input.',
      },
      {
        q: 'Why might my macro split be unavailable?',
        a: 'The model may yield a very low energy illustration or protein and fat may already require more calories than the total. In either case the tool withholds the split instead of showing inconsistent or unsafe-sounding targets.',
      },
      {
        q: 'Are 1,200 calories for women and 1,500 for men universally safe minimums?',
        a: 'No. These numbers are used in some specific clinical programs, not as universal guarantees. This calculator does not silently change modeled energy to a sex-dependent floor.',
      },
      {
        q: 'Do I need 2.2 grams of protein per kilogram when cutting?',
        a: 'Not necessarily. That is one preset arithmetic assumption, not a personal prescription. The appropriate amount depends on your health, energy intake, exercise and clinical needs.',
      },
      {
        q: 'Will the macro plan guarantee a specific weight change?',
        a: 'No. Both TDEE and the scenario offset are estimates. Actual energy expenditure and body weight respond dynamically to changes in eating and activity.',
      },
    ],
    sources: [
      {
        citation: 'Mifflin MD, St Jeor ST, Hill LA, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51:241–247.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
      },
      {
        citation: 'Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition Position Stand: protein and exercise. J Int Soc Sports Nutr. 2017;14:20.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/',
      },
      {
        citation: 'Health Canada. Dietary Reference Intakes: reference values for macronutrients (AMDR for adults age 19+).',
        url: 'https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-macronutrients.html',
      },
      {
        citation: 'NIH NIDDK. Body Weight Planner, including its under-1,000-kcal/day nutrient adequacy warning.',
        url: 'https://www.niddk.nih.gov/bwp',
      },
      {
        citation: 'Hall KD, Chow CC. Why is the 3500 kcal per pound weight loss rule wrong? Int J Obes (Lond). 2013;37:1614.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3859816/',
      },
    ],
  },

  // ============================================================
  'protein-intake-calculator': {
    directAnswer: {
      question: 'How much protein do adults need per day?',
      answer:
        'The longstanding U.S. adult RDA is 0.8 g/kg/day, but it is not an optimal training target or a ceiling. The 2025–2030 U.S. Dietary Guidelines describe a 1.2–1.6 g/kg/day goal, and sports-nutrition guidance commonly discusses 1.4–2.0 g/kg/day for healthy exercising adults. For 70 kg (154 lb), 1.6 g/kg is 112 g/day; the appropriate amount depends on individual circumstances.',
    },
    seoTitle: 'Protein Intake Calculator — Adult g/kg Examples',
    metaDescription:
      'Explore weight-based protein examples in grams, optional meal splits and energy at 4 kcal/g. Compare RDA, 2025–2030 guidelines and training ranges.',
    intro:
      'Choose your weight in kilograms or pounds and a protein reference point. This calculator multiplies body weight in kilograms by the selected g/kg factor; it does not diagnose deficiency, set a dietary maximum, or create a medical nutrition prescription.',
    notice:
      'For generally healthy adults only. Do not use a generic high-protein result as a clinical target if you have kidney disease, are pregnant or breastfeeding, are under 19, have frailty or a serious illness, or need a medically managed diet. Ask your clinician or registered dietitian about your individual needs.',
    sections: [
      {
        h2: 'How the arithmetic works',
        paragraphs: [
          'Daily protein grams = body weight in kilograms × selected grams per kilogram. If you enter pounds, the calculator first uses the exact conversion 1 lb = 0.45359237 kg (with display precision of 0.001 lb and 0.01 kg). A 70-kg adult selecting 1.6 g/kg sees 112 g/day; at the standard energy conversion of 4 kcal per gram, that is 448 kcal from protein, not 448 kcal of total daily food.',
          'The four-meal row only divides the unrounded daily result by four. Four eating occasions are not compulsory, and rounded displayed grams or calories may not multiply back exactly to the unrounded total.',
        ],
      },
      {
        h2: 'What the different g/kg values actually mean',
        paragraphs: [
          'The longstanding U.S. adult protein RDA is 0.8 g/kg/day. An RDA is a population nutrient reference designed to cover most healthy people, not a clinical diagnosis, universal minimum, personal optimum or maximum. The newer 2025–2030 U.S. Dietary Guidelines describe protein food-pattern goals of 1.2–1.6 g/kg/day, adjusted for individual energy needs.',
          'For healthy exercising adults, the International Society of Sports Nutrition describes approximately 1.4–2.0 g/kg/day for building or maintaining muscle; a 2018 meta-analysis of resistance-training studies estimated a mean leveling-off near 1.6 g/kg/day, with uncertainty. These research populations do not define everyone’s optimum.',
        ],
        list: {
          intro: 'The five preserved calculator coefficients are reference points or examples, not five universally validated requirements:',
          items: [
            '0.8 g/kg — longstanding U.S. adult RDA reference, not automatically the right goal for every adult.',
            '1.2 g/kg — higher-intake example aligned with the lower end of the current U.S. dietary guideline range.',
            '1.6 g/kg — resistance-training example, also at the upper end of the current U.S. dietary guideline range.',
            '2.0 g/kg — exercise-oriented example near the upper end of the usual 1.4–2.0 g/kg sports guidance.',
            '2.2 g/kg — higher example sometimes discussed in resistance-training literature; it is NOT a universal upper limit, required intake, or guarantee of muscle growth or fat loss.',
          ],
        },
      },
      {
        h2: 'When weight-based calculations need special caution',
        paragraphs: [
          'Chronic kidney disease requires individual assessment. KDIGO 2024 suggests about 0.8 g/kg/day for adults with CKD stages G3–G5 and advises avoiding greater than 1.3 g/kg/day in those at risk of progression; requirements during dialysis or other special circumstances can be different. Do not raise or restrict protein on the basis of this calculator if you have CKD.',
          'Pregnancy, breastfeeding, adolescence, older age with frailty, recovery from illness, and very high or low body weight may change protein needs or how the relevant weight is defined. Using scale weight alone does not account for body composition, total energy intake, medication or a clinician’s nutrition plan.',
        ],
      },
      {
        h2: 'Meals, protein sources and energy',
        paragraphs: [
          'Total daily intake matters, and people who train may choose to distribute protein across meals. Sports-nutrition literature often discusses approximately 20–40 g of high-quality protein per eating occasion for healthy exercising adults, but responses vary by age, body size, energy intake and training. The calculator’s equal four-way split is arithmetic only.',
          'Foods such as beans, lentils, tofu, dairy, eggs, seafood and poultry can supply protein. Four kcal per gram is the conventional nutrition-label energy factor for protein; the food’s total calories depend on its other nutrients. Do not mistake grams of a food for grams of protein.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is 0.8 g/kg the recommended protein target for everyone?',
        a: 'No. It is the longstanding U.S. adult RDA reference, not an individual optimum. The 2025–2030 dietary guidelines describe 1.2–1.6 g/kg/day protein goals, and training or clinical circumstances can change needs.',
      },
      {
        q: 'Is 2.2 g/kg the maximum safe amount?',
        a: 'No. This calculator’s 2.2 g/kg option is an illustrative higher training value, not a defined tolerable upper limit or advice for everyone. Higher is not guaranteed to improve training results.',
      },
      {
        q: 'How are protein calories and grams per meal calculated?',
        a: 'The calculator multiplies body weight in kilograms by the selected g/kg factor. Protein energy is approximately four kcal per gram; the optional four-meal row divides the unrounded daily grams by four.',
      },
      {
        q: 'Can I use this calculator if I have kidney disease?',
        a: 'Not as a personal protein prescription. CKD stage, dialysis, nutritional status and treatment can change the right amount. Ask a kidney specialist or renal registered dietitian before changing protein intake.',
      },
    ],
    sources: [
      { citation: 'National Academies dietary protein RDA summary in NCBI Bookshelf, 2024.', url: 'https://www.ncbi.nlm.nih.gov/books/NBK614631/' },
      { citation: 'USDA/HHS. Dietary Guidelines for Americans, 2025–2030: protein goals (1.2–1.6 g/kg/day).', url: 'https://cdn.realfood.gov/DGA_508.pdf' },
      { citation: 'Jäger R, et al. ISSN Position Stand: protein and exercise. J Int Soc Sports Nutr. 2017;14:20.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/' },
      { citation: 'Morton RW, et al. Resistance-training protein meta-analysis. Br J Sports Med. 2018;52:376–384.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5867436/' },
      { citation: 'KDIGO 2024 CKD Guideline Executive Summary, protein intake section. Kidney Int. 2024;105:684–701.', url: 'https://doi.org/10.1016/j.kint.2023.10.016' },
      { citation: 'MedlinePlus. Protein in diet: 4 calories per gram and dietary context.', url: 'https://medlineplus.gov/ency/article/002467.htm' },
    ],
  },

  'water-intake-calculator': {
    directAnswer: {
      question: 'How much water do I need daily?',
      answer:
        'There is no single body-weight equation that determines an adult’s exact daily water need. This calculator illustrates 35 mL per kg of body weight plus a selectable exercise adjustment. It holds the weight portion above 100 kg as a formula display guard, not a medical maximum. For context, U.S. adult adequate intakes are about 3.7 L for men and 2.7 L for women of TOTAL water from beverages and food, not prescribed beverage amounts.',
    },
    seoTitle: 'Water Intake Calculator — Total Water Examples (L & oz)',
    metaDescription:
      'Explore an illustrative daily total-water estimate by weight and activity. See metric/US unit equivalents, food and beverage context and safety limits.',
    intro:
      'Enter body weight and choose a simple activity example to see estimated TOTAL water from food and beverages. This is a transparent rule-of-thumb calculation, not a validated hydration prescription; your needs can differ substantially.',
    notice:
      'For general education in healthy adults, not a target for children, pregnancy, breastfeeding, illness or clinical fluid management. Heart, kidney and liver disorders, certain medications, or a prescribed fluid restriction can change what is appropriate. Drinking too much too quickly can be dangerous.',
    sections: [
      {
        h2: 'What this calculator actually measures',
        paragraphs: [
          'The arithmetic is 35 mL × body weight in kilograms, plus the selected 0, 500, 1,000 or 1,500 mL/day example. For 70 kg with the 500-mL option, 2,450 + 500 = 2,950 mL (2.95 L), displayed as 3.0 L/day when rounded to one decimal. This is an illustrative TOTAL-water number, not the amount you must drink from a bottle. The activity additions are not based on your measured sweat losses.',
          'The source limitation identified in the existing engineering review PR #54 is preserved: above 100 kg (about 220 lb), the 35-mL/kg portion stops increasing. For instance, both 100 kg and 150 kg show a 3.5-L baseline before a selected activity addition. This 100-kg cutoff is an engineering safeguard against extreme linear extrapolation; it is NOT a medically validated body-weight threshold and does not say larger adults need no more water.',
        ],
      },
      {
        h2: 'Liters, US fluid ounces, cups and food water',
        paragraphs: [
          'The calculator uses 1 kilogram = 2.2046226218 pounds and 1 US fluid ounce = 29.5735295625 mL. Conversions labeled “total-water equivalent” include water from foods as well as beverages. A total of 2.95 L is approximately 100 US fluid ounces, but it is incorrect to interpret all 100 ounces as required plain drinking water.',
          'The National Academies reported that roughly 80% of total water was obtained from drinks and 20% from food in an older U.S. population survey. The optional beverage-equivalent row demonstrates that split; it is not fixed for each person. Tea, coffee, milk, water and moisture-rich foods can contribute to total water intake.',
        ],
      },
      {
        h2: 'Adult adequate intakes are references, not maximums',
        paragraphs: [
          'The U.S. National Academies report roughly 3.7 L/day for men and 2.7 L/day for women as adequate intakes for total water in generally healthy adults in temperate climates. Those figures include drinks AND food and are based substantially on observed intake; they are not rigid personalized requirements or upper limits. The report did not establish a tolerable upper intake level for water. That does not make unlimited drinking safe: excessive rapid intake can cause severe hyponatremia.',
          'Exercise, heat, climate, sweat rate, food choices and illness can affect fluid needs. Neither the 35-mL/kg rule nor the four fixed activity increments measures these individual losses. The National Athletic Trainers’ Association recommends hydration informed by thirst and individual conditions and warns against both dehydration and overdrinking.',
        ],
      },
      {
        h2: 'Who should not use the example as a personal plan',
        paragraphs: [
          'People with heart, kidney or liver disease, certain medications, fluid restrictions, or symptoms of dehydration or fluid overload need advice specific to their condition. Pregnancy, breastfeeding, childhood and medical illness likewise need different context. Do not use this output to override an existing fluid or electrolyte plan.',
          'During exercise, avoid forcing fluid intake to match a preset number. Thirst, conditions, and when appropriate professionally assessed sweat loss can guide a more individualized approach. Rapid consumption of large water volumes can lower blood sodium; seek prompt medical help for concerning symptoms, particularly during or after endurance events.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does the calculated number mean how much plain water I must drink?',
        a: 'No. It is a rough total-water illustration from beverages and food. The ounces and cup equivalents are conversions of the same total, not a daily plain-water prescription.',
      },
      {
        q: 'Why does the result stop growing above 100 kg?',
        a: 'The earlier engineering review limited the 35-mL/kg formula at 100 kg to avoid extreme extrapolation. This is a transparent calculator guard, not a clinically validated boundary or a safe upper intake limit.',
      },
      {
        q: 'Are 3.7 L for men and 2.7 L for women recommended maximums?',
        a: 'No. They are U.S. National Academies adequate-intake reference values for TOTAL water from drinks and food for generally healthy adults, not universal targets or safe ceilings.',
      },
      {
        q: 'Can I use the activity additions as an exercise drinking plan?',
        a: 'No. The 0 to 1.5 L additions are illustrative choices, not measured sweat losses. Prolonged exercise or heat calls for individualized guidance and avoiding both dehydration and overdrinking.',
      },
      {
        q: 'What if I have a kidney, heart or liver condition?',
        a: 'Do not use this estimate as a personal fluid prescription. Clinical conditions and medicines can require different fluid and electrolyte management; follow your healthcare team’s advice.',
      },
    ],
    sources: [
      {
        citation: 'Institute of Medicine / National Academies. Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate. 2005. Summary: total water AI, population beverage/food contributions, no defined water UL.',
        url: 'https://www.nationalacademies.org/read/10925/chapter/2',
      },
      {
        citation: 'National Athletic Trainers’ Association. Fluid Replacement for the Physically Active. Journal of Athletic Training. 2017.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5634236/',
      },
      {
        citation: 'National Library of Medicine, MedlinePlus. Fluid and Electrolyte Balance: health conditions, medicines and excessive water.',
        url: 'https://medlineplus.gov/fluidandelectrolytebalance.html',
      },
    ],
  },

  // ============================================================
  'calorie-deficit-calculator': {
    directAnswer: {
      question: 'Does a 3,500-calorie deficit equal one pound of weight loss?',
      answer:
        'A historical 3,500-kcal-per-pound rule expresses an approximate energy equivalent, not a reliable prediction of when someone will lose weight. This calculator preserves that static arithmetic for education only. Real energy expenditure and body composition adapt, so a planned energy gap is not a guaranteed weight-change rate or a safe calorie prescription.',
    },
    seoTitle: 'Calorie Deficit Calculator — Static Energy Example',
    metaDescription:
      'Explore the historical 3,500-kcal-per-pound energy-equivalent rule and why it cannot predict weight loss or set safe personal calorie targets.',
    intro:
      'Enter an assumed maintenance-energy figure, a hypothetical weight change and a number of weeks to explore the classic 3,500-kcal-per-pound arithmetic. This is not a dynamic weight-loss prediction or a daily intake recommendation. The display withholds examples that produce very low modeled energy.',
    notice:
      'For adult education only. This tool does not diagnose obesity or prescribe weight-loss calories. Pregnancy, breastfeeding, adolescents, eating disorders, serious illness, medication-related risks and medically supervised diets require individualized care; do not use a modeled calorie remainder as a meal plan.',
    sections: [
      {
        h2: 'The exact calculation this tool keeps',
        paragraphs: [
          'The calculator converts the hypothetical change from kilograms to pounds using 1 lb = 0.45359237 kg, multiplies by the historical factor of 3,500 kcal per pound, then divides by 7 × the number of weeks. The result is a fixed energy-equivalent example, not the actual deficit the body will need. The same arithmetic is used when the entry is displayed in pounds.',
          'For an exact 10-lb (approximately 4.536-kg) illustration over 10 weeks: 10 × 3,500 = 35,000 kcal, and 35,000 ÷ 70 days = 500 kcal/day as STATIC arithmetic. Subtracting that number from an assumed 2,200-kcal/day maintenance figure gives 1,700 kcal/day arithmetically. It does not predict that the person will lose 10 lb within 10 weeks or imply that 1,700 kcal/day is suitable for them.',
        ],
      },
      {
        h2: 'Why the rule is not a weight-loss forecast',
        paragraphs: [
          'The original factor approximates energy stored in a pound of adipose tissue. A person’s weight changes also involve water, fat-free mass and evolving expenditure, including changes in resting energy and movement. Hall and Chow explain why applying a CONSTANT daily energy difference as a weight-change forecast can overestimate weight loss: the gap between intake and expenditure is not fixed over time.',
          'The rule is therefore shown as a historical what-if calculation, never as the daily gap “needed” to reach a weight by a certain week. For clinical or personal planning, an individualized assessment and a dynamic tool such as the NIH NIDDK Body Weight Planner are more appropriate than this static example.',
        ],
      },
      {
        h2: 'What the calorie numbers do and do not mean',
        paragraphs: [
          'An entered maintenance number is an assumption, not a measured energy expenditure. The separate Calorie Calculator uses an equation-based estimated resting expenditure multiplied by an assumed activity factor, which is also uncertain. Neither calculator can establish the calories an individual must eat.',
          'The “arithmetic remainder” row is maintenance minus the static daily difference, only while the example remains above the tool’s withholding threshold. It is not a safe meal-plan target. If the calculated remainder is below 1,000 kcal/day or negative, the tool shows no numerical deficit or dietary intake rather than quietly presenting 0 kcal/day. The NIDDK Body Weight Planner uses 1,000 kcal/day as its own nutrient-adequacy display restriction, NOT a universal safe intake above that value.',
        ],
      },
      {
        h2: 'Why there is no universal 1,200/1,500 calorie floor',
        paragraphs: [
          'Older clinical obesity guidelines sometimes describe 1,200–1,500 kcal/day for some women and 1,500–1,800 kcal/day for some men as common starting intake ranges in individualized adult programs. Those are NOT one-size-fits-all safe minimums or a license to prescribe intake from a two-field model. Energy, nutrition and medical needs depend on health status, medications, body size, age, activity and nutritional adequacy.',
          'The original calculator used a sex switch only to select a 1,200/1,500-kcal “safe minimum.” The reviewed model removes that switch, because the fixed arithmetic does not use sex, and it does not substitute a different “safe minimum.” Very-low-energy diets and complicated medical conditions require professional oversight.',
        ],
      },
      {
        h2: 'When a hypothetical example is especially misleading',
        paragraphs: [
          'An extreme requested change or short timeframe may produce an arithmetic gap greater than 1,000 kcal/day or a hypothetical change greater than 1 kg per week. The tool now warns that these are large or rapid ILLUSTRATIVE numbers, not proof that the change is achievable or safe. It does not use a static threshold to certify other combinations as safe.',
          'Body weight by itself cannot reveal fat loss, nutritional adequacy or treatment suitability. For actual weight-management decisions, discuss an appropriate goal and monitoring with a qualified clinician or registered dietitian, especially with diabetes medication, pregnancy or a history of disordered eating.',
        ],
      },
    ],
    faq: [
      {
        q: 'Will a 500-calorie daily deficit make me lose one pound per week?',
        a: 'Not reliably. A fixed 500 × 7 = 3,500-kcal weekly gap is historical arithmetic, not a forecast. Real energy expenditure and weight composition change during weight loss.',
      },
      {
        q: 'What if the calculator cannot display a result?',
        a: 'The tool withholds a modeled intake below 1,000 kcal/day or a negative remainder instead of presenting 0 as a valid food intake. That is an educational display safeguard from the NIDDK planner context, not a medically safe threshold.',
      },
      {
        q: 'Are 1,200 calories for women and 1,500 for men universal safe minimums?',
        a: 'No. Older adult obesity-treatment protocols used ranges around those values within individualized programs. A personal minimum or weight-loss diet cannot be determined from sex alone.',
      },
      {
        q: 'Is the assumed maintenance calorie value measured?',
        a: 'No. It is entered by the visitor. If obtained from a calorie calculator, it is still an equation-based estimate that varies with activity, age and other factors.',
      },
      {
        q: 'Is a static energy-gap result a diet plan or target date?',
        a: 'No. The output is a historical energy-equivalent what-if calculation. It cannot determine how much a person should eat or when a specific weight will be achieved.',
      },
    ],
    sources: [
      {
        citation: 'Wishnofsky M. Caloric equivalents of gained or lost weight. Am J Clin Nutr. 1958;6:542–546. Historical rule.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/13594881/',
      },
      {
        citation: 'Hall KD, Chow CC. Why is the 3500 kcal per pound weight loss rule wrong? Int J Obes. 2013;37:1614. Dynamic energy balance.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3859816/',
      },
      {
        citation: 'NIH NIDDK. Body Weight Planner: dynamically modeled weight change and under-1,000-kcal nutrient adequacy display restriction.',
        url: 'https://www.niddk.nih.gov/bwp',
      },
      {
        citation: 'AHA/ACC/TOS Guideline for the Management of Overweight and Obesity in Adults. J Am Coll Cardiol. 2014;63:2985–3023. Program intake ranges are individualized.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5819889/',
      },
    ],
  },

  // ============================================================
  'keto-calculator': {
    directAnswer: {
      question: 'Does a 70/25/5 keto macro calculation guarantee ketosis?',
      answer:
        'No. This calculator illustrates one 70% fat, 25% protein, 5% TOTAL-carbohydrate split using estimated resting energy and a selected activity multiplier. There is no single required ketogenic macro ratio; 5% of a high calorie amount can exceed the under-50-g/day carbohydrate pattern discussed in research. It does not measure ketones or calculate net carbohydrates.',
    },
    seoTitle: 'Keto Calculator — 70/25/5 Macro Example and Limits',
    metaDescription:
      'Explore a 70/25/5 keto macro illustration with estimated REE and TDEE, total carbohydrates, unit conversions and clinical limitations.',
    intro:
      'See how an illustrative 70% fat, 25% protein and 5% total-carbohydrate allocation looks when applied to an estimated daily energy budget. The calculator does not prescribe a keto diet, calculate net carbohydrate, confirm nutritional ketosis, or identify a safe calorie intake.',
    notice:
      'Adult education only. Very-low-carbohydrate diets are not recommended during pregnancy or breastfeeding, for children, people with kidney disease or disordered eating. Avoid ketogenic diets while taking SGLT2 inhibitors because of ketoacidosis risk; diabetes and other medicines require professional oversight. This is not a diet or medication plan.',
    sections: [
      {
        h2: 'How the calculator estimates energy',
        paragraphs: [
          'The preserved simplified Mifflin–St Jeor formula estimates resting energy expenditure (REE), in kcal/day: 10 × weight in kilograms + 6.25 × height in centimeters − 5 × age in years, then add 5 for the male equation or subtract 161 for the female equation. These are historical equation inputs, not a measurement of a person’s metabolic health. The original study enrolled healthy adults ages 19–78; the site allows adults through 100 as a transparent extrapolation, not a validation at older ages.',
          'The selectable activity multipliers, preserved from the existing calorie and macro calculators, are 1.2, 1.375, 1.55, 1.725 and 1.9. Predicted REE multiplied by the selected assumption gives illustrative total daily energy expenditure (TDEE), not measured calories burned or a clinical food-intake prescription.',
        ],
      },
      {
        h2: 'What 70% fat, 25% protein and 5% carbohydrate actually calculate',
        paragraphs: [
          'For a 70-kg, 175-cm, 30-year-old using the male equation and a 1.375 activity multiplier, the predicted REE is 1,648.75 kcal/day and illustrative TDEE is about 2,267 kcal/day. The unrounded 70/25/5 energy allocations produce approximately 176 g fat, 142 g protein and 28.34 g TOTAL carbohydrate. The calculation uses 9 kcal per gram of fat and 4 kcal per gram of protein or carbohydrate, so the unrounded energy shares reconcile to the assumed budget.',
          'The 70/25/5 ratio is retained for continuity with the original calculator; it is ONE possible distribution, not an established universal ketogenic diet. It gives about 2.0 g protein per kg of body weight in the example—whether that is medically or nutritionally appropriate depends on the individual. Rounded grams need not sum exactly to displayed calories.',
        ],
      },
      {
        h2: 'Why five percent carbohydrate is not a net-carb cap',
        paragraphs: [
          'The 5% calculation above is a percentage of assumed calories assigned to TOTAL carbohydrate. In many exercise and dietary studies a ketogenic pattern is described as fewer than about 50 g of total carbohydrate daily, but ketosis varies by person and circumstances. If this calculator’s 5% share reaches 50 g or more, it flags the difference rather than silently calling it a ketogenic target. No percentage, gram threshold or online calculator can confirm nutritional ketosis.',
          'The American Diabetes Association does not recognize “net carbs” as a standardized or FDA-defined quantity. Subtracting all fiber and all sugar alcohols from total carbohydrate can be inaccurate because different substances are digested differently. Since this calculator asks for no fiber, sugar-alcohol or food information, it cannot calculate net carbs or a personal net-carbohydrate ceiling; someone using diabetes medication should follow professional carbohydrate-counting advice.',
        ],
      },
      {
        h2: 'What the energy, grams and donut chart mean',
        paragraphs: [
          'The donut chart is computed from the unrounded 4/4/9 energy equivalents of the three allocations and therefore represents 25% protein, 5% total carbohydrate and 70% fat. The predicted REE and the selected activity factor appear separately so the assumptions behind TDEE are visible.',
          'For unusual inputs that create a modeled energy budget below 1,000 kcal/day, the tool suppresses the macro amounts instead of implying a very low food plan is acceptable. This is a conservative calculator-display decision, not a minimum intake that is medically safe for everyone. Predictions at older ages and very large body sizes can be particularly uncertain.',
        ],
      },
      {
        h2: 'Ketosis, ketoacidosis and people needing individual care',
        paragraphs: [
          'Nutritional ketosis is not the same condition as diabetic ketoacidosis (DKA), which is potentially life-threatening. ADA 2026 recommendations advise avoiding very-low-carbohydrate eating patterns when taking SGLT2 inhibitor medicines because of ketoacidosis risk, including when blood glucose is not dramatically high. Insulin and other glucose-lowering medicines may also require clinical adjustments to prevent hypoglycemia. Do not discontinue or change any medicine because of this calculator.',
          'Very-low-carbohydrate plans are not recommended during pregnancy, breastfeeding, childhood, kidney disease or a history of disordered eating. Liver or pancreatic conditions, special metabolic disorders and other medical circumstances can make restrictive diets inappropriate. If considering dietary change, assess nutritional adequacy and medication safety with a qualified clinician or registered dietitian. A chart of grams alone cannot establish suitability or safety.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is 70/25/5 the only standard ketogenic ratio?',
        a: 'No. It is the original site illustration, not a universal prescription. Published ketogenic patterns vary by goals, population and clinical setting.',
      },
      {
        q: 'Is the five-percent carbohydrate number a net-carbohydrate limit?',
        a: 'No. It is a calculated amount of total carbohydrate. The tool has no fiber or sugar-alcohol inputs, so it cannot derive net carbohydrates; ADA notes that net carbohydrate is not a standardized FDA label term.',
      },
      {
        q: 'Does 20–50 g of carbohydrates guarantee ketosis?',
        a: 'No. Some studies use below 50 g of total carbohydrate as a broad ketogenic definition, but the amount associated with nutritional ketosis varies. This calculator does not measure ketones.',
      },
      {
        q: 'Does the calorie estimate mean how much I should eat?',
        a: 'No. REE is predicted from the Mifflin–St Jeor equation and TDEE assumes an activity multiplier. Neither is a measured personal intake prescription.',
      },
      {
        q: 'Is keto safe if I have diabetes or take an SGLT2 inhibitor?',
        a: 'Do not follow the calculator as a diet plan. Very-low-carbohydrate diets should be avoided when taking SGLT2 inhibitors because of DKA risk. Diabetes medicines and dietary plans require medical oversight.',
      },
    ],
    sources: [
      {
        citation: 'Mifflin MD et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51:241–247.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
      },
      {
        citation: 'International Society of Sports Nutrition Position Stand: Ketogenic Diets. J Int Soc Sports Nutr. 2024.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11212571/',
      },
      {
        citation: 'American Diabetes Association. Get to Know Carbs: net carbs are not a standardized or recognized FDA/ADA label term.',
        url: 'https://diabetes.org/food-nutrition/understanding-carbs/get-to-know-carbs',
      },
      {
        citation: 'American Diabetes Association. Standards of Care in Diabetes 2026, Facilitating Positive Health Behaviors: very-low-carb exclusions and SGLT2 safety.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12690188/',
      },
      {
        citation: 'Harvard T.H. Chan School of Public Health. Diet Review: Ketogenic Diet for Weight Loss (multiple ratios and contraindications).',
        url: 'https://nutritionsource.hsph.harvard.edu/healthy-weight/diet-reviews/ketogenic-diet/',
      },
    ],
  },

  // ============================================================
  'vitamin-d-sun-calculator': {
    directAnswer: {
      question: 'Can sun exposure tell me whether I have enough vitamin D?',
      answer:
        'No. The UV Index, time outdoors, skin reaction type, exposed skin and dietary habits cannot reliably calculate vitamin D produced or blood 25(OH)D. This tool summarizes conditions and appropriate sun protection rather than assigning a vitamin D score or prescribing unprotected exposure. Vitamin D can come from foods, fortified products and supplements when appropriate.',
    },
    seoTitle: 'Vitamin D & Sun Exposure — Sun-Safety Context',
    metaDescription:
      'Review UV Index, sunscreen, skin-reaction type and vitamin D food sources. No invented vitamin D score, unsafe UV time or automatic supplement dose.',
    intro:
      'Record your UV Index category, time already spent outside, skin type, exposed areas, protection and vitamin D food pattern. This educational tool does not predict vitamin D synthesis, measure blood levels, or recommend deliberate UV exposure.',
    notice:
      'No UV dose is known to provide adequate vitamin D without skin-cancer risk. Do not delay sunscreen or seek midday unprotected sun for vitamin D. Do not use your answers to diagnose deficiency, justify routine blood testing or select a supplement dose.',
    sections: [
      {
        h2: 'Why this tool does not calculate a vitamin D exposure score',
        paragraphs: [
          'UVB can support vitamin D production in uncovered skin, but the amount varies with season, latitude, time of day, cloud cover, clothing, pigmentation, age and other factors. A reported UV Index category indicates ambient UV hazard, NOT the UVB dose an individual receives. Minutes outdoors and a skin-type category cannot convert these unknowns into IU of vitamin D or a laboratory 25(OH)D concentration.',
          'An earlier version of this site assigned “Low,” “Moderate” or “Good” synthesis scores from arbitrary weights. That score could improve with more unprotected sunlight and was particularly misleading with zero recorded outdoor minutes. The calculation was removed in previous reviewed safety fixes. This version reports the inputs without reinstating a score, numerical exposure target or deficiency risk grade.',
        ],
      },
      {
        h2: 'What the UV Index actually tells you',
        paragraphs: [
          'The U.S. Environmental Protection Agency groups UV Index values as low (0–2), moderate (3–5), high (6–7), very high (8–10) and extreme (11+). These are environmental UV hazard categories, not vitamin D sufficiency levels and not individual accumulated doses. Even low reported UV conditions are not proof that a person will never experience UV injury; reflection, duration and location matter.',
          'At moderate or higher UV levels, prioritize shade, covering skin, a wide-brimmed hat and UV-protective sunglasses. The American Academy of Dermatology recommends broad-spectrum, water-resistant SPF 30+ sunscreen on skin not covered by clothing. High or extreme UV calls for particular care; there is no recommendation to remove protection for a few minutes to manufacture vitamin D.',
        ],
      },
      {
        h2: 'Fitzpatrick skin types are not immunity from skin cancer',
        paragraphs: [
          'The Fitzpatrick skin-reactivity scale describes usual burning and tanning responses. Melanin changes UVB penetration, but people across all pigmentation types can experience UV damage. Labels such as type VI do not mean skin cancer is impossible or that unprotected exposure is safe.',
          'Reported uncovered body areas and sunscreen use are useful context for protection counseling, but they cannot determine a universally safe exposure duration. Someone reporting zero time outdoors receives no “good vitamin D potential” label, because no such validated model is available.',
        ],
      },
      {
        h2: 'Food, supplements and vitamin D reference intakes',
        paragraphs: [
          'Vitamin D food sources include fatty fish, egg yolks and fortified milk or other fortified foods. NIH reference intake for adults ages 19–70 is 600 IU (15 micrograms) daily, and 800 IU (20 micrograms) for those over 70, assuming minimal sun exposure. The adult tolerable upper intake level of 4,000 IU/day is a safety ceiling, NOT a recommended dose; higher doses may be clinically prescribed in selected circumstances.',
          'Choosing “frequent fish” or “daily supplement” does not give the tool an IU intake: foods, portions and supplement strengths vary. Do not interpret such answers as “meets RDA,” “below target” or a need for 1,000–2,000 IU/day. People with malabsorption, osteoporosis, kidney disease or other established indications need individualized evaluation rather than an online rule.',
        ],
      },
      {
        h2: 'Vitamin D testing and sun protection are separate decisions',
        paragraphs: [
          'The 2024 Endocrine Society guideline recommends against routine blood 25(OH)D screening in generally healthy adults who do not have another clinical indication. A blood test can measure 25(OH)D when medically indicated, but is not required for every person with limited sun exposure, darker skin or a self-reported low-food-frequency answer.',
          'The American Academy of Dermatology does not recommend obtaining vitamin D through unprotected UV exposure or indoor tanning. Protecting skin from UV radiation is compatible with obtaining vitamin D through diet and, when appropriate, supplements. Do not stop prescribed treatments, remove sunscreen, or seek sunburn based on this report.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does a high UV Index or longer time outdoors mean I have adequate vitamin D?',
        a: 'No. UV Index reports environmental UV hazard; the tool does not measure a person’s UV dose, vitamin D synthesis or blood 25(OH)D. There is no validated positive exposure score.',
      },
      {
        q: 'Should I avoid sunscreen for 10–15 minutes to make vitamin D?',
        a: 'No. Do not deliberately delay sunscreen for vitamin D. Unprotected UV exposure increases skin-cancer risk and has no universally safe duration that guarantees adequate vitamin D.',
      },
      {
        q: 'Can type V or VI skin be damaged by UV?',
        a: 'Yes. More pigmented skin can still sustain ultraviolet injury and develop skin cancer; skin type does not establish a safe exposure time.',
      },
      {
        q: 'Does a daily vitamin D supplement mean I meet the RDA?',
        a: 'Not necessarily. The dose, food portions and total intake are unknown. Check IU or micrograms on product labels and discuss individual needs with a qualified health professional; the 4,000-IU adult upper limit is not a recommended dose.',
      },
      {
        q: 'Do I need a vitamin D blood test because of the reported sun conditions?',
        a: 'Usually not solely for these answers. The 2024 Endocrine Society guideline recommends against routine 25(OH)D screening in generally healthy adults without specific medical indications; discuss relevant conditions or symptoms with your clinician.',
      },
    ],
    sources: [
      {
        citation: 'American Academy of Dermatology Association. Vitamin D and skin-cancer prevention; no safe unprotected UV target.',
        url: 'https://www.aad.org/media/stats-vitamin-d',
      },
      {
        citation: 'NIH Office of Dietary Supplements. Vitamin D: Fact Sheet for Health Professionals. Dietary intakes, sun exposure and tolerable upper limits.',
        url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/',
      },
      {
        citation: 'U.S. Environmental Protection Agency. UV Index Scale and protective guidance.',
        url: 'https://www.epa.gov/sunsafety/uv-index-scale-0',
      },
      {
        citation: 'Endocrine Society. Vitamin D for the Prevention of Disease, 2024 clinical practice guideline: routine screening considerations.',
        url: 'https://www.endocrine.org/clinical-practice-guidelines/vitamin-d-for-prevention-of-disease',
      },
    ],
  },

  // ============================================================
  'gut-health-score': {
    directAnswer: {
      question: 'Can a lifestyle checklist measure or diagnose gut health?',
      answer:
        'No. This nine-item self-report checklist illustrates dietary and lifestyle patterns using a site-defined 30-point scale, displayed as 0–100. It cannot measure microbial diversity, identify dysbiosis or diagnose digestive disease. Reported blood in stool, unexplained weight loss, or persistent abdominal pain or bowel changes withhold the points and prompt medical assessment.',
    },
    seoTitle: 'Gut Health Score — Self-Reported Habit Checklist',
    metaDescription:
      'Explore nine self-reported nutrition and lifestyle habits with transparent illustrative points, red-flag symptom guidance and clear microbiome-testing limits.',
    intro:
      'Review nine food and lifestyle habits and optionally explore their illustrative point totals. The score is an unvalidated site-defined self-check, not a measurement of the gut microbiome or a personal medical grade. Report a warning symptom to receive safety guidance without a habit score.',
    notice:
      'Do not use a score to dismiss blood in stool, unexplained weight loss, persistent abdominal pain, or a lasting change in bowel habits. These require clinical evaluation regardless of diet. Severe bleeding, black tarry stools, fainting or severe pain may need emergency assessment.',
    sections: [
      {
        h2: 'What the checklist actually measures',
        paragraphs: [
          'The nine selections record reported fiber-rich foods, number of plant-food types, fermented-food frequency, water intake, processed-food frequency, sleep quality, stress, physical activity and perceived bowel regularity. They are rough categories, not measured nutrient quantities or laboratory indicators. A separate tenth safety question asks about potentially serious digestive symptoms.',
          'A higher set of habits does not prove a healthier gut, more beneficial bacteria, lower disease risk or better clinical outcomes. An international 2025 consensus on microbiome testing highlights how limited clinical utility remains even for many actual stool microbiome tests. A brief lifestyle survey cannot provide microbiome species counts, lab diagnosis or a substitute for clinical evaluation.',
        ],
      },
      {
        h2: 'How the site-defined score is calculated',
        paragraphs: [
          'The original educational framework assigns 0–4 points each to fiber, plant diversity and fermented-food frequency, and 0–3 each to six other factors. The largest possible total is 3 × 4 + 6 × 3 = 30. The displayed 0–100 number is the rounded fraction: (points ÷ 30) × 100. For example, nine answers receiving one point each yield 9/30 = 30/100; all lowest selections yield 0/100 and the highest-scoring responses yield 30/30 = 100/100.',
          'These weights and cutoff bands are SITE-DEFINED for a reflection exercise; they are not validated clinical thresholds, microbiome richness measures or probabilities of health. The descriptive labels say how many listed behaviors were reported, not whether someone has “excellent” digestion. The displayed category does not establish microbiome composition or exclude disease.',
          'The 2–3 L/day and 3+ L/day water response categories receive the same maximum illustrative hydration points instead of rewarding ever-higher drinking volumes. Neither is an individualized fluid prescription; water needs depend on medical conditions, physical activity, food and climate.',
        ],
      },
      {
        h2: 'What research supports—and does not support—these habits',
        paragraphs: [
          'The National Institute of Diabetes and Digestive and Kidney Diseases describes adult fiber reference needs around 22–34 g/day depending on age and sex, and notes that fiber is best increased gradually if tolerated. Dietary fiber, diverse plants and overall healthy eating can support digestion, but they do not give a validated microbiome health percentage.',
          'The observational American Gut Project reported associations between eating more than 30 different types of plants weekly and differences in stool microbiome patterns. That threshold came from comparisons of self-selected participants; it does not prove that exactly 30 foods is necessary, sufficient, or beneficial for every person, and should not be prescribed as a diagnostic cutoff.',
          'Some fermented foods contain live microbial cultures, but NIH Office of Dietary Supplements guidance notes that not all fermented foods are proven probiotics and benefits depend on the specific organisms and context. Frequency of yogurt or kimchi alone does not show whether a person has beneficial microbes or needs a probiotic supplement.',
        ],
      },
      {
        h2: 'Why warning symptoms override all nine habits',
        paragraphs: [
          'Blood in stool, unintentional weight loss, and persistent abdominal pain or a new lasting change in bowel habits are recognized alarm features requiring medical assessment. When any is selected, the tool deliberately WITHHOLDS numerical points, colored tiers, bar charts and lifestyle recommendations. Even otherwise favorable answers cannot cancel a warning sign.',
          'Seek timely medical assessment rather than using diet changes to delay care. Severe or ongoing bleeding, black tarry stools, fainting or severe abdominal pain can require emergency care. A questionnaire is not a way to decide that these symptoms are harmless or that a condition has been excluded.',
        ],
      },
      {
        h2: 'How to use the result without overinterpreting it',
        paragraphs: [
          'With no selected alarm symptom, you can use the bar chart to reflect on your reported food and routine habits. The three suggestions correspond to the lowest point fractions within the original nine-factor rubric; they are conversation starters, not an individualized treatment plan. For example, you might gradually include more fiber-rich foods or explore activity suitable for your abilities.',
          'Avoid assuming more water always means better gut health, that regular stools must occur at a fixed frequency, or that stress alone explains persistent digestive problems. Medical conditions, medications, food tolerances and individual needs can change suitable advice. Discuss ongoing symptoms with a qualified healthcare professional or registered dietitian.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is a 100/100 result proof of a healthy gut microbiome?',
        a: 'No. It is the maximum of an arbitrary, educational self-report checklist. It does not measure microbial organisms, diversity, disease or digestive health.',
      },
      {
        q: 'Why is my score hidden when I report blood in stool or weight loss?',
        a: 'Those symptoms can indicate conditions that require clinical assessment regardless of lifestyle habits. The calculator withholds all habit points and tiers so a reassuring score cannot mask an alarm symptom.',
      },
      {
        q: 'Do I need to drink 3 liters of water a day to get a better score?',
        a: 'No. The two highest original water response categories now receive equal illustrative points, and neither volume is a personalized recommendation. Clinical needs, activity and food intake determine appropriate hydration.',
      },
      {
        q: 'Must I eat 30 different plants or fermented foods every week?',
        a: 'No. The 30-plants figure is an observational research comparison, not a clinical requirement. Fermented foods vary in live microbes and demonstrated benefits; a varied diet should fit your circumstances.',
      },
      {
        q: 'Should I order a commercial stool microbiome test to verify this score?',
        a: 'Not based on this checklist alone. Expert consensus finds that most direct-to-consumer microbiome tests still have limited established clinical utility; discuss specific symptoms and appropriate evaluation with your healthcare professional.',
      },
    ],
    sources: [
      {
        citation: 'Porcari S et al. International consensus statement on microbiome testing in clinical practice. Lancet Gastroenterol Hepatol. 2025;10:154–167.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12343204/',
      },
      {
        citation: 'NIDDK. Eating, Diet, and Nutrition for Constipation: fiber 22–34 g/day and individualized liquid needs.',
        url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/constipation/eating-diet-nutrition',
      },
      {
        citation: 'McDonald D et al. American Gut: An Open Platform for Citizen Science Microbiome Research. mSystems. 2018;3:e00031-18.',
        url: 'https://journals.asm.org/doi/10.1128/msystems.00031-18',
      },
      {
        citation: 'NIH Office of Dietary Supplements. Probiotics—Health Professional Fact Sheet: differences between fermented foods and probiotics.',
        url: 'https://ods.od.nih.gov/factsheets/Probiotics-HealthProfessional/',
      },
      {
        citation: 'World Gastroenterology Organisation. Common GI Symptoms: alarm signs including bleeding and unintentional weight loss.',
        url: 'https://wgofoundation.org/guidelines/common-gi-symptoms/common-gi-symptoms-english',
      },
    ],
  },

  // ============================================================
  'anti-inflammatory-score': {
    directAnswer: {
      question: 'Can a food-frequency score tell me how inflamed my body is?',
      answer:
        'No. This tool assigns a site-defined 0–33 point checklist to 11 reported food groups and rescales the total to 0–100. It reflects selected food-frequency choices, not measured inflammation, blood CRP or IL-6, or a diagnosis. Higher points mean closer alignment with this particular list, not proof of a biologically anti-inflammatory diet.',
    },
    seoTitle: 'Anti-Inflammatory Diet Score — Food-Pattern Checklist',
    metaDescription:
      'Explore 11 food-frequency choices and a transparent 33-point dietary checklist. Understand reverse scoring and why results cannot measure inflammation.',
    intro:
      'Answer 11 questions about food-group frequency to explore alignment with a simplified, plant-forward pattern. The numbers and category labels are an unvalidated site-defined reflection exercise, not a laboratory inflammation score, the published Dietary Inflammatory Index (DII), or a dietary treatment plan.',
    notice:
      'This checklist cannot measure inflammation, CRP, IL-6, autoimmune disease activity or an inflammatory disorder. Persistent or severe symptoms need medical assessment regardless of points. Food allergies, chronic disease, pregnancy and therapeutic diets can change the appropriate food choices.',
    sections: [
      {
        h2: 'What eleven food questions do and do not capture',
        paragraphs: [
          'The seven groups awarded more points when reported more frequently are vegetables, fruit, whole grains, fatty fish, olive oil, nuts and legumes. Four groups are reverse-coded: red or processed meat, refined-grain foods, sugar-sweetened beverages and deep-fried foods. The selections range from rarely to daily. These labels simplify many distinct foods and do not record portions, preparation, calories, food substitutions or nutritional adequacy.',
          'The 2026 American Heart Association dietary guidance emphasizes healthy dietary patterns rather than judging individual foods in isolation. Frequent consumption of a listed food is not proof of an individual anti-inflammatory effect. Conversely, a low score does not establish that a person has excessive inflammation or a disease.',
        ],
      },
      {
        h2: 'The arithmetic: 33 points converted to 100',
        paragraphs: [
          'Each of seven more-frequent groups earns 0, 1, 2 or 3 points for rarely, 1–2/week, 3–5/week or daily. Each of four reverse-coded groups earns 3, 2, 1 or 0 points for those same four frequency choices. Seven × 3 = 21 and four × 3 = 12, giving a maximum of 33 points. Displayed score = round(total points ÷ 33 × 100). All 11 groups carry the same maximum of three points, not clinically derived biomarker weights.',
          'For the site’s default selections, the seven more-frequent groups contribute 11 points and the four reverse-coded groups contribute 8. This totals 19/33, displayed as 58/100. All 11 least-aligned responses produce 0/33 (0/100); all most-aligned responses produce 33/33 (100/100). The descriptive bands are site-defined and have no established diagnostic thresholds.',
          'Someone selecting rarely for all 11 groups would get 12/33 (36/100) because the four reverse-coded groups each earn three points. Someone selecting daily for every group would get 21/33 (64/100) because all four reverse-coded groups earn zero. This is a property of a checklist, not evidence that either person has the corresponding blood inflammation level.',
        ],
      },
      {
        h2: 'Not the published Dietary Inflammatory Index',
        paragraphs: [
          'The research Dietary Inflammatory Index (DII) was developed using evidence on multiple inflammatory markers and 45 dietary parameters, with population-based standardization of reported intake. This website’s 11 equal-weight ordinal questions do not contain the DII data, its reference population or its algorithm. Its 0–100 display must not be compared to published DII values or used as a validated inflammatory-potential measurement.',
          'Clinical biomarkers such as CRP require a blood test. Even CRP is nonspecific: its value may reflect inflammation without identifying the cause or location. A food-frequency survey cannot estimate CRP, IL-6, medication effectiveness, disease flare activity or clinical risk.',
        ],
      },
      {
        h2: 'What the current evidence says about dietary patterns',
        paragraphs: [
          'A 2025 umbrella review of systematic reviews and meta-analyses found associations between Mediterranean-style dietary patterns and several inflammation biomarkers, although certainty varied across outcomes and populations. A 2026 meta-analysis of randomized trials found improvements in some markers, including hs-CRP and IL-6, while other measured outcomes, such as total CRP, did not show significant differences. These research findings do not validate this website’s 33-point scoring rule.',
          'The American Heart Association recommends vegetables and fruit, foods made mostly with whole grains, healthy protein sources, unsaturated fats in place of saturated fats, less added sugar and attention to the overall dietary pattern. The scoring categories are a conversation starter about those choices, not a replacement for individualized nutrition counseling.',
        ],
      },
      {
        h2: 'Interpreting suggestions with medical and dietary context',
        paragraphs: [
          'The colored bars show the original points per group. The tool suggests possible swaps for groups receiving zero or one point, but it cannot know if those swaps are appropriate for allergies, food intolerance, kidney disease, eating disorders or a prescribed therapeutic diet. People who avoid fish or nuts can build balanced eating patterns through other foods; no single food group guarantees reduced inflammation.',
          'Do not stop prescribed anti-inflammatory medicines or use a high result to dismiss fever, persistent pain, unexplained weight loss or other concerning symptoms. A clinician can decide whether further evaluation or laboratory testing is appropriate. Dietary changes are best considered in the context of overall health, access, cultural preferences and sustainable habits.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does a score of 100 mean my CRP or inflammation is low?',
        a: 'No. It means the responses earned 33 of 33 points in an unvalidated food-frequency checklist. Only suitable clinical assessment and tests can help evaluate inflammation; this number does not estimate CRP or IL-6.',
      },
      {
        q: 'Are all fried foods or red meats automatically inflammatory?',
        a: 'No. The original categories are simplified frequency markers, not judgments about individual food molecules or a diagnosis. Portions, cooking methods, replacements and the rest of the diet matter.',
      },
      {
        q: 'Is this the Dietary Inflammatory Index (DII)?',
        a: 'No. The published DII evaluates many dietary parameters using a separate evidence-based standardized algorithm. This site uses 11 equal-weight frequency questions and its own 0–100 display, so DII comparisons would be invalid.',
      },
      {
        q: 'Why does daily intake score opposite ways for different foods?',
        a: 'Seven groups receive more points as reported frequency increases. Four groups receive more points as frequency decreases. The total is seven groups × 3 plus four groups × 3, or 33 maximum points.',
      },
      {
        q: 'Can I use this score to treat an inflammatory condition?',
        a: 'No. It is not a diagnosis, marker of treatment response or medical nutrition prescription. Discuss persistent symptoms and any prescribed dietary restrictions with your healthcare team.',
      },
    ],
    sources: [
      {
        citation: 'American Heart Association. 2026 Dietary Guidance to Improve Cardiovascular Health. Scientific statement: emphasis on dietary patterns, vegetables, whole grains, unsaturated fats and added sugars.',
        url: 'https://professional.heart.org/en/science-news/2026-dietary-guidance-to-improve-cardiovascular-health/top-things-to-know',
      },
      {
        citation: 'Shivappa N, et al. Designing and developing a literature-derived, population-based dietary inflammatory index. Public Health Nutr. 2014;17:1689–1696.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3925198/',
      },
      {
        citation: 'Dietary Patterns Associated With Anti-inflammatory Effects: An Umbrella Review of Systematic Reviews and Meta-analyses. Nutr Rev. 2025.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40657695/',
      },
      {
        citation: 'Mediterranean Diet Reduces Inflammation in Adults: systematic review and meta-analysis of randomized controlled trials. Nutr Rev. 2026.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/41211687/',
      },
      {
        citation: 'National Library of Medicine, MedlinePlus. C-Reactive Protein (CRP) Test: blood measurement and limits of interpretation.',
        url: 'https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/',
      },
    ],
  },

  // ============================================================
  'food-symptom-diary': {
    directAnswer: {
      question: 'Can a food and symptom diary diagnose an allergy or intolerance?',
      answer:
        'No. It records user-reported local times, meals, and symptoms so you can discuss a timeline with a clinician. A food documented before a symptom does not prove that it caused the symptom. Severe allergy signs require emergency action, not repeated diary entries or unsupervised food challenges.',
    },
    seoTitle: 'Food & Symptom Diary — Private Browser Timeline',
    metaDescription:
      'Record food, symptom timing and severity in a browser-local diary. Review limited timing observations, print a clinician timeline and know allergy emergency signs.',
    intro:
      'Record meals, symptoms and their local times in this browser. Review the event timeline and print or save a copy for a clinician. A six-hour window in the display is an illustrative timing rule, not a diagnostic allergy test. The diary does not identify foods that cause symptoms.',
    notice:
      'Possible anaphylaxis is a medical emergency. Breathing difficulty, throat tightness, tongue swelling, fainting or symptoms across body systems after a possible allergen require immediate action: use prescribed epinephrine according to an emergency plan and call local emergency services. Do not wait to log symptoms or attempt a food challenge yourself.',
    sections: [
      {
        h2: 'What to record, and how to interpret the timestamps',
        paragraphs: [
          'Create a food-only entry at the time of a meal, or a symptom-only entry when a symptom appears. You can also record both in one entry, but that does not establish which came first. Include food details, portions if known, symptom severity and optional context such as stress, exercise, medications or sleep. The form records local wall-clock date and time and rejects impossible or future times.',
          'The previous diary default used UTC to fill a local datetime field. New entries now use local time correctly. Older timestamps remain as originally entered; because no timezone offset was saved with them, the software cannot reliably repair or reinterpret a historic offset, especially after travel or daylight-saving changes. Check older entries before giving the printed log to a clinician.',
        ],
      },
      {
        h2: 'What the six-hour observations actually count',
        paragraphs: [
          'This site uses an illustrative six-hour lookback for display. A suggestion appears only when the same nonemergency symptom is recorded at two different later timestamps, each following a separately timestamped food entry. A meal and symptom in the same entry or at exactly the same time do not prove order. Duplicate foods or multiple meals cannot inflate one symptom event into several events.',
          'The six-hour window is NOT a validated threshold for allergy, food sensitivity, intolerance, food poisoning or another diagnosis. Some conditions develop sooner and others later. Confounding factors include medication, sleep, stress, food quantity, exercise and symptoms that occur without eating. Do not treat a repeated temporal observation as an allergy confirmation, an indication for drastic dietary restriction, or permission to reintroduce a suspected dangerous allergen.',
        ],
      },
      {
        h2: 'Recognize emergencies rather than relying on a pattern',
        paragraphs: [
          'Food-induced anaphylaxis can begin within minutes and worsen quickly. Difficulty breathing or swallowing, throat tightness, significant tongue swelling, fainting or symptoms involving several body systems can be dangerous. The diary flags reported warning symptoms and does not include them in routine food-pattern suggestions. If symptoms are occurring now, follow your emergency action plan, use prescribed epinephrine promptly when indicated, and call emergency services.',
          'A warning sign in an older saved entry is not automatically an emergency in the present, but deserves appropriate medical follow-up. Do not depend on antihistamines alone to manage anaphylaxis, and do not delay treatment while saving, printing or interpreting diary entries.',
        ],
      },
      {
        h2: 'Local browser storage and what “private” does not mean',
        paragraphs: [
          'The diary itself saves entries in localStorage under this site origin; it does not intentionally POST diary entries to a backend or create an account. Entries persist between visits in the same browser profile. They are NOT encrypted by this diary, synced between devices or backed up. Other scripts running under the same website origin and people using the same browser profile may access them. A browser extension, device backup or other browser behavior may introduce additional access; avoid storing sensitive notes on shared devices.',
          'If browser storage is disabled or full, a warning identifies entries that may exist only in the current tab. If previously stored data are malformed, the diary does not silently replace them with an empty list; it warns and requests an explicit decision before clearing. Another tab changing the same diary also suspends writes to avoid overwriting its edits. Clearing browser site data may delete entries, and clearing the diary is irreversible.',
        ],
      },
      {
        h2: 'Printing and discussing the diary with a clinician',
        paragraphs: [
          'Use Print timeline or your browser’s PDF print option to review the recorded entries in chronological order. A long log may require multiple pages, not a guaranteed single-page report. Printed pages and saved PDF files are separate sensitive copies that the browser and operating system handle; consider where they are stored and who receives them. Warning signs remain visible in the print view.',
          'Medical history and appropriate testing—not a diary alone—are required to evaluate suspected allergy. A clinician may use the history to decide if specialist assessment is appropriate. Do not initiate unsupervised elimination and reintroduction of potentially dangerous foods; an oral food challenge, if needed, should be supervised by an appropriately equipped healthcare team.',
        ],
      },
    ],
    faq: [
      {
        q: 'If a food appears before a symptom twice, is it the cause?',
        a: 'No. The tool counts distinct symptom timestamps within an illustrative six-hour period after a separate food entry. This is only a temporal co-occurrence and cannot confirm causation or allergy.',
      },
      {
        q: 'What if a severe allergic reaction is happening now?',
        a: 'Do not use this diary to assess an ongoing emergency. Use prescribed epinephrine per your emergency action plan when indicated and call local emergency services immediately for breathing problems, throat swelling, fainting or other anaphylaxis signs.',
      },
      {
        q: 'Why might an older entry show a different hour than expected?',
        a: 'Earlier versions used a UTC clock string in a local-time form. Old values were not silently rewritten because the original timezone offset was never stored. Verify legacy times manually before interpreting the timeline.',
      },
      {
        q: 'Are my health notes encrypted, uploaded or backed up?',
        a: 'The diary stores plain application text in localStorage for this site origin. It does not deliberately upload diary records or back them up. Other same-origin scripts and people sharing a browser profile may access stored data; printing or saving PDFs creates separate copies.',
      },
      {
        q: 'Will Print timeline produce exactly one page?',
        a: 'No. It opens your browser’s print workflow, which may require multiple pages depending on the number of entries and printer settings. Review the preview and protect any saved or printed health information.',
      },
    ],
    sources: [
      {
        citation: 'U.S. Food and Drug Administration. Food Allergies: symptoms, anaphylaxis and evaluation.',
        url: 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies',
      },
      {
        citation: 'American Academy of Allergy, Asthma & Immunology. Anaphylaxis: urgent recognition, epinephrine and emergency care.',
        url: 'https://www.aaaai.org/tools-for-the-public/conditions-library/allergies/anaphylaxis',
      },
      {
        citation: 'NIAID-Sponsored Expert Panel. Guidelines for Diagnosis and Management of Food Allergy: history alone cannot establish diagnosis.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4241964/',
      },
      {
        citation: 'NHS. IBS diet and lifestyle: diary of foods and symptoms for discussion, not proof of disease cause.',
        url: 'https://www.nhs.uk/conditions/irritable-bowel-syndrome-ibs/diet-lifestyle-and-medicines/',
      },
      {
        citation: 'MDN Web Docs. Web Storage API: same-origin localStorage and persistence between sessions.',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API',
      },
    ],
  },

  // ============================================================
  'recipe-nutrition-analyzer': {
    directAnswer: {
      question: 'Can I calculate reliable nutrition from a written recipe?',
      answer:
        'You can obtain an approximate food-based estimate, not a laboratory measurement. The server parses ingredient text, makes approximate weight conversions and searches USDA FoodData Central. Available nutrient amounts for matched foods are divided by the number of planned servings. Unmatched foods are excluded, and nutrients missing for any matched food must show as unavailable—not zero.',
    },
    seoTitle: 'Recipe Nutrition Analyzer — USDA Food Estimates & Limits',
    metaDescription:
      'Estimate matched-ingredient recipe nutrition with transparent portions, missing-value warnings, USDA food matches and important privacy and medical limitations.',
    intro:
      'Enter a recipe, quantities and a whole-number serving count to view estimated nutrition from USDA-matched ingredients. The tool is not a laboratory analysis, verified product label, allergy test or medical nutrition prescription. Review unmatched ingredients and approximated gram conversions carefully.',
    notice:
      'Do not enter personal or medical details. Recipe text is sent to the website server and may be sent to a third-party AI parser; ingredient names are looked up through USDA FoodData Central. Missing data, ambiguous units and food matches can change results substantially. Do not use estimates to dose insulin or assess allergen safety.',
    sections: [
      {
        h2: 'How the recipe analyzer works',
        paragraphs: [
          'Your text and chosen serving count are sent to the Astro server, which forwards the request to the configured Payload CMS. CMS code uses a configured third-party AI service for ingredient segmentation and household-unit-to-gram estimates, with a simpler regular-expression fallback when parsing fails. It then searches USDA FoodData Central for possible food matches. Nutrition numbers are retrieved from food data, rather than being generated by the AI model.',
          'The CMS first searches generic SR Legacy and Foundation data, then can fall back to Branded foods if generic results are missing. Matching is approximate: a similar description is not guaranteed to be the same ingredient, brand, preparation method or portion. The response currently supplies a matched food description but not the USDA FDC ID or data type, so an individual food selection is not independently verifiable from the web tool response. Consult the original food source when precise identification matters.',
        ],
      },
      {
        h2: 'Ingredient quantities, cooking state and conversion assumptions',
        paragraphs: [
          'Specify the quantity and unit for each ingredient, preferably by weighed grams, and say whether the item was raw or cooked. Household measures such as a cup of rice, a tablespoon of oil and a whole egg are converted to assumed gram weights. These assumptions differ by density, size, preparation and packing; a cup of dry rice is not interchangeable with a cup of cooked rice. The fallback text parser accepts simple written amounts and does not support every fraction, unit or free-form recipe reliably.',
          'A “converted” badge means the amount in grams came from an estimate, not from an actual kitchen scale. Check the original ingredient text against the matched food and gram weight. Unsupported amounts or unrecognized foods should appear in the excluded-items list rather than be assigned invented nutrient values.',
        ],
      },
      {
        h2: 'How whole-recipe and per-serving values are calculated',
        paragraphs: [
          'The underlying nutrient lookup reports values per 100 g of the matched food. For each nutrient with known data, the approximate ingredient contribution is nutrient per 100 g × ingredient grams ÷ 100. Ingredient contributions are summed, then divided by the whole-number serving count (1–100). For example, a completely matched dish with 800 estimated kcal divided into four equal planned portions would contribute about 200 kcal per portion. This does not account for unequal portions or moisture or fat lost during cooking.',
          'A missing nutrient value in any matched ingredient is not zero. Earlier backend logic initialized totals at zero and skipped unknown nutrients, potentially making an incomplete nutrient appear as a valid zero or understated value. The frontend now masks that nutrient with a dash, checks returned subtotals against the ingredient results within rounding tolerance, and refuses malformed or inconsistent totals. When foods are unmatched, the visible values are matched-food contributions only, NOT full-recipe nutrition.',
          'The optional macro chart uses approximate 4 kcal/g for protein, 4 kcal/g for total carbohydrate and 9 kcal/g for fat to show relative macro-derived energy, not proportions by gram weight. These calculated shares are not identical to measured energy: fiber, alcohol, specific Atwater factors and food data may differ. The chart is omitted when required macro data are unavailable.',
        ],
      },
      {
        h2: 'USDA data types and missing-value limitations',
        paragraphs: [
          'USDA FoodData Central includes Foundation Foods, SR Legacy, FNDDS and Branded Foods. Foundation Foods emphasizes analytically measured samples and variability; SR Legacy is the final historical reference release; Branded entries are principally manufacturer-supplied label data that can reflect labeling rounding. FoodData Central does not promise each record has all nutrients or that a search name identifies a particular recipe ingredient without ambiguity.',
          'USDA documentation explains that absent nutrient values must not be interpreted as zero. Some Foundation Foods energy values use nutrient IDs 2047 or 2048 instead of 1008. The existing CMS code searches 1008 for calories and does not return a stable FDC ID with each ingredient. A dash, incomplete result or unverified match therefore requires more specific food data rather than a fabricated substitute value. Nutrition output should not be used as a substitute for an actual product label or laboratory measurement.',
        ],
      },
      {
        h2: 'Privacy, errors and responsible use',
        paragraphs: [
          'Unlike the browser-local Food & Symptom Diary, this analyzer sends recipe text over the network. The Astro proxy forwards only ingredient text and serving count to the CMS. The CMS may forward the recipe to a configured third-party AI parsing service, and forwards ingredient search names to USDA. No claim is made that third-party services immediately delete or never retain submitted text. Avoid including names, personal health data or proprietary recipes.',
          'The form requires 5–5,000 characters and a whole number of 1–100 servings. A nonresponsive parser, missing provider configuration, invalid returned nutrient data or unmapped ingredient can prevent a complete result. Do not interpret a failed analysis as zero calories. For food allergies, diabetes, kidney disease, medical diets, or medication-dependent decisions, use verified labels and advice from a qualified clinician or registered dietitian.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does the AI invent calorie or protein numbers?',
        a: 'The CMS code uses the AI parser for ingredient names and weight conversions; nutrition values are looked up through USDA FoodData Central. AI-derived quantities and database matches can still be wrong, and the result cannot independently identify an FDC record without its ID.',
      },
      {
        q: 'Does a dash mean there are zero grams of a nutrient?',
        a: 'No. A dash means the value is not available or reliable for every matched ingredient. The application must not replace missing nutrient data with zero. Unmatched items are omitted from displayed matched-food subtotals.',
      },
      {
        q: 'Why is the estimated total different from my food package label?',
        a: 'Brand formulations, raw versus cooked state, serving size, label rounding and volume-to-gram assumptions can differ. Branded FoodData Central data may also originate from manufacturer labels. Verify quantities and use the product label for decisions requiring precision.',
      },
      {
        q: 'Are my recipe details kept entirely in my browser?',
        a: 'No. Analysis requires sending text to the website server and CMS, potentially to an external AI parser, with food search terms sent to USDA. Do not provide personally identifying or confidential information. We do not claim independent knowledge of third-party retention policies.',
      },
      {
        q: 'Can I use this to calculate insulin doses or confirm a food is allergen-free?',
        a: 'No. Some foods or nutrients may be unrecognized, and total carbohydrates or ingredients may be incomplete. For insulin dosing, prescribed nutrient restrictions or serious allergy concerns, use clinician-recommended methods and verified ingredient labels.',
      },
    ],
    sources: [
      {
        citation: 'U.S. Department of Agriculture, Agricultural Research Service. FoodData Central API Guide: search, food details and API key responsibility.',
        url: 'https://fdc.nal.usda.gov/api-guide/',
      },
      {
        citation: 'USDA FoodData Central. Data Type Documentation: Foundation, Branded, SR Legacy and FNDDS sources.',
        url: 'https://fdc.nal.usda.gov/data-documentation/',
      },
      {
        citation: 'USDA FoodData Central. Foundation Foods Documentation: energy nutrient IDs and composition methods.',
        url: 'https://fdc.nal.usda.gov/Foundation_Foods_Documentation/',
      },
      {
        citation: 'USDA FoodData Central. Global Branded Foods Documentation: missing versus zero values and labeling rounding.',
        url: 'https://fdc.nal.usda.gov/GBFPD_Documentation/',
      },
    ],
  },
};
