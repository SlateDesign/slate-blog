import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import {
  access,
  cp,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const tempPrefix = 'slate-v18-optional-pages-';
const resolvedSystemTemp = realpathSync(tmpdir());
const repoGitDir = await realpath(
  execFileSync('git', ['rev-parse', '--absolute-git-dir'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim(),
);
const tempParent = await mkdtemp(join(tmpdir(), tempPrefix));
const resolvedTempParent = await realpath(tempParent);

assert.equal(dirname(resolvedTempParent), resolvedSystemTemp);
assert.ok(basename(resolvedTempParent).startsWith(tempPrefix));

const states = [
  { name: 'both', now: true, about: true },
  { name: 'now-only', now: true, about: false },
  { name: 'about-only', now: false, about: true },
  { name: 'neither', now: false, about: false },
];

const excludedRoots = new Set(
  ['.git', 'node_modules', 'dist', '.astro', 'docs', '.superpowers'].map(
    (name) => join(repoRoot, name),
  ),
);

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const build = (copyRoot) =>
  new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['build'], {
      cwd: copyRoot,
      env: {
        ...process.env,
        GIT_DIR: repoGitDir,
        GIT_WORK_TREE: copyRoot,
      },
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });

try {
  for (const state of states) {
    const copyRoot = join(resolvedTempParent, state.name);

    assert.equal(dirname(copyRoot), resolvedTempParent);
    await cp(repoRoot, copyRoot, {
      recursive: true,
      filter: (source) => !excludedRoots.has(source),
    });

    const resolvedCopyRoot = await realpath(copyRoot);
    assert.equal(dirname(resolvedCopyRoot), resolvedTempParent);
    assert.equal(basename(resolvedCopyRoot), state.name);

    await symlink(
      join(repoRoot, 'node_modules'),
      join(copyRoot, 'node_modules'),
    );

    for (const [page, present] of [
      ['now', state.now],
      ['about', state.about],
    ]) {
      if (!present) {
        const contentPath = join(copyRoot, `src/content/${page}.md`);
        assert.equal(dirname(contentPath), join(copyRoot, 'src/content'));
        assert.ok(
          [
            join(copyRoot, 'src/content/now.md'),
            join(copyRoot, 'src/content/about.md'),
          ].includes(contentPath),
        );
        await rm(contentPath, { force: true });
      }
    }

    const result = await build(copyRoot);
    const buildLog = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.code, 0, `${state.name} build failed:\n${buildLog}`);
    assert.doesNotMatch(buildLog, /matched no files|No matches found/i);

    const distRoot = join(copyRoot, 'dist');
    const homepage = await readFile(join(distRoot, 'index.html'), 'utf8');
    const sitemap = await readFile(join(distRoot, 'sitemap-0.xml'), 'utf8');

    assert.equal(
      await exists(join(distRoot, 'now/index.html')),
      state.now,
      `${state.name}: /now output mismatch`,
    );
    assert.equal(
      await exists(join(distRoot, 'about/index.html')),
      state.about,
      `${state.name}: /about output mismatch`,
    );
    assert.equal(
      homepage.includes('href="/now"'),
      state.now,
      `${state.name}: Now header link mismatch`,
    );
    assert.equal(
      homepage.includes('href="/about"'),
      state.about,
      `${state.name}: About header link mismatch`,
    );
    assert.equal(
      sitemap.includes('/now/'),
      state.now,
      `${state.name}: Now sitemap entry mismatch`,
    );
    assert.equal(
      sitemap.includes('/about/'),
      state.about,
      `${state.name}: About sitemap entry mismatch`,
    );

    if (state.name === 'neither') {
      assert.doesNotMatch(homepage, /aria-label="Primary"/);
    }

    console.log(`${state.name}: passed`);
  }
} finally {
  const cleanupTarget = await realpath(tempParent).catch(() => undefined);
  if (
    cleanupTarget &&
    dirname(cleanupTarget) === realpathSync(tmpdir()) &&
    basename(cleanupTarget).startsWith('slate-v18-optional-pages-')
  ) {
    await rm(cleanupTarget, { recursive: true, force: true });
  }
}
