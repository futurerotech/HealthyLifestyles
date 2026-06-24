/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { addDays, diffDays, formatDate, parseDateInput, toDateInputValue, trimesterOf } from '../lib/dates';
import { milestoneFor } from '../data/pregnancy-milestones';

// ---------- shared ----------
function useToday(): Date | null {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  return today;
}

const intNum = (s: string, fallback: number): number => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

function DateField({ id, label, value, onChange, help }: { id: string; label: string; value: string; onChange: (v: string) => void; help?: string }) {
  return (
    <div class="calc__field">
      <label class="calc__label" for={id}>{label}</label>
      <div class="calc__input">
        <input type="date" id={id} value={value} onInput={(e) => onChange((e.target as HTMLInputElement).value)} />
      </div>
      {help && <p class="calc__help">{help}</p>}
    </div>
  );
}

function NumField({ id, label, value, onChange, min, max, suffix }: { id: string; label: string; value: string; onChange: (v: string) => void; min: number; max: number; suffix: string }) {
  return (
    <div class="calc__field">
      <label class="calc__label" for={id}>{label}</label>
      <div class="calc__input">
        <input type="number" inputMode="numeric" min={min} max={max} step="1" id={id} value={value} onInput={(e) => onChange((e.target as HTMLInputElement).value)} />
        <span class="calc__suffix">{suffix}</span>
      </div>
    </div>
  );
}

function SelectField({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div class="calc__field">
      <label class="calc__label" for={id}>{label}</label>
      <div class="calc__select">
        <select id={id} value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value)}>
          {options.map((o) => <option value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}

const Placeholder = () => <p class="calc__placeholder">Enter your dates above to see your result.</p>;

// ---------- 1. Due date ----------
function DueDateCalc() {
  const today = useToday();
  const [method, setMethod] = useState('lmp');
  const [date, setDate] = useState('');
  const [embryo, setEmbryo] = useState('5');
  useEffect(() => { if (today && !date) setDate(toDateInputValue(addDays(today, -56))); }, [today]);

  const base = parseDateInput(date);
  const dateLabel = method === 'lmp' ? 'First day of last period' : method === 'conception' ? 'Conception date' : 'Embryo transfer date';

  let body = <Placeholder />;
  if (today && base) {
    const lmpEquiv =
      method === 'lmp' ? base
      : method === 'conception' ? addDays(base, -14)
      : addDays(base, -(14 + (embryo === '3' ? 3 : 5)));
    const due = addDays(lmpEquiv, 280);
    const ga = diffDays(today, lmpEquiv);
    const weeks = Math.floor(ga / 7);
    const days = ((ga % 7) + 7) % 7;
    const toGo = diffDays(due, today);
    body = (
      <>
        <div class="calc__headline">
          <span class="calc__result-label">Estimated due date</span>
          <span class="calc__value">{formatDate(due)}</span>
          <span class="calc__badge" style="--badge:#ec4899">{trimesterOf(weeks)}</span>
        </div>
        <dl class="calc__rows">
          <div class="calc__row is-strong"><dt>Current gestational age</dt><dd>{weeks >= 0 ? `${weeks} weeks ${days} days` : 'Not started yet'}</dd></div>
          <div class="calc__row"><dt>{toGo >= 0 ? 'Time remaining' : 'Past due by'}</dt><dd>{`${Math.abs(Math.round(toGo / 7))} weeks ${Math.abs(toGo % 7)} days`}</dd></div>
          <div class="calc__row"><dt>Method</dt><dd>{method === 'lmp' ? "Naegele's rule (LMP + 280 days)" : method === 'conception' ? 'Conception + 266 days' : `IVF day-${embryo} transfer`}</dd></div>
        </dl>
        <p class="calc__note">A due date is an estimate of 40 weeks’ gestation; only about 1 in 20 babies arrive on the exact date.</p>
      </>
    );
  }

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar"><h2 class="calc__heading">Pregnancy Due Date</h2></div>
        <SelectField id="dd-method" label="Calculate by" value={method} onChange={setMethod}
          options={[{ value: 'lmp', label: 'Last menstrual period' }, { value: 'conception', label: 'Conception date' }, { value: 'ivf', label: 'IVF embryo transfer' }]} />
        <DateField id="dd-date" label={dateLabel} value={date} onChange={setDate} />
        {method === 'ivf' && (
          <SelectField id="dd-embryo" label="Embryo age at transfer" value={embryo} onChange={setEmbryo}
            options={[{ value: '5', label: 'Day 5 (blastocyst)' }, { value: '3', label: 'Day 3' }]} />
        )}
      </div>
      <div class="calc__result" aria-live="polite">{body}</div>
    </div>
  );
}

// ---------- 2. Pregnancy week-by-week ----------
function PregnancyWeekCalc() {
  const today = useToday();
  const [lmp, setLmp] = useState('');
  useEffect(() => { if (today && !lmp) setLmp(toDateInputValue(addDays(today, -84))); }, [today]);

  const base = parseDateInput(lmp);
  let body = <Placeholder />;
  if (today && base) {
    const ga = diffDays(today, base);
    const weeks = Math.max(0, Math.floor(ga / 7));
    const days = ((ga % 7) + 7) % 7;
    const due = addDays(base, 280);
    const pct = Math.max(0, Math.min(100, (ga / 280) * 100));
    body = (
      <>
        <div class="calc__headline">
          <span class="calc__result-label">Current gestational age</span>
          <span class="calc__value">Week {weeks}</span>
          <span class="calc__badge" style="--badge:#ec4899">{trimesterOf(weeks)}</span>
        </div>
        <div class="preg-bar" role="img" aria-label={`${weeks} of about 40 weeks`}>
          <span class="preg-bar__fill" style={`width:${pct}%`} />
        </div>
        <p class="calc__callout calc__callout--info"><strong>Week {weeks}:</strong> {milestoneFor(weeks)}</p>
        <dl class="calc__rows">
          <div class="calc__row"><dt>Days into week {weeks}</dt><dd>{days} {days === 1 ? 'day' : 'days'}</dd></div>
          <div class="calc__row"><dt>Weeks remaining</dt><dd>{Math.max(0, 40 - weeks)} weeks</dd></div>
          <div class="calc__row is-strong"><dt>Estimated due date</dt><dd>{formatDate(due)}</dd></div>
        </dl>
      </>
    );
  }

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar"><h2 class="calc__heading">Pregnancy Week-by-Week</h2></div>
        <DateField id="pw-lmp" label="First day of last period" value={lmp} onChange={setLmp} help="Gestational age is counted from the first day of your last period." />
      </div>
      <div class="calc__result" aria-live="polite">{body}</div>
    </div>
  );
}

// ---------- 3. Ovulation & fertile window ----------
function OvulationCalc() {
  const today = useToday();
  const [lmp, setLmp] = useState('');
  const [cycle, setCycle] = useState('28');
  useEffect(() => { if (today && !lmp) setLmp(toDateInputValue(addDays(today, -7))); }, [today]);

  const base = parseDateInput(lmp);
  let body = <Placeholder />;
  if (today && base) {
    const c = intNum(cycle, 28);
    let ov = addDays(base, c - 14);
    let np = addDays(base, c);
    let guard = 0;
    while (diffDays(ov, today) < 0 && guard < 24) { ov = addDays(ov, c); np = addDays(np, c); guard++; }
    const fertileStart = addDays(ov, -5);
    body = (
      <>
        <div class="calc__headline">
          <span class="calc__result-label">Estimated ovulation</span>
          <span class="calc__value">{formatDate(ov)}</span>
        </div>
        <dl class="calc__rows">
          <div class="calc__row is-strong"><dt>Fertile window</dt><dd>{formatDate(fertileStart)} – {formatDate(ov)}</dd></div>
          <div class="calc__row"><dt>Most fertile days</dt><dd>{formatDate(addDays(ov, -2))} – {formatDate(ov)}</dd></div>
          <div class="calc__row"><dt>Next period expected</dt><dd>{formatDate(np)}</dd></div>
        </dl>
        <p class="calc__note">Ovulation is estimated about 14 days before your next period. The 6-day fertile window ends on ovulation day; conception is most likely in the 2 days before it.</p>
      </>
    );
  }

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar"><h2 class="calc__heading">Ovulation & Fertile Window</h2></div>
        <DateField id="ov-lmp" label="First day of your last period" value={lmp} onChange={setLmp} />
        <NumField id="ov-cycle" label="Average cycle length" value={cycle} onChange={setCycle} min={20} max={45} suffix="days" />
      </div>
      <div class="calc__result" aria-live="polite">{body}</div>
    </div>
  );
}

// ---------- 4. Period / menstrual cycle ----------
function PeriodCalc() {
  const today = useToday();
  const [last, setLast] = useState('');
  const [cycle, setCycle] = useState('28');
  const [period, setPeriod] = useState('5');
  useEffect(() => { if (today && !last) setLast(toDateInputValue(addDays(today, -20))); }, [today]);

  const base = parseDateInput(last);
  let body = <Placeholder />;
  if (today && base) {
    const c = intNum(cycle, 28);
    const p = intNum(period, 5);
    let start = addDays(base, c);
    let guard = 0;
    while (diffDays(start, today) < 0 && guard < 24) { start = addDays(start, c); guard++; }
    const periods = [0, 1, 2].map((i) => {
      const s = addDays(start, c * i);
      return { n: i + 1, start: s, end: addDays(s, p - 1) };
    });
    const nextOv = addDays(start, -14);
    body = (
      <>
        <div class="calc__headline">
          <span class="calc__result-label">Next period expected</span>
          <span class="calc__value">{formatDate(periods[0].start)}</span>
        </div>
        <ul class="sleep-list">
          {periods.map((pr) => (
            <li class={`sleep-opt${pr.n === 1 ? ' is-good' : ''}`}>
              <span class="sleep-opt__meta">
                <span class="sleep-opt__cycles">Period {pr.n}</span>
                <span class="sleep-opt__hours">{p}-day period</span>
              </span>
              <span class="sleep-opt__time">{formatDate(pr.start)}</span>
            </li>
          ))}
        </ul>
        <dl class="calc__rows">
          <div class="calc__row"><dt>Next ovulation (approx.)</dt><dd>{formatDate(nextOv)}</dd></div>
        </dl>
        <p class="calc__note">Predictions assume a regular {c}-day cycle. Real cycles vary, so use this as a guide, not a guarantee.</p>
      </>
    );
  }

  return (
    <div class="calc">
      <div class="calc__form">
        <div class="calc__toolbar"><h2 class="calc__heading">Period Calculator</h2></div>
        <DateField id="pd-last" label="First day of your last period" value={last} onChange={setLast} />
        <NumField id="pd-cycle" label="Average cycle length" value={cycle} onChange={setCycle} min={20} max={45} suffix="days" />
        <NumField id="pd-period" label="Period length" value={period} onChange={setPeriod} min={1} max={10} suffix="days" />
      </div>
      <div class="calc__result" aria-live="polite">{body}</div>
    </div>
  );
}

export default function DateCalculator({ slug }: { slug: string }) {
  if (slug === 'pregnancy-week-calculator') return <PregnancyWeekCalc />;
  if (slug === 'ovulation-calculator') return <OvulationCalc />;
  if (slug === 'period-calculator') return <PeriodCalc />;
  return <DueDateCalc />;
}
