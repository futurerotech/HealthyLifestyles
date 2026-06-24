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
};
