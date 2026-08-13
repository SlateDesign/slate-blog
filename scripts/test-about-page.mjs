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
    `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`,
  );
};

const { OPTIONAL_PAGE_SOURCES, findOptionalPage } = await importTypeScript(
  'src/helpers/optional-content-page.ts',
);

assert.equal(
  OPTIONAL_PAGE_SOURCES.now,
  '/src/content/now.md',
);
assert.equal(
  OPTIONAL_PAGE_SOURCES.about,
  '/src/content/about.md',
);

const nowModule = { id: 'now' };
const aboutModule = { id: 'about' };
const modules = {
  '/src/content/now.mdx': { id: 'wrong-now-extension' },
  '/src/content/about.mdx': { id: 'wrong-about-extension' },
  '/src/content/pages/about.md': { id: 'nested-about' },
  '/src/content/now.md': nowModule,
  '/src/content/about.md': aboutModule,
};

assert.equal(
  findOptionalPage(modules, OPTIONAL_PAGE_SOURCES.now),
  nowModule,
);
assert.equal(
  findOptionalPage(modules, OPTIONAL_PAGE_SOURCES.about),
  aboutModule,
);
assert.equal(
  findOptionalPage({}, OPTIONAL_PAGE_SOURCES.about),
  undefined,
);

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

void read;
