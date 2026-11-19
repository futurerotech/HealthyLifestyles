/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';

import {
  type DiaryEntry as Entry, SYMPTOMS, RED_FLAG_SYMPTOMS, SEVERITY_LABELS,
  MAX_FOODS_LENGTH, MAX_NOTES_LENGTH, localDateTime, parseLocalDateTime,
  parseStoredDiary, validateDiaryInput, hasRedFlag, detectDiaryPatterns,
} from '../lib/foodSymptomDiary';
const STORE = 'hls-food-symptom-diary'; // preserve original local records
const now = () => localDateTime();
const fmtDateTime = (value: string) => {
  const date = parseLocalDateTime(value);
  return date ? date.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : value;
};
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ── Component ─────────────────────────────────────────────────────── */
export default function FoodSymptomDiary() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [storageState, setStorageState] = useState<'ready' | 'unavailable' | 'invalid' | 'changed'>('ready');
  const [formError, setFormError] = useState('');

  // Form state
  const [datetime, setDatetime] = useState(now());
  const [foods, setFoods] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(2);
  const [notes, setNotes] = useState('');

  /* Preserve unreadable legacy storage instead of overwriting it with []. */
  useEffect(() => {
    let raw: string | null;
    try { raw = localStorage.getItem(STORE); }
    catch { setStorageState('unavailable'); setLoaded(true); return; }
    if (raw !== null) {
      try {
        const valid = parseStoredDiary(JSON.parse(raw));
        if (valid === null) setStorageState('invalid');
        else setEntries(valid);
      } catch { setStorageState('invalid'); }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || storageState !== 'ready') return;
    try {
      if (entries.length) localStorage.setItem(STORE, JSON.stringify(entries));
      else localStorage.removeItem(STORE);
    } catch { setStorageState('unavailable'); }
  }, [entries, loaded, storageState]);

  /* Avoid overwriting changes saved by another same-origin browser tab. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE || e.key === null) {
        setStorageState(prev => prev === 'ready' ? 'changed' : prev);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const clearUnreadableData = () => {
    if (!window.confirm('Clear unreadable saved diary data? It cannot be recovered here.')) return;
    try { localStorage.removeItem(STORE); setEntries([]); setStorageState('ready'); }
    catch { setStorageState('unavailable'); }
  };

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
    setFormError('');
  };

  const addEntry = (e: Event) => {
    e.preventDefault();
    const draft = {
      datetime, foods: foods.trim(), symptoms: [...selectedSymptoms],
      severity: selectedSymptoms.length ? severity : 0, notes: notes.trim(),
    };
    const error = validateDiaryInput(draft);
    if (error) { setFormError(error); return; }
    const entry: Entry = { id: uid(), ...draft };
    setEntries(prev => [...prev, entry]);
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

  const patterns = useMemo(() => detectDiaryPatterns(entries), [entries]);

  const formHasRedFlag = hasRedFlag(selectedSymptoms);
  const anyEntryRedFlag = entries.some((e) => hasRedFlag(e.symptoms));

  if (!loaded) return <div class="calc" />;

  return (
    <div class="calc diary">
      {/* Current and past reported warning signs are not the same event. */}
      {(formHasRedFlag || anyEntryRedFlag) && (
        <div class="diary__emergency" role="alert">
          <strong>Possible serious allergic symptoms recorded.</strong> If symptoms
          are happening now—especially breathing difficulty, throat tightness,
          tongue swelling, fainting or symptoms in multiple body systems—use
          prescribed epinephrine according to your emergency action plan and
          call local emergency services immediately. Do not wait for a diary
          pattern or rely on antihistamines alone. Discuss past events with
          a qualified clinician or allergist.
        </div>
      )}

      {/* ── Safety notice ────────────────────────────────────────────── */}
      <div class="diary__safety">
        <strong>This is a diary, not a test.</strong> It helps you record foods and
        symptoms to discuss with a doctor or dietitian. It does <em>not</em> diagnose
        allergies, intolerances, or any condition. True food allergy testing must be
        done by a qualified healthcare professional.
        <p class="diary__privacy">
          <strong>Privacy:</strong> Entries are stored in this browser profile's
          localStorage without encryption by this diary. People using this profile
          and scripts running on this site's origin may access them. The diary
          does not sync or back up entries; clearing site data can erase them.
          Printing or saving a PDF creates a separate sensitive copy outside
          this browser. Avoid shared devices.
        </p>
      </div>
      {storageState !== 'ready' && (
        <div class="diary__storage-warning" role="status">
          {storageState === 'invalid'
            ? 'Saved diary data could not be read safely. It has NOT been overwritten. New changes in this tab are temporary until you choose to clear the unreadable saved data.'
            : storageState === 'changed'
              ? 'The diary changed in another tab. This tab will not overwrite it. Reload before further edits.'
              : 'Browser storage is unavailable or full. Entries in this tab are NOT reliably saved. Print a copy if needed.'}
          {storageState === 'invalid' && (
            <button type="button" class="diary__btn diary__btn--danger" onClick={clearUnreadableData}>
              Clear unreadable saved data
            </button>
          )}
        </div>
      )}

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
              min="1900-01-01T00:00"
              max={now()}
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
              maxLength={MAX_FOODS_LENGTH}
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
                  aria-pressed={selectedSymptoms.includes(sym)}
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
                  aria-pressed={selectedSymptoms.includes(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
            {formHasRedFlag && (
              <p class="diary__redflag-note">
                Warning symptom selected. If the reaction is happening now, follow emergency guidance above immediately.
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
              maxLength={MAX_NOTES_LENGTH}
            />
          </div>

          {formError && <p class="diary__form-error" role="alert">{formError}</p>}
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
            These are <strong>timing observations, not a diagnosis or proof of cause</strong>.
            They count distinct nonemergency symptom times logged after a food in a
            separate earlier entry within an illustrative six-hour window.
            Same-entry notes cannot establish order; repeating foods or meals
            does not increase a single symptom count. Other unrecorded factors
            may explain a symptom. Discuss patterns with a clinician and never
            deliberately re-expose yourself to a suspected allergen.
          </p>
          <ul class="diary__patterns-list">
            {patterns.map((p, i) => (
              <li key={i} class="diary__pattern">
                <span class="diary__pattern-food">{p.food}</span> was logged within six hours before
                <span class="diary__pattern-sym">{p.symptom}</span>
                <span class="diary__pattern-count">{p.count} distinct times</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p class="diary__print-confidential">
        Sensitive personal health diary — share only with the intended healthcare professional.
        User-reported local timestamps do not establish food causation.
      </p>

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
                    <time class="diary__entry-time" dateTime={entry.datetime}>{fmtDateTime(entry.datetime)}</time>
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
                      Warning symptom recorded. If symptoms are current or recur severely,
                      follow the emergency action plan and seek urgent care.
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
