/** @jsxImportSource preact */
import { useState } from 'preact/hooks';

interface Props {
  /** Headline for the CTA card. */
  headline: string;
  /** Short description. */
  description?: string;
  /** Button label. */
  buttonLabel: string;
  /** Whether to collect first name. */
  collectName: boolean;
  /** Offer identifier (sent to n8n). */
  offerName: string;
  /** Tool name (sent to n8n). */
  tool: string;
  /** Success message shown after submit. */
  successMessage: string;
}

export default function LeadForm({ headline, description, buttonLabel, collectName, offerName, tool, successMessage }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          offer: offerName,
          tool,
          sourcePage: window.location.href,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div class="lead-form lead-form--done">
        <div class="lead-form__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p class="lead-form__success">{successMessage}</p>
      </div>
    );
  }

  return (
    <form class="lead-form" onSubmit={handleSubmit} noValidate>
      <p class="lead-form__headline">{headline}</p>
      {description && <p class="lead-form__desc">{description}</p>}

      {collectName && (
        <label class="lead-form__field">
          <span class="sr-only">First name</span>
          <input
            type="text"
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            placeholder="First name"
            autocomplete="given-name"
          />
        </label>
      )}

      <label class="lead-form__field">
        <span class="sr-only">Email address</span>
        <input
          type="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          placeholder="you@example.com"
          required
          autocomplete="email"
        />
      </label>

      {error && <p class="lead-form__error">{error}</p>}

      <button type="submit" class="btn btn-primary lead-form__btn" disabled={submitting}>
        {submitting ? 'Sending...' : buttonLabel}
      </button>

      <p class="lead-form__note">No spam. Unsubscribe anytime.</p>
    </form>
  );
}
