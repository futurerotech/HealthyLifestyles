/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { getQuiz, type QuizBand } from './quizzes/quiz-defs';
import ShareResult from '../components/ShareResult';

const CRISIS =
  'If you’re in distress or crisis, reach out now: in the US & Canada call or text 988; in the UK call Samaritans on 116 123; in Australia call Lifeline on 13 11 14.';

function bandFor(pct: number, bands: QuizBand[]): QuizBand {
  return bands.find((b) => pct <= b.upToPct) ?? bands[bands.length - 1];
}

export default function QuizCalculator({ slug }: { slug: string }) {
  const quiz = getQuiz(slug);
  // Default each question to the lower-middle answer (a calm, non-alarming start).
  const mid = quiz ? Math.floor((quiz.scale.length - 1) / 2) : 0;
  const [answers, setAnswers] = useState<number[]>(() =>
    quiz ? quiz.questions.map(() => quiz.scale[mid].value) : []
  );

  if (!quiz) return null;

  const maxScore = quiz.questions.length * Math.max(...quiz.scale.map((o) => o.value));
  const score = answers.reduce((a, b) => a + b, 0);
  // Express as "% concern" so band thresholds read consistently regardless of polarity.
  const pct = maxScore ? (score / maxScore) * 100 : 0;
  const band = bandFor(pct, quiz.bands);

  const setAnswer = (qi: number, value: number) =>
    setAnswers((prev) => prev.map((a, i) => (i === qi ? value : a)));

  const id = (s: string) => `quiz-${slug}-${s}`;

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar"><h2 class="calc__heading">{quiz.heading}</h2></div>
        <p class="calc__help">Answer honestly about the past two weeks. There are no right or wrong answers.</p>
        <div class="quiz">
          {quiz.questions.map((q, qi) => (
            <fieldset class="quiz__q">
              <legend class="quiz__legend">{q}</legend>
              <div class="quiz__opts">
                {quiz.scale.map((opt) => (
                  <label class="quiz__opt">
                    <input
                      type="radio"
                      name={id(`q${qi}`)}
                      checked={answers[qi] === opt.value}
                      onChange={() => setAnswer(qi, opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div class="calc__result" aria-live="polite">
        <div class="calc__headline">
          <span class="calc__result-label">{quiz.scoreLabel}</span>
          <span class="calc__value">{score} <span class="quiz__max">/ {maxScore}</span></span>
          <span class="calc__badge" style={`--badge:${band.color}`}>{band.label}</span>
        </div>
        <p class="quiz__summary">{band.summary}</p>
        <div class="sleep-tips">
          <h3>Things that may help</h3>
          <ul>{band.tips.map((t) => <li>{t}</li>)}</ul>
        </div>
        <p class="quiz__disclaimer">
          This is not a diagnostic tool. If you’re struggling, please talk to a qualified professional.
        </p>
        {quiz.crisis && <p class="quiz__crisis">{CRISIS}</p>}

        <ShareResult
          tool={quiz.heading}
          value={`${score}/${maxScore}`}
          label={quiz.scoreLabel}
          category={band.label}
          categoryColor={band.color}
          toolSlug={slug}
        />
      </div>
    </div>
  );
}
