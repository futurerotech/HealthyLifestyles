// Verifies draft-only CMS correction packages against the exact live published records,
// in memory only. Reads the public published API, applies each package's operations to a
// deep copy, and re-runs the release preflight's article-tool check with the §6.3 gates
// removed. Prints a dry-run report (record IDs, current updatedAt for drift detection, and
// resolved tool relation IDs). It never writes to the CMS.
import { readFile } from 'node:fs/promises';
import { readPublishedCollection } from './inventory.mjs';
import { articleToolIntegration, checkArticleToolGates } from './preflight.mjs';

export function applyOps(doc, ops, toolBySlug) {
  const d = structuredClone(doc);
  d.layout = [...(d.layout || [])];
  const rel = (slug) => { const t = toolBySlug.get(slug); if (!t) throw Error(`tool not published: ${slug}`); return { id: t.id, slug: t.slug }; };
  for (const op of ops) {
    if (op.op === 'setPrimaryTool') d.primaryTool = rel(op.tool);
    else if (op.op === 'insertToolEmbed') {
      if (d.layout.some((b) => b?.blockType === 'toolEmbed' && (b.tool?.slug || b.tool) === op.tool)) throw Error(`${d.slug}: embed already present (stale package)`);
      const firstText = d.layout.findIndex((b) => b?.blockType === 'text');
      d.layout.splice(op.position === 'afterFirstText' && firstText >= 0 ? firstText + 1 : 0, 0, { blockType: 'toolEmbed', tool: rel(op.tool) });
    } else if (op.op === 'replaceToolEmbed') {
      const i = d.layout.findIndex((b) => b?.blockType === 'toolEmbed' && (b.tool?.slug || b.tool) === op.from);
      if (i < 0) throw Error(`${d.slug}: no ${op.from} embed to replace (stale package)`);
      // Every duplicate embed of the wrong tool is replaced, so none remains.
      d.layout = d.layout.map((b) => (b?.blockType === 'toolEmbed' && (b.tool?.slug || b.tool) === op.from ? { ...b, tool: rel(op.tool) } : b));
    } else throw Error(`unknown op ${op.op}`);
  }
  return d;
}

async function main() {
  const pkg = JSON.parse(await readFile(new URL('./correction-packages/article-tool-gates.json', import.meta.url), 'utf8'));
  const [articles, tools] = await Promise.all([readPublishedCollection(pkg.cmsOrigin, 'articles'), readPublishedCollection(pkg.cmsOrigin, 'tools')]);
  const toolBySlug = new Map(tools.map((t) => [t.slug, t]));
  const report = [];
  const patched = articles.map((a) => {
    const p = pkg.articles.find((x) => x.id === a.id);
    if (!p) return a;
    if (p.slug !== a.slug) throw Error(`identity mismatch for ID ${a.id}: package ${p.slug} vs live ${a.slug}`);
    const out = applyOps(a, p.ops, toolBySlug);
    report.push({ id: a.id, slug: a.slug, updatedAt: a.updatedAt, before: articleToolIntegration(a), after: articleToolIntegration(out),
      primaryTool: out.primaryTool?.slug, embeds: out.layout.filter((b) => b?.blockType === 'toolEmbed').map((b) => `${b.tool.slug}#${b.tool.id}`) });
    return out;
  });
  const missing = pkg.articles.filter((p) => !articles.some((a) => a.id === p.id)).map((p) => p.id);
  // The release check with every §6.3 gate removed: the corrected records must pass on their own.
  const errors = checkArticleToolGates(patched, [], { 'healthy-waist-to-height-ratio': 'waist-to-height-ratio-calculator' });
  console.log('[CORRECTION_PACKAGE] ' + JSON.stringify({ articles: report.length, missing, errorsAfter: errors, report }));
  if (missing.length || errors.length || report.some((r) => r.after)) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
