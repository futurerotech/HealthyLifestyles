import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { SITE } from '../../consts';

const W = 1200;
const H = 630;

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
  const used = lines.join(' ').split(/\s+/).filter(Boolean).length;
  let rest = words.slice(used).join(' ');
  if (rest) lines.push(rest);
  if (lines.length > maxLines) lines.length = maxLines;
  const last = lines[lines.length - 1] ?? '';
  if (last.length > maxChars + 2) lines[lines.length - 1] = last.slice(0, maxChars - 1).trimEnd() + '\u2026';
  return lines;
}

function buildSvg(tool: string, value: string, label: string, category?: string, catColor?: string): string {
  const toolLines = wrap(tool, 25, 2);
  const toolY = toolLines.length > 1 ? 196 : 220;

  const valueFontSize = value.length > 6 ? 88 : value.length > 4 ? 104 : 128;
  const labelFontSize = 28;
  const categoryFontSize = 30;

  const catColorHex = catColor && /^#[0-9a-f]{6}$/i.test(catColor) ? catColor : '#16a34a';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#16a34a"/>
    </linearGradient>
    <linearGradient id="cardBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1060" cy="80" r="280" fill="#ffffff" opacity="0.06"/>
  <circle cx="100" cy="580" r="220" fill="#ffffff" opacity="0.04"/>

  <!-- Brand header -->
  <g transform="translate(70 60)">
    <rect width="72" height="72" rx="20" fill="url(#acc)"/>
    <path d="M14 42h10l4-14 9 26 7-18 4 6H58" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="90" y="32" font-family="'Segoe UI', Arial, sans-serif" font-size="30" font-weight="800" fill="#ffffff">${escapeXml(SITE.name)}</text>
    <text x="90" y="62" font-family="'Segoe UI', Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="4" fill="#22c55e">TRUSTED WELLNESS</text>
  </g>

  <!-- Divider -->
  <line x1="70" y1="148" x2="1130" y2="148" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>

  <!-- Tool name -->
  <text x="70" y="${toolY}" font-family="'Segoe UI', Arial, sans-serif" font-size="34" font-weight="600" fill="#94a3b8">
    ${toolLines.map((l, i) => `<tspan x="70" y="${toolY + i * 44}">${escapeXml(l)}</tspan>`).join('')}
  </text>

  <!-- Result value (big, centered area) -->
  <text x="600" y="400" font-family="'Segoe UI', Arial, sans-serif" font-size="${valueFontSize}" font-weight="800" fill="#ffffff" text-anchor="middle">${escapeXml(value)}</text>

  <!-- Result label -->
  <text x="600" y="454" font-family="'Segoe UI', Arial, sans-serif" font-size="${labelFontSize}" font-weight="500" fill="#94a3b8" text-anchor="middle">${escapeXml(label)}</text>

  <!-- Category badge -->
  ${category ? `
  <g transform="translate(${(W - (escapeXml(category).length * categoryFontSize * 0.7 + 56)) / 2} 490)">
    <rect width="${escapeXml(category).length * categoryFontSize * 0.7 + 56}" height="48" rx="24" fill="${catColorHex}" fill-opacity="0.16"/>
    <text x="28" y="31" font-family="'Segoe UI', Arial, sans-serif" font-size="${categoryFontSize}" font-weight="700" fill="${catColorHex}" text-anchor="middle">${escapeXml(category)}</text>
  </g>` : ''}

  <!-- URL -->
  <text x="70" y="578" font-family="'Segoe UI', Arial, sans-serif" font-size="22" font-weight="700" fill="#64748b">healthylifesstyles.com</text>
  <text x="1130" y="578" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="500" fill="#475569" text-anchor="end">Free &middot; No signup &middot; Science-backed</text>
</svg>`;
}

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const tool = url.searchParams.get('tool') || 'Health Calculator';
  const value = url.searchParams.get('value') || '';
  const label = url.searchParams.get('label') || '';
  const category = url.searchParams.get('category') || undefined;
  const catColor = url.searchParams.get('color') || undefined;

  if (!value) {
    return new Response('Missing required query param: value', { status: 400 });
  }

  const svg = buildSvg(tool, value, label, category, catColor);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  const bytes = new Uint8Array(png);
  return new Response(new Blob([bytes], { type: 'image/png' }), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',  // 24h — result images aren't fully immutable but safe to cache
    },
  });
};
