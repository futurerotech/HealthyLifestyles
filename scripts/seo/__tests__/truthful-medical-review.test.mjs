import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = (path) => readFileSync(new URL(`../../../src/${path}`, import.meta.url), 'utf8');

test('tools and articles do not receive a site-wide medical review attribution', () => {
  assert.doesNotMatch(source('components/Byline.astro'), /reviewed = true|getReviewerLocal/);
  assert.doesNotMatch(source('components/ToolPageLayout.astro'), /reviewedBy: authorLd\(reviewerEntity\)|lastReviewed: EDITORIAL/);
  assert.doesNotMatch(source('pages/wellness-hub/[...path].astro'), /article\.reviewer \|\| REVIEWER_SLUG|lastReviewed: article\.updatedDate/);
  assert.doesNotMatch(source('pages/wellness-hub/[...path].astro'), /reviewedBy:/);
  assert.doesNotMatch(source('components/Byline.astro'), /Medically reviewed by/);
});

test('editorial and legal pages do not claim an unverified review board', () => {
  for (const path of ['pages/about.astro', 'pages/editorial-policy.astro', 'pages/methodology.astro', 'pages/llms.txt.ts']) {
    assert.doesNotMatch(source(path), /medical review board|Licensed clinicians & registered dietitians|our medical review team/i, path);
  }
  assert.doesNotMatch(source('data/authors.ts'), /slug: 'medical-review'/);
});

test('standalone apps do not publish invented reviewedBy structured data', () => {
  for (const path of ['pages/ai-assistant.astro', 'pages/health-score.astro', 'pages/medical-disclaimer.astro']) {
    assert.doesNotMatch(source(path), /reviewedBy: authorLd\(reviewerEntity\)|lastReviewed: EDITORIAL/, path);
  }
});

test('privacy copy discloses server features, local storage and advertising', () => {
  assert.match(source('pages/privacy.astro'), /recipe analysis/i);
  assert.match(source('pages/privacy.astro'), /local storage/i);
  assert.match(source('pages/privacy.astro'), /Food and Symptom Diary/i);
  assert.match(source('pages/privacy.astro'), /Health Score/i);
  assert.match(source('pages/cookie-policy.astro'), /advertising/i);
  for (const path of ['components/home/WhyTrust.astro', 'components/CookieConsent.astro']) {
    assert.doesNotMatch(source(path), /never uploaded|never stored|never\s+store the numbers/i, path);
  }
});

test('AdSense loading and slot initialization wait for explicit consent', () => {
  assert.match(source('components/AdsLoader.astro'), /HLS_CONSENT.*accept/);
  assert.match(source('layouts/BaseLayout.astro'), /HLS_CONSENT.*accept/);
  assert.doesNotMatch(source('components/AdSlot.astro'), /<template[^>]*set:html/);
  assert.match(source('components/AdSlot.astro'), /data-src=\{affiliate\.image\.url\}/);
  assert.doesNotMatch(source('components/AdSlot.astro'), /^\s+src=\{affiliate\.image\.url\}/m);
  assert.match(source('layouts/BaseLayout.astro'), /querySelectorAll\('img\[data-ad-affiliate\]'/);
});

test('consent can be changed without deleting locally saved tool data', () => {
  assert.match(source('components/Footer.astro'), /data-open-consent/);
  assert.match(source('components/CookieConsent.astro'), /closest\('\[data-open-consent\]'\)/);
  assert.match(source('components/CookieConsent.astro'), /location\.reload\(\)/);
  assert.doesNotMatch(source('pages/cookie-policy.astro'), /clear this site's\s+data in your browser and reload/i);
});

test('withdrawing consent preserves tool storage and reloads without opt-in', () => {
  const script = source('components/CookieConsent.astro').match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const handlers = {};
  const storage = new Map([['hls-consent', 'accept'], ['hls-diary', 'saved entries']]);
  let reloads = 0;
  const banner = {
    hidden: true,
    querySelectorAll: () => ['accept', 'reject'].map((choice) => ({
      dataset: { consent: choice }, addEventListener: (_, fn) => { handlers[choice] = fn; },
    })),
    querySelector: () => ({ focus: () => {} }),
  };
  const document = {
    getElementById: () => banner,
    addEventListener: (name, fn) => { handlers[name] = fn; },
    dispatchEvent: () => {},
  };
  const window = {};
  runInNewContext(ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, {
    document, window, localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    location: { reload: () => { reloads++; } }, CustomEvent: class {},
  });
  assert.equal(window.HLS_CONSENT, 'accept');
  handlers.click({ target: { closest: () => true } });
  assert.equal(banner.hidden, false);
  handlers.reject();
  assert.equal(window.HLS_CONSENT, 'reject');
  assert.equal(storage.get('hls-diary'), 'saved entries');
  assert.equal(storage.get('hls-consent'), 'reject');
  assert.equal(reloads, 1);
});

test('visitor-facing privacy claims describe server-assisted tools and local storage', () => {
  for (const path of ['data/faq.ts', 'components/Footer.astro', 'pages/index.astro', 'consts.ts', 'data/nutrition-content.ts', 'pages/health-score.astro', 'islands/HealthScore.tsx']) {
    assert.doesNotMatch(source(path), /never sent to a server|never leave your device|no data stored/i, path);
  }
  assert.match(source('data/faq.ts'), /local storage/i);
  assert.match(source('components/Footer.astro'), /server/i);
});

test('first-party web vitals are not transmitted before consent', () => {
  const vitals = source('components/WebVitals.astro');
  const script = vitals.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'WebVitals inline script exists');
  const handlers = {};
  const beacons = [];
  const observers = {};
  let choice = null;
  class PerformanceObserver {
    constructor(callback) { this.callback = callback; }
    observe({ type }) { observers[type] = this.callback; }
  }
  const window = { PerformanceObserver, HLS_CONSENT: undefined };
  assert.match(source('components/CookieConsent.astro'), /const KEY = 'hls-consent'/);
  assert.match(source('components/CookieConsent.astro'), /HLS_CONSENT = value/);
  runInNewContext(script, {
    window, PerformanceObserver,
    addEventListener: (name, handler) => { handlers[name] = handler; },
    document: { visibilityState: 'hidden' },
    localStorage: { getItem: (key) => key === 'hls-consent' ? choice : null },
    navigator: { sendBeacon: (...args) => beacons.push(args) },
    performance: { getEntriesByType: () => [] },
    location: { pathname: '/tools/bmi-calculator' },
  });
  observers['largest-contentful-paint']({ getEntries: () => [{ startTime: 50 }] });
  handlers.pagehide();
  assert.equal(beacons.length, 0, 'no consent');
  choice = 'reject';
  window.HLS_CONSENT = choice;
  handlers.visibilitychange();
  assert.equal(beacons.length, 0, 'rejected');
  choice = 'accept';
  window.HLS_CONSENT = choice;
  handlers.pagehide();
  assert.equal(beacons.length, 1, 'accepted once');
  choice = 'reject';
  window.HLS_CONSENT = choice;
  handlers.pagehide();
  assert.equal(beacons.length, 1, 'never sends again after withdrawal');
  assert.match(source('pages/privacy.astro'), /performance (?:metrics|data)/i);
});

test('embeds do not transmit the framing page referrer without consent', () => {
  const embed = source('pages/embed/[slug].astro');
  assert.doesNotMatch(embed, /navigator\.sendBeacon\(endpoint|fetch\(endpoint|document\.referrer/);
});
