import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { getDef } = await import('../../../src/islands/calculators/defs.ts');
const { FITNESS_CONTENT } = await import('../../../src/data/fitness-content.ts');

const calculator = () => {
  const d = getDef('vo2-max-calculator');
  assert.ok(d, 'the original VO₂ max calculator must exist');
  return d;
};
const result = (age: number, rest: number) =>
  calculator().compute({vals: {age, rest}, selects: {}, sex: 'male', units: 'metric'});

test('preserves the original numerical HR-ratio formula', () => {
  const r = result(30, 60);
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '48.5 ml/kg/min');
  assert.equal(r.rows?.find((x) => /assumed max/i.test(x.label))?.value, '190 bpm');
  assert.match(r.primaryLabel, /Rough VO₂ max/i);
});

test('never fabricates fitness age or universal good/bad health categories', () => {
  for (const [age, resting] of [[20, 40], [35, 65], [65, 80]]) {
    const r = result(age, resting);
    assert.equal(r.visual.kind, 'none');
    assert.equal(r.category, undefined);
    assert.equal(r.rows?.some((x) => /fitness age/i.test(x.label)), false);
    assert.doesNotMatch(r.callout?.text ?? '', /years younger|years older|typical for your actual age/i);
    assert.match(r.note ?? '', /well-trained men/i);
  }
});

test('calls out the study population and age-prediction uncertainty', () => {
  const r = result(50, 75);
  assert.match(r.callout?.text ?? '', /not a laboratory/i);
  assert.match(r.callout?.text ?? '', /predicting maximum heart rate/i);
  const c = FITNESS_CONTENT['vo2-max-calculator'];
  assert.ok(c);
  assert.ok(c.sections.some((s) => s.paragraphs?.some((p) => /46 well-trained men/.test(p))));
  assert.ok(c.sections.some((s) => s.paragraphs?.some((p) => /American Heart Association/.test(p))));
  assert.ok(c.sources.some((s) => s.url === 'https://pubmed.ncbi.nlm.nih.gov/14624296/'));
});
