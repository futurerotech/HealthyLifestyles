// Regression (run 43623986550): modules bundled into client islands must not read
// `process` unguarded at load time, or hydration throws "process is not defined".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ISLANDS = 'src/islands';
const resolveImport = (from, spec) => {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(from), spec);
  for (const p of [base, base + '.ts', base + '.tsx', join(base, 'index.ts')]) { try { readFileSync(p); return p; } catch {} }
  return null;
};
const graph = (entry, seen = new Set()) => {
  if (seen.has(entry)) return seen; seen.add(entry);
  const src = readFileSync(entry, 'utf8');
  for (const m of src.matchAll(/^\s*import\s+(?!type\b)[^'"]*['"]([^'"]+)['"]/gm)) { const p = resolveImport(entry, m[1]); if (p && /\.(ts|tsx)$/.test(p)) graph(p, seen); }
  return seen;
};

test('client island imports never read process unguarded', () => {
  const offenders = [];
  const entries = readdirSync(ISLANDS, { recursive: true }).filter((f) => /\.tsx?$/.test(f)).map((f) => resolve(ISLANDS, f));
  const all = new Set(); for (const e of entries) graph(e, all);
  for (const file of all) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (/\bprocess\.(env|argv|cwd)/.test(line) && !/typeof process !== ['"]undefined['"]/.test(line) && !/^\s*(\/\/|\*)/.test(line)) offenders.push(`${file.replace(process.cwd() + '/', '')}:${i + 1}`);
    });
  }
  assert.ok(all.size > 20, 'island import graph resolved');
  assert.deepEqual(offenders, []);
});
