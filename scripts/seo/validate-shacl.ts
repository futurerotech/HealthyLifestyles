/**
 * validate-shacl.ts — sandboxed SHACL validation CLI (Phase 12, P1).
 *
 *   node scripts/seo/validate-shacl.ts <file.json>     # file input
 *   node scripts/seo/validate-shacl.ts -                # stdin
 *   node scripts/seo/validate-shacl.ts --update-shapes  # maintenance ONLY (network; never CI)
 *
 * Validates JSON-LD against the vendored schemarama schema.org SHACL suite
 * (scripts/seo/shapes/ — SHA-256 pinned in shapes.lock.json; this script
 * REFUSES to run on checksum mismatch: fail-closed tamper detection).
 *
 * Input formats accepted: a JSON-LD object, an array of objects, an array of
 * JSON strings, or { jsonld: string[] } (the rich-results-check payload).
 * Remote @context values are replaced with an inline
 * { "@vocab": "http://schema.org/" } so NO network calls ever happen during
 * validation (the vendored shapes use the http:// schema.org namespace).
 *
 * Output: machine-readable JSON on STDOUT — { conforms, errors, warnings,
 * stats } (sh:Violation → errors; sh:Warning / sh:Info → warnings); human
 * summary on STDERR. Exit codes: 0 = ran (violations do NOT change the exit
 * code — this is a reporter), 1 = usage/internal error, 2 = shapes tamper.
 *
 * Isolation: ZERO imports from the app/Payload/Next runtime — node builtins +
 * the three pinned validator deps only. Run from the repo root (CI does).
 *
 * Known limitation (documented): rdf-validate-shacl performs no RDFS
 * inference, so only shapes targeting a node's EXACT @type apply (parent-class
 * constraints don't fire). Mistyped values on same-type properties are caught.
 *
 * Chaos-test hooks (used by __tests__/degradation.test.ts only):
 *   VALIDATE_SHACL_TEST_DELAY_MS — sleep before validating (timeout tests)
 *   VALIDATE_SHACL_TEST_CRASH=1  — abort mid-run (kill/crash tests)
 *   SHAPES_DIR                   — override shapes directory (tamper tests)
 */
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import jsonld from 'jsonld';
import { Parser, Store, DataFactory } from 'n3';
import SHACLValidator from 'rdf-validate-shacl';

const SHAPES_DIR = path.resolve(process.env.SHAPES_DIR || path.join(process.cwd(), 'scripts', 'seo', 'shapes'));
const LOCK_FILE = path.join(SHAPES_DIR, 'shapes.lock.json');
const VOCAB = 'http://schema.org/';

interface LockFile {
  source: string;
  sourceCommit: string;
  files: Record<string, { sha256: string; url: string }>;
}
interface Finding {
  message: string;
  path?: string;
  focusNode?: string;
  severity: string;
}

const sha256 = (buf: Buffer): string => createHash('sha256').update(buf).digest('hex');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fail-closed: every locked file must exist and match its pinned hash. */
function verifyShapesIntegrity(lock: LockFile): string[] {
  const problems: string[] = [];
  for (const [name, meta] of Object.entries(lock.files)) {
    const file = path.join(SHAPES_DIR, name);
    if (!fs.existsSync(file)) {
      problems.push(`${name}: missing`);
      continue;
    }
    const actual = sha256(fs.readFileSync(file));
    if (actual !== meta.sha256) problems.push(`${name}: sha256 mismatch (expected ${meta.sha256.slice(0, 12)}…, got ${actual.slice(0, 12)}…)`);
  }
  return problems;
}

/** Replace any remote/string @context with the offline schema.org vocab. */
function offlineContext(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(offlineContext);
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = k === '@context' ? { '@vocab': VOCAB } : offlineContext(v);
    }
    return out;
  }
  return node;
}

/** Accept object | object[] | string[] | { jsonld: string[] } → parsed blocks. */
function normalizeInput(raw: string): Record<string, unknown>[] {
  const parsed = JSON.parse(raw) as unknown;
  const wrapped = (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray((parsed as { jsonld?: unknown[] }).jsonld))
    ? (parsed as { jsonld: unknown[] }).jsonld
    : parsed;
  const arr = Array.isArray(wrapped) ? wrapped : [wrapped];
  return arr.map((b) => (typeof b === 'string' ? (JSON.parse(b) as Record<string, unknown>) : (b as Record<string, unknown>)));
}

interface QuadLike {
  subject: { termType: string; value: string };
  predicate: { value: string };
  object: { termType: string; value: string; language?: string; datatype?: { value: string } };
}

async function blocksToStore(blocks: Record<string, unknown>[]): Promise<Store> {
  const store = new Store();
  for (const block of blocks) {
    const offline = offlineContext(block);
    const quads = (await jsonld.toRDF(offline as never)) as unknown as QuadLike[];
    for (const q of quads) {
      store.addQuad(
        DataFactory.quad(
          q.subject.termType === 'BlankNode' ? DataFactory.blankNode(q.subject.value) : DataFactory.namedNode(q.subject.value),
          DataFactory.namedNode(q.predicate.value),
          q.object.termType === 'Literal'
            ? DataFactory.literal(q.object.value, q.object.language || DataFactory.namedNode(q.object.datatype?.value || ''))
            : q.object.termType === 'BlankNode'
              ? DataFactory.blankNode(q.object.value)
              : DataFactory.namedNode(q.object.value),
        ),
      );
    }
  }
  return store;
}

/** Maintenance mode: refresh shapes from upstream and re-pin. NEVER runs in CI. */
async function updateShapes(lock: LockFile): Promise<void> {
  console.error('[update-shapes] fetching latest upstream commit…');
  const commitRes = await fetch('https://api.github.com/repos/google/schemarama/commits/main');
  const commit = ((await commitRes.json()) as { sha: string }).sha;
  for (const [name] of Object.entries(lock.files)) {
    const url = `https://raw.githubusercontent.com/google/schemarama/${commit}/demo/validation/shacl/full.shacl`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch failed: ${res.status} ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(SHAPES_DIR, name), buf);
    lock.files[name] = { sha256: sha256(buf), url };
    console.error(`[update-shapes] ${name} ← ${commit.slice(0, 12)} (${buf.length} bytes, sha256 ${lock.files[name].sha256.slice(0, 12)}…)`);
  }
  lock.sourceCommit = commit;
  fs.writeFileSync(LOCK_FILE, JSON.stringify(lock, null, 2) + '\n');
  console.error('[update-shapes] shapes.lock.json re-pinned. Review + commit the diff.');
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')) as LockFile;

  if (arg === '--update-shapes') {
    await updateShapes(lock);
    process.exit(0);
  }

  // Tamper detection — fail closed BEFORE reading any input.
  const problems = verifyShapesIntegrity(lock);
  if (problems.length > 0) {
    console.error(`TAMPER: vendored shapes failed integrity check — refusing to validate.\n  ${problems.join('\n  ')}`);
    process.exit(2);
  }

  if (!arg) {
    console.error('usage: node scripts/seo/validate-shacl.ts <file.json | -> | --update-shapes');
    process.exit(1);
  }

  const raw = arg === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(arg, 'utf8');
  const blocks = normalizeInput(raw);

  // Chaos hooks (tests only) — see header.
  const delay = Number(process.env.VALIDATE_SHACL_TEST_DELAY_MS || 0);
  if (delay > 0) await sleep(delay);
  if (process.env.VALIDATE_SHACL_TEST_CRASH === '1') process.exit(137);

  const shapes = new Store(new Parser().parse(fs.readFileSync(path.join(SHAPES_DIR, 'schemarama-full.shacl'), 'utf8')));
  const data = await blocksToStore(blocks);
  const report = await new SHACLValidator(shapes).validate(data);

  const errors: Finding[] = [];
  const warnings: Finding[] = [];
  for (const r of report.results) {
    const sev = r.severity?.value || '';
    const finding: Finding = {
      message: r.message?.[0]?.value || r.sourceConstraintComponent?.value || 'constraint violation',
      path: r.path?.value,
      focusNode: r.focusNode?.value,
      severity: sev.split('#')[1] || sev,
    };
    (sev.endsWith('Violation') ? errors : warnings).push(finding);
  }

  console.log(JSON.stringify({ conforms: report.conforms, errors, warnings, stats: { blocks: blocks.length, dataQuads: data.size } }));
  console.error(`validate-shacl: ${blocks.length} block(s), ${data.size} quad(s) → conforms=${report.conforms}, ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`validate-shacl: internal error — ${(err as Error).message}`);
  process.exit(1);
});
