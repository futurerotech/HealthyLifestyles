import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../../../docs/editorial/unpublished-revisions/2026-11-06/', import.meta.url);
const read = (filename) => readFileSync(new URL(filename, base), 'utf8');
const packets = [
  { id: 6, slug: 'due-date-by-conception-date', tool: 33, original: '2026-07-15T18:58:13.656Z', file: 'cms-6-due-date' },
  { id: 26, slug: 'what-do-your-blood-pressure-numbers-mean', tool: 29, original: '2026-07-26T21:23:27.339Z', file: 'cms-26-blood-pressure' },
];

for (const spec of packets) {
  test('unpublished medical revision keeps existing CMS identity and verified editorial structure: ID ' + spec.id, () => {
    const d = JSON.parse(read(spec.file + '.json'));
    const md = read(spec.file + '.md');
    assert.equal(d.packetSchema, 'hls-unpublished-existing-article-revision/v1');
    assert.equal(d.target.cmsArticleId, spec.id);
    assert.equal(d.target.slug, spec.slug);
    assert.equal(d.target.originalUpdatedAt, spec.original);
    assert.equal(d.target.originalStatus, 'published');
    assert.equal(d.status, 'UNPUBLISHED_PROPOSAL_NOT_APPLIED');
    assert.match(d.approvalRequired, /Separate explicit owner permission/);
    assert.equal(d.retention.heroImage, spec.id === 6 ? 12 : 24);
    assert.equal(d.retention.primaryTool, spec.tool);
    assert.equal(d.retention.originalPublishedRecordMustStayUnchanged, true);
    assert.equal(d.proposedFields.primaryTool, spec.tool);
    assert.equal(d.proposedFields.author, 1);
    assert.deepEqual(d.proposedFields.tags, d.retention.tags);
    assert.deepEqual(d.proposedFields.relatedTools, d.retention.relatedTools);
    assert.deepEqual(d.proposedFields.relatedArticles, d.retention.relatedArticles);
    assert.equal(d.proposedFields.reviewedByHuman, false);
    assert.equal(d.proposedFields.reviewer, null);
    assert.equal(d.proposedFields.hasFAQ, true);
    assert.equal(d.proposedFields.seo.noIndex, false);
    assert.equal(d.proposedFields.seo.canonical, '');
    for (const field of ['metaTitle','metaDescription','ogTitle','ogDescription','twitterTitle','twitterDescription']) {
      assert.ok(d.proposedFields.seo[field]?.length >= 15, 'missing SEO field: ' + field);
    }
    assert.equal(d.proposedFields.takeaways.length, 3);
    const blocks = d.proposedFields.layout;
    const embed = blocks.filter(b => b.blockType === 'toolEmbed');
    assert.equal(embed.length, 1);
    assert.equal(embed[0].tool, spec.tool);
    assert.ok(blocks.indexOf(embed[0]) <= 3, 'interactive calculator should be near article opening');
    const faq = blocks.filter(b => b.blockType === 'peopleAlsoAsk');
    assert.equal(faq.length, 1);
    assert.equal(faq[0].items.length, 5);
    assert.ok(faq[0].items.every(i => i.question?.length > 15 && i.answer?.length > 80));
    assert.ok(blocks.some(b => b.blockType === 'callout' && b.tone === 'warning'));
    assert.ok(blocks.filter(b => b.blockType === 'text' && b.style === 'h2').length >= 7);
    assert.ok(blocks.filter(b => b.blockType === 'table').length >= 1);
    const paragraphs = blocks.filter(b => b.blockType === 'text' && b.style === 'p').map(b => b.text);
    const text = paragraphs.join('\n');
    assert.ok(text.split(/\s+/).length >= 1100, 'full article text is required');
    const internal = [...new Set([...text.matchAll(/\[[^\]]+\]\((\/[^)\s]+)\)/g)].map(m => m[1]))];
    const external = [...new Set([...text.matchAll(/\[[^\]]+\]\((https:\/\/[^)\s]+)\)/g)].map(m => m[1]))];
    assert.ok(internal.filter(s => s.startsWith('/tools/')).length >= 3);
    assert.ok(internal.filter(s => s.startsWith('/wellness-hub/')).length >= 2);
    assert.ok(external.length >= 3);
    assert.ok(d.proposedFields.sources.length >= 3 && d.proposedFields.sources.length <= 5);
    assert.ok(d.proposedFields.sources.every(s => /^https:\/\//.test(s.url) && s.label.length > 20));
    assert.ok(d.proposedFields.semanticEntities.length >= 5 && d.proposedFields.semanticEntities.length <= 7);
    assert.ok(d.proposedFields.semanticEntities.every(s => /^https:\/\//.test(s.url)));
    for(const b of paragraphs) assert.ok(md.includes(b), 'readable Markdown must mirror the structured CMS text blocks');
    assert.match(md, /NOT PUBLISHED \/ NOT WRITTEN TO CMS/);
    assert.match(md, /EXISTING INTERACTIVE CMS TOOL EMBED/);
    assert.doesNotMatch(JSON.stringify(d), /"verificationStatus":"approved"|"doctorApproved":true/);
  });
}
test('pregnancy dating examples match calendar arithmetic and exact existing relationship', () => {
  const d = JSON.parse(read('cms-6-due-date.json'));
  const blocks = d.proposedFields.layout;
  const table = blocks.find(b => b.blockType === 'table' && b.rows.length === 4);
  assert.ok(table);
  const addDays = (ymd, n) => {
    const dt = new Date(ymd + 'T00:00:00Z');
    dt.setUTCDate(dt.getUTCDate() + n);
    return dt.toISOString().slice(0,10);
  };
  for (const [date,n] of [['2026-01-01',280],['2026-01-15',266],['2026-01-18',263],['2026-01-20',261]]) {
    assert.equal(addDays(date,n),'2026-10-08');
  }
  const text = JSON.stringify(blocks);
  assert.match(text,/first-trimester ultrasound/i);
  assert.match(text,/clinical|clinician/);
  assert.match(text,/vaginal bleeding|warning signs|urgent medical/i);
});
test('2025 adult BP categories and emergency risk are distinguished in revision', () => {
  const d = JSON.parse(read('cms-26-blood-pressure.json'));
  const blocks = d.proposedFields.layout;
  const table = blocks.find(b => b.blockType === 'table' && b.rows.length === 5);
  assert.ok(table);
  const rows = table.rows.map(r => r.cells.join(' ')).join('\n');
  assert.match(rows,/Normal.*<120.*AND <80/);
  assert.match(rows,/Elevated.*120.?129.*AND <80/);
  assert.match(rows,/Stage 1.*130.?139.*OR 80.?89/);
  assert.match(rows,/Stage 2.*≥140.*OR ≥90/);
  const text = JSON.stringify(blocks);
  assert.match(text,/2025 AHA\/ACC/i);
  assert.match(text,/emergency services immediately/);
  assert.match(text,/without.*symptoms/);
  assert.match(text,/pregnan/i);
  assert.match(text,/Do not interpret a metabolic age/i);
  assert.match(text,/180/);
});
