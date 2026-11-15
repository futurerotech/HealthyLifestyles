// Editorial standard: user-facing copy is American English. Published titles
// of cited works keep their original spelling and are listed explicitly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src/data', 'src/islands', 'src/components', 'src/pages', 'src/layouts'];
const BRITISH = /\b(fibre|colour(?:s|ed|ful)?|behaviour(?:s|al)?|(?:milli|centi|kilo)?(?:litre|metre)s?|favour(?:ite|s)?|programme|counsellor|(?:prioriti|organi|standardi|personali|optimi|minimi|recogni|normali|emphasi|summari|apologi|reali|utili)s(?:e|ed|es|ing|ation))\b/gi;
// Proper names / cited titles, kept verbatim.
const ALLOWED = [/sedentary behaviour/i, /Intersun Programme/i];
const files = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|astro|mjs)$/.test(n) ? [p] : []; });
// Strip comments so code notes are not policed.
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1').replace(/<!--[\s\S]*?-->/g, '');

test('user-facing copy uses American English spellings', () => {
  const hits = [];
  for (const f of ROOTS.flatMap(files)) {
    strip(readFileSync(f, 'utf8')).split('\n').forEach((line, i) => {
      for (const m of line.matchAll(BRITISH)) {
        if (!ALLOWED.some((a) => a.test(line))) hits.push(`${f}:${i + 1} ${m[0]}`);
      }
    });
  }
  assert.deepEqual(hits, []);
});
