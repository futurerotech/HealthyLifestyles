// Phase 7 §11.3 existing-page overlap and cannibalization screening (read-only).
// Inputs: the published CMS inventory only (articles, tools, pSEO pages). No search data.
// Output: pairs of pages whose search intent (title, SEO title, slug) overlaps, and
// articles sharing a primary tool. These are candidates for human review, not verdicts.
import { readFile, writeFile } from 'node:fs/promises';
import { readPublishedCollection } from './inventory.mjs';

const ORIGIN = process.env.CMS_ORIGIN || 'https://cms.healthylifesstyles.com';
const STOP = new Set('a an and are by can do does for from guide how i in is it my of on or should the to what when which why with your you vs per day explained calculator tool free mean means much many long'.split(' '));
const stem = (w) => w.replace(/(ing|ies|es|s)$/, (m) => (m === 'ies' ? 'y' : ''));
export const intent = (...parts) => new Set(parts.filter(Boolean).join(' ').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem));
export const jaccard = (a, b) => { const i = [...a].filter((x) => b.has(x)).length; return i / (a.size + b.size - i || 1); };

export function screen(pages, threshold = 0.5) {
  const pairs = [];
  for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) {
    const s = jaccard(pages[i].intent, pages[j].intent);
    // A tool and the article that embeds it are meant to pair; only same-kind or pSEO overlaps are screened.
    if (s >= threshold && !(pages[i].kind !== pages[j].kind && pages[i].kind !== 'pseo' && pages[j].kind !== 'pseo')) pairs.push({ score: +s.toFixed(2), a: pages[i].ref, b: pages[j].ref, shared: [...pages[i].intent].filter((x) => pages[j].intent.has(x)).join(' ') });
  }
  return pairs.sort((x, y) => y.score - x.score);
}

async function main() {
  const contract = JSON.parse(await readFile(new URL('../../src/lib/site-contract.json', import.meta.url), 'utf8'));
  const canon = (s) => contract.toolAliases?.[s] || s;
  const [articles, tools, pseo] = await Promise.all(['articles', 'tools', 'pseo-pages'].map((c) => readPublishedCollection(ORIGIN, c)));
  const rel = (r) => (r && typeof r === 'object' ? r.slug : r) || '';
  const pages = [
    ...articles.map((d) => ({ kind: 'article', ref: `article:${d.slug}`, intent: intent(d.title, d.seo?.metaTitle, d.slug.replace(/-/g, ' ')), tool: canon(rel(d.primaryTool)) })),
    ...tools.map((d) => ({ kind: 'tool', ref: `tool:${canon(d.slug)}`, intent: intent(d.title, d.seo?.metaTitle, d.slug.replace(/-/g, ' ')) })),
    ...pseo.map((d) => ({ kind: 'pseo', ref: `pseo:${d.slug}`, intent: intent(d.headline || d.title, d.seo?.metaTitle, d.slug.replace(/-/g, ' ')) })),
  ];
  const pairs = screen(pages);
  const byTool = {};
  for (const p of pages.filter((x) => x.kind === 'article' && x.tool)) (byTool[p.tool] ||= []).push(p.ref);
  const sharedTool = Object.entries(byTool).filter(([, v]) => v.length > 1);
  await writeFile('overlap-audit.json', JSON.stringify({ checkedAt: new Date().toISOString(), counts: { articles: articles.length, tools: tools.length, pseo: pseo.length }, pairs, sharedTool }, null, 2));
  console.log(JSON.stringify({ overlap: { articles: articles.length, tools: tools.length, pseo: pseo.length, pairs: pairs.length, sharedPrimaryTool: sharedTool.length } }));
  for (const p of pairs) console.log(`[OVERLAP] ${p.score} | ${p.a} | ${p.b} | ${p.shared}`);
  for (const [t, v] of sharedTool) console.log(`[SHARED_TOOL] ${t} | ${v.join(' ; ')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
