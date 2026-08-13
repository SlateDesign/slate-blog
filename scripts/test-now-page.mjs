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

const { OPTIONAL_PAGE_SOURCES, findOptionalPage } = await importTypeScript(
  'src/helpers/optional-content-page.ts',
);

assert.equal(OPTIONAL_PAGE_SOURCES.now, '/src/content/now.md');
assert.equal(findOptionalPage({}, OPTIONAL_PAGE_SOURCES.now), undefined);

const expected = { Content: 'compiled-now-page' };
const wrongOnlyNowModules = {
  '/src/content/now.mdx': { Content: 'wrong-extension' },
  '/src/content/nested/now.md': { Content: 'wrong-directory' },
  '/src/content/now.md.backup': { Content: 'approximate-name' },
};

assert.equal(
  findOptionalPage(wrongOnlyNowModules, OPTIONAL_PAGE_SOURCES.now),
  undefined,
  'Now discovery must ignore wrong-only module tables',
);
assert.equal(
  findOptionalPage({
    '/src/content/config.ts': {},
    '/src/content/now.mdx': { Content: 'wrong-extension' },
    '/src/content/nested/now.md': { Content: 'wrong-directory' },
    '/src/content/now.md': expected,
  }, OPTIONAL_PAGE_SOURCES.now),
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
  /const hasNowPage = Boolean\(\s*findOptionalPage\(\s*contentModules,\s*OPTIONAL_PAGE_SOURCES\.now,?\s*\),\s*\);/,
  'Header must compute the Now state from its exact optional content source',
);
assert.match(
  header,
  /hasOptionalPages\s*&&\s*\(\s*<nav/,
  'Header must omit the complete nav element when both optional pages are absent',
);
assert.match(
  header,
  /\{hasNowPage\s*&&\s*\(\s*<a\s+href=["']\/now["'][\s\S]*?<\/a>\s*\)\}/,
  'Header must omit the Now link when now.md is absent',
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
  /if\s*\(!loadNowPage\)\s*return\s*\[\]/,
  'Now route must return no static paths when the file is absent',
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

const defaultNow = read('src/content/now.md');

assert.match(defaultNow, /^## What I'm doing now$/m);
assert.match(defaultNow, /^## About this page$/m);
assert.match(defaultNow, /https:\/\/nownownow\.com\/about/);
assert.match(
  defaultNow,
  /delete `src\/content\/now\.md`\s+to disable the page/i,
);
assert.doesNotMatch(
  defaultNow,
  /^---\s*[\s\S]*?\b(?:title|pubDate|draft):/,
  'the default Now page must not require article frontmatter',
);

const englishReadme = read('README.md');
const chineseReadme = read('README-zh_CN.md');

for (const [language, readme] of [
  ['English', englishReadme],
  ['Chinese', chineseReadme],
]) {
  assert.match(readme, /src\/content\/now\.md/, `${language} README must name the switch file`);
  assert.match(readme, /\/now/, `${language} README must document the route`);
  assert.match(readme, /1\.7\.0/, `${language} README must include the release entry`);
}
assert.match(englishReadme, /delete[^.]*now\.md[^.]*remove[^.]*navigation[^.]*route/is);
assert.match(chineseReadme, /删除[^。]*now\.md[^。]*(?:导航|入口)[^。]*(?:路由|页面)/is);
assert.match(englishReadme, /delete[^.]*now\.md[^.]*sitemap/is);
assert.match(chineseReadme, /删除[^。]*now\.md[^。]*sitemap/is);

console.log('optional now page tests passed');
