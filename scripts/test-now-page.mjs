import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const importTypeScript = async (path) => {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: path,
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
  );
};

const { NOW_PAGE_SOURCE, findNowPage } = await importTypeScript(
  'src/helpers/optional-now-page.ts',
);

assert.equal(NOW_PAGE_SOURCE, '/src/content/now.md');
assert.equal(findNowPage({}), undefined);

const expected = { Content: 'compiled-now-page' };
assert.equal(
  findNowPage({
    '/src/content/config.ts': {},
    '/src/content/now.mdx': { Content: 'wrong-extension' },
    '/src/content/nested/now.md': { Content: 'wrong-directory' },
    '/src/content/now.md': expected,
  }),
  expected,
);

console.log('optional now page tests passed');
