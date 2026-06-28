/**
 * Build-time Open Graph image for each Wellness Hub article (1200×630 PNG).
 * A branded editorial card on the dark brand navy: logo lockup, a category
 * eyebrow, the article title, and its excerpt. Wired into og:image /
 * twitter:image per article (see wellness-hub/[...path].astro). Rendered with
 * sharp at build — no runtime, no new dependency. Mirrors og/tools/[slug].png.ts.
 */
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { getArticles, getArticle, getArticleCategory } from '../../../lib/cms';
import { SITE } from '../../../consts';

const W = 1200;
const H = 630;
const SITE_URL = 'www.healthylifesstyles.com';

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Greedy word-wrap into at most `maxLines` lines of ~`maxChars`; ellipsize overflow. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines - 1) break;
    } else {
      line = next;
    }
  }
  const used = lines.join(' ').split(/\s+/).filter(Boolean).length;
  const rest = words.slice(used).join(' ');
  if (rest) lines.push(rest);
  if (lines.length > maxLines) lines.length = maxLines;
  const last = lines[lines.length - 1] ?? '';
  if (last.length > maxChars + 2) lines[lines.length - 1] = last.slice(0, maxChars - 1).trimEnd() + '…';
  return lines;
}

function buildSvg(title: string, excerpt: string, categoryName: string): string {
  const eyebrow = `WELLNESS HUB${categoryName ? ` · ${categoryName.toUpperCase()}` : ''}`;

  const titleLines = wrap(title, 24, 3);
  const titleSize = titleLines.length >= 3 ? 52 : titleLines.length === 2 ? 60 : 66;
  const titleLineH = titleSize + 12;
  const titleTop = 300;
  const titleTspans = titleLines
    .map((l, i) => `<tspan x="80" y="${titleTop + i * titleLineH}">${escapeXml(l)}</tspan>`)
    .join('');

  const descTop = titleTop + titleLines.length * titleLineH + 22;
  const descTspans = wrap(excerpt, 56, 2)
    .map((l, i) => `<tspan x="82" y="${descTop + i * 38}">${escapeXml(l)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a1628"/>
      <stop offset="1" stop-color="#0e1f38"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22c55e"/>
      <stop offset="1" stop-color="#16a34a"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1090" cy="110" r="240" fill="#22c55e" opacity="0.10"/>
  <circle cx="120" cy="600" r="200" fill="#22c55e" opacity="0.07"/>

  <!-- brand lockup -->
  <g transform="translate(80 64)">
    <rect width="84" height="84" rx="24" fill="url(#mark)"/>
    <path d="M17 49h12l5-17 10 31 8-22 5 8H68" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="104" y="38" font-family="'Segoe UI', Arial, sans-serif" font-size="36" font-weight="800" fill="#ffffff">${escapeXml(SITE.name)}</text>
    <text x="104" y="70" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5" fill="#ffffff" opacity="0.85">TRUSTED WELLNESS</text>
  </g>

  <!-- category eyebrow + accent rule -->
  <rect x="80" y="216" width="56" height="6" rx="3" fill="#22c55e"/>
  <text x="80" y="262" font-family="'Segoe UI', Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="2" fill="#22c55e">${escapeXml(eyebrow)}</text>

  <!-- title + excerpt -->
  <text font-family="'Segoe UI', Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff">${titleTspans}</text>
  <text font-family="'Segoe UI', Arial, sans-serif" font-size="26" font-weight="400" fill="#ffffff" opacity="0.82">${descTspans}</text>

  <!-- url strip -->
  <circle cx="86" cy="560" r="7" fill="#22c55e"/>
  <text x="104" y="568" font-family="'Segoe UI', Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff" opacity="0.92">${SITE_URL}</text>
  <text x="500" y="568" font-family="'Segoe UI', Arial, sans-serif" font-size="24" font-weight="400" fill="#ffffff" opacity="0.65">Free · Evidence-based wellness guides</text>
</svg>`;
}

export async function getStaticPaths() {
  const articles = await getArticles();
  return (articles || []).map((a) => ({ params: { slug: a.slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const slug = String(params.slug || '');
  const article = await getArticle(slug);
  if (!article) return new Response('Not found', { status: 404 });

  const category = await getArticleCategory(article.category).catch(() => null);
  const svg = buildSvg(
    article.title || 'Wellness guide',
    article.excerpt || article.metaDescription || '',
    category?.name || '',
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
