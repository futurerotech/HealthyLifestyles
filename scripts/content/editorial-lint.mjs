// Phase 3 §7.3/§7.5 editorial lint of published articles (read-only).
//
// Flags, for human editorial review:
// - British spellings in reader-facing copy (cited titles in doc.sources are exempt);
// - overclaiming or medically irresponsible phrasing;
// - thin content;
// - weak sourcing;
// - internal links that point to unpublished articles or tools;
// - articles with no internal links.
// Writes editorial-lint.json. It never changes content.
import { readFile, writeFile } from 'node:fs/promises';
import { readPublishedCollection } from './inventory.mjs';
import { blockTexts, articleToolIntegration } from './preflight.mjs';

const ORIGIN = process.env.CMS_ORIGIN || 'https://cms.healthylifesstyles.com';
const SITE_HOSTS = /^(?:https?:\/\/(?:www\.)?healthylifesstyles\.com)?(\/[^\s)]*)$/i;

export const BRITISH = /\b(fibre|colour(?:s|ed|ful)?|flavour(?:s|ed|ful)?|behaviour(?:s|al)?|(?:milli|centi|kilo)?(?:litre|metre)s?|centre[sd]?|favour(?:ite|s|ed)?|programme[sd]?|counsellor|yoghurts?|haem\w+|oestrogen|ageing|analys(?:e|ed|ing)|paediatric\w*|anaemi\w+|oedema|diarrhoea|foetus\w*|manoeuvre\w*|defence|travell(?:ed|ing|er)|modell(?:ed|ing)|fulfil|enrol(?:s|ment)?|learnt|whilst|amongst|tonnes?|(?:prioriti|organi|standardi|personali|optimi|minimi|recogni|normali|emphasi|summari|apologi|reali|utili|stabili|energi|categori|maximi|mobili|sensiti)s(?:e|ed|es|ing|ation))\b/gi;
export const OVERCLAIM = /\b(cures?|cured|guarantee[sd]?|guaranteed results|miracle|detox(?:ify|ifies|ing)?|melts? (?:away )?fat|burns? fat fast|clinically proven|scientifically proven|proven to|100% (?:safe|accurate|natural)|risk-free|never fails|reverse[sd]? (?:diabetes|aging|ageing|disease)|boosts? (?:your )?immun\w*|flush(?:es)? (?:out )?toxins|instantly|diagnos(?:e|es) you|you (?:definitely )?have (?:diabetes|hypertension|depression|anxiety|cancer))\b/gi;

export function hits(re, text) { return [...String(text).matchAll(re)].map((m) => m[0]); }
export const words = (texts) => texts.join(' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

/** Internal (same-site) markdown link targets as site paths. */
export function internalLinks(texts) {
  const out = [];
  for (const t of texts) for (const m of String(t).matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) { const p = m[1].match(SITE_HOSTS)?.[1]; if (p) out.push(p.split(/[?#]/)[0].replace(/\/+$/, '') || '/'); }
  return out;
}

export function lintArticle(doc, { articleSlugs, toolSlugs, toolAliases = {} }) {
  const body = [doc.title, doc.excerpt, doc.seo?.metaTitle, doc.seo?.metaDescription, ...(doc.layout || []).flatMap(blockTexts), ...(doc.faq || []).flatMap((f) => [f.question, f.answer])].filter(Boolean);
  const n = words(body);
  const links = internalLinks(body);
  const broken = links.filter((p) => {
    let m;
    if ((m = p.match(/^\/wellness-hub\/([^/]+)$/))) return !articleSlugs.has(m[1]);
    if ((m = p.match(/^\/tools\/([^/]+)$/))) return !toolSlugs.has(toolAliases[m[1]] || m[1]);
    return false;
  });
  const findings = [];
  const brit = [...new Set(body.flatMap((t) => hits(BRITISH, t)).map((w) => w.toLowerCase()))];
  if (brit.length) findings.push({ code: 'british-spelling', detail: brit.join(', ') });
  const over = [...new Set(body.flatMap((t) => hits(OVERCLAIM, t)).map((w) => w.toLowerCase()))];
  if (over.length) findings.push({ code: 'overclaim-review', detail: over.join(', ') });
  if (n < 700) findings.push({ code: 'thin-content', detail: `${n} words (~${Math.max(1, Math.round(n / 230))} min)` });
  const sources = (doc.sources || []).filter((s) => s?.url).length;
  if (sources < 3) findings.push({ code: 'few-sources', detail: `${sources} cited sources` });
  if (!links.length) findings.push({ code: 'no-internal-links', detail: '' });
  if (broken.length) findings.push({ code: 'broken-internal-link', detail: [...new Set(broken)].join(', ') });
  if (!(doc.faq || []).length) findings.push({ code: 'no-faq', detail: '' });
  const tool = articleToolIntegration(doc);
  if (tool) findings.push({ code: `tool-${tool.kind}`, detail: `${tool.expected} vs ${tool.actual || '(none)'}` });
  return { id: doc.id, slug: doc.slug, words: n, sources, internalLinks: links.length, findings };
}

async function main() {
  const contract = JSON.parse(await readFile(new URL('../../src/lib/site-contract.json', import.meta.url), 'utf8'));
  const [articles, tools] = await Promise.all([readPublishedCollection(ORIGIN, 'articles'), readPublishedCollection(ORIGIN, 'tools')]);
  const ctx = { articleSlugs: new Set(articles.map((a) => a.slug)), toolSlugs: new Set(tools.map((t) => contract.toolAliases?.[t.slug] || t.slug)), toolAliases: contract.toolAliases || {} };
  const results = articles.map((a) => lintArticle(a, ctx)).sort((a, b) => a.id - b.id);
  const counts = {};
  for (const r of results) for (const f of r.findings) counts[f.code] = (counts[f.code] || 0) + 1;
  await writeFile('editorial-lint.json', JSON.stringify({ checkedAt: new Date().toISOString(), cmsOrigin: ORIGIN, articles: results.length, counts, results }, null, 2));
  console.log(JSON.stringify({ lint: { articles: results.length, counts } }));
  for (const r of results) console.log(`[LINT] ${r.id} | ${r.slug} | ${r.words}w | src ${r.sources} | int ${r.internalLinks} | ${r.findings.map((f) => `${f.code}${f.detail ? `(${f.detail})` : ''}`).join(' ; ') || 'clean'}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
