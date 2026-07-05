/** Long-form, source-cited content for each Sleep & Recovery tool page. */
import { pubmed, type Source, type ToolContent } from './content-types';

const NSF_DURATION: Source = {
  citation:
    'Hirshkowitz M, Whiton K, Albert SM, et al. "National Sleep Foundation’s sleep time duration recommendations: methodology and results summary." Sleep Health. 2015;1(1):40–43.',
  url: pubmed('National Sleep Foundation sleep time duration recommendations methodology'),
};
const SLEEP_CYCLE: Source = {
  citation:
    'Patel AK, Reddy V, Shumway KR, Araujo JF. "Physiology, Sleep Stages." In: StatPearls. Treasure Island (FL): StatPearls Publishing; 2024.',
  url: pubmed('Physiology Sleep Stages NREM REM cycle'),
};

export const SLEEP_CONTENT: Record<string, ToolContent> = {
  // ============================================================
  'sleep-chronotype-quiz': {
    seoTitle: 'Sleep Chronotype Quiz — Lion, Bear, Wolf, Dolphin',
    metaDescription:
      'Free sleep chronotype quiz: are you a Lion, Bear, Wolf, or Dolphin? Get your type and an ideal daily schedule for energy, focus, and better sleep.',
    intro:
      'Your chronotype is your body’s natural timing for sleep and energy. Take this quick quiz to find out whether you’re a Lion, Bear, Wolf, or Dolphin — and get a daily schedule that fits your clock.',
    sections: [
      {
        h2: 'What is a chronotype?',
        paragraphs: [
          'A chronotype is your natural tendency toward being a morning person, a night person, or somewhere in between — set largely by your internal body clock. Working with it (rather than against it) can make your energy, focus, and sleep noticeably better.',
          'The popular four-animal framework sorts people into Lions (early birds), Bears (in sync with the sun — the most common), Wolves (night owls), and Dolphins (light, restless sleepers).',
        ],
      },
      {
        h2: 'Using your ideal schedule',
        paragraphs: [
          'Once you know your type, line up your day with it where you can: do demanding work during your natural focus peak, exercise when your body is most ready, and keep a consistent wake time. You won’t control every hour, but even small shifts toward your chronotype help.',
        ],
      },
    ],
    faq: [
      { q: 'What are the 4 sleep chronotypes?', a: 'Lion (early riser, morning peak), Bear (follows the sun, the most common), Wolf (night owl, evening peak), and Dolphin (light, easily-woken sleeper).' },
      { q: 'What’s the most common chronotype?', a: 'The Bear — roughly half of people. Bears wake and sleep with the sun and do well on a typical 9-to-5 schedule.' },
      { q: 'Can my chronotype change?', a: 'It shifts with age (teens trend later, older adults earlier) and can be nudged with light and routine, but your underlying tendency is fairly stable.' },
      { q: 'Is this a medical sleep test?', a: 'No — it’s a quick, educational guide for self-awareness. If you have ongoing sleep problems, talk to a healthcare professional.' },
    ],
    sources: [
      NSF_DURATION,
      { citation: 'Roenneberg T, et al. "Life between clocks: daily temporal patterns of human chronotypes." J Biol Rhythms. 2003.', url: pubmed('Life between clocks daily temporal patterns of human chronotypes Roenneberg') },
    ],
  },
  // ============================================================
  'caffeine-intake-calculator': {
    seoTitle: 'Caffeine Calculator — Daily Intake vs 400 mg',
    metaDescription:
      'Add up your daily caffeine from coffee, tea, and energy drinks and see how it compares to the ~400 mg safe daily limit. Free caffeine tracker.',
    intro:
      'Tap in the coffees, teas, and energy drinks you’ve had today to total your caffeine in milligrams — and see how it stacks up against the roughly 400 mg considered safe for most healthy adults.',
    notice:
      'General wellness education, not medical advice. The ~400 mg figure is for healthy adults; pregnant people and those sensitive to caffeine should aim considerably lower.',
    sections: [
      {
        h2: 'How much caffeine is too much?',
        paragraphs: [
          'For most healthy adults, the FDA points to about 400 mg of caffeine a day — roughly four cups of coffee — as an amount not generally associated with negative effects. That’s a population guideline, not a target: sensitivity varies a lot, and what’s fine for one person can cause jitters, a racing heart, or poor sleep in another.',
          'This tracker adds up your typical drinks so you can see where your day lands and adjust — especially in the afternoon and evening.',
        ],
      },
      {
        h2: 'Where caffeine adds up',
        list: {
          items: [
            'Brewed coffee: ~95 mg per cup (large coffees can be 200 mg+).',
            'Espresso: ~65 mg per shot.',
            'Tea: ~47 mg per cup.',
            'Energy drinks: ~80 mg (some far more).',
            'Cola: ~40 mg per can.',
          ],
        },
      },
    ],
    faq: [
      { q: 'How much caffeine is safe per day?', a: 'For most healthy adults, up to about 400 mg/day is generally considered safe. Pregnant people are usually advised to stay under ~200 mg, and sensitive individuals lower still.' },
      { q: 'How many cups of coffee is 400 mg?', a: 'Roughly four 8-oz cups of brewed coffee at ~95 mg each — but large coffee-shop drinks can hold 200–300 mg in a single cup.' },
      { q: 'What are signs of too much caffeine?', a: 'Jitteriness, a racing heartbeat, anxiety, an upset stomach, and trouble sleeping are common signs to cut back.' },
      { q: 'When should I stop for better sleep?', a: 'Because caffeine has a ~5-hour half-life, timing matters — see the Caffeine Curfew Calculator for your personal cutoff time.' },
    ],
    sources: [
      { citation: 'U.S. Food & Drug Administration. "Spilling the Beans: How Much Caffeine is Too Much?"', url: 'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much' },
      { citation: 'Mayo Clinic. "Caffeine: How much is too much?"', url: 'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/caffeine/art-20045678' },
    ],
  },
  // ============================================================
  'caffeine-curfew-calculator': {
    seoTitle: 'Caffeine Cutoff Calculator – Stop Coffee Time',
    metaDescription:
      'Find your caffeine curfew — when to stop coffee before bed (≈5-hour half-life) — plus morning-light and screen-cutoff timing for better sleep. Free.',
    intro:
      'Enter your wake time, bedtime, and usual caffeine dose to see the latest you should have coffee — plus a simple daily timeline for morning light, screens, and wind-down that works with your body clock.',
    notice:
      'General sleep-hygiene education, not medical advice. Caffeine metabolism varies a lot between people, so treat these times as a starting point and adjust to how you sleep.',
    sections: [
      {
        h2: 'When should you stop drinking coffee before bed?',
        paragraphs: [
          'Caffeine has a half-life of roughly 5 hours in a typical adult — meaning about half of what you drink is still in your system 5 hours later, and a quarter after 10 hours. So an afternoon coffee can still be working at bedtime, even if you don’t feel wired.',
          'This calculator works backward from your bedtime and your usual dose to find the latest you can have caffeine and still be near a low residual (~50 mg) when you turn the lights off. The bigger your dose, the earlier the cutoff. As a simpler backup, stopping 8–10 hours before bed suits most people.',
        ],
      },
      {
        h2: 'How the caffeine curfew is calculated',
        paragraphs: [
          'Caffeine clears in a predictable first-order way: it halves about every 5 hours. Starting from your dose, the tool finds the time at which the amount left by your bedtime drops to around 50 mg — roughly the level unlikely to disrupt most people’s sleep — and shows you the full decay curve so you can see why.',
          'Your own clearance can be faster or slower than average. A gene (CYP1A2) makes some people "fast" or "slow" metabolizers; smoking speeds clearance up; pregnancy, older age, and some medications slow it down. If caffeine hits you hard, cut off earlier than the estimate.',
        ],
      },
      {
        h2: 'Timing light for your circadian rhythm',
        paragraphs: [
          'Your sleep-wake cycle is set by light. Getting 10–30 minutes of outdoor light within about an hour of waking anchors your body clock and helps you feel sleepy at the right time that night. In the evening, bright and blue-rich screen light does the opposite — it can delay your clock — so dimming screens 1–2 hours before bed and winding down in low light helps you fall asleep.',
        ],
      },
      {
        h2: 'A simple evening routine',
        list: {
          items: [
            'Morning: get outside light within an hour of waking.',
            'Afternoon: have your last caffeine by your curfew time.',
            '1–2 hours before bed: dim screens and overhead lights.',
            '~45 minutes before bed: wind down — read, stretch, or relax away from screens.',
            'Keep a consistent wake time, even on weekends, to stabilize your rhythm.',
          ],
        },
      },
    ],
    faq: [
      { q: 'When should I stop drinking caffeine before bed?', a: 'For most people, 8–10 hours before bed is a safe cutoff. This tool refines that to your dose: a small coffee may only need ~5 hours, while a large or double dose needs longer to fall to a low residual by bedtime.' },
      { q: 'How long does caffeine stay in your system?', a: 'About half clears in roughly 5 hours, and it takes around 10 hours or more to clear most of a dose — longer in slow metabolizers, during pregnancy, with older age, or with certain medications.' },
      { q: 'Does afternoon coffee really affect sleep?', a: 'It can. Controlled research found caffeine taken even 6 hours before bed measurably reduced total sleep, often without the person realizing their sleep had worsened.' },
      { q: 'What is a circadian rhythm calculator?', a: 'It times daily cues — light exposure and caffeine — to your personal sleep-wake schedule, so your body clock and your bedtime are working together rather than against each other.' },
      { q: 'Is morning sunlight really important for sleep?', a: 'Yes. Morning outdoor light is one of the strongest signals that sets your circadian clock, which in turn helps you feel sleepy at a consistent time at night.' },
    ],
    sources: [
      { citation: 'U.S. Food & Drug Administration. "Spilling the Beans: How Much Caffeine is Too Much?" (notes caffeine’s ~4–6 hour half-life).', url: 'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much' },
      { citation: 'Drake C, Roehrs T, Shambroom J, Roth T. "Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed." J Clin Sleep Med. 2013;9(11):1195–1200.', url: pubmed('Caffeine effects on sleep taken 0 3 or 6 hours before going to bed Drake') },
      { citation: 'Clark I, Landolt HP. "Coffee, caffeine, and sleep: A systematic review." Sleep Med Rev. 2017;31:70–78.', url: pubmed('Coffee caffeine and sleep systematic review Clark Landolt') },
      { citation: 'Blume C, Garbazza C, Spitschan M. "Effects of light on human circadian rhythms, sleep and mood." Somnologie. 2019.', url: pubmed('Effects of light on human circadian rhythms sleep and mood Blume') },
    ],
  },
  // ============================================================
  'sleep-calculator': {
    directAnswer: {
      question: 'What time should I go to bed?',
      answer:
        'Count back five or six 90-minute sleep cycles (7.5–9 hours) from your wake-up time, then add about 15 minutes to fall asleep. To wake at 6:30 am, that puts lights-out around 9:00–10:45 pm. Waking at the end of a cycle — rather than mid-cycle — is what makes mornings feel noticeably easier.',
    },
    seoTitle: 'Sleep Calculator – Best Bedtime by Cycles',
    metaDescription:
      'Find the best time to sleep or wake using 90-minute sleep cycles. Enter your wake-up time or bedtime for cycle-based suggestions. Free, no signup.',
    intro:
      'Waking at the end of a sleep cycle helps you feel refreshed instead of groggy. Enter the time you need to wake up — or the time you plan to go to bed — and this calculator suggests the best matching times based on 90-minute cycles.',
    sections: [
      {
        h2: 'How sleep cycles work',
        paragraphs: [
          'Sleep is not uniform. Through the night you move through repeating cycles, each lasting roughly 90 minutes, that progress from light sleep into deep slow-wave sleep and then into REM (dreaming) sleep. A typical adult completes four to six of these cycles a night.',
          'Waking in the middle of a cycle — especially during deep sleep — is what leaves you feeling foggy and heavy, an effect called sleep inertia. Waking at the end of a cycle, when sleep is lightest, feels far more natural. This calculator lines up your sleep so that your alarm lands at the end of a cycle rather than the middle of one.',
        ],
      },
      {
        h2: 'How to use this calculator',
        paragraphs: [
          'Choose whether you want to set a wake-up time or a bedtime. If you enter when you need to wake, the tool counts backwards to show bedtimes for 6, 5, and 4 complete cycles. If you enter when you’ll go to bed, it counts forwards to show ideal wake-up times.',
          'Each suggestion adds about 15 minutes, the average time it takes to fall asleep, so the cycle count reflects actual sleep rather than time in bed. Pick the option that gives you enough total sleep while ending on a full cycle.',
        ],
      },
      {
        h2: 'Getting enough cycles',
        paragraphs: [
          'For most adults, five to six cycles — roughly 7.5 to 9 hours — matches the National Sleep Foundation’s recommendation of 7–9 hours a night. Four cycles (6 hours) can work occasionally but is below the ideal for ongoing nights.',
          'The 90-minute figure is an average; real cycles vary from person to person and lengthen slightly through the night, so treat the times as a smart guide rather than a precise rule. The bigger wins come from consistency: going to bed and waking at similar times every day keeps your body clock steady and your sleep more restorative.',
        ],
      },
    ],
    faq: [
      {
        q: 'How long is one sleep cycle?',
        a: 'A full sleep cycle averages about 90 minutes, moving from light sleep into deep sleep and then REM. Most adults complete four to six cycles per night.',
      },
      {
        q: 'Why does waking up at the end of a cycle matter?',
        a: 'Waking during deep sleep causes grogginess known as sleep inertia. Waking at the end of a cycle, when sleep is lightest, helps you feel more alert and refreshed.',
      },
      {
        q: 'How many hours of sleep do I need?',
        a: 'The National Sleep Foundation recommends 7–9 hours for most adults, which is about five to six 90-minute cycles. Teenagers and children need more.',
      },
      {
        q: 'Is the 90-minute cycle exact?',
        a: 'No — 90 minutes is an average. Real cycles vary between people and across the night, so use these times as a helpful guide alongside a consistent sleep schedule.',
      },
    ],
    sources: [NSF_DURATION, SLEEP_CYCLE],
  },

  // ============================================================
  'nap-calculator': {
    seoTitle: 'Nap Calculator – Power Nap & Cycle Timing',
    metaDescription:
      'Find when to wake from a nap — 10–20 minutes for a power nap or 90 minutes for a full cycle — and avoid groggy mid-nap waking. Free, no signup.',
    intro:
      'The secret to a good nap is waking at the right moment. Enter the time you expect to fall asleep and this calculator shows when to wake for a refreshing power nap or a full sleep cycle.',
    sections: [
      {
        h2: 'How long should a nap be?',
        paragraphs: [
          'Two nap lengths work best, and they sit at opposite ends of a sleep cycle. A power nap of 10–20 minutes keeps you in light sleep, so you wake quickly with a boost to alertness, mood and focus — ideal for a midday lift without affecting your night’s sleep.',
          'A full cycle of about 90 minutes takes you all the way through deep sleep and into REM, then back to light sleep, so you again wake at a natural point. This longer nap can aid memory and creativity but needs enough time and is best earlier in the day.',
        ],
      },
      {
        h2: 'Why 30–60 minute naps backfire',
        paragraphs: [
          'Naps in the 30–60 minute range are the worst of both worlds. By then you have usually descended into deep slow-wave sleep, and your alarm wakes you mid-cycle. The result is sleep inertia — that heavy, disoriented feeling that can last 15–30 minutes and leave you groggier than before you lay down.',
          'If you only have half an hour, keep the nap to 20 minutes. If you have time for the full 90, take it. Avoid the murky middle.',
        ],
      },
      {
        h2: 'The best time to nap',
        paragraphs: [
          'Aim to nap in the early afternoon, roughly between 1 and 3 p.m., when most people experience a natural dip in alertness. Napping too late in the day can make it harder to fall asleep at night and may add to a cycle of poor sleep.',
          'A simple trick for power naps: have a coffee right before lying down. Caffeine takes about 20 minutes to kick in, so it arrives just as your nap ends — a so-called "coffee nap." If you regularly need long daytime naps to function, it is worth discussing your night-time sleep with a doctor.',
        ],
      },
    ],
    faq: [
      {
        q: 'How long should a power nap be?',
        a: 'About 10–20 minutes. That keeps you in light sleep, so you wake quickly feeling refreshed and alert without the grogginess of a longer nap.',
      },
      {
        q: 'Why do I feel worse after a long nap?',
        a: 'Napping for 30–60 minutes usually wakes you during deep sleep, causing sleep inertia — grogginess and disorientation. A 10–20 minute or full 90-minute nap avoids this.',
      },
      {
        q: 'When is the best time to take a nap?',
        a: 'Early afternoon, around 1–3 p.m., works best because it lines up with a natural dip in alertness and is far enough from bedtime to avoid disrupting night sleep.',
      },
    ],
    sources: [
      {
        citation:
          'Brooks A, Lack L. "A brief afternoon nap following nocturnal sleep restriction: which nap duration is most recovering?" Sleep. 2006;29(6):831–840.',
        url: pubmed('A brief afternoon nap which nap duration is most recovering Brooks Lack'),
      },
      SLEEP_CYCLE,
    ],
  },

  // ============================================================
  'sleep-debt-calculator': {
    seoTitle: 'Sleep Debt Calculator – Weekly Sleep Deficit',
    metaDescription:
      'Add up your sleep debt over a week by comparing target hours to actual sleep, and get practical tips to recover. Free sleep debt calculator.',
    intro:
      'Sleep debt is the running total of the sleep you miss compared with what your body needs. Enter your nightly target and how much you actually slept each day this week to see your cumulative debt — and how to repay it.',
    sections: [
      {
        h2: 'What is sleep debt?',
        paragraphs: [
          'Every night you sleep less than your body needs, the shortfall adds up. Miss an hour for five nights and you carry a five-hour sleep debt into the weekend. Research shows this debt is real: the effects of short sleep accumulate, steadily eroding attention, reaction time, mood and decision-making — often without you noticing how impaired you have become.',
          'This calculator adds up the gap between your target and your actual sleep across seven nights to show the total you owe.',
        ],
      },
      {
        h2: 'How it is calculated',
        paragraphs: [
          'The maths is simple: your weekly target is your nightly goal multiplied by seven. Your sleep debt is that target minus the total hours you actually slept. For example, with an 8-hour target (56 hours a week), sleeping a total of 49 hours leaves a 7-hour debt.',
          'The tool also shows your average nightly sleep and how many nights fell short, so you can see whether the problem is the occasional bad night or a consistent weekday shortfall.',
        ],
      },
      {
        h2: 'How to repay sleep debt',
        paragraphs: [
          'Small, recent sleep debt can be recovered within a few days. The best approach is gradual: add an extra hour or two per night rather than attempting one enormous weekend lie-in, which can throw off your body clock and make Monday harder. Going to bed earlier is usually better than sleeping in late.',
          'Chronic, long-term sleep debt is harder to undo and is linked to higher risks of weight gain, heart disease and impaired immunity. The most reliable fix is prevention: a consistent schedule, a dark and cool bedroom, and limiting caffeine and screens before bed. If you regularly cannot get enough sleep despite trying, speak to a healthcare professional.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can you catch up on lost sleep?',
        a: 'Small, recent sleep debt can be recovered over a few days by adding 1–2 extra hours a night. Long-term chronic debt is much harder to reverse, so prevention matters most.',
      },
      {
        q: 'Is it better to sleep in or go to bed earlier?',
        a: 'Going to bed earlier is usually better. Large weekend lie-ins shift your body clock and can make it harder to sleep well the following night, prolonging the cycle.',
      },
      {
        q: 'How much sleep debt is harmful?',
        a: 'Even one to two hours of nightly debt measurably impairs alertness and mood over a week. Ongoing debt is linked to higher risks of weight gain, heart disease and weakened immunity.',
      },
    ],
    sources: [
      {
        citation:
          'Van Dongen HPA, Maislin G, Mullington JM, Dinges DF. "The cumulative cost of additional wakefulness: dose-response effects on neurobehavioral functions… from chronic sleep restriction." Sleep. 2003;26(2):117–126.',
        url: pubmed('cumulative cost of additional wakefulness chronic sleep restriction Van Dongen'),
      },
      NSF_DURATION,
    ],
  },

  // ============================================================
  'blue-light-exposure-estimator': {
    seoTitle: 'Blue Light Exposure Estimator — Evening Screen Habits & Sleep',
    metaDescription:
      'Score your evening light hygiene: screen time before bed, device type, night mode, room lighting. Get a 0-100 score with specific tips to improve. Educational, not medical.',
    intro:
      'Answer 7 quick questions about your evening screen habits and lighting. Get a 0-100 evening light hygiene score with specific, actionable tips to reduce blue light before bed.',
    notice:
      'This is a habit score based on general circadian and sleep hygiene guidance. It does not measure melatonin suppression or circadian phase shift. Individual sensitivity to evening light varies. Educational only — not medical advice.',
    sections: [
      {
        h2: 'Why evening light matters for sleep',
        paragraphs: [
          'Your circadian rhythm uses light as its primary time cue. Bright, blue-rich light in the evening tells your brain it is still daytime, which can delay melatonin onset and push your sleep window later. The hour closest to bedtime has the strongest effect.',
          'Phones, tablets, and laptops emit blue-rich light directly toward your eyes. TV is further away but still adds ambient light. E-readers with e-ink displays emit far less blue light and are a better evening option.',
        ],
      },
      {
        h2: 'How the score works',
        paragraphs: [
          'Six factors are scored on points: pre-bed screen time (max 10), total evening screen time (max 8), device type (max 6), night mode or filter use (max 8), room lighting (max 5), and screen curfew before bed (max 3). The maximum is 40 points, scaled to 0-100.',
          'Your bedtime is contextual only — it does not affect the score but helps tailor the tips to your schedule.',
        ],
      },
      {
        h2: 'Practical tips to improve',
        paragraphs: [
          'The highest-impact changes are usually: (1) enable night mode or a blue-light filter 2 hours before bed, (2) dim room lights after dinner, (3) build a 30-60 minute screen curfew before bed, and (4) switch from a phone (held close to the face) to a larger screen further away or audio-only.',
          'You do not need to eliminate screens entirely — even reducing brightness, enabling warm filters, and putting the phone down 30 minutes earlier can make a noticeable difference in how easily you fall asleep.',
        ],
      },
      {
        h2: 'How this differs from the Caffeine Curfew and Sleep Calculator',
        paragraphs: [
          'This tool focuses specifically on light exposure in the evening. The Caffeine Curfew Calculator handles caffeine half-life and timing. The Sleep Calculator finds optimal bed/wake times using 90-minute sleep cycles. The Chronotype Quiz identifies your natural morning/evening tendency. Together, they cover the main lifestyle levers for better sleep.',
        ],
      },
    ],
    faq: [
      {
        q: 'Does blue light from screens really affect sleep?',
        a: 'Research shows that bright, blue-rich light in the evening can delay melatonin onset and push your sleep window later. The effect varies by individual, brightness, duration, and proximity to the eyes. The biggest concern is the hour closest to bedtime — that is why the score weights pre-bed screen time most heavily.',
      },
      {
        q: 'Is night mode or a blue-light filter enough?',
        a: 'Night mode helps — it shifts screen color to warmer tones and reduces blue light. But it does not eliminate all light, and brightness still matters. Combining night mode with dim room lights and a screen curfew is more effective than relying on night mode alone.',
      },
      {
        q: 'Are e-readers better than phones before bed?',
        a: 'E-ink e-readers (like the Kindle Paperwhite) emit far less blue light than phones, tablets, or laptops with LCD/OLED screens. They are a better choice for evening reading. However, even an e-reader with a frontlight adds some light — the darkest environment is still best for sleep.',
      },
      {
        q: 'Does this tool measure my melatonin levels?',
        a: 'No. This is a habit score based on your self-reported evening light behaviors. It does not measure melatonin, circadian phase, or any biological marker. If you have persistent sleep problems, talk to your doctor or a sleep specialist.',
      },
      {
        q: 'What about TV — is it as bad as phone use?',
        a: 'TV is typically viewed from across the room, so less light reaches your eyes directly. The score gives TV a higher rating (better) than phones for this reason. However, TV in a bright room late at night still adds ambient light that can affect sleep — dim the room and avoid watching right up to bedtime.',
      },
    ],
    sources: [
      {
        citation: 'Harvard Health. "Blue light has a dark side." — Blue light at night suppresses melatonin and can disrupt circadian rhythms.',
        url: 'https://www.health.harvard.edu/healthblog/blue-light-has-a-dark-side-2016070710348',
      },
      {
        citation: 'Chang AM, Aeschbach D, Duffy JF, Czeisler CA. "Evening use of light-emitting eReaders negatively affects sleep, circadian timing, and next-morning alertness." Proc Natl Acad Sci. 2015;112(4):1232–1237.',
        url: pubmed('Evening use light-emitting eReaders negatively affects sleep circadian timing next-morning alertness Chang'),
      },
      {
        citation: 'Centers for Disease Control and Prevention. "Sleep Hygiene." — Recommendations for creating a sleep-friendly environment including limiting evening light exposure.',
        url: 'https://www.cdc.gov/sleep/about-sleep/sleep-hygiene.html',
      },
    ],
  },
};
