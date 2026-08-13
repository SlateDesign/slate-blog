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
