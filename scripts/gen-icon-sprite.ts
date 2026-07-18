/**
 * gen-icon-sprite.ts
 *
 * Generates public/icons/sprite.svg from src/lib/icon-paths.ts so Icon.astro can
 * reference icons via <use href="/icons/sprite.svg#i-{name}"> instead of inlining
 * the full SVG markup at every instance (which added ~66 KB to /tools alone).
 *
 * Runs automatically as `prebuild`; safe to run manually after editing icon-paths.
 */
import * as fs from 'fs'
import * as path from 'path'
import { ICON_PATHS } from '../src/lib/icon-paths.ts'

const OUT = path.resolve(process.cwd(), 'public', 'icons', 'sprite.svg')

const symbols = Object.entries(ICON_PATHS)
  .map(([name, inner]) => `  <symbol id="i-${name}" viewBox="0 0 24 24">${inner}</symbol>`)
  .join('\n')

const svg = `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols}\n</svg>\n`

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, svg)

console.log(`icon sprite: ${Object.keys(ICON_PATHS).length} icons → ${path.relative(process.cwd(), OUT)} (${(svg.length / 1024).toFixed(1)} KB)`)
