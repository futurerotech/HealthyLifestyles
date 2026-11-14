/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { getQuiz, scoreQuiz } from './quizzes/quiz-defs';
import ShareResult from '../components/ShareResult';

const CRISIS =
  'If you’re in distress or crisis, reach out now: in the US & Canada call or text 988; in the UK call Samaritans on 116 123; in Australia call Lifeline on 13 11 14.';

export default function QuizCalculator({ slug }: { slug: string }) {
  const quiz = getQuiz(slug);
  // Wellness self-checks start at the lower-middle answer (a calm start).
  // Validated screeners start unanswered: a score must never include an answer
  // the person did not give (e.g. PHQ-9 item 9).
  const mid = quiz ? Math.floor((quiz.scale.length - 1) / 2) : 0;
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    quiz ? quiz.questions.map(() => (quiz.validated ? null : quiz.scale[mid].value)) : []
  );

  if (!quiz) return null;

  // Reuse terms not confirmed: no reproduced items, link to the official source.
  if (quiz.licenseHold) {
    return (
      <div class="calc">
        <div class="calc__form">
          <div class="calc__toolbar"><h2 class="calc__heading">{quiz.heading}</h2></div>
          <p class="quiz__hold">{quiz.licenseHold.message}</p>
          <p><a class="btn btn-outline" href={quiz.licenseHold.officialUrl} rel="noopener" target="_blank">{quiz.licenseHold.officialLabel}</a></p>
          {quiz.crisis && <p class="quiz__crisis">{CRISIS}</p>}
        </div>
      </div>
    );
  }

  const result = scoreQuiz(quiz, answers);
  const { score, maxScore, band, flags } = result;

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
        {flags.map((f) => (
          <p class={`quiz__flag quiz__flag--${f.tone}`} role={f.tone === 'urgent' ? 'alert' : undefined}>{f.message}</p>
        ))}
        {band ? (
          <>
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
          </>
        ) : (
          <p class="quiz__progress">
            {result.answered} of {result.total} answered. Answer every question to see your score — this screener is only scored when complete.
          </p>
        )}
        <p class="quiz__disclaimer">
          This is not a diagnostic tool. If you’re struggling, please talk to a qualified professional.
        </p>
        {quiz.crisis && <p class="quiz__crisis">{CRISIS}</p>}

        {/* Validated mental-health screener results are sensitive: no social
            share text or result image (which would carry the score and
            severity in a URL). Answers are never stored or sent anywhere. */}
        {band && !quiz.validated && (
          <ShareResult
            tool={quiz.heading}
            value={`${score}/${maxScore}`}
            label={quiz.scoreLabel}
            category={band.label}
            categoryColor={band.color}
            toolSlug={slug}
          />
        )}
      </div>
    </div>
  );
}
