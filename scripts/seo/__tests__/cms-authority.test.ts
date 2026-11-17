import test from 'node:test';
import assert from 'node:assert/strict';
import { authoritativeCmsDocs, resolveCmsList } from '../../../src/lib/cms-authority.ts';

test('an authoritative empty CMS response must never trigger stale local fallback', () => {
  const calls: string[] = [];
  const value = resolveCmsList(
    { docs: [] as string[] },
    (docs) => { calls.push('cms'); return docs; },
    () => { calls.push('fallback'); return ['stale-tool']; },
  );
  assert.deepEqual(value, []);
  assert.deepEqual(calls, ['cms']);
});

test('valid nonempty CMS data is returned with no local fallback', () => {
  let fallbackCount = 0;
  const response = { docs: [{ slug: 'new', enabled: true }] };
  const result = resolveCmsList(response, docs => docs.filter(d => d.enabled), () => {
    fallbackCount++;
    return [{ slug: 'stale', enabled: true }];
  });
  assert.deepEqual(result, response.docs);
  assert.equal(fallbackCount, 0);
});

test('transport failure and malformed list envelope use the caller-controlled fallback', () => {
  for (const input of [null, undefined, { docs: 'not-an-array' } as unknown as { docs: string[] }]) {
    let cmsCalled = false;
    let fallbackCalled = 0;
    const result = resolveCmsList(input, () => { cmsCalled = true; return []; }, () => {
      fallbackCalled++;
      return ['local-dev-only'];
    });
    assert.deepEqual(result, ['local-dev-only']);
    assert.equal(fallbackCalled, 1);
    assert.equal(cmsCalled, false);
    assert.equal(authoritativeCmsDocs(input), null);
  }
});

test('empty CMS article slug result is authoritative not a previously published local article', () => {
  const result = resolveCmsList(
    { docs: [] as { slug: string }[] },
    docs => docs[0] ?? null,
    () => ({ slug: 'old-unpublished-article' }),
  );
  assert.equal(result, null);
});
