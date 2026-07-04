/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { QUESTIONS, TYPES, computeChronotype, type TypeKey } from '../lib/chronotype';

export default function Chronotype() {
  const [answers, setAnswers] = useState<(TypeKey | null)[]>(() => QUESTIONS.map(() => null));
  const [result, setResult] = useState<TypeKey | null>(null);
  const [error, setError] = useState('');
  const [shareMsg, setShareMsg] = useState('');

  const pick = (qi: number, type: TypeKey) => {
    setAnswers((a) => a.map((v, i) => (i === qi ? type : v)));
    setError('');
  };

  const answered = answers.filter(Boolean).length;

  const submit = () => {
    if (answered < QUESTIONS.length) {
      setError(`Please answer all ${QUESTIONS.length} questions (${answered}/${QUESTIONS.length} done).`);
      return;
    }
    setResult(computeChronotype(answers));
    setShareMsg('');
    setTimeout(() => document.getElementById('ch-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const retake = () => {
    setAnswers(QUESTIONS.map(() => null));
    setResult(null);
    setError('');
    setTimeout(() => document.getElementById('ch-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const shareCard = async () => {
    if (!result) return;
    setShareMsg('');
    const t = TYPES[result];
    const W = 1200, H = 630;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a1628'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 900);
    g.addColorStop(0, 'rgba(99,102,241,0.4)'); g.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const sans = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8'; ctx.font = `600 28px ${sans}`;
    ctx.fillText('My sleep chronotype is…', W / 2, 130);
    ctx.font = `800 180px ${sans}`; ctx.fillText(t.emoji, W / 2, 320);
    ctx.fillStyle = '#fff'; ctx.font = `800 84px ${sans}`;
    ctx.fillText(`The ${t.name}`, W / 2, 430);
    ctx.fillStyle = '#c7d2fe'; ctx.font = `500 30px ${sans}`;
    ctx.fillText(t.tagline, W / 2, 484);
    ctx.fillStyle = '#64748b'; ctx.font = `500 22px ${sans}`;
    ctx.fillText('healthylifesstyles.com/tools/sleep-chronotype-quiz', W / 2, 588);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
    if (!blob) return;
    const file = new File([blob], 'my-chronotype.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
    if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      try { await nav.share({ files: [file], title: 'My sleep chronotype', text: `I'm a ${t.name} ${t.emoji} — what's your sleep chronotype?` }); return; } catch { /* */ }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'my-chronotype.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setShareMsg('Image saved — share it anywhere!');
  };

  if (result) {
    const t = TYPES[result];
    return (
      <div class="ch" id="ch-result">
        <p class="sr-only" role="status" aria-live="polite">Your sleep chronotype is the {t.name}: {t.tagline}.</p>
        <div class="ch__hero card">
          <span class="ch__hero-emoji">{t.emoji}</span>
          <span class="ch__hero-cap">You’re a</span>
          <h2 class="ch__hero-name">{t.name}</h2>
          <p class="ch__hero-tag">{t.tagline} · about {t.share}% of people</p>
          <p class="ch__hero-desc">{t.description}</p>
        </div>

        <section class="ch__schedule card">
          <h2 class="ch__h">Your ideal day</h2>
          <ol class="ch__sched-list">
            {t.schedule.map((s) => (
              <li><span class="ch__sched-time">{s.time}</span><span class="ch__sched-label">{s.label}</span></li>
            ))}
          </ol>
        </section>

        <section class="ch__tips card">
          <h2 class="ch__h">Make it work for you</h2>
          <ul>{t.tips.map((tip) => <li><span class="ch__tip-dot" aria-hidden="true">✓</span><span>{tip}</span></li>)}</ul>
        </section>

        <section class="ch__tips card">
          <h2 class="ch__h">Circadian rhythm tips</h2>
          <ul>{t.circadianTips.map((tip) => <li><span class="ch__tip-dot" aria-hidden="true">✓</span><span>{tip}</span></li>)}</ul>
        </section>

        <section class="ch__share card">
          <div><h2 class="ch__h">Share your type</h2><p class="ch__share-sub">Post your chronotype and compare with friends.</p></div>
          <div class="ch__share-btns">
            <button type="button" class="btn btn-primary" onClick={shareCard}>Share result</button>
            <button type="button" class="btn btn-outline" onClick={retake}>Retake quiz</button>
          </div>
          {shareMsg && <p class="ch__share-msg">{shareMsg}</p>}
        </section>

        <p class="ch__note">For fun and general guidance — not a clinical sleep assessment. If sleep problems persist, talk to a healthcare professional.</p>
      </div>
    );
  }

  return (
    <div class="ch" id="ch-top">
      <p class="ch__intro">Answer {QUESTIONS.length} quick questions to discover whether you’re a Lion, Bear, Wolf, or Dolphin — and get the daily schedule that fits your body clock.</p>
      <div class="ch__progress-top"><div class="ch__progress-bar" style={`width:${(answered / QUESTIONS.length) * 100}%`}></div></div>
      {QUESTIONS.map((question, qi) => (
        <fieldset class="ch__q card">
          <legend>{qi + 1}. {question.q}</legend>
          <div class="ch__opts">
            {question.options.map((opt) => (
              <label class={`ch__opt ${answers[qi] === opt.type ? 'is-on' : ''}`}>
                <input type="radio" name={`q${qi}`} checked={answers[qi] === opt.type} onChange={() => pick(qi, opt.type)} />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && <p class="ch__error" role="alert">{error}</p>}
      <button type="button" class="btn btn-primary btn-lg ch__go" onClick={submit}>See my chronotype</button>
    </div>
  );
}
