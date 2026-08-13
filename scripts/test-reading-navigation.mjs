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

const {
  calculateReadingProgress,
  filterTocHeadings,
  getActiveHeadingSlug,
  getHeadingScrollTop,
} = await importTypeScript('src/helpers/reading-navigation.ts');

const headings = [
  { depth: 1, slug: 'title', text: 'Title' },
  { depth: 2, slug: 'section', text: 'Section' },
  { depth: 4, slug: 'deep-section', text: 'Deep section' },
];

assert.deepEqual(filterTocHeadings([]), [], 'empty heading input stays empty');
assert.deepEqual(
  filterTocHeadings(headings).map(({ slug }) => slug),
  ['section', 'deep-section'],
  'TOC filtering must retain skipped heading levels below the article title',
);

assert.equal(
  getActiveHeadingSlug([], 500, 120),
  '',
  'empty heading positions must not invent an active section',
);

const positions = [
  { slug: 'first', offsetTop: 200 },
  { slug: 'second', offsetTop: 600 },
  { slug: 'third', offsetTop: 600 },
  { slug: 'fourth', offsetTop: 1000 },
];
assert.equal(
  getActiveHeadingSlug(positions, 100, 120),
  'first',
  'the viewport threshold should activate the first crossed heading',
);
assert.equal(
  getActiveHeadingSlug(positions, 480, 120),
  'third',
  'duplicate offsets must select the last crossed heading in document order',
);
assert.equal(
  getActiveHeadingSlug(positions, 900, 120),
  'fourth',
  'scroll fallback must select the last heading crossed by the threshold',
);

assert.equal(
  calculateReadingProgress(0, 2000, 1000),
  0,
  'top of a scrollable document is zero percent',
);
assert.equal(
  calculateReadingProgress(500, 2000, 1000),
  50,
  'middle of a scrollable document is fifty percent',
);
assert.equal(
  calculateReadingProgress(1000, 2000, 1000),
  100,
  'bottom of a scrollable document is one hundred percent',
);
assert.equal(
  calculateReadingProgress(0, 800, 800),
  100,
  'a non-scrollable document is already complete',
);
assert.equal(
  calculateReadingProgress(Number.NaN, 0, 0),
  100,
  'invalid zero-height measurements must never produce NaN',
);
assert.equal(
  calculateReadingProgress(2000, 2000, 1000),
  100,
  'reading progress must clamp above one hundred percent',
);
assert.equal(
  calculateReadingProgress(-200, 2000, 1000),
  0,
  'reading progress must clamp below zero percent',
);

assert.equal(
  getHeadingScrollTop(240, 96),
  144,
  'anchor scrolling must account for floating chrome',
);
assert.equal(
  getHeadingScrollTop(60, 96),
  0,
  'anchor scrolling must never produce a negative scroll target',
);
assert.equal(
  getHeadingScrollTop(Number.NaN, 96),
  0,
  'invalid anchor measurements must produce a safe scroll target',
);

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const tocComponent = read('src/components/toc/index.tsx');
const mobileTocComponent = read('src/components/mobile-toc/index.tsx');
const articlePage = read('src/pages/blog/[...slug].astro');
const blogStyles = read('src/assets/style/blog.css');
const english = read('src/i18n/lang/en-us.ts');
const chinese = read('src/i18n/lang/zh-cn.ts');

assert.match(
  tocComponent,
  /IntersectionObserver/,
  'desktop TOC must observe headings when the browser supports it',
);
assert.match(
  tocComponent,
  /addEventListener\(['"]scroll['"]/,
  'desktop TOC must retain a scroll fallback',
);
assert.match(
  tocComponent,
  /aria-current=\{[\s\S]*?'location'[\s\S]*?\}/,
  'the active desktop TOC link must expose aria-current=location',
);
assert.match(
  tocComponent,
  /behavior:\s*['"]smooth['"]/,
  'desktop TOC selection must scroll smoothly',
);
assert.match(
  blogStyles,
  /h2[\s\S]*h3[\s\S]*h4[\s\S]*scroll-margin-top:/,
  'article section headings must clear the floating title',
);

assert.match(
  mobileTocComponent,
  /<button[\s\S]*?aria-haspopup=["']dialog["'][\s\S]*?aria-expanded=/,
  'mobile TOC must open from an accessible disclosure button',
);
assert.match(
  mobileTocComponent,
  /role=["']dialog["'][\s\S]*?aria-modal=["']true["']/,
  'mobile TOC panel must expose modal dialog semantics',
);
assert.match(
  mobileTocComponent,
  /event\.key\s*===\s*['"]Escape['"][\s\S]*?closeDialog/,
  'Escape must close the mobile TOC',
);
assert.match(
  mobileTocComponent,
  /event\.target\s*===\s*event\.currentTarget[\s\S]*?closeDialog/,
  'clicking the overlay itself must dismiss the mobile TOC',
);
assert.match(
  mobileTocComponent,
  /previousOverflow\s*=\s*document\.body\.style\.overflow[\s\S]*?document\.body\.style\.overflow\s*=\s*['"]hidden['"][\s\S]*?document\.body\.style\.overflow\s*=\s*previousOverflow/,
  'body scroll locking must restore the previous inline overflow value',
);
assert.match(
  mobileTocComponent,
  /aria-controls=\{isOpen\s*\?\s*dialogId[\s\S]*?id=\{dialogId\}[\s\S]*?role=["']dialog["']/,
  'the disclosure control must reference the dialog element it opens',
);
assert.match(
  mobileTocComponent,
  /triggerRef\.current\?\.focus\(\)/,
  'closing the mobile TOC must restore focus to its trigger',
);
assert.match(
  mobileTocComponent,
  /matchMedia\(['"]\(min-width:\s*1280px\)['"]\)[\s\S]*?closeDialog/,
  'crossing into the xl desktop breakpoint must close the mobile dialog',
);
assert.match(
  articlePage,
  /<MobileToc[\s\S]*?dataSource=\{headings\}[\s\S]*?client:/,
  'article pages must hydrate the mobile TOC with the same heading records',
);
assert.match(english, /tableOfContents:/, 'English mobile TOC copy must exist');
assert.match(chinese, /tableOfContents:/, 'Chinese mobile TOC copy must exist');
assert.match(
  blogStyles,
  /prefers-reduced-motion:\s*reduce[\s\S]*?mobile-toc/,
  'mobile TOC motion must be disabled when reduced motion is preferred',
);

console.log('reading navigation tests passed');
