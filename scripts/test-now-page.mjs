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

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const header = read('src/components/layouts/Header.astro');

assert.match(
  header,
  /import\.meta\.glob\(['"]\/src\/content\/\*['"]\)/,
  'Header must discover optional root content without eagerly loading Markdown',
);
assert.doesNotMatch(
  header,
  /import\.meta\.glob\([^)]*eager:\s*true/,
  'Header must not eagerly compile the Now Markdown payload',
);
assert.match(
  header,
  /findNowPage\([\s\S]*?\)[\s\S]*?hasNowPage[\s\S]*?<nav/,
  'Header must render navigation only when now.md exists',
);
assert.match(
  header,
  /href=["']\/now["'][\s\S]*?>\s*Now\s*</,
  'Header must expose the fixed Now destination and label',
);
assert.match(
  header,
  /mb-9 flex items-center justify-between[\s\S]*?gap-6[\s\S]*?text-slate11[\s\S]*?hover:text-slate12[\s\S]*?text-base[\s\S]*?font-medium/,
  'Header navigation must match the personal-blog layout and typography',
);

const nowRoute = read('src/pages/now/[...path].astro');

assert.match(
  nowRoute,
  /import\.meta\.glob<[^>]+>\(['"]\/src\/content\/\*['"]\)/,
  'Now route must discover Astro-compiled root content through lazy loaders',
);
assert.doesNotMatch(
  nowRoute,
  /import\.meta\.glob\([^)]*eager:\s*true/,
  'Now route must not eagerly import unrelated root content modules',
);
assert.match(
  nowRoute,
  /async\s+function\s+getStaticPaths[\s\S]*?if\s*\(!loadNowPage\)\s*return\s*\[\][\s\S]*?await\s+loadNowPage\(\)[\s\S]*?path:\s*undefined/,
  'Now route must emit no path when disabled and only the empty rest path when enabled',
);
assert.match(
  nowRoute,
  /const\s*\{\s*Content\s*\}\s*=\s*Astro\.props[\s\S]*?<Content\s*\/>/,
  'Now route must render the compiled Markdown Content component',
);
assert.match(
  nowRoute,
  /<PageLayout\s+title=["']Now["'][\s\S]*?class=["']blog-content["']/,
  'Now route must use the standard layout and article typography',
);
assert.match(
  nowRoute,
  /pangu\/browser[\s\S]*?spacingNode/,
  'Now route must apply the same Pangu spacing enhancement as articles',
);
assert.doesNotMatch(
  nowRoute,
  /from\s+["'](?:fs|node:fs|marked)["']|readFileSync|set:html/,
  'Now route must not create a second Markdown parsing pipeline',
);

console.log('optional now page tests passed');
