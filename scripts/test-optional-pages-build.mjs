import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import {
  access,
  cp,
  lstat,
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

const states = [
  { name: 'both', now: true, about: true },
  { name: 'now-only', now: true, about: false },
  { name: 'about-only', now: false, about: true },
  { name: 'neither', now: false, about: false },
];

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

// These rev-parse calls discover the local-variable list itself, so they must
// not trust any inherited GIT_* selector. The build environment is cleaned
// more narrowly below and preserves non-local Git settings.
const createGitDiscoveryEnv = (inheritedEnv) =>
  Object.fromEntries(
    Object.entries(inheritedEnv).filter(([name]) => !name.startsWith('GIT_')),
  );

export const getGitLocalEnvVars = (inheritedEnv = process.env) =>
  execFileSync('git', ['rev-parse', '--local-env-vars'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: createGitDiscoveryEnv(inheritedEnv),
  })
    .split(/\r?\n/)
    .filter(Boolean);

const getRepositoryGitDir = async (inheritedEnv = process.env) =>
  realpath(
    execFileSync('git', ['rev-parse', '--absolute-git-dir'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: createGitDiscoveryEnv(inheritedEnv),
    }).trim(),
  );

export const createGitCleanEnv = ({
  inheritedEnv,
  localGitVariables,
  gitDir,
  workTree,
}) => {
  const cleanEnv = { ...inheritedEnv };

  for (const name of localGitVariables) delete cleanEnv[name];

  cleanEnv.GIT_DIR = gitDir;
  cleanEnv.GIT_WORK_TREE = workTree;
  return cleanEnv;
};

const build = (copyRoot, env) =>
  new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['build'], {
      cwd: copyRoot,
      env,
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

const validateTempParent = async (tempParent) => {
  const resolvedTempParent = await realpath(tempParent);
  assert.equal(dirname(resolvedTempParent), resolvedSystemTemp);
  assert.ok(basename(resolvedTempParent).startsWith(tempPrefix));
  return resolvedTempParent;
};

export const withValidatedTempParent = async (
  runner,
  validate = validateTempParent,
) => {
  const tempParent = await mkdtemp(join(tmpdir(), tempPrefix));
  try {
    const resolvedTempParent = await validate(tempParent);
    return await runner(resolvedTempParent);
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
};

export const removeOptionalPage = async (copyRoot, page) => {
  assert.ok(page === 'now' || page === 'about');

  const resolvedCopyRoot = await realpath(copyRoot);
  const srcPath = join(copyRoot, 'src');
  const contentDirectory = join(srcPath, 'content');
  const allowedContentPaths = {
    now: join(copyRoot, 'src/content/now.md'),
    about: join(copyRoot, 'src/content/about.md'),
  };
  const contentPath = allowedContentPaths[page];
  const expectedResolvedContent = join(resolvedCopyRoot, 'src/content');

  const [srcStats, contentStats, targetStats] = await Promise.all([
    lstat(srcPath),
    lstat(contentDirectory),
    lstat(contentPath),
  ]);
  assert.ok(
    !srcStats.isSymbolicLink(),
    'src ancestor must not be a symbolic link',
  );
  assert.ok(
    !contentStats.isSymbolicLink(),
    'content ancestor must not be a symbolic link',
  );
  assert.ok(
    !targetStats.isSymbolicLink(),
    'target must not be a symbolic link',
  );

  const resolvedContent = await realpath(contentDirectory);
  const resolvedTarget = await realpath(contentPath);
  assert.equal(resolvedContent, expectedResolvedContent);
  assert.equal(dirname(resolvedTarget), resolvedContent);
  assert.equal(resolvedTarget, join(resolvedContent, `${page}.md`));

  await rm(resolvedTarget, { force: true });
};

export const runMatrix = async () => {
  const inheritedEnv = process.env;
  const localGitVariables = getGitLocalEnvVars(inheritedEnv);
  const repoGitDir = await getRepositoryGitDir(inheritedEnv);
  const excludedRoots = new Set(
    ['.git', 'node_modules', 'dist', '.astro', 'docs', '.superpowers'].map(
      (name) => join(repoRoot, name),
    ),
  );

  await withValidatedTempParent(async (resolvedTempParent) => {
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
        if (!present) await removeOptionalPage(copyRoot, page);
      }

      const result = await build(
        resolvedCopyRoot,
        createGitCleanEnv({
          inheritedEnv,
          localGitVariables,
          gitDir: repoGitDir,
          workTree: resolvedCopyRoot,
        }),
      );
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
  });
};

const isMain =
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) await runMatrix();
