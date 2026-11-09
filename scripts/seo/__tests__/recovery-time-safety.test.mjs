import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Compile and execute the real original calculator compute function.
const defs = readFileSync(new URL('../../../src/islands/calculators/defs.ts', import.meta.url), 'utf8');
const content = readFileSync(new URL('../../../src/data/fitness-content.ts', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../../../src/components/ToolPageLayout.astro', import.meta.url), 'utf8');
const start = defs.indexOf("  'recovery-time-calculator': {");
const end = defs.indexOf('  // ---- Push-Up Test', start);
assert.ok(start >= 0 && end > start, 'original calculator must exist');
const block = defs.slice(start, end);
const cStart = block.indexOf('    compute: ');
const cEnd = block.lastIndexOf('\n    },');
assert.ok(cStart >= 0 && cEnd > cStart, 'source compute closure must be found');
const expression = block.slice(cStart + '    compute: '.length, cEnd) + '\n}';
const transpiled = ts.transpileModule('const compute = ' + expression + ';', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const fmt = (value, decimals = 0) => String(Number(Number(value).toFixed(decimals)));
const compute = runInNewContext(transpiled + '\ncompute;', { fmt, Math });
const defaults = { workoutType:'strength', trainingAge:'intermediate', sleep:'good', soreness:'mild' };
const run = (vals={}, selects={}) => compute({
  vals: {rpe:7, duration:60, ...vals}, selects: {...defaults,...selects},
  sex:'male', units:'metric'
});

test('normal default mathematical result and model factors stay unchanged', () => {
  const r = run();
  assert.equal(r.ok, true);
  assert.equal(r.primaryValue, '1.9 days – 2.5 days');
  assert.equal(r.rows.length, 6);
  assert.equal(r.rows[0].value, '48 hrs');
  assert.equal(r.rows[1].value, '×1.1');
  assert.match(r.note, /fixed multipliers/);
  assert.match(r.note, /NOT a measured confidence interval/);
});
test('severe soreness that limits movement suppresses any numeric recovery clearance', () => {
  for(const workoutType of ['strength','hiit','endurance','light']){
    for(const input of [{rpe:1,duration:5},{rpe:10,duration:240}]){
      const r=run(input, {workoutType,soreness:'severe'});
      assert.equal(r.ok, false, 'workout '+workoutType);
      assert.equal(r.primaryValue, '');
      assert.match(r.error, /outside this time estimator/i);
      assert.match(r.error, /urgent medical care/i);
    }
  }
});
test('mild and moderate inputs remain numerical and respond to changing intensity, duration, workout and sleep', () => {
  const baseline=run();
  const varied=[
    run({rpe:1}),
    run({rpe:10}),
    run({duration:5}),
    run({duration:240}),
    run({}, {workoutType:'light'}),
    run({}, {workoutType:'hiit'}),
    run({}, {sleep:'poor'}),
    run({}, {soreness:'moderate'})
  ];
  for (const r of varied) {
    assert.equal(r.ok,true);
    assert.match(r.primaryValue, /\d/);
    assert.notEqual(r.primaryValue,baseline.primaryValue);
  }
  assert.equal(run({rpe:1}).primaryValue, '29 hrs – 39 hrs');
  assert.equal(run({}, {workoutType:'light'}).primaryValue, '17 hrs – 23 hrs');
});
test('original tool page and shared layout use truthful non-clinical wording only for this tool', () => {
  const p=content.slice(content.indexOf("  'recovery-time-calculator': {"),
                        content.indexOf("  'push-up-test-calculator': {"));
  assert.match(p,/site-defined example times/);
  assert.match(p,/not a statistically measured prediction interval/);
  assert.match(p,/the calculator deliberately withholds a time estimate/);
  assert.doesNotMatch(p,/most muscle repair and adaptation happens during deep sleep/);
  assert.match(p,/my\.clevelandclinic\.org\/health\/diseases\/delayed-onset-muscle-soreness/);
  assert.match(layout,/tool\.slug === 'recovery-time-calculator'/);
  assert.match(layout,/not population norms, a validated healing timeline or medical clearance/);
  assert.match(block,/if \(soreness === 'severe'\)/);
});
