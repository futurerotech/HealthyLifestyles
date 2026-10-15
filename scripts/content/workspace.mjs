import { cp, mkdir, mkdtemp, symlink, readdir, stat, realpath, link } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Disposable review workspace. Neither dist nor provider output in the repo is touched. */
export async function createReviewWorkspace(prefix) {
  if (!/^[a-z-]+$/.test(prefix)) throw new Error('Invalid review workspace prefix');
  await mkdir('.content-audit', { recursive: true });
  const workspace = await mkdtemp(resolve(`.content-audit/${prefix}-`));
  for (const entry of ['src', 'scripts', 'public', 'astro.config.mjs', 'vercel.json', 'package.json', 'tsconfig.json']) await cp(resolve(entry), resolve(workspace, entry), { recursive: true });
  if (process.platform === 'win32') {
    // Vercel's file tracer tries to recreate junctions as privileged symlinks.
    // Give each workspace real directories and shared immutable package files.
    async function linkPackages(from, to) {
      await mkdir(to, { recursive: true });
      const entries = await readdir(from, { withFileTypes: true });
      for (let start = 0; start < entries.length; start += 16) await Promise.all(entries.slice(start, start + 16).filter((e) => !['.cache', '.vite', '.astro'].includes(e.name)).map(async (entry) => {
        const source = resolve(from, entry.name), target = resolve(to, entry.name);
        if (entry.isDirectory() || entry.isSymbolicLink() && (await stat(source)).isDirectory()) await linkPackages(source, target);
        else await link(await realpath(source), target);
      }));
    }
    await linkPackages(resolve('node_modules'), resolve(workspace, 'node_modules'));
  } else await symlink(resolve('node_modules'), resolve(workspace, 'node_modules'), 'dir');
  return workspace;
}
