/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import { ASSISTANT } from '../consts';
import {
  SYSTEM_PROMPT, DISTRESS_RE, MEDICAL_RE, CRISIS_REPLY, MEDICAL_REPLY, guidedReply, type ToolLink,
} from './assistant-rules';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
  kind?: 'crisis' | 'medical' | 'normal';
  tools?: ToolLink[];
}

const STARTERS = [
  'How much protein should I eat to build muscle?',
  'What does a waist-to-height ratio of 0.55 mean?',
  'Which tools help me train for a 10K?',
  'How many hours of sleep do I need?',
];

const GREETING: Msg = {
  role: 'assistant',
  text: 'Hi! I’m the HealthyLifeStyles assistant. Ask me a general wellness, nutrition, fitness, or sleep question and I’ll help — and point you to the right free calculator. I can’t give medical advice, so please see a professional for anything clinical.',
};

export default function AiAssistant() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const hasEndpoint = !!ASSISTANT.endpoint;

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const add = (m: Msg) => setMessages((prev) => [...prev, m]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    setInput('');
    const history = [...messages, { role: 'user', text } as Msg];
    add({ role: 'user', text });

    // Guardrails enforced client-side, always.
    if (DISTRESS_RE.test(text)) { add({ role: 'assistant', text: CRISIS_REPLY, kind: 'crisis' }); return; }
    if (MEDICAL_RE.test(text)) { add({ role: 'assistant', text: MEDICAL_REPLY, kind: 'medical' }); return; }

    if (hasEndpoint) {
      setBusy(true);
      try {
        const res = await fetch(ASSISTANT.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            system: SYSTEM_PROMPT,
            messages: history.map((m) => ({ role: m.role, content: m.text })),
          }),
        });
        if (!res.ok) throw new Error('bad response');
        const data = await res.json();
        const reply = (data && (data.reply || data.text)) || '';
        if (reply) add({ role: 'assistant', text: String(reply) });
        else { const g = guidedReply(text); add({ role: 'assistant', text: g.text, tools: g.tools }); }
      } catch {
        const g = guidedReply(text);
        add({ role: 'assistant', text: 'I had trouble reaching the assistant just now, but here’s what can help:', tools: g.tools });
      } finally {
        setBusy(false);
      }
    } else {
      const g = guidedReply(text);
      add({ role: 'assistant', text: g.text, tools: g.tools });
    }
  }

  const onSubmit = (e: Event) => { e.preventDefault(); send(input); };
  const showStarters = messages.length <= 1 && !busy;

  return (
    <div class="chat">
      <div class="chat__bar">
        <span class="chat__avatar" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>
        </span>
        <div>
          <strong>Wellness Assistant</strong>
          <span class="chat__status">{hasEndpoint ? 'Online' : 'Guided mode'}</span>
        </div>
      </div>

      <div class="chat__body" ref={bodyRef} aria-live="polite">
        {messages.map((m) => (
          <div class={`chat__msg chat__msg--${m.role}${m.kind ? ' chat__msg--' + m.kind : ''}`}>
            <p>{m.text}</p>
            {m.tools && m.tools.length > 0 && (
              <div class="chat__tools">
                {m.tools.map((t) => (
                  <a href={`/tools/${t.slug}`} class="chat__tool">{t.title}</a>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div class="chat__msg chat__msg--assistant">
            <p class="chat__typing"><span></span><span></span><span></span></p>
          </div>
        )}
      </div>

      {showStarters && (
        <div class="chat__starters">
          {STARTERS.map((q) => (
            <button type="button" class="chat__starter" onClick={() => send(q)}>{q}</button>
          ))}
        </div>
      )}

      <form class="chat__input" onSubmit={onSubmit}>
        <label class="visually-hidden" for="chat-text">Ask a wellness question</label>
        <input
          id="chat-text"
          type="text"
          autocomplete="off"
          placeholder="Ask a wellness question…"
          value={input}
          disabled={busy}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
        />
        <button type="submit" class="btn btn-primary" disabled={busy || !input.trim()}>Send</button>
      </form>
      <p class="chat__foot">General information only — not medical advice. For health concerns, consult a qualified professional.</p>
    </div>
  );
}
