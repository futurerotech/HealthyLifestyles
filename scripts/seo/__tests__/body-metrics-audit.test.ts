// Phase 2 audit: BMI, BMR, Calorie, Body Fat and Ideal Weight calculators.
// Category boundaries are pinned to the tables published on each tool page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { getDef } = await import('../../../src/islands/calculators/defs.ts');

type Sex = 'male' | 'female';
const run = (slug: string, vals: Record<string, number>, sex: Sex = 'male', selects: Record<string, string> = {}, units: 'metric' | 'imperial' = 'metric') => {
  const d = getDef(slug);
  assert.ok(d, slug);
  return d.compute({ vals, sex, selects, units });
};
// Weight (kg) giving an exact BMI at 1.70 m.
const bmiAt = (bmi: number) => run('bmi-calculator', { weight: bmi * 1.7 * 1.7, height: 170 });

test('BMI categories follow WHO/CDC: <18.5, 18.5–24.9, 25–29.9, ≥30', () => {
  const cases: [number, string][] = [
    [18.4, 'Underweight'], [18.5, 'Normal weight'], [24.9, 'Normal weight'],
    [25, 'Overweight'], [29.9, 'Overweight'], [30, 'Obese'], [45, 'Obese'],
  ];
  for (const [bmi, label] of cases) assert.equal(bmiAt(bmi).category?.label, label, String(bmi));
});

test('BMI label matches the displayed value (24.96 shows 25 → Overweight)', () => {
  const out = bmiAt(24.96);
  assert.equal(out.primaryValue, '25'); // fmt trims trailing zeros
  assert.equal(out.category?.label, 'Overweight');
  assert.match(out.note ?? '', /adults \(18\+\)/);
  assert.match(out.note ?? '', /BMI-for-age percentiles/);
});

test('BMI value and healthy range are unchanged', () => {
  const out = run('bmi-calculator', { weight: 72, height: 175 });
  assert.equal(out.primaryValue, '23.5');
  assert.equal(out.rows?.[0].value, '57 kg – 76 kg');
});

test('BMR is Mifflin-St Jeor exactly, with an accuracy note', () => {
  const m = run('bmr-calculator', { weight: 72, height: 175, age: 30 }, 'male');
  // 720 + 1093.75 - 150 + 5 = 1668.75
  assert.match(m.primaryValue, /^1,?669 kcal\/day$/);
  const f = run('bmr-calculator', { weight: 60, height: 165, age: 40 }, 'female');
  // 600 + 1031.25 - 200 - 161 = 1270.25
  assert.match(f.primaryValue, /^1,?270 kcal\/day$/);
  assert.match(m.note ?? '', /within about 10%/);
});

test('Devine ideal weight: exact above 5 ft, not invented below it', () => {
  const tall = run('ideal-weight-calculator', { height: 177.8 }, 'male'); // 70 in → 50 + 23 = 73 kg
  assert.equal(tall.rows?.[0].value, '73 kg');
  const f = run('ideal-weight-calculator', { height: 165.1 }, 'female'); // 65 in → 45.5 + 11.5 = 57 kg
  assert.equal(f.rows?.[0].value, '57 kg');
  const at5ft = run('ideal-weight-calculator', { height: 152.4 }, 'female');
  assert.equal(at5ft.rows?.[0].value, '45.5 kg');
  for (const sex of ['male', 'female'] as const) {
    const short = run('ideal-weight-calculator', { height: 150 }, sex);
    assert.equal(short.rows?.[0].value, 'Not defined below 5 ft (152 cm)');
    assert.equal(short.ok, true); // the BMI-based range is still shown
  }
});

// Find waist (cm) giving a target male Navy body fat at height 175, neck 38.
const maleWaistFor = (target: number) => {
  let lo = 39, hi = 200;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(mid - 38) + 0.15456 * Math.log10(175)) - 450;
    if (bf < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
};

test('U.S. Navy body fat formula is unchanged for ordinary measurements', () => {
  const m = run('body-fat-calculator', { height: 175, neck: 38, waist: 88 }, 'male');
  const expected = 495 / (1.0324 - 0.19077 * Math.log10(50) + 0.15456 * Math.log10(175)) - 450;
  assert.equal(m.primaryValue, `${Number(expected.toFixed(1))}%`);
  const f = run('body-fat-calculator', { height: 165, neck: 33, waist: 75, hip: 98 }, 'female');
  const fe = 495 / (1.29579 - 0.35004 * Math.log10(140) + 0.221 * Math.log10(165)) - 450;
  assert.equal(f.primaryValue, `${Number(fe.toFixed(1))}%`);
});

test('body fat categories follow the published ACE table (men 6 / 14 / 18 / 25)', () => {
  const cases: [number, string][] = [
    [5.9, 'Essential fat'], [6.0, 'Athletic'], [13.9, 'Athletic'], [14.0, 'Fitness'],
    [17.9, 'Fitness'], [18.0, 'Average'], [24.9, 'Average'], [25.0, 'Above average'],
  ];
  for (const [bf, label] of cases) {
    const out = run('body-fat-calculator', { height: 175, neck: 38, waist: maleWaistFor(bf) }, 'male');
    assert.equal(out.primaryValue, `${Number(bf.toFixed(1))}%`, String(bf));
    assert.equal(out.category?.label, label, String(bf));
  }
});

test('body fat outside 2–60% is withheld, not clamped to an invented value', () => {
  const low = run('body-fat-calculator', { height: 230, neck: 50, waist: 55 }, 'male');
  assert.equal(low.ok, false);
  assert.equal(low.primaryValue, '—');
  assert.match(low.error ?? '', /outside the range/);
  const neg = run('body-fat-calculator', { height: 175, neck: 40, waist: 40 }, 'male');
  assert.equal(neg.ok, false);
});

const calorie = (vals: Record<string, number>, sex: Sex, activity: string, units: 'metric' | 'imperial' = 'metric') =>
  run('calorie-calculator', vals, sex, { activity }, units);
const num = (s: string) => Number(s.replace(/[^\d.]/g, ''));

test('calorie targets: ordinary case keeps the 500 kcal deficit and surplus', () => {
  const out = calorie({ weight: 72, height: 175, age: 30 }, 'male', '1.55');
  const tdee = (10 * 72 + 6.25 * 175 - 5 * 30 + 5) * 1.55;
  assert.equal(num(out.cards![1].value), Math.round(tdee));
  assert.equal(num(out.cards![0].value), Math.round(tdee - 500));
  assert.equal(out.cards![0].sub, '≈ 0.5 kg (1 lb)/week');
  assert.equal(out.callout, undefined);
});

test('calorie floor: clamped target shows the real, smaller weekly loss', () => {
  // female 55 kg, 160 cm, 40 y, sedentary: BMR 1189, TDEE 1426.8 → 926.8 < 1200
  const out = calorie({ weight: 55, height: 160, age: 40 }, 'female', '1.2');
  assert.equal(num(out.cards![0].value), 1200);
  assert.equal(out.cards![0].sub, `≈ ${Number((((1426.8 - 1200) * 7) / 7700).toFixed(1))} kg/week`);
  assert.equal(out.callout?.tone, 'warn');
  assert.ok(num(out.cards![0].value) < num(out.cards![1].value));
});

test('calorie floor: no deficit is offered when maintenance is already at or below it', () => {
  // female 40 kg, 150 cm, 80 y, sedentary: BMR 776.5, TDEE 931.8 < 1200
  const out = calorie({ weight: 40, height: 150, age: 80 }, 'female', '1.2');
  assert.equal(out.cards![0].value, '—');
  assert.match(out.cards![0].sub ?? '', /healthcare professional/);
  assert.match(out.callout?.text ?? '', /already at or below 1,?200 kcal\/day/);
  // The lose figure can never exceed maintenance in any combination.
  for (const sex of ['male', 'female'] as const) for (const w of [40, 60, 90]) for (const a of [20, 50, 90]) for (const act of ['1.2', '1.9']) {
    const r = calorie({ weight: w, height: 160, age: a }, sex, act);
    if (r.cards![0].value !== '—') assert.ok(num(r.cards![0].value) < num(r.cards![1].value), `${sex} ${w} ${a} ${act}`);
  }
});

test('waist-to-height: <0.4, 0.4–0.49, 0.5–0.59, ≥0.6 on the shown value', () => {
  const cases: [number, string][] = [[0.39, 'Slim'], [0.4, 'Healthy'], [0.49, 'Healthy'], [0.5, 'Increased risk'],
    [0.595, 'High risk'], [0.59, 'Increased risk'], [0.6, 'High risk'], [0.8, 'High risk']];
  for (const [r, label] of cases) assert.equal(run('waist-to-height-ratio-calculator', { waist: r * 170, height: 170 }).category?.label, label, String(r));
});

test('waist-to-hip: WHO substantially increased risk at ≥0.90 (men) and ≥0.85 (women), no invented tiers', () => {
  const at = (ratio: number, sex: Sex) => run('waist-to-hip-ratio-calculator', { waist: ratio * 100, hip: 100 }, sex);
  assert.equal(at(0.89, 'male').category?.label, 'Lower risk');
  assert.equal(at(0.9, 'male').category?.label, 'Substantially increased risk');
  assert.equal(at(1.2, 'male').category?.label, 'Substantially increased risk');
  assert.equal(at(0.84, 'female').category?.label, 'Lower risk');
  assert.equal(at(0.85, 'female').category?.label, 'Substantially increased risk');
  assert.match(at(0.9, 'male').note ?? '', /0\.90 or above for men/);
  const v = at(0.8, 'female').visual;
  assert.equal(v.kind === 'gauge' && v.segments.length, 2);
});

const macroKcal = (rows: { label: string; value: string }[]) =>
  rows.reduce((t, r) => t + Number(r.value.split('·')[1].replace(/[^\d.]/g, '')), 0);

test('macro: a cut is never above maintenance, and the floor message matches the goal', () => {
  const small = run('macro-calculator', { weight: 40, height: 150, age: 80 }, 'female', { activity: '1.2', goal: 'cut' });
  const maint = run('macro-calculator', { weight: 40, height: 150, age: 80 }, 'female', { activity: '1.2', goal: 'maintain' });
  assert.equal(small.primaryValue, maint.primaryValue);
  assert.match(small.callout?.text ?? '', /for maintenance, not a cut/);
  assert.doesNotMatch(maint.callout?.text ?? '', /cut target was raised/);
  const clamped = run('macro-calculator', { weight: 55, height: 160, age: 40 }, 'female', { activity: '1.2', goal: 'cut' });
  assert.match(clamped.primaryValue, /^1,?200 kcal\/day$/);
  assert.match(clamped.callout?.text ?? '', /cut target was raised to 1,?200/);
});

test('macro: grams always add up to the calories shown (incl. high body weight)', () => {
  for (const [w, h] of [[72, 175], [150, 175], [200, 160], [45, 155]]) for (const goal of ['cut', 'maintain', 'bulk']) for (const sex of ['male', 'female'] as const) {
    const r = run('macro-calculator', { weight: w, height: h, age: 40 }, sex, { activity: '1.2', goal });
    const shown = Number(r.primaryValue.replace(/[^\d.]/g, ''));
    assert.ok(Math.abs(macroKcal(r.rows!) - shown) <= 3, `${w}/${h} ${goal} ${sex}: ${macroKcal(r.rows!)} vs ${shown}`);
    const q = new URL('https://x' + r.cta!.href).searchParams;
    assert.ok(Math.abs(Number(q.get('protein')) * 4 + Number(q.get('carbs')) * 4 + Number(q.get('fat')) * 9 - Number(q.get('calories'))) <= 15);
  }
  const heavy = run('macro-calculator', { weight: 150, height: 175, age: 40 }, 'female', { activity: '1.2', goal: 'cut' });
  assert.match(heavy.callout?.text ?? '', /fat was reduced to fit/);
});

test('keto: carbs never exceed the stated 50 g ceiling; calories still add up', () => {
  for (const [w, act] of [[72, '1.375'], [120, '1.9'], [150, '1.9']]) {
    const r = run('keto-calculator', { weight: w, height: 190, age: 25 }, 'male', { activity: act });
    const carbs = r.rows!.find((x) => /^Carbs/.test(x.label))!;
    assert.ok(Number(carbs.value.split(' g')[0]) <= 50, carbs.value);
    const shown = Number(r.primaryValue.replace(/[^\d.]/g, ''));
    assert.ok(Math.abs(macroKcal(r.rows!.filter((x) => x.value.includes('·'))) - shown) <= 3);
  }
  const big = run('keto-calculator', { weight: 150, height: 190, age: 25 }, 'male', { activity: '1.9' });
  assert.match(big.callout?.text ?? '', /capped at 50 g/);
  assert.match(big.note ?? '', /diabetes or blood pressure/);
});
