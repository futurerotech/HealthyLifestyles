import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assignedReviewer } from '../../../src/lib/medical-review.ts';
import { resolveAuthorIdentity as resolve, resolveCmsAuthorRelation as relation, validateAuthorInventory as validate, authorLd } from '../../../src/lib/author-identity.mjs';

const editorial = { cmsId: '10', slug: 'editorial-team', name: 'Editorial Team', schemaType: 'Organization' };
const person = { cmsId: '11', slug: 'fixture-person', name: 'Fixture Person', schemaType: 'Person', credential: 'Fixture credential', role: 'Fixture role', bio: 'Synthetic profile, not a clinician.' };
const other = { cmsId: '12', slug: 'second-person', name: 'Fixture Person', schemaType: 'Person' };
const authors = [editorial, person];
const docs = authors.map(({ cmsId, ...a }) => ({ ...a, id: cmsId }));
const inventory = (docs, totalDocs = docs.length) => ({ docs, totalDocs });
const source = (path) => readFileSync(new URL(`../../../src/${path}`, import.meta.url), 'utf8');

const cases = [
  ['explicit slug', 'fixture-person', authors, person],
  ['explicit unique name', 'Fixture Person', authors, person],
  ['unknown is never first author', 'missing', authors, undefined],
  ['blank assignment', '', authors, undefined],
  ['undefined assignment', undefined, authors, undefined],
  ['no case-insensitive guess', 'fixture person', authors, undefined],
  ['empty CMS inventory', 'editorial-team', [], undefined],
  ['ambiguous display name', 'Fixture Person', [...authors, other], undefined],
  ['duplicate slug', 'fixture-person', [person, { ...other, slug: person.slug }], undefined],
];
for (const [name, value, list, expected] of cases) test(name, () => assert.equal(resolve(value, list), expected));

const relations = [
  ['populated exact ID', { id: 11, slug: 'fixture-person', name: 'Translated name' }, person],
  ['scalar numeric ID', 11, person],
  ['scalar string ID', '11', person],
  ['missing ID is not rescued by name', { id: 999, name: person.name }, undefined],
  ['conflicting ID and slug', { id: 11, slug: 'editorial-team' }, undefined],
  ['null explicit ID', { id: null, slug: person.slug }, undefined],
  ['ID with null explicit slug', { id: 11, slug: null }, undefined],
  ['slug-only populated relation', { slug: person.slug }, person],
  ['name-only legacy fixture', { name: editorial.name }, editorial],
  ['name-only object cannot match a slug', { name: person.slug }, undefined],
  ['no relation', null, undefined],
  ['array not a relation', [{ id: 11 }], undefined],
  ['no guessing raw slug as ID', person.slug, undefined],
];
for (const [name, value, expected] of relations) test(name, () => assert.equal(relation(value, authors), expected));
test('ambiguous name-only relationship is omitted', () => assert.equal(relation({ name: person.name }, [...authors, other]), undefined));

for (const [name, value] of [
  ['complete inventory', inventory(docs)], ['authoritative empty inventory', inventory([])],
]) test(name, () => assert.doesNotThrow(() => validate(value)));
for (const [name, value] of [
  ['incomplete list', inventory(docs, 3)],
  ['missing docs', { totalDocs: 0 }],
  ['negative total', inventory([], -1)],
  ['missing ID', inventory([{ ...docs[0], id: undefined }])],
  ['duplicate ID (numeric/string)', inventory([docs[0], { ...docs[1], id: 10 }])],
  ['duplicate slug', inventory([docs[0], { ...docs[1], slug: editorial.slug }])],
  ['invalid path slug', inventory([{ ...docs[0], slug: '../bad' }])],
  ['blank name', inventory([{ ...docs[0], name: ' ' }])],
  ['unrecognized type', inventory([{ ...docs[0], schemaType: 'Unknown' }])],
]) test(name, () => assert.throws(() => validate(value), /authors inventory|author identity|Duplicate author/));

test('schema identity uses exactly the same source profile URL and name', () => {
  const ld = authorLd(person, 'https://example.test/');
  assert.equal(ld['@id'], 'https://example.test/author/fixture-person');
  assert.equal(ld.name, person.name);
  assert.equal(ld['@type'], 'Person');
  assert.equal(ld.credential, person.credential);
  assert.ok(!('worksFor' in ld));
});
test('organization profile is not a credentialed person', () => {
  const ld = authorLd(editorial, 'https://example.test/');
  assert.equal(ld['@type'], 'Organization');
  assert.ok(!('credential' in ld));
  assert.ok(!('jobTitle' in ld));
});

test('CMS list is cached, authoritative even when empty, and only falls back after guard', () => {
  const cms = source('lib/cms.ts');
  assert.match(cms, /let _authorsPromise: Promise<Author\[\]> \| null/);
  assert.match(cms, /validateAuthorInventory\(data\)/);
  assert.match(cms, /if \(!data\) \{\s+assertLocalFallbackAllowed\('authors'\);\s+return LOCAL_AUTHORS;/);
  assert.match(cms, /return resolveAuthorIdentity\(nameOrSlug, await getAuthors\(\)\)/);
  assert.doesNotMatch(cms, /return all\[0\] \|\| LOCAL_AUTHORS/);
  assert.match(cms, /resolveCmsAuthorRelation\(a\.author, authors\)/);
  assert.match(cms, /resolveCmsAuthorRelation\(a\.reviewer, authors\)/);
});
test('visible byline, profile and both language routes use the same inventory', () => {
  const byline = source('components/Byline.astro');
  assert.match(byline, /resolveAuthorIdentity\(author, allAuthors\)/);
  assert.match(byline, /Author not specified/);
  assert.doesNotMatch(byline, /allAuthors\[0\]|author = 'editorial-team'/);
  assert.match(source('pages/author/[slug].astro'), /resolveAuthorIdentity\(a\.author, allAuthors\)\?\.slug === author\.slug/);
  for (const path of ['pages/wellness-hub/[...path].astro', 'pages/[locale]/wellness-hub/[...path].astro']) {
    assert.match(source(path), /authorEntity \? \{ author: authorLd\(authorEntity, origin\) \} : \{\}/);
    assert.match(source(path), /reviewerEntity \? \{ reviewedBy: authorLd\(reviewerEntity, origin\) \} : \{\}/);
  }
});


test('explicit qualified person reviewer is retained, never invented', () => {
  assert.equal(assignedReviewer(person.slug, authors), person);
  assert.equal(assignedReviewer(undefined, authors), undefined);
  assert.equal(assignedReviewer(editorial.slug, authors), undefined);
});
test('ambiguous name or absent reviewer is not a clinical review', () => {
  assert.equal(assignedReviewer(person.name, [...authors, other]), undefined);
  assert.equal(assignedReviewer('unknown', authors), undefined);
});
test('reviewer requires explicit person, credential and biography', () => {
  for (const profile of [
    { ...person, credential: '' }, { ...person, bio: '' }, { ...person, schemaType: 'Organization' },
    { ...person, slug: 'medical-review' },
  ]) assert.equal(assignedReviewer(profile.slug, [profile]), undefined);
});
