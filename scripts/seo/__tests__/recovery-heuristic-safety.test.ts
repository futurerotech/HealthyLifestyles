import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { getDef } = await import('../../../src/islands/calculators/defs.ts');
const { FITNESS_CONTENT } = await import('../../../src/data/fitness-content.ts');
const c = () => { const d = getDef('recovery-time-calculator'); assert.ok(d); return d; };
const result = (selects = {}) => c().compute({
  vals: { rpe: 7, duration: 60 }, selects, sex: 'female', units: 'metric',
});

test('keeps the old transparent numeric planning multipliers', () => {
  const r = result();
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '1.9 days – 2.5 days');
  assert.match(r.primaryLabel, /not medical clearance/);
  assert.equal(r.rows?.find((x) => /Workout type base/.test(x.label))?.value, '48 hrs');
});
test('warns that modeled hour band is NOT a calibrated confidence interval', () => {
  const r = result({ soreness: 'severe', sleep: 'poor' });
  assert.match(r.note ?? '', /NOT a calibrated confidence interval/);
  assert.match(r.callout?.text ?? '', /unvalidated planning multipliers/);
  assert.match(r.callout?.text ?? '', /qualified medical advice/);
});
test('editorial copy avoids assigning exact restoration from one night of sleep or soreness', () => {
  const content = FITNESS_CONTENT['recovery-time-calculator'];
  assert.ok(content);
  assert.match(content.intro, /coefficients are author-chosen/i);
  assert.ok(content.sections.some((s) => s.paragraphs?.some((p) => /scientifically derived confidence interval/.test(p))));
  assert.ok(content.sources.some((s) => s.url === 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3607100/'));
});
