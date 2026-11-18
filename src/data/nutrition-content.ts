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
    seoTitle: 'Water Intake Calculator (Liters & oz)',
    metaDescription:
      'Calculate how much water to drink each day from your body weight and activity. Get your target in liters and fluid ounces. Free, no signup.',
    intro:
      'How much water you need depends on your size and how active you are. Enter your weight and activity level to get a daily target in both liters and fluid ounces.',
    sections: [
      {
        h2: 'How your water target is calculated',
        paragraphs: [
          'This tool uses a widely used clinical guide of about 35 ml of fluid per kilogram of body weight as a baseline, then adds an allowance for activity — exercise increases losses through sweat and breathing, so more active people need more.',
          'For example, a 70 kg person has a baseline of roughly 2.45 litres, rising with training. The result is shown in litres and fluid ounces so it works wherever you live. Remember this is total fluid: drinks of all kinds count, and food (especially fruit and vegetables) provides around 20% of it.',
        ],
      },
      {
        h2: 'Signs you are well hydrated',
        paragraphs: [
          'The simplest check is the colour of your urine: pale straw means you are well hydrated, while dark yellow signals you need more fluid. Thirst, headaches, tiredness and poor concentration can all be early signs of mild dehydration.',
          'There is no need to force large amounts at once. Sipping steadily through the day is more effective, and drinking to thirst plus the guidance above keeps most healthy adults in good balance.',
        ],
      },
      {
        h2: 'When you need more — or less',
        paragraphs: [
          'Increase your intake in hot or humid weather, at altitude, during illness with fever, and during pregnancy or breastfeeding. Endurance athletes lose significant fluid and electrolytes in sweat and should plan their drinking around training.',
          'A small number of people — for example those with certain heart or kidney conditions — need to limit fluids, and should follow their doctor’s advice rather than a general formula. Drinking extreme amounts very quickly can dilute blood sodium dangerously, so aim for steady, sensible hydration.',
        ],
      },
    ],
    faq: [
      {
        q: 'How many liters of water should I drink a day?',
        a: 'A common guide is about 35 ml per kg of body weight, plus extra for activity — often 2 to 3 litres a day for adults. This calculator personalises that to your weight and activity level.',
      },
      {
        q: 'Do other drinks and food count?',
        a: 'Yes. Water, tea, coffee, milk and other drinks all contribute, and food provides roughly 20% of your daily fluid. The target shown is your total fluid, not just plain water.',
      },
      {
        q: 'Is the "8 glasses a day" rule correct?',
        a: 'It is a rough guide that suits many people, but actual needs vary with body size, activity, climate and health. Calculating from your weight and activity gives a more personal estimate.',
      },
    ],
    sources: [
      {
        citation:
          'Institute of Medicine (National Academies). "Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate." Washington, DC: National Academies Press; 2005.',
        url: pubmed('Dietary Reference Intakes for Water Potassium Sodium Chloride Sulfate'),
      },
      {
        citation:
          'EFSA Panel on Dietetic Products, Nutrition, and Allergies. "Scientific Opinion on Dietary Reference Values for water." EFSA Journal. 2010;8(3):1459.',
      },
    ],
  },

  // ============================================================
  'calorie-deficit-calculator': {
    seoTitle: 'Calorie Deficit Calculator (Lose Weight)',
    metaDescription:
      'Work out the daily calorie deficit to lose a set amount of weight by your target date, using the 3,500-kcal rule — with a built-in safety check.',
    intro:
      'A calorie deficit means eating fewer calories than you burn. Enter how much weight you want to lose and your timeframe to see the daily deficit you would need — and whether it is safe.',
    sections: [
      {
        h2: 'How the deficit is calculated',
        paragraphs: [
          'The calculation uses the classic rule that about 3,500 calories equals one pound (roughly 7,700 calories per kilogram) of body fat. Your total deficit is the weight you want to lose converted to calories; dividing that by the number of days in your timeframe gives the deficit you need each day.',
          'For example, to lose 10 lb (about 4.5 kg) in 10 weeks: 10 × 3,500 = 35,000 calories ÷ 70 days = a 500-calorie daily deficit. Subtracting that from your maintenance calories gives the daily intake to aim for, which this tool shows alongside the deficit.',
        ],
      },
      {
        h2: 'Keeping it safe and sustainable',
        paragraphs: [
          'A healthy rate of loss is generally 0.5–1 kg (1–2 lb) per week, which usually means a deficit of 500–1,000 calories a day. Larger deficits are harder to stick to, tend to cost you muscle as well as fat, and often backfire with rebound eating.',
          'This calculator warns you if your plan needs a very large daily deficit, or would push your intake below the safe minimum of about 1,200 calories for women or 1,500 for men. If you see that warning, the simplest fix is to extend your timeframe.',
        ],
      },
      {
        h2: 'Why the scale is not the whole story',
        paragraphs: [
          'The 3,500-calorie rule is a useful planning tool, but the body is not a simple machine. As you lose weight your metabolism adapts and your maintenance calories fall, so weight loss naturally slows over time — meaning real results often lag the straight-line prediction.',
          'Treat the number as a starting point. Combine your deficit with high protein and resistance training to protect muscle, weigh yourself under consistent conditions, and adjust your intake based on the trend over several weeks rather than day-to-day changes.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a safe calorie deficit?',
        a: 'A deficit of 500–1,000 calories a day supports losing about 0.5–1 kg (1–2 lb) per week, which is widely considered safe and sustainable for most adults.',
      },
      {
        q: 'Is the 3,500 calories per pound rule accurate?',
        a: 'It is a reasonable planning estimate but not exact. Metabolism adapts as you lose weight, so actual loss usually slows over time and lags the simple prediction.',
      },
      {
        q: 'What if my deficit comes out too high?',
        a: 'A very large required deficit means your timeframe is too short. Extend it so the daily deficit stays in the safe 500–1,000 calorie range and keeps your intake above the recommended minimum.',
      },
    ],
    sources: [
      {
        citation:
          'Wishnofsky M. "Caloric equivalents of gained or lost weight." Am J Clin Nutr. 1958;6(5):542–546.',
        url: pubmed('Caloric equivalents of gained or lost weight Wishnofsky'),
      },
      {
        citation:
          'Hall KD, Sacks G, Chandramohan D, et al. "Quantification of the effect of energy imbalance on bodyweight." Lancet. 2011;378(9793):826–837.',
        url: pubmed('Quantification of the effect of energy imbalance on bodyweight Hall'),
      },
    ],
  },

  // ============================================================
  'keto-calculator': {
    seoTitle: 'Keto Calculator – Macros & Net Carbs',
    metaDescription:
      'Calculate your ketogenic macros — about 70% fat, 25% protein, 5% carbs — plus your daily net carb cap. Free keto calculator, metric or imperial.',
    intro:
      'The ketogenic diet is very low in carbohydrate and high in fat. Enter your details to get your daily calories split into keto macros, along with your net carb limit.',
    sections: [
      {
        h2: 'How keto macros are split',
        paragraphs: [
          'A standard ketogenic diet draws roughly 70% of calories from fat, 25% from protein, and just 5% from carbohydrate. This calculator finds your daily calories (TDEE) using the Mifflin-St Jeor equation and an activity factor, then converts each share into grams — remembering that fat provides 9 calories per gram while protein and carbs provide 4.',
          'The very high fat and very low carb intake is what shifts your body into ketosis, a state in which it burns fat for fuel and produces molecules called ketones in place of glucose.',
        ],
      },
      {
        h2: 'Net carbs and your daily cap',
        paragraphs: [
          'Keto plans count "net carbs" — total carbohydrate minus fibre (and sugar alcohols), since fibre is not digested for energy and has little effect on blood sugar. Most people need to keep net carbs under about 20–50 grams a day to reach and stay in ketosis; 20 g is a strict target, while up to 50 g works for more active people.',
          'Your 5% carbohydrate allowance above is your starting point. Treat 20–50 g of net carbs as your daily ceiling, and prioritise carbs from non-starchy vegetables rather than grains, sugar or fruit.',
        ],
      },
      {
        h2: 'Getting into ketosis safely',
        paragraphs: [
          'It typically takes a few days to a week of very low carbohydrate intake to enter ketosis. During the transition some people experience the temporary "keto flu" — fatigue, headache and irritability — which is eased by drinking enough water and replacing electrolytes such as sodium, potassium and magnesium.',
          'Keto suits some people well but is not for everyone. If you are pregnant, have type 1 diabetes, take medication for blood sugar or blood pressure, or have liver, kidney or pancreatic conditions, speak to your doctor before starting, as your needs and medication may need adjusting.',
        ],
      },
    ],
    faq: [
      {
        q: 'What are the macros for a keto diet?',
        a: 'A standard ketogenic diet is about 70% of calories from fat, 25% from protein, and 5% from carbohydrate. This calculator converts those percentages into daily gram targets for you.',
      },
      {
        q: 'How many carbs can I eat on keto?',
        a: 'Most people stay in ketosis by keeping net carbs (total carbs minus fibre) under 20–50 grams a day. Twenty grams is a strict limit; more active people can sometimes tolerate up to 50.',
      },
      {
        q: 'What are net carbs?',
        a: 'Net carbs are total carbohydrate minus fibre and sugar alcohols. Because fibre is not absorbed for energy, keto diets count only the carbs that actually affect blood sugar.',
      },
    ],
    sources: [
      MIFFLIN,
      {
        citation:
          'Masood W, Annamaraju P, Uppaluri KR. "Ketogenic Diet." In: StatPearls. Treasure Island (FL): StatPearls Publishing; 2023.',
        url: pubmed('Ketogenic Diet StatPearls Masood'),
      },
    ],
  },

  // ============================================================
  'vitamin-d-sun-calculator': {
    seoTitle: 'Vitamin D & Sun Exposure Calculator',
    metaDescription:
      'Estimate your vitamin D synthesis potential from sun, skin type, and diet. Educational guide with safe-sun reminders. This does NOT measure blood vitamin D — ask for a test if concerned.',
    intro:
      'See how your sun exposure, skin type, and diet combine to affect your vitamin D potential. This is an educational estimator — it does not measure your actual blood level.',
    notice:
      'Educational estimator only — this does NOT measure your blood vitamin D. Only a 25(OH)D blood test can confirm your status. Never sunburn to "get vitamin D." No megadose supplement advice — do not exceed 4,000 IU/day without medical supervision.',
    sections: [
      {
        h2: 'How your body makes vitamin D from sun',
        paragraphs: [
          'When UVB rays from sunlight hit your skin, they trigger a reaction that produces vitamin D. The amount depends on four things: the UV index (which changes with latitude, season, and time of day), your skin type (darker skin needs more UVB), how much skin is exposed, and how long you are out.',
          'This tool combines those factors into a qualitative synthesis likelihood — Low, Moderate, or Good. It is not a precise IU estimate, because too many variables affect real-world production to calculate accurately from a few inputs.',
        ],
      },
      {
        h2: 'Skin type matters — a lot',
        paragraphs: [
          'The Fitzpatrick scale ranges from Type I (very fair, always burns) to Type VI (dark, never burns). Melanin is nature\'s sunscreen — it absorbs UVB before it can trigger vitamin D synthesis. So someone with Type VI skin may need 3–6 times more sun exposure than someone with Type I to make the same amount of vitamin D.',
          'This is not a flaw — it means darker skin is naturally protected from UV damage. But it also means that at higher latitudes or in winter, people with darker skin are at higher risk of deficiency. A blood test is the way to know for sure.',
        ],
      },
      {
        h2: 'Dietary vitamin D',
        paragraphs: [
          'Few foods naturally contain vitamin D. The main sources are fatty fish (salmon, mackerel, sardines), cod liver oil, egg yolks, and fortified foods like milk, plant milks, and some cereals. The NIH recommended dietary allowance (RDA) is about 600 IU/day for adults under 70 and 800 IU/day for those 70+.',
          'If you get little sun (live far north, work indoors, or it is winter), diet and supplements become more important. A daily supplement of 1,000–2,000 IU is common and within safe limits — but do not take megadoses. The safe upper limit for adults is 4,000 IU/day from all sources.',
        ],
      },
      {
        h2: 'Balancing sun and skin safety',
        list: {
          intro: 'The same UVB that makes vitamin D also causes skin damage and raises cancer risk. Balance both:',
          items: [
            'Aim for short, sensible exposure — 10–30 minutes of midday sun on exposed skin (less if you burn easily, more if your skin is darker).',
            'Never sunburn. Sunburn is never "worth it" for vitamin D — the damage far outweighs any benefit.',
            'Apply SPF 30+ after your short exposure if you will be outdoors longer.',
            'In winter or at high latitudes (UV index 0–2), your skin makes almost no vitamin D — focus on diet and consider a supplement.',
            'If you are concerned about your level, ask your doctor for a 25(OH)D blood test. It is the only way to know your true status.',
          ],
        },
      },
    ],
    faq: [
      {
        q: 'Does this calculator tell me my vitamin D level?',
        a: 'No. It estimates whether your sun exposure and diet give you a low, moderate, or good chance of adequate vitamin D. Only a 25(OH)D blood test can measure your actual blood level. If you are concerned about deficiency, ask your doctor for the test.',
      },
      {
        q: 'How much sun do I need for vitamin D?',
        a: 'It depends on your skin type, latitude, and the UV index. As a general guide, 10–30 minutes of midday sun on exposed arms and face (without sunscreen) is enough for most people with Type I–III skin in summer. Darker skin types need more; in winter or far north, everyone makes less.',
      },
      {
        q: 'Should I take a vitamin D supplement?',
        a: 'If you get little sun, live far north, have darker skin, or are older, a daily supplement of 1,000–2,000 IU is reasonable and within safe limits. Do not exceed 4,000 IU/day from all sources without medical supervision. Talk to your doctor if unsure.',
      },
      {
        q: 'Does sunscreen block vitamin D production?',
        a: 'Yes — sunscreen reduces UVB absorption, which lowers vitamin D synthesis. A common compromise is a short period of unprotected exposure (10–15 minutes) before applying sunscreen. Never extend unprotected exposure to the point of burning.',
      },
    ],
    sources: [
      {
        citation: 'National Institutes of Health, Office of Dietary Supplements. "Vitamin D Fact Sheet for Consumers and Health Professionals." Updated 2022.',
        url: 'https://ods.od.nih.gov/factsheets/VitaminD-Consumer/',
      },
      {
        citation: 'World Health Organization. "UV Radiation and Health." Intersun Programme.',
        url: 'https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation',
      },
      {
        citation: 'U.S. Environmental Protection Agency. "UV Index." SunWise Program.',
        url: 'https://www.epa.gov/sunsafety/uv-index-scale-0',
      },
    ],
  },

  // ============================================================
  'gut-health-score': {
    seoTitle: 'Gut Health Score — Lifestyle & Diet Self-Check',
    metaDescription:
      'Score your gut-friendly habits from fiber, plant diversity, fermented foods, sleep, stress, and more. Educational lifestyle tool — not a microbiome test or diagnosis.',
    intro:
      'Answer nine quick questions about your diet and lifestyle to get a 0–100 gut-habits score with per-factor bars and targeted improvements. This is a lifestyle self-check, not a microbiome test.',
    notice:
      'Educational lifestyle score only — NOT a diagnosis or a microbiome test. Red flags (blood in stool, unexplained weight loss, persistent pain or change in bowel habits) need a doctor, not a score.',
    sections: [
      {
        h2: 'What this score measures',
        paragraphs: [
          'Your gut is home to trillions of bacteria that influence digestion, immunity, and even mood. While a real microbiome test requires a lab, your daily habits give a strong indication of whether you are feeding and supporting a healthy gut ecosystem.',
          'This tool scores nine lifestyle factors backed by general gut-health evidence: fiber intake, plant diversity, fermented foods, hydration, processed-food intake, sleep, stress, activity, and bowel regularity. The result is a 0–100 gut-habits score — a lifestyle indicator, not a clinical measurement.',
        ],
      },
      {
        h2: 'The three most important factors',
        list: {
          intro: 'These carry the most weight in your score:',
          items: [
            'Fiber: the single most important fuel for beneficial gut bacteria. Aim for 25–35g/day from whole grains, vegetables, fruit, legumes, nuts, and seeds.',
            'Plant diversity: research shows that people who eat 30+ different plants per week have a more diverse microbiome, which is associated with better health outcomes.',
            'Fermented foods: yogurt, kefir, sauerkraut, kimchi, and kombucha add live cultures that may support gut microbial balance.',
          ],
        },
      },
      {
        h2: 'How your score is calculated',
        paragraphs: [
          'Each of the nine factors earns 0–3 points (0–4 for fiber, plant diversity, and fermented foods, which carry more weight). The maximum is 30 points, scaled to a 0–100 score. The bars show each factor individually so you can see exactly where to focus.',
          'The bands range from "Needs improvement" (0–33) through "Fair" and "Good" to "Very good" (71–85) and "Excellent" (86–100). Most people land in the middle — the goal is steady improvement, not perfection.',
        ],
      },
      {
        h2: 'Improving your gut health',
        paragraphs: [
          'Start with the weakest areas shown in your per-factor bars. Small, consistent changes compound — adding a daily serving of vegetables, swapping a processed snack for fruit and nuts, or eating yogurt a few times a week can move the needle within a few weeks.',
          'The gut microbiome responds to dietary changes surprisingly fast — some studies show shifts within 24–48 hours of changing what you eat. The key is consistency over weeks and months, not a single perfect day.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is this a microbiome test?',
        a: 'No. This is a lifestyle and diet self-check based on habits known to support gut health. A real microbiome test analyses a stool sample in a lab. If you want to know your actual gut bacteria composition, talk to your doctor or a registered dietitian.',
      },
      {
        q: 'What are the red flags I should not ignore?',
        a: 'Blood in your stool, unexplained weight loss, persistent abdominal pain, or a lasting change in your bowel habits all need prompt medical evaluation. Do not try to "score" these away with lifestyle changes — see a doctor.',
      },
      {
        q: 'How much fiber should I eat for gut health?',
        a: 'Most adults should aim for 25–35 grams of fiber per day. The average person eats far less than that. Increase gradually over a week or two and drink plenty of water — a sudden fiber jump can cause bloating.',
      },
      {
        q: 'Why does plant diversity matter?',
        a: 'Different plants feed different beneficial bacteria. Research shows that people who eat 30+ different plant types per week have a more diverse microbiome, which is generally associated with better digestive and overall health.',
      },
      {
        q: 'Do I need probiotic supplements?',
        a: 'Not necessarily. Fermented foods like yogurt, kefir, sauerkraut, and kimchi provide live cultures naturally. If you are considering a probiotic supplement for a specific issue, talk to your doctor or dietitian — quality and strain specificity matter.',
      },
    ],
    sources: [
      {
        citation: 'U.S. Departments of Agriculture and Health and Human Services. "Dietary Guidelines for Americans, 2020–2025." 9th ed.',
        url: 'https://www.dietaryguidelines.gov/',
      },
      {
        citation: 'National Institutes of Health, Office of Dietary Supplements. "Dietary Fiber." Consumer & Health Professional Fact Sheet.',
        url: 'https://ods.od.nih.gov/factsheets/Fiber-Consumer/',
      },
      {
        citation: 'McDonald D, Hyde E, Debelius JW, et al. "American Gut: an open platform for citizen science microbiome research." mSystems. 2018;3(3):e00031-18.',
        url: pubmed('American Gut open platform citizen science microbiome research McDonald'),
      },
    ],
  },

  // ============================================================
  'anti-inflammatory-score': {
    seoTitle: 'Anti-Inflammatory Diet Score — Food Frequency',
    metaDescription:
      'Score your diet for anti-inflammatory foods (vegetables, fruit, fatty fish, olive oil, nuts) vs pro-inflammatory foods (processed meat, sugar, fried food). Free, educational.',
    intro:
      'Answer 11 quick questions about how often you eat key anti-inflammatory and pro-inflammatory foods. Get a 0–100 score with per-food bars and specific foods to add or reduce.',
    notice:
      'Educational dietary self-assessment only — not a medical diagnosis or treatment plan. If you have an inflammatory condition, talk to your doctor or a registered dietitian before making major dietary changes.',
    sections: [
      {
        h2: 'What is an anti-inflammatory diet?',
        paragraphs: [
          'Chronic low-grade inflammation is linked to heart disease, type 2 diabetes, and other conditions. While no single food causes or cures inflammation, overall dietary patterns can nudge your body toward or away from an inflammatory state.',
          'Anti-inflammatory patterns — like the Mediterranean diet — are rich in vegetables, fruit, whole grains, fatty fish, olive oil, nuts, and legumes, and low in red/processed meat, refined carbohydrates, sugary drinks, and fried foods. This tool scores how closely your eating pattern matches those principles.',
        ],
      },
      {
        h2: 'How the score works',
        paragraphs: [
          'Each of the 11 foods is scored 0–3 based on how often you eat it. Anti-inflammatory foods score higher when you eat them more often; pro-inflammatory foods score higher when you eat them less often (inverted scoring). The maximum is 33 points, scaled to a 0–100 score.',
          'The bands range from "Pro-inflammatory" (0–33) through "Moderate" to "Strongly anti-inflammatory" (86–100). The per-food bars show exactly which foods are helping and which need work.',
        ],
      },
      {
        h2: 'Foods to add vs reduce',
        paragraphs: [
          'Your result highlights specific foods to add (anti-inflammatory foods you eat rarely) and to reduce (pro-inflammatory foods you eat often). Focus on one or two swaps at a time — small, consistent changes are more sustainable than a complete diet overhaul.',
          'The highest-impact changes are usually: adding fatty fish (omega-3s), replacing refined carbs with whole grains, swapping sugary drinks for water or tea, and using extra virgin olive oil as your primary cooking fat.',
        ],
      },
      {
        h2: 'Overlap with Mediterranean and DASH',
        paragraphs: [
          'This anti-inflammatory pattern closely overlaps with the Mediterranean diet, which has the strongest evidence base of any dietary pattern for reducing inflammation and cardiovascular risk. The DASH diet (Dietary Approaches to Stop Hypertension) shares the same emphasis on vegetables, fruit, whole grains, and legumes, with an additional focus on low sodium for blood pressure.',
          'You do not need to follow a named diet to eat anti-inflammatory foods — the principles are the same. Pick the pattern that fits your life and culture.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is this the Dietary Inflammatory Index (DII)?',
        a: 'No. The DII is a licensed, proprietary tool. This calculator uses a transparent adherence score inspired by the same research on anti-inflammatory and Mediterranean dietary patterns, but it is not the DII and should not be compared directly to DII scores.',
      },
      {
        q: 'Which foods are most anti-inflammatory?',
        a: 'The strongest evidence is for fatty fish (omega-3 EPA/DHA), extra virgin olive oil (oleic acid and polyphenols), vegetables and fruit (antioxidants and fiber), and nuts. These form the core of the Mediterranean diet, which has the best evidence for reducing inflammatory markers.',
      },
      {
        q: 'Can diet reduce inflammation?',
        a: 'Yes — research consistently shows that Mediterranean-style dietary patterns are associated with lower levels of inflammatory markers like CRP and IL-6. The effect is gradual and comes from the overall pattern, not any single "superfood."',
      },
      {
        q: 'Do I need to cut out all pro-inflammatory foods?',
        a: 'No. The goal is a pattern that is mostly anti-inflammatory, not perfection. Occasional red meat, dessert, or fried food within an otherwise healthy pattern is fine. It is what you eat most of the time that matters.',
      },
    ],
    sources: [
      {
        citation: 'Estruch R, Ros E, Salas-Salvadó J, et al. "Primary prevention of cardiovascular disease with a Mediterranean diet supplemented with extra-virgin olive oil or nuts." N Engl J Med. 2018;378(25):e34.',
        url: pubmed('Primary prevention cardiovascular disease Mediterranean diet extra virgin olive oil nuts Estruch'),
      },
      {
        citation: 'Sofi F, Macchi G, Abbate R, Gensini GF, Casini A. "Mediterranean diet and health status: an updated meta-analysis and a proposal for a literature-based adherence score." Nutr Rev. 2014;72(6):392–399.',
        url: pubmed('Mediterranean diet health status updated meta-analysis literature-based adherence score Sofi'),
      },
      {
        citation: 'Galland L. "Diet and inflammation." Nutr Clin Pract. 2010;25(6):634–640.',
        url: pubmed('Diet and inflammation Galland Nutr Clin Pract'),
      },
    ],
  },

  // ============================================================
  'food-symptom-diary': {
    seoTitle: 'Food & Symptom Diary Tracker — Print for Your Doctor',
    metaDescription:
      'Free food and symptom diary tracker. Log meals, timing, and symptoms over days, then print a clean timeline to show your doctor or dietitian. Not a diagnostic test.',
    intro:
      'Log what you eat, when you eat it, and any symptoms you notice. Over several days, a clear timeline emerges that you can print and bring to your doctor or dietitian. This is a diary, not a test — it does not diagnose allergies or intolerances.',
    notice:
      'True food allergy can be life-threatening. If you experience trouble breathing, throat swelling, or feel faint after eating, call your local emergency number immediately. This diary is not a substitute for professional medical evaluation.',
    sections: [
      {
        h2: 'How to use this diary',
        paragraphs: [
          'Log each meal or symptom as it happens — or at the end of each day while memory is fresh. Include what you ate, the time, any symptoms, and how strong they were. The more consistent you are over 1–2 weeks, the more useful the timeline will be.',
          'You can also log symptoms on their own (without a food) — for example, waking up with a headache or bloating before breakfast. This helps your clinician see patterns across the full day, not just after meals.',
        ],
      },
      {
        h2: 'The pattern observations feature',
        paragraphs: [
          'After several entries, the diary highlights foods that appeared before symptoms more than once. These are observations, not conclusions. They do not mean you are allergic or intolerant to those foods.',
          'Many factors cause symptoms after eating — stress, sleep, portion size, exercise, medications, and normal digestion. Only a qualified healthcare professional can interpret patterns in the context of your full health history.',
        ],
      },
      {
        h2: 'What to share with your doctor',
        paragraphs: [
          'Click "Print timeline" to generate a clean, one-page summary of your diary. Bring it to your appointment along with any questions you have. Your doctor or dietitian can use it alongside their own assessment.',
          'If you suspect a food allergy (especially if symptoms appeared quickly after eating), ask about referral to an allergist for proper testing. Self-elimination diets can mask real problems and cause unnecessary restriction.',
        ],
      },
      {
        h2: 'Your data stays private',
        paragraphs: [
          'All entries are stored locally in your browser. Nothing is sent to a server, and clearing your browser data will erase your diary. You can also use "Clear all" to start fresh at any time.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can this diary diagnose a food allergy or intolerance?',
        a: 'No. This is a tracking tool, not a diagnostic test. It records what you eat and any symptoms you notice so you can share that information with a healthcare professional. Only a qualified doctor or allergist can diagnose food allergies or intolerances using validated tests.',
      },
      {
        q: 'What should I do if I have a severe reaction?',
        a: 'If you experience trouble breathing, throat swelling, lip or tongue swelling, widespread hives, or feel faint after eating, call your local emergency number immediately. Severe allergic reactions (anaphylaxis) can be life-threatening and require immediate emergency care.',
      },
      {
        q: 'How long should I keep the diary?',
        a: 'One to two weeks is usually enough for your doctor to see meaningful patterns. If you are working with a dietitian on an elimination and reintroduction protocol, follow their guidance on timing.',
      },
      {
        q: 'Are the pattern observations a diagnosis?',
        a: 'No. The observations simply note that a food appeared before a symptom in your log more than once. This could be coincidence, or it could be worth discussing with your doctor. It is not a statement that you are sensitive or allergic to that food.',
      },
      {
        q: 'Is my diary data sent anywhere?',
        a: 'No. All entries are stored only in your browser local storage. Nothing is uploaded to a server. If you clear your browser data or use "Clear all," your diary is permanently erased.',
      },
    ],
    sources: [
      {
        citation: 'American Academy of Allergy, Asthma & Immunology. "Food Allergies." Patient resources on food allergy symptoms, diagnosis, and management.',
        url: 'https://www.aaaai.org/conditions-treatments/allergies/food-allergy',
      },
      {
        citation: 'Tuck CJ, Biesiekierski JR, Scholten G, et al. "Food intolerances." Nutrients. 2019;11(7):1684.',
        url: pubmed('Food intolerances Tuck Biesiekierski Nutrients'),
      },
      {
        citation: 'Staudacher HM, Whelan K. "The low FODMAP diet: recent advances in understanding its mechanisms and efficacy in IBS." Gut. 2017;66(8):1517–1527.',
        url: pubmed('low FODMAP diet recent advances mechanisms efficacy IBS Staudacher'),
      },
    ],
  },

  // ============================================================
  'recipe-nutrition-analyzer': {
    directAnswer: {
      question: 'How do I find the nutrition of a recipe?',
      answer:
        'Paste the ingredient list and set your servings: AI splits the text into ingredients and converts each to grams, then every calorie and nutrient value is looked up in the USDA FoodData Central database and summed per serving. For recipes made from common, generic ingredients, estimates typically land within 10–20% of lab-analyzed values.',
    },
    seoTitle: 'Recipe Nutrition Analyzer — USDA-Powered Estimates',
    metaDescription:
      'Paste any recipe or ingredient list and get estimated nutrition per serving. AI parses ingredients, USDA FoodData Central provides the numbers. Free, no signup.',
    intro:
      'Paste a recipe or ingredient list, choose your servings, and get estimated nutrition per serving. The AI splits and converts your ingredients; all nutrient values come from the USDA FoodData Central database.',
    notice:
      'Nutrition values are estimates for general education, not medical or dietary advice. For medical nutrition therapy, consult a registered dietitian or your clinician.',
    sections: [
      {
        h2: 'How this works',
        paragraphs: [
          'This tool uses a hybrid data approach. First, an AI model reads your recipe text and splits it into individual ingredients, converting household measurements (cups, tablespoons, counts) to grams. Then each ingredient is matched to the USDA FoodData Central database, which provides the actual nutrient values. Finally, our code calculates the totals.',
          'The AI never estimates calorie or nutrient values. Its only job is parsing and unit conversion. All nutrition numbers come directly from USDA data. This means the estimates are only as good as the USDA match — generic ingredients like "chicken breast" match well, while branded or unusual items may not.',
        ],
      },
      {
        h2: 'Limitations and accuracy',
        paragraphs: [
          'These are estimates, not lab analyses. Several factors affect accuracy: the USDA database uses generic items (not specific brands), cooking and preparation methods change nutrient values, oils and marinades may not fully transfer to the finished dish, and volume-to-weight conversions are always approximate.',
          'When an ingredient cannot be matched to a USDA item, it is excluded from the totals and listed as "could not identify." When a nutrient (especially fiber or sugar) is not reported by the USDA for a given item, it shows as a dash, not zero. A dash means "not available," not "none."',
        ],
      },
      {
        h2: 'Why estimates differ from packaging',
        paragraphs: [
          'Food packaging labels come from the manufacturer and may use different serving sizes, preparation assumptions, or ingredient formulations than the USDA generic items. Both can be correct and still differ. This tool uses USDA SR Legacy and Foundation data types, which are the most reliable generic-ingredient sources available.',
          'If you need exact nutrition for a branded product, check the nutrition label on the package. This tool is best for recipes made from whole, generic ingredients.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does the AI make up the nutrition numbers?',
        a: 'No. The AI only splits your recipe into ingredients and converts units to grams. All calorie, protein, carb, fat, fiber, sugar, and sodium values come from the USDA FoodData Central database. The AI never outputs nutrient values.',
      },
      {
        q: 'Why does a nutrient show as a dash?',
        a: 'A dash means the USDA did not report that nutrient for one or more ingredients in your recipe. This is most common for fiber and sugar in certain SR Legacy items. A dash does not mean zero — it means "not available." The total for that nutrient may be understated.',
      },
      {
        q: 'How accurate are the estimates?',
        a: 'For recipes using common, generic ingredients with clear quantities, the estimates are typically within 10-20% of lab-analyzed values. Accuracy decreases with unusual ingredients, imprecise quantities ("a handful"), or complex preparation methods. The "converted" badge on an ingredient means a volume measurement was approximated to grams.',
      },
      {
        q: 'Does cooking change the nutrition values?',
        a: 'Yes. Cooking can add or remove water (changing weight), break down fiber, render fat, and concentrate or dilute nutrients. The USDA database includes both raw and cooked items — for the most accurate estimate, specify whether ingredients are raw or cooked (e.g. "1 cup cooked rice" rather than just "1 cup rice").',
      },
      {
        q: 'Can I use this for medical nutrition therapy?',
        a: 'No. This tool provides general educational estimates only. If you need precise nutrition data for a medical condition (diabetes, kidney disease, food allergies, etc.), consult a registered dietitian who can provide individualized guidance based on your specific needs.',
      },
    ],
    sources: [
      {
        citation: 'U.S. Department of Agriculture, Agricultural Research Service. "FoodData Central." (SR Legacy and Foundation data types used for generic ingredient nutrition values.)',
        url: 'https://fdc.nal.usda.gov/',
      },
      {
        citation: 'U.S. Department of Agriculture. "FoodData Central: Data Types." (Documentation on SR Legacy, Foundation, and Branded data types and their methodology.)',
        url: 'https://fdc.nal.usda.gov/docs.html',
      },
    ],
  },
};
