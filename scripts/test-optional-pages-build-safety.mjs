import assert from 'node:assert/strict';
import { access, mkdir, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  removeOptionalPage,
  withValidatedTempParent,
} from './test-optional-pages-build.mjs';

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
