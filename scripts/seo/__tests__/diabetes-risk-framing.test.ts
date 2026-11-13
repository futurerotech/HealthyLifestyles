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
const def: CalcDef = getDef('diabetes-risk-calculator')!, content: ToolContent = RISK_CONTENT['diabetes-risk-calculator']!;
const ctx=(v: Record<string, number> = {}, s: Record<string, string> = {}): ComputeCtx=>({vals:{age:50,weight:85,height:172,waist:96,...v},selects:{family:'0',activity:'0',...s},sex:'male',units:'metric'});
test('original arithmetic intact, no arbitrary clinical categories',()=>{
  assert.ok(def);
  const r=def.compute(ctx());
  assert.equal(r.primaryValue,'5 / 18');
  assert.equal(r.visual.kind,'none');
  assert.equal(r.category,undefined);
  assert.match(r.primaryLabel,/not screening/i);
  assert.deepEqual(r.rows!.map(x=>x.label),['Age','BMI','Waist-to-height','Family history','Inactivity']);
});
test('maximum 18/18 not reported as clinical diabetes probability',()=>{
  const r=def.compute(ctx({age:70,weight:120,height:170,waist:110},{family:'5',activity:'2'}));
  assert.equal(r.primaryValue,'18 / 18');
  assert.equal(r.category,undefined);
  assert.match(r.callout!.text,/NOT a validated CDC\/ADA prediabetes risk test/i);
});
test('zero points not falsely reassuring',()=>{
  const r=def.compute(ctx({age:30,weight:60,height:170,waist:70},{family:'0',activity:'0'}));
  assert.equal(r.primaryValue,'0 / 18');
  assert.match(r.callout!.text,/Even 0 points cannot rule out/i);
});
test('patient copy distinguishes custom points from validated tests',()=>{
  assert.ok(content);
  assert.match(content.notice,/not the validated CDC\/ADA risk test/i);
  const text=content.sections.flatMap(s=>s.paragraphs??[]).join(' ');
  assert.match(text,/different questions, points and thresholds/i);
  assert.match(text,/not a diagnosis or a validated screening result/i);
  assert.ok(content.sources.some(s=>s.url?.includes('cdc.gov/diabetes/widgets/risktest')));
});
test('catalog retains original tool identity and avoids validated-risk claims',()=>{
  const tool=getTool('diabetes-risk-calculator')!;
  assert.ok(tool);
  assert.equal(tool.slug,'diabetes-risk-calculator');
  assert.match(tool.blurb,/not a validated clinical risk category/i);
});