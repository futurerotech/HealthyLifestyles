import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Compile and execute the EXISTING production VO2 calculator's compute body;
// do not reimplement the calculation inside test fixtures.
const read = (p) => readFileSync(new URL('../../../' + p, import.meta.url), 'utf8');
const defs = read('src/islands/calculators/defs.ts');
const page = read('src/data/fitness-content.ts');
const ui = read('src/islands/Calculator.tsx');
const anchor = "  'vo2-max-calculator': {";
const start = defs.indexOf(anchor);
assert.notEqual(start, -1);
const end = defs.indexOf('\n  },', start);
assert.ok(end > start);
const block = defs.slice(start, end);
const fnStart = block.indexOf('    compute: ');
const fnEnd = block.lastIndexOf('\n    },');
assert.ok(fnStart >= 0 && fnEnd > fnStart, 'real compute found');
const arrow = block.slice(fnStart + '    compute: '.length, fnEnd) + '\n}';
const compiled = ts.transpileModule('const compute = ' + arrow + ';', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const C = { blue:'#3b82f6', green:'#16a34a', teal:'#14b8a6', amber:'#f59e0b', red:'#ef4444', slate:'#64748b' };
const bandFor = (value, segments) => segments.find(s => value <= s.upTo) ?? segments[segments.length - 1];
const fmt = (value, digits) => Number(value.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits });
const compute = runInNewContext(compiled + '\ncompute;', { C, Math, Number, fmt, bandFor });
const run = (age, rest) => compute({ vals: { age, rest }, selects: {} });
const pageStart = page.indexOf(anchor);
const section = page.slice(pageStart, page.indexOf('\n  },', pageStart));

const row = (r, re) => r.rows?.find((x) => re.test(x.label))?.value;

test('existing Uth–Sørensen arithmetic and worked article example are unchanged', () => {
  const r = run(30,60);
  assert.equal(r.ok,true);
  assert.equal(r.primaryValue,'48.5 ml/kg/min');
  assert.match(r.primaryLabel,/Rough VO₂ max/);
  assert.equal(row(r,/assumed max/i),'190 bpm');
  assert.equal(row(r,/entered resting/i),'60 bpm');
  assert.equal(row(r,/ratio/i),'3.17');
  assert.equal(r.callout.tone,'info');
  assert.match(r.callout.text,/not a laboratory VO₂ max measurement, a fitness age or a diagnosis/);
  assert.match(r.callout.text,/predicting maximum heart rate from age adds uncertainty/);
  assert.match(r.note,/not validated equally for other ages, women/i);
  assert.equal(run(50,60).primaryValue,'43.4 ml/kg/min');
});

test('no fitness age and no age- or sex-independent good/bad grading for any input', () => {
  for (const [age, rest] of [[20,40],[30,60],[35,65],[65,80],[30,30],[30,120],[100,119]]) {
    const r = run(age, rest);
    assert.equal(r.ok, true);
    assert.equal(r.visual.kind, 'none');
    assert.equal(r.category, undefined);
    assert.equal(r.rows.some((x) => /fitness.age/i.test(x.label)), false);
    assert.doesNotMatch(JSON.stringify(r), /Below average|Superior|Excellent|years younger|years older/);
    assert.match(r.note, /does not produce a fitness age/);
  }
  assert.doesNotMatch(block, /fitnessAge|0\.5 \* vals\.age \+ 50/);
});

test('very low waking pulse gets emergency-first warning', () => {
  const r = run(30,30);
  assert.equal(r.primaryValue,'96.9 ml/kg/min');
  assert.equal(r.callout.tone,'danger');
  assert.match(r.callout.text,/call emergency services immediately/i);
  assert.match(r.callout.text,/under 40 bpm/i);
});

test('high waking pulse gets clinical caution', () => {
  const r = run(30,120);
  assert.equal(r.ok,true);
  assert.equal(r.primaryValue,'24.2 ml/kg/min');
  assert.equal(r.callout.tone,'warn');
  assert.match(r.callout.text,/over 100 bpm/i);
  assert.equal(run(30,59).callout.tone,'info');
});

test('a resting pulse equal to the age-predicted max cannot produce a meaningful VO2 ratio', () => {
  const r = run(100,120);
  assert.equal(r.ok,false);
  assert.equal(r.visual.kind,'none');
  assert.match(r.error,/call emergency services immediately/i);
  assert.match(r.error,/must be below the estimated maximum/i);
  assert.equal(r.primaryLabel,'VO2 max estimate unavailable');
  assert.equal(run(100,119).ok,true);
});

test('adult input, male-only original population, ungraded copy and UI warning placement stay truthful', () => {
  assert.match(block,/\.\.\.F\.age\(30\), min: 18/);
  assert.match(block,/hasSex: false/);
  assert.match(section,/46 well-trained men aged 21–51/);
  assert.match(section,/does not grade the estimate against sex- or age-adjusted reference values/);
  assert.match(section,/does not label your result as good or poor/);
  assert.match(section,/Call emergency services/);
  assert.match(section,/HR_RATIO_LIMITS/);
  assert.match(section,/AHA_HRMAX/);
  assert.doesNotMatch(section,/five colored-band|five labels|fitness-age index/);
  assert.match(ui,/slug === 'vo2-max-calculator' && result.callout/);
  assert.match(ui,/slug !== 'vo2-max-calculator' &&[^\n]*result\.callout/);
  assert.doesNotMatch(section,/higher VO₂ max means your heart|a hallmark of good fitness/i);
});
