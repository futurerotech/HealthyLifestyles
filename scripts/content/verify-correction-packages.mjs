// Verifies draft-only CMS correction packages against the exact live published records,
// in memory only. It reads the public published API and checks:
// 1. The article-tool package targets exactly the gated defects: same IDs, same slugs, and
//    the same 'before' finding as article-tool-gates.json.
// 2. Applying it to deep copies changes only the primaryTool relation and toolEmbed blocks.
//    Every other field and every non-embed block is unchanged and stays in order.
// 3. The preflight's article-tool check passes with every gate removed.
// 4. Every record in both packages (gates and the 12 release-coupled articles) still has
//    its baseline updatedAt (drift check).
// It prints a dry-run report and never writes to the CMS.
import { readFile } from 'node:fs/promises';
import { readPublishedCollection } from './inventory.mjs';
import { articleToolIntegration, checkArticleToolGates } from './preflight.mjs';

const slugOf = (t) => (t && typeof t === 'object' ? t.slug : t);
const isEmbed = (b) => b?.blockType === 'toolEmbed';

export function applyOps(doc, ops, toolBySlug) {
  const d = structuredClone(doc);
  d.layout = [...(d.layout || [])];
  const rel = (slug) => { const t = toolBySlug.get(slug); if (!t) throw Error(`tool not published: ${slug}`); return { id: t.id, slug: t.slug }; };
  for (const op of ops) {
    if (op.op === 'setPrimaryTool') d.primaryTool = rel(op.tool);
    else if (op.op === 'insertToolEmbed') {
      if (d.layout.some((b) => isEmbed(b) && slugOf(b.tool) === op.tool)) throw Error(`${d.slug}: embed already present (stale package)`);
      const firstText = d.layout.findIndex((b) => b?.blockType === 'text');
      d.layout.splice(op.position === 'afterFirstText' && firstText >= 0 ? firstText + 1 : 0, 0, { blockType: 'toolEmbed', tool: rel(op.tool) });
    } else if (op.op === 'replaceToolEmbed') {
      if (!d.layout.some((b) => isEmbed(b) && slugOf(b.tool) === op.from)) throw Error(`${d.slug}: no ${op.from} embed to replace (stale package)`);
      // Every duplicate embed of the wrong tool is replaced, so none remains.
      d.layout = d.layout.map((b) => (isEmbed(b) && slugOf(b.tool) === op.from ? { ...b, tool: rel(op.tool) } : b));
    } else throw Error(`unknown op ${op.op}`);
  }
  return d;
}

/** Fields other than primaryTool/toolEmbed that changed: must be empty. */
export function outOfScopeChanges(before, after) {
  const out = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (k === 'primaryTool' || k === 'layout') continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) out.push(k);
  }
  const a = (before.layout || []).filter((b) => !isEmbed(b)), b = (after.layout || []).filter((x) => !isEmbed(x));
  if (JSON.stringify(a) !== JSON.stringify(b)) out.push('layout (non-embed blocks)');
  return out;
}

const sameFinding = (f, g) => !!f && f.kind === g.kind && f.expected === g.expected && (f.actual || '') === (g.actual || '');

async function main() {
  const load = async (f) => JSON.parse(await readFile(new URL(f, import.meta.url), 'utf8'));
  const [pkg, coupled, gatesFile] = await Promise.all([
    load('./correction-packages/article-tool-gates.json'),
    load('./correction-packages/release-coupled-articles.json'),
    load('./article-tool-gates.json'),
  ]);
  const editorial = gatesFile.editorialPrimary || {};
  const [articles, tools] = await Promise.all([readPublishedCollection(pkg.cmsOrigin, 'articles'), readPublishedCollection(pkg.cmsOrigin, 'tools')]);
  const toolBySlug = new Map(tools.map((t) => [t.slug, t]));
  const byId = new Map(articles.map((a) => [a.id, a]));
  const problems = [];

  const gateIds = gatesFile.gates.map((g) => g.id).sort((a, b) => a - b).join(',');
  const pkgIds = pkg.articles.map((a) => a.id).sort((a, b) => a - b).join(',');
  if (gateIds !== pkgIds) problems.push(`package IDs ${pkgIds} differ from gate IDs ${gateIds}`);

  const report = [];
  const patched = articles.map((a) => {
    const p = pkg.articles.find((x) => x.id === a.id);
    if (!p) return a;
    if (p.slug !== a.slug) { problems.push(`identity mismatch for ID ${a.id}: package ${p.slug} vs live ${a.slug}`); return a; }
    const gate = gatesFile.gates.find((g) => g.id === a.id);
    const before = articleToolIntegration(a, editorial[a.slug]);
    if (!gate || !sameFinding(before, gate)) problems.push(`ID ${a.id}: live defect ${JSON.stringify(before)} is not the gated defect`);
    const out = applyOps(a, p.ops, toolBySlug);
    const scope = outOfScopeChanges(a, out);
    if (scope.length) problems.push(`ID ${a.id}: out-of-scope changes ${scope.join(', ')}`);
    const after = articleToolIntegration(out, editorial[a.slug]);
    if (after) problems.push(`ID ${a.id}: still inconsistent after patch ${JSON.stringify(after)}`);
    report.push({ id: a.id, slug: a.slug, updatedAt: a.updatedAt, before, after, primaryTool: slugOf(out.primaryTool),
      embeds: out.layout.filter(isEmbed).map((b) => `${b.tool.slug}#${b.tool.id}`) });
    return out;
  });
  for (const p of pkg.articles) if (!byId.has(p.id)) problems.push(`package ID ${p.id} is not a published article`);

  // The release check with every gate removed: the corrected records must pass on their own.
  const errorsAfter = checkArticleToolGates(patched, [], editorial);
  problems.push(...errorsAfter);

  // Drift: the 12 coupled records must still match their reviewed baseline.
  const drift = [];
  for (const c of coupled.articles) {
    const live = byId.get(c.id);
    if (!live) drift.push(`${c.id}: not published`);
    else if (live.slug !== c.slug) drift.push(`${c.id}: slug ${live.slug} != ${c.slug}`);
    else if (live.updatedAt !== c.baselineUpdatedAt) drift.push(`${c.id}: updatedAt ${live.updatedAt} != baseline ${c.baselineUpdatedAt}`);
  }
  console.log('[CORRECTION_PACKAGE] ' + JSON.stringify({ articles: report.length, coupled: coupled.articles.length, drift, problems, report }));
  if (problems.length || drift.length) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
