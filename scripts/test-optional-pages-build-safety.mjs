import assert from 'node:assert/strict';
import { access, mkdir, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  createGitCleanEnv,
  getGitLocalEnvVars,
  removeOptionalPage,
  withValidatedTempParent,
} from './test-optional-pages-build.mjs';

const localGitVariables = getGitLocalEnvVars({
  ...process.env,
  GIT_COMMON_DIR: '/tmp/polluted-common-dir',
  GIT_OBJECT_DIRECTORY: '/tmp/polluted-object-dir',
  GIT_ALTERNATE_OBJECT_DIRECTORIES: '/tmp/polluted-alternate-objects',
});
for (const name of [
  'GIT_COMMON_DIR',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
]) {
  assert.ok(localGitVariables.includes(name), `${name} must be Git-local`);
}
const pollutedEnv = {
  PATH: process.env.PATH,
  SLATE_OPTIONAL_PAGE_SENTINEL: 'preserve-me',
  GIT_PAGER: 'cat',
  ...Object.fromEntries(
    localGitVariables.map((name) => [name, `/tmp/polluted-${name}`]),
  ),
};
const cleanEnv = createGitCleanEnv({
  inheritedEnv: pollutedEnv,
  localGitVariables,
  gitDir: '/absolute/repository/git-dir',
  workTree: '/absolute/isolated/work-tree',
});

for (const name of localGitVariables) {
  if (name === 'GIT_DIR' || name === 'GIT_WORK_TREE') continue;
  assert.equal(
    Object.hasOwn(cleanEnv, name),
    false,
    `${name} must be removed from the build environment`,
  );
}
assert.equal(cleanEnv.GIT_DIR, '/absolute/repository/git-dir');
assert.equal(cleanEnv.GIT_WORK_TREE, '/absolute/isolated/work-tree');
assert.equal(cleanEnv.PATH, process.env.PATH);
assert.equal(cleanEnv.SLATE_OPTIONAL_PAGE_SENTINEL, 'preserve-me');
assert.equal(cleanEnv.GIT_PAGER, 'cat');

await withValidatedTempParent(async (resolvedFixtureParent) => {
  const copyRoot = join(resolvedFixtureParent, 'copy');
  const externalContent = join(resolvedFixtureParent, 'external-content');
  const externalPage = join(externalContent, 'now.md');
  const sentinel = join(externalContent, 'sentinel');

  await mkdir(join(copyRoot, 'src'), { recursive: true });
  await mkdir(externalContent);
  await writeFile(externalPage, 'outside the copy');
  await writeFile(sentinel, 'must survive');
  await symlink(externalContent, join(copyRoot, 'src/content'), 'dir');

  await assert.rejects(
    removeOptionalPage(copyRoot, 'now'),
    /symbolic link|outside the copy/i,
  );
  await access(externalPage);
  await access(sentinel);
});

let failedTempParent;
await assert.rejects(
  withValidatedTempParent(
    async () => assert.fail('runner must not start after validation fails'),
    async (tempParent) => {
      failedTempParent = tempParent;
      throw new Error('forced validation failure');
    },
  ),
  /forced validation failure/,
);
assert.ok(failedTempParent);
await assert.rejects(access(failedTempParent), { code: 'ENOENT' });

console.log('optional pages build safety tests passed');
