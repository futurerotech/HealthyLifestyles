// Exact-content promotion attestation for frontend `main`.
//
// Under the proposed ruleset (docs/release/branch-ruleset-main.json), `main` changes only
// through a pull request whose required `Verify` check passed and whose branch is up to date
// with `main`. GitHub then creates a merge commit M with parents [old main, R]. Because R
// already contains old main, M's tree is byte-identical to R's tree. The tested object is
// therefore the TREE (the exact content that Vercel builds), not a SHA that GitHub creates
// at merge time. This check proves that on the actual landed commit:
//   1. M is a fast-forward to R, or a merge with parents [P, R] where P is R's merge base.
//   2. tree(M) === tree(R): no untested change was introduced by the merge.
//   3. The required checks succeeded for R: Verify (production promotion gate) and, for a
//      release commit, Release-candidate acceptance.
// It is evidence, not a gate on Vercel. Vercel's own build of M re-runs the full preflight
// (content lock included), and that build produces the artifact that receives the alias.
import { execFileSync } from 'node:child_process';

export function verifyPromotion({ sha, parents, treeOf, mergeBase, checks, requireRc }) {
  const errors = [];
  const ps = parents(sha);
  let r;
  if (ps.length === 2) {
    r = ps[1];
    if (mergeBase(ps[0], r) !== ps[0]) errors.push(`R ${r} was not up to date with main ${ps[0]} when merged`);
    if (treeOf(sha) !== treeOf(r)) errors.push(`merge commit tree differs from the tested release tree (${treeOf(sha)} != ${treeOf(r)})`);
  } else if (ps.length === 1) {
    r = sha; // fast-forward: the landed commit is the tested commit
  } else errors.push(`unexpected parent count ${ps.length}`);
  if (r) {
    const c = checks(r);
    if (c.verify !== 'success') errors.push(`required Verify check for ${r} is ${c.verify ?? 'missing'}`);
    if (requireRc && c.rc !== 'success') errors.push(`release-candidate acceptance for ${r} is ${c.rc ?? 'missing'}`);
  }
  return { releaseCommit: r ?? null, errors };
}

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();

if (import.meta.url === `file://${process.argv[1]}`) {
  const sha = process.argv[2] || git('rev-parse', 'HEAD');
  const repo = process.env.GITHUB_REPOSITORY || 'futurerotech/HealthyLifestyles';
  const lock = JSON.parse(git('show', `${sha}:scripts/content/release-content-lock.json`));
  const runs = (headSha) => JSON.parse(execFileSync('gh', ['api', `repos/${repo}/actions/runs?head_sha=${headSha}&per_page=100`], { encoding: 'utf8' })).workflow_runs;
  const latest = (list, name) => list.filter((w) => w.name === name).sort((a, b) => b.run_number - a.run_number)[0]?.conclusion;
  const result = verifyPromotion({
    sha,
    parents: (s) => git('rev-list', '--parents', '-n', '1', s).split(' ').slice(1),
    treeOf: (s) => git('rev-parse', `${s}^{tree}`),
    mergeBase: (a, b) => git('merge-base', a, b),
    checks: (s) => { const l = runs(s); return { verify: latest(l, 'Verify repair branches'), rc: latest(l, 'Release-candidate acceptance (isolated staging mirror)') }; },
    requireRc: lock.enabled === true && lock.mode === 'release',
  });
  console.log('[PROMOTION_ATTESTATION] ' + JSON.stringify({ sha, ...result }));
  if (result.errors.length) process.exitCode = 1;
}
