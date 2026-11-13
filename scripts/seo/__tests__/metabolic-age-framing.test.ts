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
const { METABOLIC_CONTENT } = await import('../../../src/data/metabolic-content.ts');
const { getTool } = await import('../../../src/data/tools.ts');
const calc: CalcDef = getDef('metabolic-age-calculator')!;
const copy: ToolContent = METABOLIC_CONTENT['metabolic-age-calculator']!;
const ctx=(weight: number): ComputeCtx=>({vals:{age:30,height:175,weight},sex:'male',selects:{},units:'metric'});
test('default BMR-derived age remains 30 but never carries health-grade colors',()=>{
  const r=calc.compute(ctx(72)); assert.equal(r.primaryValue,'30 years'); assert.equal(r.category,undefined);
  assert.equal(r.visual.kind,'none'); assert.match(r.primaryLabel,/not health/i);
});
test('higher body weight yields younger number, not false positive health label',()=>{
  const r=calc.compute(ctx(110)); assert.equal(r.primaryValue,'21 years');
  assert.equal(r.category,undefined); assert.match(r.callout!.text,/Increasing body weight alone/i);
});
test('reference is explicitly custom and nonvalidated',()=>{
  const r=calc.compute(ctx(72)); assert.ok(r.rows!.some(x=>/Custom illustrative reference/.test(x.label)));
  assert.match(r.note,/custom illustrative constants/i); assert.match(r.note,/40 kcal per model year/i);
});
test('source copy discloses body-size confounding and scientific evidence',()=>{
  assert.match(copy.notice,/Increasing weight by itself/i);
  const body=copy.sections.flatMap(x=>x.paragraphs??[]).join(' ');
  assert.match(body,/not validated clinical or population age standards/i);
  assert.match(body,/mechanically increase predicted BMR/i);
  assert.ok(copy.sources.some(x=>x.url?.includes('PMC10661987')));
});
test('catalog preserves canonical original slug without clinical implication',()=>{
  const tool=getTool('metabolic-age-calculator')!; assert.ok(tool);
  assert.equal(tool.slug,'metabolic-age-calculator');
  assert.match(tool.blurb,/not a measure of metabolic health/i);
  assert.match(copy.faq.find(q=>q.q==='Should I try to lower my metabolic age?')!.a,/No health benefit/i);
});