/**
 * Content for Mental Wellness tools. Self-reflection only — never diagnostic.
 * Distress topics (stress, burnout) carry a crisis-resources line in the notice.
 */
import { pubmed, type Source, type ToolContent } from './content-types';

const DISCLAIMER =
  'This is not a diagnostic tool. If you’re struggling, please talk to a qualified professional.';
const CRISIS =
  ' If you’re in distress or crisis, contact a helpline now — in the US & Canada call or text 988, in the UK call Samaritans on 116 123, in Australia call Lifeline on 13 11 14.';

const APA_STRESS: Source = {
  citation: 'American Psychological Association (APA). "Stress effects on the body" and "Healthy ways to handle life’s stressors."',
  url: 'https://www.apa.org/topics/stress',
};
const WHO_BURNOUT: Source = {
  citation: 'World Health Organization. "Burn-out an ‘occupational phenomenon’: International Classification of Diseases" (ICD-11) — burn-out is not classified as a medical condition.',
  url: 'https://www.who.int/news/item/28-05-2019-burn-out-an-occupational-phenomenon-international-classification-of-diseases',
};
const BREATH_REVIEW: Source = {
  citation: 'Zaccaro A, Piarulli A, Laurino M, et al. "How Breath-Control Can Change Your Life: A Systematic Review on Psycho-Physiological Correlates of Slow Breathing." Front Hum Neurosci. 2018;12:353.',
  url: pubmed('How Breath-Control Can Change Your Life slow breathing Zaccaro'),
};
const PHQ9_SOURCE: Source = {
  citation: 'Kroenke K, Spitzer RL, Williams JB. "The PHQ-9: validity of a brief depression severity measure." J Gen Intern Med. 2001;16(9):606–613.',
  url: pubmed('PHQ-9 validity brief depression severity measure Kroenke'),
};
const GAD7_SOURCE: Source = {
  citation: 'Spitzer RL, Kroenke K, Williams JB, Löwe B. "A brief measure for assessing generalized anxiety disorder: the GAD-7." Arch Intern Med. 2006;166(10):1092–1097.',
  url: pubmed('brief measure assessing generalized anxiety disorder GAD-7 Spitzer'),
};
const WHO5_SOURCE: Source = {
  citation: 'Topp CW, Østergaard SD, Søndergaard S, Bech P. "The WHO-5 Well-Being Index: a systematic review of the literature." Psychother Psychosom. 2015;84(3):167–176.',
  url: pubmed('WHO-5 Well-Being Index systematic review Topp'),
};
const SCREENER_DISCLAIMER =
  'This is a validated screening tool, not a diagnosis. Only a qualified healthcare or mental health professional can diagnose depression, anxiety, or any condition. If your results concern you, please reach out for professional help.';

export const MENTAL_CONTENT: Record<string, ToolContent> = {
  // ============================================================
  'sleep-quality-check': {
    seoTitle: 'Sleep Quality Self-Check (Free)',
    metaDescription:
      'A short, private self-check on how restful your sleep has been, with a quality score and practical tips. Not a diagnosis — for reflection only.',
    intro:
      'Answer a few quick questions about your recent sleep to get a simple quality score and tailored tips. It’s private, instant, and just for your own reflection.',
    notice: DISCLAIMER,
    sections: [
      {
        h2: 'What this self-check looks at',
        paragraphs: [
          'The questions cover the things that most shape sleep quality: how quickly you fall asleep, whether you stay asleep, how rested you feel, how long you sleep, how consistent your schedule is, and your wind-down habits. Your answers combine into a simple score and a plain-language summary.',
          'It’s a snapshot for reflection, not a sleep study. Real sleep quality is best understood over weeks, and only a professional can assess a possible sleep disorder.',
        ],
      },
      {
        h2: 'Habits that improve sleep',
        list: {
          intro: 'Whatever your score, these evidence-based habits ("sleep hygiene") help most people:',
          items: [
            'Keep the same wake-up time every day, even at weekends.',
            'Get natural light in the morning to anchor your body clock.',
            'Keep your bedroom dark, quiet and cool.',
            'Avoid caffeine after early afternoon and big meals late at night.',
            'Wind down screen-free for the last hour before bed.',
          ],
        },
      },
      {
        h2: 'When to seek help',
        paragraphs: [
          'Occasional poor sleep is normal, especially during stressful periods. But if you regularly struggle to fall or stay asleep, feel exhausted despite enough hours, snore heavily or stop breathing in your sleep, it’s worth speaking to a doctor.',
          'Persistent sleep problems can affect mood, concentration and physical health — and they’re very treatable. This check is only a starting point for that conversation, not a substitute for it.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is this a sleep disorder test?',
        a: 'No. It’s a self-reflection tool, not a diagnostic test. Only a healthcare professional can diagnose conditions such as insomnia or sleep apnoea.',
      },
      {
        q: 'How much sleep should I get?',
        a: 'Most adults do best with 7–9 hours a night, though quality and consistency matter as much as the total. Needs vary from person to person.',
      },
      {
        q: 'What if my score is low?',
        a: 'Treat it as a prompt to try a few sleep-hygiene habits, and to see a doctor if poor sleep continues for more than a few weeks or affects your daily life.',
      },
    ],
    sources: [
      { citation: 'Centers for Disease Control and Prevention (CDC). "Tips for Better Sleep" and sleep recommendations.' },
    ],
  },

  // ============================================================
  'stress-level-check': {
    seoTitle: 'Stress Level Self-Check',
    metaDescription:
      'A short, private self-check on how stress is affecting you right now, with a low/moderate/high reflection and coping ideas. Not a diagnosis.',
    intro:
      'Stress affects everyone differently. Answer a few questions about how you’ve felt recently to get a simple reflection on your stress level — and some ideas that may help.',
    notice: DISCLAIMER + CRISIS,
    sections: [
      {
        h2: 'Understanding your result',
        paragraphs: [
          'The questions ask how often you’ve felt overwhelmed, tense, irritable or unable to switch off lately. Your answers place you in a lower, moderate or higher band, with coping suggestions to match — there are no clinical labels here, just a reflection of how things feel for you right now.',
          'Stress is a normal response to pressure, and some stress can even be helpful. It becomes a problem when it’s frequent, intense or long-lasting. This check is a gentle gauge, not a measurement of any condition.',
        ],
      },
      {
        h2: 'Ways to ease stress',
        list: {
          intro: 'Small, regular habits tend to help more than occasional big efforts:',
          items: [
            'Slow your breathing — a few minutes of long, gentle exhales calms the body.',
            'Move your body daily, even a short walk.',
            'Protect sleep, and keep meals and routines regular.',
            'Talk to someone you trust about what’s on your mind.',
            'Set realistic limits on what you take on.',
          ],
        },
      },
      {
        h2: 'When to reach out',
        paragraphs: [
          'If stress is persistent, stops you functioning, or comes with low mood, hopelessness, or thoughts of harming yourself, please reach out to a doctor or mental-health professional. You don’t need to wait until things feel unbearable.',
          'Support helps, and asking for it is a sign of strength. If you ever feel in crisis, contact a local helpline straight away — the numbers are shown at the top of this page.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does this diagnose anxiety or a stress disorder?',
        a: 'No. It is a self-reflection tool only and uses no clinical labels. A qualified professional is the only one who can assess or diagnose a condition.',
      },
      {
        q: 'What’s the fastest way to calm down when stressed?',
        a: 'Slow breathing with a longer exhale is one of the quickest ways to settle your nervous system. A short walk or stepping away from the trigger also helps.',
      },
      {
        q: 'When should I see a professional about stress?',
        a: 'If stress is frequent, overwhelming, lasts for weeks, or affects your sleep, relationships or daily life — or if you have any thoughts of self-harm — please talk to a doctor or counsellor.',
      },
    ],
    sources: [APA_STRESS],
  },

  // ============================================================
  'burnout-self-check': {
    seoTitle: 'Burnout Self-Check (Reflective)',
    metaDescription:
      'A private, reflective self-check on exhaustion, energy and workload — with encouragement to seek support. Not a diagnosis or clinical assessment.',
    intro:
      'Burnout builds slowly, and it’s easy to miss until you’re running on empty. These questions offer a gentle reflection on your energy and workload — and a nudge toward support if you need it.',
    notice: DISCLAIMER + CRISIS,
    sections: [
      {
        h2: 'What burnout feels like',
        paragraphs: [
          'Burnout is commonly described as having three threads: emotional exhaustion, feeling detached or cynical, and a sense of getting less done. This self-check reflects those themes back to you in plain language — it does not score you against any clinical scale.',
          'The World Health Organization describes burn-out as an occupational phenomenon resulting from chronic, unmanaged workplace stress — and is clear that it is not classified as a medical condition. So think of your result as a prompt for reflection, never a diagnosis.',
        ],
      },
      {
        h2: 'Easing the load',
        paragraphs: [
          'Recovery usually means reducing the demands and increasing the recovery — not just trying harder. Real breaks during the day, protecting time off, handing off or pausing non-essential tasks, and reconnecting with parts of life that energise you all help.',
          'Talking about it matters too. A conversation with a manager about workload, or with a friend or professional about how you’re feeling, can lift a surprising amount of weight. You don’t have to push through alone.',
        ],
      },
      {
        h2: 'When to get support',
        paragraphs: [
          'If exhaustion, dread or detachment have lasted weeks, or you’re struggling to cope day to day, please reach out — to your doctor, a counsellor, or an employee assistance programme if you have one. Early support makes recovery faster.',
          'And if you ever feel hopeless or have thoughts of harming yourself, contact a crisis helpline immediately (numbers at the top of this page). Reaching out is a strength, not a failure.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is burnout a medical diagnosis?',
        a: 'No. The World Health Organization describes burn-out as an occupational phenomenon, not a medical condition. This tool is reflective only and cannot diagnose anything.',
      },
      {
        q: 'How is burnout different from stress?',
        a: 'Stress tends to involve over-engagement and urgency; burnout is more about exhaustion, detachment and feeling depleted after prolonged, unmanaged stress.',
      },
      {
        q: 'What helps with burnout?',
        a: 'Reducing demands and increasing genuine recovery — real breaks, protected time off, support from others, and professional help if it persists — tend to help more than simply working harder.',
      },
    ],
    sources: [WHO_BURNOUT],
  },

  // ============================================================
  'box-breathing-timer': {
    seoTitle: 'Box Breathing Timer (4-4-4-4 & 4-7-8)',
    metaDescription:
      'A free guided breathing timer with animated 4-4-4-4 box breathing and 4-7-8 techniques to help you calm down and relax. No signup.',
    intro:
      'Slow, controlled breathing is one of the quickest ways to calm your body. Follow the animated guide for box breathing (4-4-4-4) or the relaxing 4-7-8 technique.',
    notice: DISCLAIMER,
    sections: [
      {
        h2: 'How guided breathing helps',
        paragraphs: [
          'When you slow your breathing — especially by lengthening the exhale — you activate the parasympathetic ("rest and digest") branch of your nervous system. Heart rate steadies, muscles loosen, and the racing-thoughts feeling of stress tends to ease. Research reviews link slow breathing to greater calm and better emotional control.',
          'The animation gives you something simple to follow: breathe in as the circle grows, hold while it pauses, and breathe out as it shrinks.',
        ],
      },
      {
        h2: 'Two techniques to try',
        paragraphs: [
          'Box breathing uses an even rhythm — inhale, hold, exhale and hold, each for four seconds. Its balance makes it easy to remember and popular for steadying nerves before a stressful moment.',
          'The 4-7-8 technique inhales for four, holds for seven and exhales for eight. The long exhale makes it especially relaxing, and many people use it to wind down or to help drift off to sleep.',
        ],
      },
      {
        h2: 'Using it safely',
        paragraphs: [
          'Sit or lie somewhere comfortable, breathe through your nose where you can, and start with just a few cycles, building up gradually. A little light-headedness can happen at first — if you feel dizzy or unwell, return to normal breathing and stop.',
          'Breathing exercises are a helpful self-calming tool, not a treatment. If you live with anxiety, panic attacks, a respiratory condition, or ongoing distress, please speak with a healthcare professional about the right support for you.',
        ],
      },
    ],
    faq: [
      {
        q: 'What is box breathing?',
        a: 'Box breathing is a technique of inhaling, holding, exhaling and holding — each for four seconds. The even rhythm helps calm the nervous system and steady your focus.',
      },
      {
        q: 'What is the 4-7-8 technique?',
        a: 'You inhale for 4 seconds, hold for 7, and exhale for 8. The long exhale is especially relaxing, which is why many people use it to unwind or to help fall asleep.',
      },
      {
        q: 'Is breathing exercise a treatment for anxiety?',
        a: 'It’s a helpful self-calming tool, not a treatment. If you experience ongoing anxiety or panic, please talk to a qualified professional about the right support.',
      },
    ],
    sources: [BREATH_REVIEW, APA_STRESS],
  },

  // ============================================================
  'phq-9-depression-screener': {
    seoTitle: 'PHQ-9 Depression Screener — Validated Self-Report',
    metaDescription:
      'Take the PHQ-9, a validated depression screening questionnaire. 9 questions, 2 minutes. Not a diagnosis — share results with your doctor. Crisis resources included.',
    intro:
      'The Patient Health Questionnaire (PHQ-9) is a validated, 9-item depression screener used widely in primary care. Answer honestly about the past two weeks. Your score helps you decide whether to seek professional support.',
    notice: SCREENER_DISCLAIMER + CRISIS,
    sections: [
      {
        h2: 'What the PHQ-9 measures',
        paragraphs: [
          'The PHQ-9 asks about the nine symptoms of depression from the DSM-5 over the past two weeks. Each item is scored 0 (not at all) to 3 (nearly every day). The total ranges from 0 to 27.',
          'The bands — minimal, mild, moderate, moderately severe, and severe — are the standard cutoffs from the instrument developers. Higher scores indicate more depression symptoms, not a diagnosis.',
        ],
      },
      {
        h2: 'Question 9 and safety',
        paragraphs: [
          'Question 9 asks about thoughts of self-harm. If you indicated anything other than "Not at all" for question 9, please contact a crisis line or your doctor immediately, regardless of your total score. A single positive response on item 9 requires clinical follow-up.',
          'If you are in immediate danger, call your local emergency number now.',
        ],
      },
      {
        h2: 'What to do with your result',
        paragraphs: [
          'If your score is 10 or higher, the PHQ-9 guideline suggests you should be assessed for depression by a healthcare professional. A score of 15 or higher suggests you should seek treatment.',
          'Bring your results to your doctor or a mental health professional. They will interpret them in the context of your full health history, not as a standalone diagnosis.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can the PHQ-9 diagnose depression?',
        a: 'No. The PHQ-9 is a screening tool — it helps identify whether depression symptoms are present and how severe they appear. Only a qualified healthcare or mental health professional can diagnose depression, using a clinical interview and your full history.',
      },
      {
        q: 'What does a score of 10 mean?',
        a: 'A score of 10 or above is the standard cutoff for "major depression" screening on the PHQ-9. It means you should talk to your doctor or a mental health professional for a proper assessment. It does not mean you definitely have depression.',
      },
      {
        q: 'What if I scored positive on question 9 (self-harm)?',
        a: 'If you indicated anything other than "Not at all" for question 9, please seek help immediately — contact a crisis line (988 in the US/Canada, 116 123 in the UK, 13 11 14 in Australia) or your doctor. Do not wait. A single positive response on item 9 requires clinical attention.',
      },
      {
        q: 'How often should I take the PHQ-9?',
        a: 'The PHQ-9 measures symptoms over the past two weeks. If you are being monitored by a healthcare professional, they will advise on frequency. If you are self-monitoring, retake it every 2-4 weeks and track the trend — not every day.',
      },
    ],
    sources: [PHQ9_SOURCE],
  },

  // ============================================================
  'gad-7-anxiety-screener': {
    seoTitle: 'GAD-7 Anxiety Screener — Validated Self-Report',
    metaDescription:
      'Take the GAD-7, a validated anxiety screening questionnaire. 7 questions, 2 minutes. Not a diagnosis — share results with your doctor. Crisis resources included.',
    intro:
      'The Generalized Anxiety Disorder 7-item (GAD-7) scale is a validated anxiety screener used widely in primary care. Answer honestly about the past two weeks. Your score helps you decide whether to seek professional support.',
    notice: SCREENER_DISCLAIMER + CRISIS,
    sections: [
      {
        h2: 'What the GAD-7 measures',
        paragraphs: [
          'The GAD-7 asks about seven core symptoms of generalized anxiety over the past two weeks. Each item is scored 0 (not at all) to 3 (nearly every day). The total ranges from 0 to 21.',
          'The bands — minimal, mild, moderate, and severe — are the standard cutoffs from the instrument developers. Higher scores indicate more anxiety symptoms, not a diagnosis.',
        ],
      },
      {
        h2: 'What to do with your result',
        paragraphs: [
          'A score of 10 or above is the standard cutoff for further assessment. If your score is 10 or higher, please consider speaking with a healthcare professional about your anxiety symptoms.',
          'Anxiety is highly treatable — therapy, lifestyle changes, and medication are all options. Your doctor or a mental health professional can help you find the right approach.',
        ],
      },
      {
        h2: 'Anxiety vs normal worry',
        paragraphs: [
          'Everyone worries sometimes. The GAD-7 asks whether worry and anxiety have been frequent and interfering over the past two weeks. A low score does not mean you never worry — it means anxiety is not currently a significant problem.',
          'If anxiety is affecting your sleep, work, relationships, or daily life, please reach out for support — regardless of your score.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can the GAD-7 diagnose anxiety?',
        a: 'No. The GAD-7 is a screening tool — it identifies whether anxiety symptoms are present and how severe they appear. Only a qualified healthcare or mental health professional can diagnose an anxiety disorder.',
      },
      {
        q: 'What score should concern me?',
        a: 'A score of 10 or above suggests moderate anxiety and is the standard cutoff for further assessment. A score of 15 or above suggests severe anxiety. If either applies, please talk to your doctor or a mental health professional.',
      },
      {
        q: 'Does the GAD-7 cover panic attacks?',
        a: 'The GAD-7 screens for generalized anxiety symptoms, not panic disorder specifically. If you experience sudden, intense episodes of fear with physical symptoms (racing heart, shortness of breath, feeling faint), mention this to your doctor — panic disorder is assessed separately.',
      },
      {
        q: 'Can I use the GAD-7 to track my anxiety over time?',
        a: 'Yes. The GAD-7 is commonly used to monitor symptom severity over time. If you are in treatment, your provider may ask you to retake it every few weeks. If self-monitoring, retake every 2-4 weeks and discuss the trend with your doctor.',
      },
    ],
    sources: [GAD7_SOURCE],
  },

  // ============================================================
  'who-5-wellbeing-screener': {
    seoTitle: 'WHO-5 Well-Being Index — Validated Screener',
    metaDescription:
      'Take the WHO-5 Well-Being Index, a validated 5-question screener. 2 minutes. Low scores suggest further screening for depression. Not a diagnosis. Crisis resources included.',
    intro:
      'The WHO-5 Well-Being Index is a short, validated questionnaire from the World Health Organization. It measures positive well-being over the past two weeks — not just the absence of problems, but how good you have been feeling.',
    notice: SCREENER_DISCLAIMER + CRISIS,
    sections: [
      {
        h2: 'What the WHO-5 measures',
        paragraphs: [
          'The WHO-5 asks five positive statements about well-being (cheerful, calm, active, rested, interested) over the past two weeks. Each is scored 0 (at no time) to 5 (all of the time). The raw score ranges from 0 to 25.',
          'Unlike the PHQ-9 or GAD-7, the WHO-5 measures positive well-being — a higher score is better. A raw score of 13 or below suggests poor well-being and the WHO guideline recommends further screening for depression.',
        ],
      },
      {
        h2: 'Why well-being matters',
        paragraphs: [
          'Well-being is more than the absence of illness. The WHO-5 captures whether you are thriving, not just whether you are symptom-free. Low scores can be an early signal — sometimes before specific symptoms are noticed.',
          'If your score is 13 or below, please consider talking to your doctor. The WHO-5 is specifically recommended as a first-step screen for depression — a low score does not mean you are depressed, but it means further assessment is a good idea.',
        ],
      },
    ],
    faq: [
      {
        q: 'Is the WHO-5 a depression test?',
        a: 'No. The WHO-5 measures positive well-being. However, a raw score of 13 or below is the standard cutoff for recommending further screening for depression. If your score is low, your doctor may follow up with a depression-specific tool like the PHQ-9.',
      },
      {
        q: 'My score is low but I do not feel depressed — what should I do?',
        a: 'Well-being fluctuates for many reasons — stress, poor sleep, life events, or simply a difficult couple of weeks. If your score is 13 or below, it is still worth mentioning to your doctor, especially if it persists. But a single low score does not mean you are depressed.',
      },
      {
        q: 'Can the WHO-5 diagnose anything?',
        a: 'No. The WHO-5 is a screening and monitoring tool. It cannot diagnose depression, anxiety, or any condition. Only a qualified professional can make a diagnosis after a clinical assessment.',
      },
      {
        q: 'How often should I take the WHO-5?',
        a: 'The WHO-5 measures the past two weeks. If you are being monitored by a healthcare professional, follow their guidance. If self-monitoring, retake every 2-4 weeks and track the trend.',
      },
    ],
    sources: [WHO5_SOURCE],
  },
};
