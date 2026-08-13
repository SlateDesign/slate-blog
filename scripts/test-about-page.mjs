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

assert.deepEqual(Object.keys(OPTIONAL_PAGE_SOURCES), ['now', 'about']);
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

const wrongOnlyAboutModules = {
  '/src/content/about.mdx': { id: 'wrong-about-extension' },
  '/src/content/pages/about.md': { id: 'nested-about' },
  '/src/content/about.md.backup': { id: 'approximate-about-name' },
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
  findOptionalPage(wrongOnlyAboutModules, OPTIONAL_PAGE_SOURCES.about),
  undefined,
  'About discovery must ignore wrong-only module tables',
);
assert.equal(
  findOptionalPage({}, OPTIONAL_PAGE_SOURCES.about),
  undefined,
);

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const readme = read('README.md');
const chineseReadme = read('README-zh_CN.md');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractDirectoryTree = (source, heading) => {
  const match = source.match(
    new RegExp(
      `^${escapeRegExp(heading)}\\n\\n` + '```' + '\\n([\\s\\S]*?)^```$',
      'm',
    ),
  );
  assert.ok(match, `${heading} must contain a fenced directory tree`);
  return match[1];
};

const extractSection = (source, heading) => {
  const level = heading.match(/^(#+) /)?.[1];
  assert.ok(level, `${heading} must be a Markdown heading`);
  const match = source.match(
    new RegExp(
      `^${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=^${escapeRegExp(level)} |(?![\\s\\S]))`,
      'm',
    ),
  );
  assert.ok(match, `${heading} section is required`);
  return match[1];
};

const assertContentTree = (tree, locale) => {
  assert.match(
    tree,
    /- src\/\n[\s\S]*? {2}├── content\/[^\n]*\n {2}│ {3}├── now\.md[^\n]*\n {2}│ {3}├── about\.md[^\n]*\n {2}│ {3}└── post\//,
    `${locale} directory tree must list adjacent now.md and about.md under src/content`,
  );
};

const assertEnglishAboutSection = (source) => {
  const section = extractSection(source, '### Optional About page');
  assert.match(section, /`src\/content\/about\.md` is the exact switch/);
  assert.match(section, /About is enabled by default/);
  assert.match(section, /`\/about` uses the full article\/Now Markdown pipeline and typography/);
  assert.match(
    section,
    /Deleting `src\/content\/about\.md` removes the About navigation, route, and sitemap URL without disabling Now\./,
  );
};

const assertChineseAboutSection = (source) => {
  const section = extractSection(source, '### 可选 About 页面');
  assert.match(section, /`src\/content\/about\.md` 是 `\/about` 页面及 Header 中 About 入口的唯一开关/);
  assert.match(section, /About 默认启用/);
  assert.match(section, /`\/about` 与文章和 Now 页面共用完整 Markdown 渲染链路和排版样式/);
  assert.match(
    section,
    /删除 `src\/content\/about\.md` 会移除 About 导航、路由和 sitemap 地址，而 Now 仍由 `now\.md` 独立控制。/,
  );
};

const assertReleaseSection = (source, heading, expectedEntries) => {
  const section = extractSection(source, heading);
  for (const entry of expectedEntries) {
    assert.ok(section.includes(entry), `${heading} must include ${entry}`);
  }
};

const detachedAboutDocumentation = `### Optional About page

The optional page is documented here.

### Elsewhere

\`src/content/about.md\` is the exact switch. About is enabled by default. \`/about\` uses the full article/Now Markdown pipeline and typography. Deleting \`src/content/about.md\` removes the About navigation, route, and sitemap URL without disabling Now.`;

for (const keyword of [
  'src/content/about.md',
  '/about',
  'Optional About page',
]) {
  assert.ok(detachedAboutDocumentation.includes(keyword));
}
assert.throws(() => assertEnglishAboutSection(detachedAboutDocumentation));

assertContentTree(extractDirectoryTree(readme, '## 🗂 Directory Structure'), 'English');
assertContentTree(extractDirectoryTree(chineseReadme, '## 🗂 目录'), 'Chinese');
assertEnglishAboutSection(readme);
assertChineseAboutSection(chineseReadme);
assertReleaseSection(readme, '### Version 1.8.0', [
  'Added an optional, complete-Markdown About page driven by `src/content/about.md`',
  'Shared exact file discovery between the independent Now and About pages',
]);
assertReleaseSection(chineseReadme, '### 版本 1.8.0', [
  '新增由 `src/content/about.md` 驱动、支持完整 Markdown 的可选 About 页面',
  'Now 与 About 独立启停，并共享严格的文件发现逻辑',
]);

const matrixSource = read('scripts/test-optional-pages-build.mjs');
const packageJson = JSON.parse(read('package.json'));

assert.equal(
  packageJson.scripts['test:optional-pages-build'],
  'pnpm test:optional-pages-build-safety && pnpm test:optional-pages-build:matrix',
  'the public optional-pages gate must run safety before the matrix',
);
assert.equal(
  packageJson.scripts['test:optional-pages-build:matrix'],
  'node scripts/test-optional-pages-build.mjs',
  'the direct matrix command must remain available to the composite gate',
);

assert.match(matrixSource, /mkdtemp\(/);
assert.match(matrixSource, /slate-v18-optional-pages-/);
assert.match(matrixSource, /src\/content\/now\.md/);
assert.match(matrixSource, /src\/content\/about\.md/);
assert.match(matrixSource, /finally[\s\S]*rm\(/);
assert.match(matrixSource, /realpath\(/);
assert.match(matrixSource, /lstat\(/);
assert.match(matrixSource, /isSymbolicLink\(\)/);
assert.match(matrixSource, /withValidatedTempParent/);
assert.match(matrixSource, /isMain/);
assert.match(matrixSource, /git[\s\S]*rev-parse[\s\S]*--local-env-vars/);
assert.match(matrixSource, /createGitCleanEnv/);
assert.match(
  matrixSource,
  /env:\s*createGitDiscoveryEnv\(inheritedEnv\)/,
  'Git metadata discovery must ignore inherited GIT_* selectors',
);
assert.doesNotMatch(
  matrixSource,
  /process\.cwd\(\)[\s\S]*recursive:\s*true/,
);

const aboutMarkdown = read('src/content/about.md');

assert.match(aboutMarkdown, /^## Hello$/m);
assert.match(aboutMarkdown, /^## About this site$/m);
assert.match(aboutMarkdown, /person behind this blog/i);
assert.match(
  aboutMarkdown,
  /delete `src\/content\/about\.md` to\s+disable the page/i,
);
assert.doesNotMatch(aboutMarkdown, /^---\s*$/m);

const personalBlogDetails = [
  /\b(?:Bluepikachu|exping|Pixyer|NiFiTi|Figma UX Writing|Files Preview)\b/i,
  /(?:新年第一杯喝什么|大师对谈之《红猪》|奶茶喝什么)/,
  /\b(?:Nikon Z f|Ricoh GR II|Nikon AF600|Canon EOS 30|Yashica Samurai|Minolta 360si)\b/i,
  /\b(?:SW-7973-4801-4403|138072651)\b/,
];

const includesPersonalBlogDetail = (markdown) =>
  personalBlogDetails.some((detail) => detail.test(markdown));

assert.equal(includesPersonalBlogDetail('- Project setup notes'), false);
assert.equal(includesPersonalBlogDetail('- Pixyer project notes'), true);

for (const personalBlogDetail of personalBlogDetails) {
  assert.doesNotMatch(aboutMarkdown, personalBlogDetail);
}

const headerSource = read('src/components/layouts/Header.astro');

assert.match(headerSource, /OPTIONAL_PAGE_SOURCES\.about/);
assert.match(headerSource, /const hasAboutPage = Boolean\(/);
assert.match(
  headerSource,
  /const hasOptionalPages = hasNowPage \|\| hasAboutPage/,
);
assert.match(headerSource, /hasOptionalPages\s*&&\s*\(\s*<nav/);
assert.match(
  headerSource,
  /\{hasNowPage\s*&&\s*\(\s*<a\s+href="\/now"[\s\S]*?<\/a>\s*\)\}/,
);
assert.match(
  headerSource,
  /\{hasAboutPage\s*&&\s*\(\s*<a\s+href="\/about"[\s\S]*?<\/a>\s*\)\}/,
);

const nowIndex = headerSource.indexOf('href="/now"');
const aboutIndex = headerSource.indexOf('href="/about"');
assert.ok(nowIndex >= 0 && aboutIndex > nowIndex);

for (const href of ['/now', '/about']) {
  assert.match(
    headerSource,
    new RegExp(
      `<a\\s+href="${href}"\\s+class="(?=[^"]*text-base)(?=[^"]*font-medium)(?=[^"]*text-slate11)(?=[^"]*hover:text-slate12)`,
    ),
  );
}

assert.match(headerSource, /<nav class="flex items-center gap-6"/);

const routeSource = read('src/pages/about/[...path].astro');

assert.match(routeSource, /import type \{ MarkdownInstance \} from 'astro'/);
assert.match(
  routeSource,
  /import\.meta\.glob<AboutModule>\('\/src\/content\/\*'\)/,
);
assert.doesNotMatch(routeSource, /eager\s*:\s*true/);
assert.match(routeSource, /OPTIONAL_PAGE_SOURCES\.about/);
assert.match(routeSource, /if \(!loadAboutPage\) return \[\]/);
assert.match(routeSource, /params:\s*\{\s*path:\s*undefined\s*\}/);
assert.match(routeSource, /props:\s*\{\s*Content:\s*aboutPage\.Content\s*\}/);
assert.match(routeSource, /<PageLayout title="About">/);
assert.match(routeSource, /<div class="blog-content">\s*<Content \/>/);
assert.match(routeSource, /pangu\.spacingNode\(content\)/);
assert.doesNotMatch(routeSource, /readFileSync|marked|set:html/);
