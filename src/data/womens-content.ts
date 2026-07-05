/** Long-form, source-cited content for each Women's Health tool page. */
import { pubmed, type Source, type ToolContent } from './content-types';

const OBGYN_NOTICE =
  'Informational only — not medical advice or a diagnosis. Every pregnancy and cycle is different, and these results are estimates. Always consult your OB-GYN or midwife.';

const ACOG_DUE: Source = {
  citation:
    'American College of Obstetricians and Gynecologists. "Methods for Estimating the Due Date." Committee Opinion No. 700. Obstet Gynecol. 2017;129(5):e150–e154.',
  url: pubmed('Methods for Estimating the Due Date Committee Opinion 700'),
};
const WILCOX: Source = {
  citation:
    'Wilcox AJ, Weinberg CR, Baird DD. "Timing of sexual intercourse in relation to ovulation." N Engl J Med. 1995;333(23):1517–1521.',
  url: pubmed('Timing of sexual intercourse in relation to ovulation Wilcox'),
};
const IOM_WEIGHT: Source = {
  citation:
    'Institute of Medicine & National Research Council. "Weight Gain During Pregnancy: Reexamining the Guidelines." Washington, DC: National Academies Press; 2009.',
  url: pubmed('Weight Gain During Pregnancy Reexamining the Guidelines Institute of Medicine'),
};

export const WOMENS_CONTENT: Record<string, ToolContent> = {
  // ============================================================
  'due-date-calculator': {
    directAnswer: {
      question: 'How is a due date calculated?',
      answer:
        'The standard estimate (Naegele’s rule) adds 280 days — 40 weeks — to the first day of your last menstrual period. From a known conception date it’s 266 days, and IVF pregnancies count from the transfer day. It’s an estimate, not a promise: delivery anywhere from 37 to 42 weeks is considered normal (ACOG).',
    },
    seoTitle: 'Pregnancy Due Date Calculator (Naegele)',
    metaDescription:
      'Estimate your due date from your last period, conception date, or IVF transfer. See your current week and trimester. Free, no signup.',
    intro:
      'Find out when your baby is likely to arrive. Choose your method — last period, conception date, or IVF embryo transfer — and see your estimated due date, current week, and trimester.',
    notice: OBGYN_NOTICE,
    sections: [
      {
        h2: 'How your due date is calculated',
        paragraphs: [
          'The classic method is Naegele’s rule: add 280 days (40 weeks) to the first day of your last menstrual period (LMP). It assumes a regular 28-day cycle with ovulation on day 14, which is why a due date is an estimate rather than a fixed appointment.',
          'If you know your conception date, the calculator adds 266 days (38 weeks) instead, since pregnancy is dated from about two weeks before conception. For IVF, it uses your transfer date and the embryo’s age — a day-5 (blastocyst) transfer counts as 19 days of gestation already, a day-3 transfer as 17 — giving a more precise date than LMP alone.',
        ],
      },
      {
        h2: 'Weeks and trimesters',
        paragraphs: [
          'Pregnancy is measured in gestational weeks counted from your LMP, and divided into three trimesters: the first runs to the end of week 13, the second from weeks 14–27, and the third from week 28 to birth. This tool shows where you are today alongside your due date.',
          'An ultrasound in the first trimester is the most accurate way to date a pregnancy and may adjust your due date. If your dating scan differs from your LMP estimate by more than about a week, your care team will usually use the scan date.',
        ],
      },
      {
        h2: 'Why the date is only an estimate',
        paragraphs: [
          'Only about 1 in 20 babies are born on their exact due date. A full-term birth can happen any time between 37 and 42 weeks, and factors such as cycle length, irregular ovulation and individual variation all affect timing.',
          'Use your due date to plan and to track milestones, but hold it loosely. Your OB-GYN or midwife will monitor your pregnancy and let you know if anything about your dating or timing needs attention.',
        ],
      },
    ],
    faq: [
      {
        q: 'How accurate is a due date calculator?',
        a: 'It gives a solid estimate, but only about 5% of babies arrive on the exact date. A first-trimester ultrasound is the most accurate way to confirm or adjust your due date.',
      },
      {
        q: 'What is Naegele’s rule?',
        a: 'Naegele’s rule estimates your due date by adding 280 days (40 weeks) to the first day of your last menstrual period, assuming a regular 28-day cycle.',
      },
      {
        q: 'How is an IVF due date different?',
        a: 'IVF dating uses the known transfer date and embryo age, so it is often more precise than LMP. A day-5 transfer already counts as 19 days of gestation.',
      },
    ],
    sources: [
      ACOG_DUE,
      {
        citation: 'American College of Obstetricians and Gynecologists. "How Your Fetus Grows During Pregnancy" — gestational age and trimester basics.',
        url: 'https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy',
      },
    ],
  },

  // ============================================================
  'pregnancy-week-calculator': {
    seoTitle: 'Pregnancy Week-by-Week Calculator',
    metaDescription:
      'Enter your last period to see your current pregnancy week, trimester, and what is developing right now. Free week-by-week pregnancy tracker.',
    intro:
      'Track your pregnancy week by week. Enter the first day of your last period to see your current gestational week, your trimester, and a short note on what’s developing now.',
    notice: OBGYN_NOTICE,
    sections: [
      {
        h2: 'How pregnancy weeks are counted',
        paragraphs: [
          'Gestational age is counted from the first day of your last menstrual period (LMP) — not from conception. That means you are considered about two weeks "pregnant" before conception actually happens, which is why a 40-week pregnancy reflects roughly 38 weeks of fetal development.',
          'This calculator works out how many weeks and days have passed since your LMP and shows the developmental milestone typical for that week, from the first heartbeat in early weeks to the rapid brain growth of the third trimester.',
        ],
      },
      {
        h2: 'The three trimesters',
        paragraphs: [
          'The first trimester (weeks 1–13) is when all the major organs form — a period of rapid, delicate development. The second trimester (weeks 14–27) is often the most comfortable, when many people first feel movement and learn the sex if they wish. The third trimester (weeks 28–40) is mainly growth and maturation, especially of the lungs and brain.',
          'Each week brings change, but development is a continuum: the notes here describe what is typical, and healthy babies vary in size and timing.',
        ],
      },
      {
        h2: 'Using the milestones',
        paragraphs: [
          'The weekly notes are a friendly guide to what’s generally happening, not a checklist your baby must match. Your routine antenatal appointments, blood tests and scans are what actually confirm that your pregnancy is progressing well.',
          'If you ever notice reduced movements, bleeding, severe pain or other worrying symptoms, contact your maternity team straight away rather than waiting for your next appointment.',
        ],
      },
    ],
    faq: [
      {
        q: 'Why is pregnancy counted from the last period?',
        a: 'Counting from the last menstrual period gives a consistent starting point that everyone can identify, even though conception happens about two weeks later. It is the standard clinicians use.',
      },
      {
        q: 'How many weeks is a full-term pregnancy?',
        a: 'Full term is 39–40 weeks, and birth any time from 37 to 42 weeks is considered normal. Your due date marks the end of week 40.',
      },
      {
        q: 'Are the weekly milestones exact?',
        a: 'No. They describe what typically develops each week, but healthy babies vary in size and timing. Your scans and appointments confirm how your own pregnancy is progressing.',
      },
    ],
    sources: [ACOG_DUE],
  },

  // ============================================================
  'ovulation-calculator': {
    seoTitle: 'Ovulation & Fertile Window Calculator',
    metaDescription:
      'Predict your ovulation day and 6-day fertile window from your last period and cycle length. Free ovulation calculator — no signup.',
    intro:
      'Knowing your fertile window helps whether you’re trying to conceive or trying to avoid it. Enter your last period and average cycle length to estimate your ovulation day and fertile days.',
    notice: OBGYN_NOTICE,
    sections: [
      {
        h2: 'How ovulation is predicted',
        paragraphs: [
          'Ovulation — when an ovary releases an egg — usually happens about 14 days before your next period starts, regardless of how long your cycle is. So for a 28-day cycle ovulation is around day 14, while for a 32-day cycle it’s closer to day 18.',
          'This calculator estimates your next period from your cycle length, then counts back 14 days to predict ovulation, and marks the fertile window around it.',
        ],
      },
      {
        h2: 'Your fertile window',
        paragraphs: [
          'The egg lives for only about 12–24 hours, but sperm can survive in the body for up to five days. That creates a fertile window of roughly six days: the five days before ovulation plus ovulation day itself. The two days just before ovulation are the most fertile.',
          'If you’re trying to conceive, having sex every one to two days through the fertile window gives the best chance. If you’re avoiding pregnancy, remember that calendar prediction alone is not a reliable contraceptive — see below.',
        ],
      },
      {
        h2: 'How reliable is it?',
        paragraphs: [
          'Calendar-based prediction works best if your cycles are regular. Stress, illness, travel and conditions such as PCOS can shift ovulation, so the predicted day can be off by several days. Tracking basal body temperature or using ovulation predictor kits, which detect the hormone surge before ovulation, gives a more precise picture.',
          'Because of this variability, the rhythm method is one of the least reliable forms of contraception. If you are trying to avoid pregnancy, speak to your doctor about more dependable options. If you’re trying to conceive and haven’t succeeded after 6–12 months, your OB-GYN can help.',
        ],
      },
    ],
    faq: [
      {
        q: 'When am I most fertile?',
        a: 'Your most fertile days are the two days before ovulation and ovulation day itself. The full fertile window is about six days: the five days before ovulation plus the day of ovulation.',
      },
      {
        q: 'Can I use this as birth control?',
        a: 'No. Calendar prediction is not a reliable contraceptive because ovulation timing can shift. If you want to avoid pregnancy, talk to your doctor about dependable contraception.',
      },
      {
        q: 'What if my cycles are irregular?',
        a: 'Calendar prediction is less accurate with irregular cycles. Ovulation predictor kits or tracking basal body temperature can help, and your OB-GYN can investigate persistent irregularity.',
      },
    ],
    sources: [WILCOX, ACOG_DUE],
  },

  // ============================================================
  'period-calculator': {
    seoTitle: 'Period Calculator – Predict Next 3 Cycles',
    metaDescription:
      'Predict the start dates of your next three periods from your last period and cycle length. Free period and menstrual cycle calculator.',
    intro:
      'Plan ahead with confidence. Enter the first day of your last period and your usual cycle length to see when your next three periods are likely to arrive.',
    notice: OBGYN_NOTICE,
    sections: [
      {
        h2: 'How period prediction works',
        paragraphs: [
          'Your menstrual cycle is counted from the first day of one period to the first day of the next. The average cycle is about 28 days, but anywhere from 21 to 35 days is normal for adults. This calculator simply adds your cycle length to your last start date to project the next three periods.',
          'It also estimates your next ovulation, which typically falls about 14 days before each period begins.',
        ],
      },
      {
        h2: 'What counts as a normal cycle',
        paragraphs: [
          'Cycle length naturally varies a little from month to month, and many people are not perfectly regular. Factors such as stress, weight change, exercise, travel and approaching menopause can all shift timing. Tracking a few cycles helps you learn your own average and how much it tends to vary.',
          'Because real cycles fluctuate, treat these predictions as a helpful guide for planning rather than exact dates.',
        ],
      },
      {
        h2: 'When to see a doctor',
        paragraphs: [
          'It’s worth speaking to your OB-GYN if your cycles are consistently shorter than 21 days or longer than 35, if periods suddenly become irregular, if you bleed between periods or after sex, or if bleeding is unusually heavy or painful.',
          'A missed period can signal pregnancy, but also stress, hormonal changes or other conditions. If you might be pregnant, a home test taken after a missed period is a good first step, followed by a chat with your doctor.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is a normal cycle length?',
        a: 'For adults, a cycle of 21 to 35 days is considered normal, with around 28 days being average. Some month-to-month variation is completely typical.',
      },
      {
        q: 'How accurate are period predictions?',
        a: 'They are estimates based on a regular cycle. Stress, illness, weight change and other factors can shift your dates, so use the predictions as a planning guide.',
      },
      {
        q: 'When should I see a doctor about my periods?',
        a: 'See your OB-GYN if cycles are regularly under 21 or over 35 days, become suddenly irregular, include bleeding between periods, or are unusually heavy or painful.',
      },
    ],
    sources: [ACOG_DUE],
  },

  // ============================================================
  'pregnancy-weight-gain-calculator': {
    seoTitle: 'Pregnancy Weight Gain Calculator (IOM)',
    metaDescription:
      'See your recommended pregnancy weight-gain range by pre-pregnancy BMI using IOM guidelines, plus a healthy target for your current week. Free.',
    intro:
      'Healthy pregnancy weight gain depends on your weight before pregnancy. Enter your details to see your recommended total gain and a healthy target for the week you’re in, based on IOM guidelines.',
    notice: OBGYN_NOTICE,
    sections: [
      {
        h2: 'How much weight should you gain?',
        paragraphs: [
          'The Institute of Medicine (IOM) bases its recommendations on your pre-pregnancy body mass index (BMI). For a single baby the guidelines are: 28–40 lb (12.5–18 kg) if you were underweight, 25–35 lb (11.5–16 kg) if a healthy weight, 15–25 lb (7–11.5 kg) if overweight, and 11–20 lb (5–9 kg) if obese.',
          'This calculator works out your pre-pregnancy BMI, shows your recommended total range, and estimates how much of that you should have gained by your current week.',
        ],
      },
      {
        h2: 'Gaining at a healthy pace',
        paragraphs: [
          'Most weight gain happens in the second and third trimesters. In the first trimester, a gain of just 1–4.5 lb (about 0.5–2 kg) is typical. After that, a steady rate of roughly 0.5–1 lb per week is recommended for those who started at a healthy weight, and a little less if you began overweight.',
          'The gauge above compares the weight you’ve gained so far with the healthy range for your week, so you can see whether you’re on track, a little behind, or ahead.',
        ],
      },
      {
        h2: 'Why healthy gain matters',
        paragraphs: [
          'Gaining within the recommended range supports your baby’s growth while lowering the risk of complications such as gestational diabetes, high blood pressure, a very large or very small baby, and difficulties at delivery. It also makes it easier to return to a healthy weight afterwards.',
          'These ranges are general guidance, not strict rules — and they differ for twins or other multiples. Your OB-GYN will track your gain at appointments and give you advice tailored to your pregnancy and health.',
        ],
      },
    ],
    faq: [
      {
        q: 'How much weight should I gain during pregnancy?',
        a: 'It depends on your pre-pregnancy BMI. IOM guidance suggests 25–35 lb for a healthy starting weight, 28–40 lb if underweight, 15–25 lb if overweight, and 11–20 lb if obese (for a single baby).',
      },
      {
        q: 'Is it normal to gain little in the first trimester?',
        a: 'Yes. Gaining only 1–4.5 lb in the first trimester is typical; nausea can even cause slight loss. Most pregnancy weight gain occurs in the second and third trimesters.',
      },
      {
        q: 'What if I gain more or less than recommended?',
        a: 'Week-to-week variation is normal, but consistently gaining well above or below the range is worth discussing with your OB-GYN, who can check that you and your baby are healthy.',
      },
    ],
    sources: [IOM_WEIGHT],
  },
};
