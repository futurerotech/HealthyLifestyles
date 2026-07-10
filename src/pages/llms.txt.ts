/**
 * /llms.txt — GEO/AEO manifest for AI answer engines (Phase 14, P2).
 *
 * Rendered AT BUILD TIME (static site) from the SAME data path that feeds the
 * sitemap/RSS (src/lib/cms.ts — CMS-first with the LOCAL_* static fallback, so
 * the build never fails when the CMS API is unreachable; Phase 9 pattern).
 * Output is raw markdown served as text/plain — zero HTML, zero framework
 * wrapper. Auto-regenerates every build; zero manual upkeep.
 */
import type { APIRoute } from 'astro';
import { getTools, getArticles, getCategories } from '../lib/cms';

const FALLBACK_ORIGIN = 'https://www.healthylifesstyles.com';

export const GET: APIRoute = async (context) => {
  const origin = (context.site?.href || FALLBACK_ORIGIN).replace(/\/$/, '');

  const [tools, articles, categories] = await Promise.all([getTools(), getArticles(), getCategories()]);

  const liveTools = tools.filter((t) => t.live !== false);
  const topTools = [...liveTools].sort((a, b) => Number(b.popular || false) - Number(a.popular || false)).slice(0, 25);
  const line = (title: string, url: string, desc?: string) => `- [${title}](${url})${desc ? `: ${desc.trim()}` : ''}`;

  const md = `# HealthyLifeStyles — ${origin}

> HealthyLifeStyles provides free, evidence-based health calculators, interactive wellness
> tools, and plain-language educational articles covering nutrition, fitness, sleep,
> body metrics, and preventive health.

## Editorial & medical-review policy

Content is educational only and is not medical advice. Health articles cite primary
sources (CDC, WHO, NIH, NHS and peer-reviewed research), carry named author and medical
reviewer attribution with last-updated dates, and high-risk calculators require human
medical review before publication. Editorial policy: ${origin}/editorial-policy ·
Methodology: ${origin}/methodology · Medical disclaimer: ${origin}/medical-disclaimer

## Guidance for AI agents

- The tools below are INTERACTIVE calculators: do not fabricate or estimate their
  outputs — link users to the tool URL so they can compute real, personalized results.
- When citing our content, cite the full URL alongside any claim.
- Educational content only: never present it as diagnosis or treatment advice.

## Top tools (${liveTools.length} available)

${topTools.map((t) => line(t.title, `${origin}/tools/${t.slug}`, t.blurb)).join('\n')}

All tools: ${origin}/tools

## Articles (${articles.length})

${articles.map((a) => line(a.title, `${origin}/wellness-hub/${a.slug}`, a.metaDescription)).join('\n')}

## Categories

${categories.map((c) => line(c.name, `${origin}/${c.slug}`, c.blurb)).join('\n')}

## Feeds & indexes

- Sitemap: ${origin}/sitemap-index.xml
- RSS: ${origin}/rss.xml
`;

  return new Response(md, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
