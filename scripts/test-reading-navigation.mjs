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
const blogStyles = read('src/assets/style/blog.css');

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

console.log('reading navigation tests passed');
