import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import type { ComputeCtx } from '../../../src/islands/calculators/defs.ts';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { DEFS } = await import('../../../src/islands/calculators/defs.ts');
const { WOMENS_CONTENT } = await import('../../../src/data/womens-content.ts');
const { lbToKg } = await import('../../../src/lib/units.ts');
const { editorialLinkPolicy } = await import('../../../src/data/editorial-citations.ts');
const { safeLinkAttributes, renderInline } = await import('../../../src/lib/text.ts');
const slug = 'pregnancy-weight-gain-calculator';
const def = DEFS[slug];
const ctx = (bmi = 23, week = 20, change = 6, units: ComputeCtx['units'] = 'metric'): ComputeCtx => ({
  vals: { height: 200, weight: bmi * 4, week, current: bmi * 4 + change },
  units, sex: 'female', selects: { pregnancyType: 'singleton' },
});
const row = (r: ReturnType<typeof def.compute>, label: string) => r.rows?.find(x => x.label === label)?.value;
const weekly = 'Second/third-trimester weekly reference rate';
const first = 'First-trimester total reference (not a weekly target)';
const change = 'Measured weight change';
const bmiLabel = 'Pre-pregnancy BMI (category uses unrounded BMI)';
const expected = [
  [17, 'Underweight', '12.5–18 kg', '28–40 lb', '0.44–0.58 kg/week', '1–1.3 lb/week'],
  [23, 'Normal weight', '11.5–16 kg', '25–35 lb', '0.35–0.5 kg/week', '0.8–1 lb/week'],
  [27, 'Overweight', '7–11.5 kg', '15–25 lb', '0.23–0.33 kg/week', '0.5–0.7 lb/week'],
  [32, 'Obesity', '5–9 kg', '11–20 lb', '0.17–0.27 kg/week', '0.4–0.6 lb/week'],
] as const;
for (const [bmi, category, totalKg, totalLb, rateKg, rateLb] of expected) {
  for (const units of ['metric', 'imperial'] as const) test(`${category}: exact published ${units} total and weekly references`, () => {
    const r = def.compute(ctx(bmi, 40, 6, units));
    assert.equal(r.ok, true);
    assert.equal(r.primaryValue, units === 'metric' ? totalKg : totalLb);
    assert.equal(row(r, weekly), units === 'metric' ? rateKg : rateLb);
    assert.match(row(r, bmiLabel) ?? '', new RegExp(`\\(${category}\\)$`));
    assert.equal(r.visual.kind, 'none');
    assert.equal(r.category, undefined);
  });
}
for (const [bmi, category] of [[18.49, 'Underweight'], [18.5, 'Normal weight'], [24.99, 'Normal weight'], [25, 'Overweight'], [29.99, 'Overweight'], [30, 'Obesity']] as const) test(`BMI cutoff ${bmi} remains ${category}`, () => {
  assert.match(row(def.compute(ctx(bmi)), bmiLabel) ?? '', new RegExp(`\\(${category}\\)$`));
});
test('BMI 40 and higher retains the published group range, with an explicit evidence limitation', () => {
  for (const b of [40, 45]) { const r = def.compute(ctx(b)); assert.equal(r.primaryValue, '5–9 kg'); assert.match(r.note ?? '', /higher obesity classes is limited/); }
});
for (const week of [1, 13]) test(`week ${week}: first-trimester total only, not a weekly target`, () => {
  const metric = def.compute(ctx(23, week)); const imperial = def.compute(ctx(23, week, 6, 'imperial'));
  assert.equal(row(metric, first), '0.5–2 kg'); assert.equal(row(imperial, first), '1.1–4.4 lb');
  assert.equal(row(metric, weekly), undefined); assert.equal(row(imperial, weekly), undefined);
});
for (const week of [14, 20, 40, 41, 42]) test(`week ${week}: published rate does not extrapolate a cumulative target`, () => {
  const r = def.compute(ctx(23, week, lbToKg(23), 'imperial'));
  assert.equal(row(r, weekly), '0.8–1 lb/week'); assert.equal(row(r, first), undefined);
  assert.equal(row(r, change), '23 lb'); assert.equal(r.primaryValue, '25–35 lb');
  assert.equal(r.visual.kind, 'none'); assert.equal(r.category, undefined);
  assert.doesNotMatch(JSON.stringify(r), /On track|Below pace|Above pace|Recommended by week/i);
  if (week > 40) assert.match(r.note ?? '', /no separate target for weeks 41–42/i);
});
test('singleton confirmation is required; default and multiple/unknown never calculate a result', () => {
  const field = def.fields.find(f => f.key === 'pregnancyType');
  assert.equal(def.fields[0].key, 'pregnancyType'); assert.equal(field?.selectDefault, 'unconfirmed');
  for (const type of ['', 'unconfirmed', 'multiple-or-unknown', 'twins', 'unexpected']) {
    const c = ctx(); c.selects.pregnancyType = type;
    const r = def.compute(c); assert.equal(r.ok, false); assert.equal(r.primaryValue, ''); assert.equal(r.rows, undefined); assert.equal(r.visual.kind, 'none');
  }
  const c = ctx(); c.selects = {}; assert.equal(def.compute(c).ok, false);
});
for (const [field, value] of [['week', 0], ['week', 43], ['week', 12.5], ['week', NaN], ['height', 0], ['height', 231], ['weight', Infinity], ['weight', 34], ['weight', 201], ['current', 251], ['current', 34], ['current', NaN]] as const) test(`invalid ${field}=${value} fails closed`, () => {
  const c = ctx(); c.vals[field] = value; const r = def.compute(c); assert.equal(r.ok, false); assert.equal(r.primaryValue, ''); assert.equal(r.rows, undefined);
});
test('measured gain, loss, zero and very small signed changes retain their meaning', () => {
  assert.equal(row(def.compute(ctx(23, 20, 6)), change), '6 kg');
  assert.equal(row(def.compute(ctx(23, 20, -3)), change), '-3 kg');
  assert.equal(row(def.compute(ctx(23, 20, 0)), change), '0 kg');
  assert.equal(row(def.compute(ctx(23, 20, -lbToKg(3), 'imperial')), change), '-3 lb');
  assert.equal(row(def.compute(ctx(23, 20, -0.001)), change), 'Less than 0.1 kg loss');
  assert.equal(row(def.compute(ctx(23, 20, 0.001, 'imperial')), change), 'Less than 0.1 lb gain');
});
test('urgent warning appears before result, and valid results never offer medical reassurance', () => {
  const help = def.fields[0].help ?? '';
  for (const phrase of ['one baby only', 'immediate medical care', 'headache', 'vision changes', 'face or hand swelling', 'abdominal pain', 'fluids down', 'decreased fetal movement', 'Chest pain', 'emergency care']) assert.ok(help.includes(phrase), phrase);
  const r = def.compute(ctx()); assert.match(r.callout?.text ?? '', /cannot assess fetal growth/); assert.match(r.callout?.text ?? '', /immediate medical care/);
  assert.match(r.note ?? '', /No cumulative week-specific target or safety classification/);
});
test('existing tool copy matches the calculator, includes direct primary sources and no old gauge promise', () => {
  const content = WOMENS_CONTENT[slug]; const prose = JSON.stringify(content);
  assert.match(content.notice ?? '', /One baby only/);
  assert.match(prose, /immediate medical care/);
  assert.doesNotMatch(prose, /healthy target for your current week|gauge above|should have gained by your current week|you're on track|you’re on track/);
  assert.ok(content.sources.some(s => s.url === 'https://www.ncbi.nlm.nih.gov/books/NBK32799/'));
  assert.ok(content.sources.some(s => s.url === 'https://www.cdc.gov/hearher/maternal-warning-signs/index.html'));
});
const articleSlug = 'pregnancy-weight-gain-calculator-healthy-range-guide';
const approved = [
  'https://www.cdc.gov/maternal-infant-health/pregnancy-weight/',
  'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',
  'https://www.ncbi.nlm.nih.gov/books/NBK32799/',
  'https://www.ncbi.nlm.nih.gov/books/NBK32799/table/summary.t1/?report=objectonly',
  'https://health.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/prenatal-nutrition/pregnancy-weight-gain-calculator.html',
  'https://medlineplus.gov/highbloodpressureinpregnancy.html',
  'https://www.cdc.gov/hearher/maternal-warning-signs/index.html',
];
for (const url of approved) test(`ID61 exact audited URL: ${url}`, () => {
  const policy = editorialLinkPolicy(articleSlug); assert.equal(safeLinkAttributes(url, policy)?.rel, 'noopener');
  assert.match(renderInline(`[Scientific reference](${url})`, policy), /rel="noopener"/);
});
test('unverified, altered, unrelated, sponsored and user-generated URLs remain qualified', () => {
  const policy = editorialLinkPolicy(articleSlug);
  assert.equal(policy.approvedCitationUrls?.size, approved.length);
  assert.equal(safeLinkAttributes(approved[0], editorialLinkPolicy('unrelated-article'))?.rel, 'noopener nofollow');
  assert.equal(safeLinkAttributes(approved[0] + '?changed=1', policy)?.rel, 'noopener nofollow');
  assert.equal(safeLinkAttributes('https://www.acog.org/womens-health/experts-and-stories/ask-acog/how-much-weight-should-i-gain-during-pregnancy', policy)?.rel, 'noopener nofollow');
  assert.equal(safeLinkAttributes('https://shop.example.test/offer', policy)?.rel, 'noopener nofollow');
  assert.equal(safeLinkAttributes(approved[0], { ...policy, purpose: 'sponsored' })?.rel, 'noopener sponsored nofollow');
  assert.equal(safeLinkAttributes(approved[0], { ...policy, purpose: 'ugc' })?.rel, 'noopener ugc nofollow');
  assert.equal(safeLinkAttributes('javascript:alert(1)', policy), undefined);
});
