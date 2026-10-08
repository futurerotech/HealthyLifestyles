import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
const source = (name: string) => readFileSync(new URL(`../../../src/${name}`, import.meta.url), 'utf8');
const script = (name: string) => [...source(name).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
function harness(consent?: string) {
  const events: Record<string, Function[]> = {}; const requests: string[] = []; const beacons: unknown[] = [];
  const document = { visibilityState: 'hidden', prerendering: false, readyState: 'complete',
    addEventListener: (n: string, fn: Function) => (events[n] ||= []).push(fn),
    querySelectorAll: () => [], getElementById: () => null,
    createElement: () => ({}), head: { appendChild: (s: any) => requests.push(s.src) } };
  const context: any = { document, enabled: true, clientId: 'ca-pub-123', console,
    navigator: { sendBeacon: (...args: unknown[]) => beacons.push(args) },
    performance: { getEntriesByType: () => [] }, location: { pathname: '/' },
    PerformanceObserver: class { fn: Function; constructor(fn: Function) { this.fn = fn; } observe(o: any) { if(o.type === 'largest-contentful-paint') this.fn({getEntries: () => [{ startTime: 100 }]}); } },
    addEventListener: document.addEventListener, HLS_CONSENT: consent };
  context.window = context; vm.createContext(context);
  return { context, requests, beacons, fire: (n: string) => events[n]?.forEach(fn => fn({detail:{analytics:context.HLS_CONSENT==='accept',ads:context.HLS_CONSENT==='accept'}})) };
}
test('AdSense is inert until accept, loads once and stays blocked on rejection', () => {
  // A server-emitted script src bypasses any runtime gate.
  assert.doesNotMatch(source('components/AdsLoader.astro'), /src=\{`https:\/\/pagead2/);
  for (const choice of [undefined, 'reject', 'garbage']) {
    const h = harness(choice); vm.runInContext(script('components/AdsLoader.astro'), h.context);
    assert.equal(h.requests.length, 0); h.fire('consent-update'); assert.equal(h.requests.length, 0);
    h.context.HLS_CONSENT = 'accept'; h.fire('consent-update'); h.fire('consent-update');
    assert.equal(h.requests.length, 1); assert.match(h.requests[0], /adsbygoogle\.js\?client=ca-pub-123/);
  }
  const h = harness('accept'); vm.runInContext(script('components/AdsLoader.astro'), h.context); assert.equal(h.requests.length, 1);
});
test('AdSense pushes wait for consent even when an intersection or paint is queued', () => {
  const h = harness(); const frames: Function[] = [];
  h.context.requestAnimationFrame = (fn: Function) => frames.push(fn);
  const block = script('layouts/BaseLayout.astro');
  vm.runInContext(block.slice(block.indexOf('function pushAd'), block.indexOf('// Reveal')), h.context);
  h.context.pushAd({removeAttribute() {}, getBoundingClientRect: () => ({width: 320})});
  while(frames.length) frames.shift()!();
  assert.equal(h.context.adsbygoogle?.length || 0, 0);
  h.context.HLS_CONSENT = 'accept'; h.context.pushAd({getBoundingClientRect: () => ({width: 320})});
  while(frames.length) frames.shift()!();
  assert.equal(h.context.adsbygoogle.length, 1);
});
test('vitals never transmit without current consent, including withdrawal before pagehide', () => {
  for (const choice of [undefined, 'reject', 'accept']) {
    const h = harness(choice); vm.runInContext(script('components/WebVitals.astro'), h.context);
    h.fire('pagehide'); assert.equal(h.beacons.length, choice === 'accept' ? 1 : 0);
  }
  const h = harness('accept'); vm.runInContext(script('components/WebVitals.astro'), h.context);
  h.context.HLS_CONSENT = 'reject'; h.fire('pagehide'); assert.equal(h.beacons.length, 0);
});
test('cookie consent treats invalid storage as undecided and publishes explicit ads permission', () => {
  for (const stored of [null, 'invalid', 'reject', 'accept']) {
    const h = harness(); const updates: any[] = [];
    const banner = {hidden: true, querySelectorAll: () => []};
    h.context.document.getElementById = () => banner;
    h.context.document.dispatchEvent = (e: any) => updates.push(e.detail);
    h.context.localStorage = { getItem: () => stored };
    h.context.CustomEvent = class { detail: any; constructor(n: string, o: any) {this.detail = o.detail;} };
    vm.runInContext(stripTypeScriptTypes(script('components/CookieConsent.astro')), h.context);
    const valid = stored === 'accept' || stored === 'reject';
    assert.equal(banner.hidden, valid);
    if(valid) assert.equal(updates[0].ads, stored === 'accept');
    else assert.equal(h.context.HLS_CONSENT, undefined);
  }
});
