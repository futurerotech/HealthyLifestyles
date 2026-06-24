/**
 * Build-time Open Graph image for each tool (1200×630 PNG). A branded card on
 * the tool's brand gradient: logo lockup + "Trusted Wellness", the tool name,
 * its one-line description, its icon, and the site URL. Wired into og:image /
 * twitter:image per tool (see ToolPageLayout). Rendered with sharp at build —
 * no runtime, no new dependency.
 */
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { getLiveTools, getTool } from '../../../data/tools';
import { ICON_PATHS } from '../../../lib/icon-paths';
import { GRADIENTS, DEFAULT_GRADIENT } from '../../../lib/gradients';
import { SITE } from '../../../consts';

const W = 1200;
const H = 630;
const SITE_URL = 'www.healthylifestyles.com';

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Greedy word-wrap into at most `maxLines` lines of ~`maxChars`; ellipsize overflow. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
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
  // Remaining words go on the last line.
  const used = lines.join(' ').split(/\s+/).filter(Boolean).length;
  let rest = words.slice(used).join(' ');
  if (rest) lines.push(rest);
  if (lines.length > maxLines) lines.length = maxLines;
  // Ellipsize the final line if the whole string didn't fit.
  const last = lines[lines.length - 1] ?? '';
  if (last.length > maxChars + 2) lines[lines.length - 1] = last.slice(0, maxChars - 1).trimEnd() + '…';
  return lines;
}

function buildSvg(title: string, desc: string, icon: string, gradient: string): string {
  const [from, to] = GRADIENTS[gradient] ?? DEFAULT_GRADIENT;
  const iconInner = ICON_PATHS[icon] ?? ICON_PATHS.flask;

  const titleLines = wrap(title, 22, 2);
  const titleSize = titleLines.length > 1 || title.length > 18 ? 58 : 66;
  const titleLineH = titleSize + 12;
  const titleTop = titleLines.length > 1 ? 286 : 320;
  const titleTspans = titleLines
    .map((l, i) => `<tspan x="80" y="${titleTop + i * titleLineH}">${escapeXml(l)}</tspan>`)
    .join('');

  const descTop = titleTop + titleLines.length * titleLineH + 26;
  const descLines = wrap(desc, 50, 2);
  const descTspans = descLines
    .map((l, i) => `<tspan x="82" y="${descTop + i * 40}">${escapeXml(l)}</tspan>`)
    .join('');

  // Right-side frosted tile with the tool's icon (scaled from the 24×24 grid).
  const tileX = 858, tileY = 196, tileSz = 268, tileR = 48;
  const glyph = 156;
  const scale = glyph / 24;
  const gx = tileX + tileSz / 2 - glyph / 2;
  const gy = tileY + tileSz / 2 - glyph / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22c55e"/>
      <stop offset="1" stop-color="#16a34a"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="#0a1628" opacity="0.22"/>
  <circle cx="1080" cy="90" r="240" fill="#ffffff" opacity="0.08"/>
  <circle cx="80" cy="600" r="200" fill="#ffffff" opacity="0.06"/>

  <!-- frosted icon tile -->
  <rect x="${tileX}" y="${tileY}" width="${tileSz}" height="${tileSz}" rx="${tileR}" fill="#ffffff" opacity="0.16"/>
  <g transform="translate(${gx} ${gy}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.96">${iconInner}</g>

  <!-- brand lockup -->
  <g transform="translate(80 70)">
    <rect width="84" height="84" rx="24" fill="url(#mark)"/>
    <path d="M17 49h12l5-17 10 31 8-22 5 8H68" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="104" y="38" font-family="'Segoe UI', Arial, sans-serif" font-size="36" font-weight="800" fill="#ffffff">${escapeXml(SITE.name)}</text>
    <text x="104" y="70" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5" fill="#ffffff" opacity="0.85">TRUSTED WELLNESS</text>
  </g>

  <!-- tool name + description -->
  <text font-family="'Segoe UI', Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff">${titleTspans}</text>
  <text font-family="'Segoe UI', Arial, sans-serif" font-size="28" font-weight="400" fill="#ffffff" opacity="0.9">${descTspans}</text>

  <!-- url strip -->
  <text x="80" y="568" font-family="'Segoe UI', Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff" opacity="0.92">${SITE_URL}</text>
  <text x="476" y="568" font-family="'Segoe UI', Arial, sans-serif" font-size="24" font-weight="400" fill="#ffffff" opacity="0.7">Free · No signup · Science-backed</text>
</svg>`;
}

export function getStaticPaths() {
  return getLiveTools().map((t) => ({ params: { slug: t.slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const tool = getTool(String(params.slug));
  if (!tool) return new Response('Not found', { status: 404 });

  const svg = buildSvg(tool.title, tool.blurb, tool.icon ?? 'flask', tool.gradient ?? 'blue');
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
