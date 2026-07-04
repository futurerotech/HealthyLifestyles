/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';

/* ── Types ─────────────────────────────────────────────────────────── */
interface Entry {
  id: string;
  datetime: string;        // ISO local datetime
  foods: string;            // free-text, e.g. "oats, blueberries, milk"
  symptoms: string[];       // from SYMPTOMS list
  severity: number;          // 1–5
  notes: string;
}

/* ── Constants ─────────────────────────────────────────────────────── */
const STORE = 'hls-food-symptom-diary';

const SYMPTOMS = [
  'Bloating',
  'Gas',
  'Stomach pain / cramps',
  'Nausea',
  'Heartburn',
  'Diarrhea',
  'Constipation',
  'Headache',
  'Fatigue',
  'Skin flare',
  'Joint pain',
  'Brain fog',
] as const;

const RED_FLAG_SYMPTOMS = [
  'Trouble breathing',
  'Throat swelling / tightness',
  'Lip / tongue swelling',
  'Hives (widespread)',
  'Dizziness / fainting',
] as const;

const ALL_SYMPTOMS = [...SYMPTOMS, ...RED_FLAG_SYMPTOMS] as const;

const SEVERITY_LABELS: Record<number, string> = {
  1: '1 — Minimal',
  2: '2 — Mild',
  3: '3 — Moderate',
  4: '4 — Strong',
  5: '5 — Severe',
};

const PATTERN_WINDOW_HOURS = 6;

/* ── Utility ───────────────────────────────────────────────────────── */
const now = () => new Date().toISOString().slice(0, 16);

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const hasRedFlag = (symptoms: string[]) =>
  symptoms.some((s) => (RED_FLAG_SYMPTOMS as readonly string[]).includes(s));

/* ── Pattern detection ─────────────────────────────────────────────── */
interface Pattern {
  food: string;
  symptom: string;
  count: number;
}

function detectPatterns(entries: Entry[]): Pattern[] {
  const sorted = [...entries].sort((a, b) => a.datetime.localeCompare(b.datetime));
  const map = new Map<string, number>();

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (!entry.foods.trim() || entry.symptoms.length === 0) continue;

    const foods = entry.foods
      .split(/[,;]/)
      .map((f) => f.trim().toLowerCase())
      .filter(Boolean);

    // Check same-entry food+symptom (most common: user logs both at once)
    for (const food of foods) {
      for (const sym of entry.symptoms) {
        const key = `${food}|||${sym.toLowerCase()}`;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }

    // Check if a symptom entry follows a food-only entry within window
    for (let j = i + 1; j < sorted.length; j++) {
      const later = sorted[j];
      const gapH = (new Date(later.datetime).getTime() - new Date(entry.datetime).getTime()) / 3.6e6;
      if (gapH > PATTERN_WINDOW_HOURS) break;
      if (gapH < 0) continue;

      if (later.symptoms.length === 0) continue;
      for (const food of foods) {
        for (const sym of later.symptoms) {
          const key = `${food}|||${sym.toLowerCase()}`;
          map.set(key, (map.get(key) ?? 0) + 1);
        }
      }
    }
  }

  return [...map.entries()]
    .filter(([, count]) => count >= 2)
    .map(([key, count]) => {
      const [food, symptom] = key.split('|||');
      return {
        food: food.charAt(0).toUpperCase() + food.slice(1),
        symptom: symptom.charAt(0).toUpperCase() + symptom.slice(1),
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/* ── Component ─────────────────────────────────────────────────────── */
export default function FoodSymptomDiary() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [datetime, setDatetime] = useState(now());
  const [foods, setFoods] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(2);
  const [notes, setNotes] = useState('');

  /* Load from localStorage on mount (client-only — no hydration mismatch) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch {
      /* private mode / quota — ignore */
    }
    setLoaded(true);
  }, []);

  /* Persist on every change */
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }, [entries, loaded]);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym],
    );
  };

  const resetForm = () => {
    setDatetime(now());
    setFoods('');
    setSelectedSymptoms([]);
    setSeverity(2);
    setNotes('');
  };

  const addEntry = (e: Event) => {
    e.preventDefault();
    if (!foods.trim() && selectedSymptoms.length === 0) return;

    const entry: Entry = {
      id: uid(),
      datetime,
      foods: foods.trim(),
      symptoms: [...selectedSymptoms],
      severity: selectedSymptoms.length > 0 ? severity : 0,
      notes: notes.trim(),
    };
    setEntries((prev) => [...prev, entry]);
    resetForm();
    setShowForm(false);
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const clearAll = () => {
    if (confirm('Delete ALL diary entries? This cannot be undone.')) {
      setEntries([]);
    }
  };

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.datetime.localeCompare(a.datetime)),
    [entries],
  );

  const patterns = useMemo(() => detectPatterns(entries), [entries]);

  const formHasRedFlag = hasRedFlag(selectedSymptoms);
  const anyEntryRedFlag = entries.some((e) => hasRedFlag(e.symptoms));

  if (!loaded) return <div class="calc" />;

  return (
    <div class="calc diary">
      {/* ── Emergency banner ─────────────────────────────────────────── */}
      {(formHasRedFlag || anyEntryRedFlag) && (
        <div class="diary__emergency">
          <strong>Seek emergency help now.</strong> If you or someone near you has
          trouble breathing, throat swelling, or feels faint after eating, call your
          local emergency number immediately. Do not wait — severe allergic reactions
          can be life-threatening.
        </div>
      )}

      {/* ── Safety notice ────────────────────────────────────────────── */}
      <div class="diary__safety">
        <strong>This is a diary, not a test.</strong> It helps you record foods and
        symptoms to discuss with a doctor or dietitian. It does <em>not</em> diagnose
        allergies, intolerances, or any condition. True food allergy testing must be
        done by a qualified healthcare professional.
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div class="diary__toolbar">
        <div class="diary__stats">
          <span class="diary__stat">
            <strong>{entries.length}</strong> {entries.length === 1 ? 'entry' : 'entries'}
          </span>
          <span class="diary__stat">
            <strong>{new Set(entries.map((e) => e.datetime.slice(0, 10))).size}</strong> days
          </span>
        </div>
        <div class="diary__actions">
          {entries.length > 0 && (
            <>
              <button type="button" class="diary__btn diary__btn--print" onClick={() => window.print()}>
                Print timeline
              </button>
              <button type="button" class="diary__btn diary__btn--danger" onClick={clearAll}>
                Clear all
              </button>
            </>
          )}
          <button
            type="button"
            class="diary__btn diary__btn--primary"
            onClick={() => { resetForm(); setShowForm(!showForm); }}
          >
            {showForm ? 'Cancel' : '+ Add entry'}
          </button>
        </div>
      </div>

      {/* ── Add-entry form ───────────────────────────────────────────── */}
      {showForm && (
        <form class="diary__form" onSubmit={addEntry}>
          <div class="diary__field">
            <label class="diary__label" for="diary-dt">When did you eat / feel symptoms?</label>
            <input
              id="diary-dt"
              type="datetime-local"
              class="diary__input"
              value={datetime}
              onInput={(e) => setDatetime((e.target as HTMLInputElement).value)}
              required
            />
          </div>

          <div class="diary__field">
            <label class="diary__label" for="diary-foods">What did you eat / drink?</label>
            <input
              id="diary-foods"
              type="text"
              class="diary__input"
              placeholder="e.g. oats, blueberries, milk, coffee"
              value={foods}
              onInput={(e) => setFoods((e.target as HTMLInputElement).value)}
            />
            <p class="diary__hint">Separate foods with commas. Include portions if you can.</p>
          </div>

          <div class="diary__field">
            <span class="diary__label">Symptoms (select any)</span>
            <div class="diary__chips">
              {SYMPTOMS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  class={`diary__chip ${selectedSymptoms.includes(sym) ? 'diary__chip--on' : ''}`}
                  onClick={() => toggleSymptom(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
            <div class="diary__chips diary__chips--red">
              {RED_FLAG_SYMPTOMS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  class={`diary__chip diary__chip--red ${selectedSymptoms.includes(sym) ? 'diary__chip--on' : ''}`}
                  onClick={() => toggleSymptom(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
            {formHasRedFlag && (
              <p class="diary__redflag-note">
                Red-flag symptom selected. See the emergency banner above — seek immediate help.
              </p>
            )}
          </div>

          {selectedSymptoms.length > 0 && (
            <div class="diary__field">
              <label class="diary__label" for="diary-sev">Severity</label>
              <select
                id="diary-sev"
                class="diary__select"
                value={severity}
                onChange={(e) => setSeverity(Number((e.target as HTMLSelectElement).value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{SEVERITY_LABELS[n]}</option>
                ))}
              </select>
            </div>
          )}

          <div class="diary__field">
            <label class="diary__label" for="diary-notes">Notes (optional)</label>
            <textarea
              id="diary-notes"
              class="diary__textarea"
              rows={2}
              placeholder="Anything else: stress, sleep, exercise, supplements..."
              value={notes}
              onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          <button type="submit" class="diary__btn diary__btn--primary diary__btn--lg">
            Save entry
          </button>
        </form>
      )}

      {/* ── Pattern observations ────────────────────────────────────── */}
      {patterns.length > 0 && (
        <div class="diary__patterns">
          <h3 class="diary__patterns-title">Observations</h3>
          <p class="diary__patterns-intro">
            These are <strong>observations, not diagnoses</strong>. They show foods that
            appeared before symptoms in your log. Share them with your doctor or dietitian.
          </p>
          <ul class="diary__patterns-list">
            {patterns.map((p, i) => (
              <li key={i} class="diary__pattern">
                <span class="diary__pattern-food">{p.food}</span> appeared before
                <span class="diary__pattern-sym">{p.symptom}</span>
                <span class="diary__pattern-count">{p.count}x</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Timeline ────────────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <div class="diary__empty">
          <p>No entries yet.</p>
          <button type="button" class="diary__btn diary__btn--primary" onClick={() => setShowForm(true)}>
            + Log your first meal or symptom
          </button>
        </div>
      ) : (
        <div class="diary__timeline">
          {sorted.map((entry) => {
            const isRed = hasRedFlag(entry.symptoms);
            return (
              <div key={entry.id} class={`diary__entry ${isRed ? 'diary__entry--red' : ''}`}>
                <div class="diary__entry-dot" />
                <div class="diary__entry-body">
                  <div class="diary__entry-head">
                    <time class="diary__entry-time">{fmtDateTime(entry.datetime)}</time>
                    {entry.severity > 0 && (
                      <span class={`diary__sev diary__sev--${entry.severity}`}>
                        {SEVERITY_LABELS[entry.severity]}
                      </span>
                    )}
                    <button
                      type="button"
                      class="diary__entry-del"
                      onClick={() => deleteEntry(entry.id)}
                      aria-label="Delete entry"
                    >
                      x
                    </button>
                  </div>
                  {entry.foods && (
                    <p class="diary__entry-foods">
                      <span class="diary__entry-label">Foods:</span> {entry.foods}
                    </p>
                  )}
                  {entry.symptoms.length > 0 && (
                    <p class="diary__entry-symptoms">
                      <span class="diary__entry-label">Symptoms:</span>{' '}
                      {entry.symptoms.map((s) => (
                        <span
                          key={s}
                          class={`diary__tag ${hasRedFlag([s]) ? 'diary__tag--red' : ''}`}
                        >
                          {s}
                        </span>
                      ))}
                    </p>
                  )}
                  {entry.notes && (
                    <p class="diary__entry-notes">{entry.notes}</p>
                  )}
                  {isRed && (
                    <p class="diary__entry-redflag">
                      Red-flag symptom recorded. If this was an acute reaction, seek emergency care.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
