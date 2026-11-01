import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeLighthouseVariance } from '../lighthouse-variance.mjs';

const report = (lcp, tbt, url = 'http://localhost:48313/', more = {}) => ({
  lighthouseVersion: '12.1.0', finalUrl: url,
  audits: {
    'largest-contentful-paint': {numericValue:lcp},
    'total-blocking-time': {numericValue:tbt},
    'cumulative-layout-shift': {numericValue:0},
    'mainthread-work-breakdown': {details:{items:[{group:'scriptEvaluation',duration:300},{group:'styleLayout',duration:200}]}},
    'bootup-time': {details:{items:[{url:'https://private.example/secret?token=1', total:510}]}},
  },
  categories: {performance:{score:0.88}},
  ...more,
});

test('computes same-build homepage variance and preserves fixed 2000ms diagnostic comparison',()=>{
  const s=summarizeLighthouseVariance([report(2200,350),report(1800,0),report(1900,100)]);
  assert.equal(s.runCount,3);
  assert.deepEqual(s.lcpMs,{min:1800,median:1900,max:2200,range:400,overExisting2000MsGate:1});
  assert.deepEqual(s.tbtMs,{min:0,median:100,max:350,range:350});
  assert.equal(s.slowestLcpRun.dominantMainThreadGroup,'scriptEvaluation');
  assert.equal(s.slowestLcpRun.longestScriptTotalMs,510);
  assert.equal(s.changesReleaseGate,false);
  assert.equal(s.diagnosticOnly,true);
  assert.ok(!JSON.stringify(s).includes('private.example'));
});

test('only exact http localhost homepage reports are considered',()=>{
  const a=[report(1900,0),report(1950,0),report(2000,0),report(900,0,'http://localhost:1234/tools'),report(800,0,'https://other.test/')];
  assert.equal(summarizeLighthouseVariance(a).runCount,3);
  assert.throws(()=>summarizeLighthouseVariance([...a,report(800,0,'http://localhost:1234/?debug=1')],4),/Expected exactly 4/);
  assert.throws(()=>summarizeLighthouseVariance(a.filter(x=>x.finalUrl.includes('/tools'))),/Expected exactly 3/);
});

test('rejects nonfinite metrics, mismatched Lighthouse versions, and invalid run counts',()=>{
  const good=[report(1700,0),report(1750,0),report(1800,0)];
  assert.throws(()=>summarizeLighthouseVariance([good[0],report(-5,0),good[2]]),/valid largest-contentful-paint/);
  assert.throws(()=>summarizeLighthouseVariance([good[0],report(1,NaN),good[2]]),/valid total-blocking-time/);
  assert.throws(()=>summarizeLighthouseVariance([...good.slice(0,2),{...good[2],lighthouseVersion:'1.0.0'}]),/Inconsistent Lighthouse versions/);
  assert.throws(()=>summarizeLighthouseVariance(good,1),/Invalid expected/);
});

test('unknown main-thread group is sanitized and never prints untrusted script path',()=>{
  const bad=report(2100,0,'http://localhost:9876/',{audits:{
    'largest-contentful-paint':{numericValue:2100}, 'total-blocking-time':{numericValue:0},
    'cumulative-layout-shift':{numericValue:0},
    'mainthread-work-breakdown':{details:{items:[{group:'internal-secret',duration:900}]}},
    'bootup-time':{details:{items:[{url:'https://secret.example/key',total:22}]}},
  }});
  const s=summarizeLighthouseVariance([report(1800,0),report(1900,0),bad]);
  assert.equal(s.slowestLcpRun.dominantMainThreadGroup,'other');
  assert.ok(!JSON.stringify(s).includes('secret'));
});
