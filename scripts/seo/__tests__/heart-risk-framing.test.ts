import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
import type { ComputeCtx, CalcDef } from '../../../src/islands/calculators/defs.ts';
import type { ToolContent } from '../../../src/data/content-types.ts';
const { getDef } = await import('../../../src/islands/calculators/defs.ts');
const { RISK_CONTENT } = await import('../../../src/data/risk-content.ts');
const { getTool } = await import('../../../src/data/tools.ts');
const def: CalcDef = getDef('heart-disease-risk-calculator')!;
const content: ToolContent = RISK_CONTENT['heart-disease-risk-calculator']!;
const ctx = (v: Record<string, number> = {}, s: Record<string, string> = {}): ComputeCtx => ({
  vals: {age:50,weight:82,height:172,...v},
  selects:{smoking:'0',activity:'1',bp:'0',...s},
  sex:'male', units:'metric'
});
test('existing score arithmetic stays intact; arbitrary bands are removed',()=>{
  assert.ok(def);
  const out=def.compute(ctx());
  assert.equal(out.primaryValue,'3 / 12');
  assert.equal(out.category,undefined);
  assert.equal(out.visual.kind,'none');
  assert.match(out.primaryLabel,/not clinical risk/i);
  assert.deepEqual(out.rows!.map(r=>r.label),['Age','Smoking','Activity','BMI','Blood pressure']);
});
test('maximum 12/12 is not a clinical risk category',()=>{
  const out=def.compute(ctx({age:70,weight:110,height:170},{smoking:'3',activity:'2',bp:'2'}));
  assert.equal(out.primaryValue,'12 / 12');
  assert.equal(out.category,undefined);
  assert.match(out.callout!.text,/not your chance of developing heart disease/i);
});
test('zero points cannot be described as clinical low-risk clearance',()=>{
  const out=def.compute(ctx({age:30,weight:62,height:172},{smoking:'0',activity:'0',bp:'0'}));
  assert.equal(out.primaryValue,'0 / 12');
  assert.match(out.callout!.text,/Even 0 points cannot rule out/i);
});
test('visible source and FAQ explain PREVENT inputs and nonclinical nature',()=>{
  assert.ok(content);
  assert.match(content.notice ?? '',/does NOT measure personal risk/i);
  assert.match(content.intro,/does not classify your personal heart disease risk/i);
  const prose=content.sections.flatMap(s=>s.paragraphs??[]).join(' ');
  assert.match(prose,/not validated cardiovascular predictions/i);
  assert.match(prose,/sex, measured systolic blood pressure, cholesterol, kidney function/i);
  assert.match(prose,/professional.heart.org/);
  assert.doesNotMatch(prose,/If your band is moderate or elevated/);
  assert.match(content.faq.at(-1)!.a,/Even a tally of 0 out of 12 cannot rule out/i);
  assert.ok(content.sources.some(s=>s.url?.includes('professional.heart.org')));
});
test('existing tool identity and cautious catalog copy remain aligned',()=>{
  const tool=getTool('heart-disease-risk-calculator')!;
  assert.ok(tool);
  assert.equal(tool.slug,'heart-disease-risk-calculator');
  assert.match(tool.blurb,/not a validated clinical risk estimate/i);
});