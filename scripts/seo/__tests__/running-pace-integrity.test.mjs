import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Compile the production pure helper to run the SAME actual math as the UI.
const source = readFileSync(new URL('../../../src/lib/running-pace.ts', import.meta.url), 'utf8');
const island = readFileSync(new URL('../../../src/islands/PaceCalculator.tsx', import.meta.url), 'utf8');
const text = readFileSync(new URL('../../../src/data/fitness-content.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context = {exports:{},Number,Math,String};
runInNewContext(js,context);
const {
  KM_PER_MILE, convertDistance, convertPaceSeconds,
  parseDistance, parseElapsedSeconds, parsePaceSeconds,
  calculateRunningPace, formatHMS, formatMS, paceInputParts, distanceInput,
} = context.exports;
const close = (x,y,epsilon=1e-8) => assert.ok(Math.abs(x-y)<=epsilon,String(x)+' != '+String(y));

test('unchanged 10km at 5:00/km yields 50:00 with cumulative 1–10km splits',()=>{
  const result=calculateRunningPace('time','km',10,NaN,300);
  assert.equal(result.valid,true);
  assert.equal(formatHMS(result.outTime),'50:00');
  assert.equal(formatMS(result.outPace),'5:00');
  assert.equal(result.speed,12);
  assert.equal(result.splits.length,10);
  assert.equal(result.splits[0].label,'1 km');
  assert.equal(formatHMS(result.splits.at(-1).time),'50:00');
});
test('reversible original article examples: 5K/30min, 5K/27:30, 3mi/30min',()=>{
  const five=calculateRunningPace('pace','km',5,1800,NaN);
  assert.equal(formatMS(five.outPace),'6:00');
  assert.equal(formatHMS(five.outTime),'30:00');
  const fiveFast=calculateRunningPace('pace','km',5,1650,NaN);
  assert.equal(formatMS(fiveFast.outPace),'5:30');
  assert.equal(formatMS(convertPaceSeconds(fiveFast.outPace,'km','mi')),'8:51');
  const three=calculateRunningPace('pace','mi',3,1800,NaN);
  assert.equal(formatMS(three.outPace),'10:00');
  assert.equal(formatMS(convertPaceSeconds(three.outPace,'mi','km')),'6:13');
});
test('km to mile and back converts both distance and pace while preserving finish time',()=>{
  const miles=convertDistance(10,'km','mi');
  const paceMiles=convertPaceSeconds(300,'km','mi');
  close(miles,10/KM_PER_MILE);
  close(paceMiles,300*KM_PER_MILE);
  assert.equal(formatMS(paceMiles),'8:03');
  const r=calculateRunningPace('time','mi',miles,NaN,paceMiles);
  assert.equal(formatHMS(r.outTime),'50:00');
  close(convertDistance(miles,'mi','km'),10);
  close(convertPaceSeconds(paceMiles,'mi','km'),300);
  const displayed=paceInputParts(paceMiles);
  assert.equal(displayed.minutes,'8');
  assert.equal(displayed.seconds,'3');
  assert.equal(distanceInput(miles),'6.213712');
  assert.match(island,/setExactDistance\(converted\)/);
  assert.match(island,/setExactPace\(converted\)/);
  assert.match(island,/onClick=\{\(\) => changeUnit\(u\)\}/);
  assert.match(island,/setExactPace\(null\)/);
});
test('distance and pace modes are inverse and support finish split on fractions',()=>{
  const r1=calculateRunningPace('distance','km',NaN,3150,315);
  assert.equal(r1.valid,true);
  close(r1.outDist,10);
  const r2=calculateRunningPace('pace','km',r1.outDist,r1.outTime,NaN);
  close(r2.outPace,315);
  const fractional=calculateRunningPace('time','km',10.25,NaN,300);
  assert.equal(fractional.splits.length,11);
  assert.equal(fractional.splits.at(-1).label,'10.25 km (finish)');
  assert.equal(formatHMS(fractional.splits.at(-1).time),'51:15');
});
test('runs longer than 60 units retain the final finish marker without unbounded list',()=>{
  for(const distance of [60,60.5,61,100,500]){
    const result=calculateRunningPace('time','km',distance,NaN,300);
    assert.equal(result.valid,true);
    assert.ok(result.splits.length<=61);
    assert.equal(formatHMS(result.splits.at(-1).time),formatHMS(result.outTime));
    if(distance>60)assert.match(result.splits.at(-1).label,/\(finish\)/);
  }
  assert.match(text,/first 60 checkpoints plus the actual finish marker/);
});
test('strict time input parsing rejects bad minute/second ranges, negatives and fractions',()=>{
  assert.equal(parseElapsedSeconds('1','02','03'),3723);
  assert.equal(parsePaceSeconds('5','30'),330);
  for(const value of ['60','99','-1','1.2','x','']){
    assert.ok(Number.isNaN(parseElapsedSeconds('0',value,'0')),value);
    assert.ok(Number.isNaN(parsePaceSeconds('5',value)),value);
  }
  assert.ok(Number.isNaN(parseElapsedSeconds('1.5','0','0')));
  assert.ok(Number.isNaN(parsePaceSeconds('3.2','0')));
  assert.ok(Number.isNaN(parseDistance('-4')));
  assert.ok(Number.isNaN(parseDistance('12abc')));
  assert.equal(parseDistance('10.25'),10.25);
  assert.equal(calculateRunningPace('time','km',0,NaN,300).valid,false);
  assert.equal(calculateRunningPace('time','km',10,NaN,0).valid,false);
  assert.equal(calculateRunningPace('pace','km',10,0,NaN).valid,false);
  assert.equal(calculateRunningPace('distance','km',NaN,1800,NaN).valid,false);
});
