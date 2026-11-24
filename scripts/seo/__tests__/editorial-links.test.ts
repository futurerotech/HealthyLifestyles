import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { renderInline, safeLinkAttributes } = await import('../../../src/lib/text.ts');
const { editorialLinkPolicy } = await import('../../../src/data/editorial-citations.ts');
const due = 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date';
const bp = 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings';
const policy = editorialLinkPolicy('due-date-by-conception-date');

test('audited inline citation and structured source share ordinary link attributes', () => {
  assert.deepEqual(safeLinkAttributes(due, policy), { href: due, target: '_blank', rel: 'noopener' });
  assert.equal(renderInline(`[ACOG](${due})`, policy), `<a href="${due}" target="_blank" rel="noopener">ACOG</a>`);
});
test('blood pressure citation is approved in its own article only', () => {
  assert.equal(safeLinkAttributes(bp, editorialLinkPolicy('what-do-your-blood-pressure-numbers-mean'))?.rel, 'noopener');
  assert.equal(safeLinkAttributes(bp, policy)?.rel, 'noopener nofollow');
});
test('unclassified contexts default to nofollow even for an audited URL', () => {
  assert.equal(safeLinkAttributes(due)?.rel, 'noopener nofollow');
  assert.match(renderInline(`[Reference](${due})`), /rel="noopener nofollow"/);
  assert.equal(safeLinkAttributes(due, editorialLinkPolicy('__proto__'))?.rel, 'noopener nofollow');
});
test('wrong and generic pregnancy references remain qualified', () => {
  for (const url of ['https://www.ncbi.nlm.nih.gov/books/NBK459351/', 'https://www.acog.org/womens-health']) {
    assert.equal(safeLinkAttributes(url, policy)?.rel, 'noopener nofollow');
  }
});
test('same-host unrelated paths, query changes and fragment changes are not approved', () => {
  for (const url of [`${due}?affiliate=1`, `${due}#other`, 'https://www.acog.org/redirect?url=https://shop.example.test/']) {
    assert.equal(safeLinkAttributes(url, policy)?.rel, 'noopener nofollow');
  }
});
test('commercial links not in the audit never become followable', () => {
  assert.equal(safeLinkAttributes('https://www.amazon.com/s?k=cuff&tag=affiliate', policy)?.rel, 'noopener nofollow');
});
test('explicit sponsored context takes precedence over approval', () => {
  assert.equal(safeLinkAttributes(due, { ...policy, purpose: 'sponsored' })?.rel, 'noopener sponsored nofollow');
  assert.match(renderInline(`[Paid](${due})`, { ...policy, purpose: 'sponsored' }), /rel="noopener sponsored nofollow"/);
});
test('explicit UGC and untrusted contexts take precedence over approval', () => {
  assert.equal(safeLinkAttributes(due, { ...policy, purpose: 'ugc' })?.rel, 'noopener ugc nofollow');
  assert.equal(safeLinkAttributes(due, { ...policy, purpose: 'untrusted' })?.rel, 'noopener nofollow');
});
test('internal sponsored redirect remains qualified', () => {
  assert.deepEqual(safeLinkAttributes('/go/offer', { purpose: 'sponsored' }), { href: '/go/offer', rel: 'sponsored nofollow' });
});
test('unknown article cannot inherit another article citation', () => {
  assert.equal(safeLinkAttributes(due, editorialLinkPolicy('other-article'))?.rel, 'noopener nofollow');
});
test('legacy internal tool alias retains query and fragment with one HTML escaping pass', () => {
  assert.equal(renderInline('[tool](/tools/body-fat-percentage-calculator?a=1&b=2#result)', policy), '<a href="/tools/body-fat-calculator?a=1&amp;b=2#result">tool</a>');
});
test('local links, same-origin absolute links, anchors and mailto stay usable', () => {
  for (const url of ['/wellness-hub/example', '#sources', 'https://www.healthylifesstyles.com/tools/bmi-calculator', 'mailto:editor@example.test']) {
    assert.deepEqual(safeLinkAttributes(url, policy), { href: url });
  }
});
test('scheme-relative and uppercase external URLs still receive safe external attributes', () => {
  for (const url of ['//example.test/article', 'HTTPS://EXAMPLE.TEST/article', due.replace('https:', 'http:')]) {
    const attrs = safeLinkAttributes(url, policy);
    assert.equal(attrs?.target, '_blank');
    assert.equal(attrs?.rel, 'noopener nofollow');
  }
});
test('lookalike hosts, credentials and backslashes cannot bypass the policy', () => {
  assert.equal(safeLinkAttributes('https://www.acog.org.evil.example/path', policy)?.rel, 'noopener nofollow');
  assert.equal(safeLinkAttributes('https://www.acog.org@evil.example/path', policy), undefined);
  assert.equal(safeLinkAttributes('https:\\evil.example/path', policy), undefined);
});
test('unsafe schemes and controls are rejected in both link paths', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,bad', 'vbscript:msgbox(1)', 'file:///tmp/test', 'jav\tascript:alert(1)', 'https://example.test/\nnext']) {
    assert.equal(safeLinkAttributes(url, policy), undefined);
    assert.doesNotMatch(renderInline(`[click](${url})`, policy), /<a\b/);
  }
});
test('attribute-breaking destinations and raw HTML do not become active markup', () => {
  assert.equal(safeLinkAttributes('https://example.test/"onmouseover="alert(1)', policy), undefined);
  const html = renderInline('<img src=x onerror=alert(1)> [<script>evil</script>](https://example.test/a?x=1&y=2)', policy);
  assert.doesNotMatch(html, /<img\b|<script\b/);
  assert.match(html, /&lt;img/);
  assert.match(html, /href="https:\/\/example.test\/a\?x=1&amp;y=2"/);
  assert.match(html, /&lt;script&gt;evil&lt;\/script&gt;/);
});
test('encoded entities cannot become executable URL schemes or attributes', () => {
  const html = renderInline('[entity](&#106;avascript:evil) [query](https://example.test/?x=%22onerror%3D1&y=2)', policy);
  assert.doesNotMatch(html, /href="javascript:/i);
  assert.match(html, /href="&amp;#106;avascript:evil"/);
  assert.match(html, /x=%22onerror%3D1&amp;y=2/);
});
test('existing bold formatting and safe linked labels survive', () => {
  assert.equal(renderInline('**important** and [**source**](/wellness-hub/test)', policy), '<strong>important</strong> and <a href="/wellness-hub/test"><strong>source</strong></a>');
  assert.equal(renderInline(`**[ACOG](${due})**`, policy), `<strong><a href="${due}" target="_blank" rel="noopener">ACOG</a></strong>`);
});
