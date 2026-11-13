import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { getDef } = await import('../../../src/islands/calculators/defs.ts');
const { RISK_CONTENT } = await import('../../../src/data/risk-content.ts');
const { getTool } = await import('../../../src/data/tools.ts');
const def=getDef('waist-health-risk-calculator');
const content=RISK_CONTENT['waist-health-risk-calculator'];
const ctx=(vals,units='metric')=>({vals,selects:{},sex:'male',units});
test('original BMI and waist-to-height calculations remain, no unvalidated combined-risk category',()=>{
  assert.ok(def);
  const result=def.compute(ctx({weight:78,height:172,waist:92}));
  assert.equal(result.primaryValue,'26.4');
  assert.equal(result.category,undefined);
  assert.equal(result.visual.kind,'none');
  assert.equal(result.rows.find(r=>r.label==='Waist-to-height ratio').value,'0.53');
  assert.match(result.callout.text,/not a diagnosis or a validated combined disease-risk score/i);
});
test('NICE under-35 BMI waist guidance respects 0.5 and 0.6 thresholds',()=>{
  const increased=def.compute(ctx({weight:78,height:172,waist:92}));
  assert.match(increased.rows[1].value,/increased central adiposity/i);
  const high=def.compute(ctx({weight:78,height:172,waist:105}));
  assert.match(high.rows[1].value,/high central adiposity/i);
});
test('BMI 35 or above does not reuse NICE under-35 classification as clinical risk',()=>{
  const r=def.compute(ctx({weight:110,height:172,waist:105}));
  assert.match(r.rows[1].value,/BMI 35 or above/i);
  assert.equal(r.category,undefined);
});
test('metric and imperial display preserve BMI and waist-to-height math',()=>{
  const v={weight:78,height:172,waist:92};
  const a=def.compute(ctx(v,'metric')),b=def.compute(ctx(v,'imperial'));
  assert.equal(a.primaryValue,b.primaryValue);
  assert.equal(a.rows[0].value,b.rows[0].value);
  assert.match(a.rows[3].value,/cm/);
  assert.match(b.rows[3].value,/in/);
});
test('tool page and catalog cite NICE, preserve original route and reject combined clinical bands',()=>{
  assert.ok(content);
  assert.match(content.intro,/does not predict your personal disease risk/i);
  assert.match(content.sections[0].paragraphs.join(' '),/NICE overweight and obesity guideline/i);
  assert.ok(content.sources.some(s=>s.url?.includes('nice.org.uk/guidance/ng246')));
  const x=getTool('waist-health-risk-calculator');
  assert.ok(x);
  assert.equal(x.slug,'waist-health-risk-calculator');
  assert.match(x.blurb,/separately/i);
});