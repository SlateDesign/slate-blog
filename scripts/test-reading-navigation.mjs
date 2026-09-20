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
  buildChatGPTReadingUrl,
  filterTocHeadings,
  getActiveHeadingSlug,
  getHeadingScrollTop,
} = await importTypeScript('src/helpers/reading-navigation.ts');
const { defineConfig } = await importTypeScript('src/helpers/config-helper.ts');

const requiredConfig = {
  site: 'https://example.com',
  title: 'Example',
  description: 'Example blog',
};
const readingDefaults = defineConfig(requiredConfig);
assert.equal(
  readingDefaults.readingProgress,
  true,
  'reading progress must be enabled by default',
);
assert.equal(
  readingDefaults.progressiveBlur,
  true,
  'progressive blur must be enabled by default',
);
const disabledReadingFeatures = defineConfig({
  ...requiredConfig,
  readingProgress: false,
  progressiveBlur: false,
});
assert.equal(
  disabledReadingFeatures.readingProgress,
  false,
  'an explicit false must disable reading progress',
);
assert.equal(
  disabledReadingFeatures.progressiveBlur,
  false,
  'an explicit false must disable progressive blur',
);
assert.equal(
  readingDefaults.readWithChatGPT,
  false,
  'the external ChatGPT entry must be disabled by default',
);
assert.equal(
  defineConfig({ ...requiredConfig, readWithChatGPT: true }).readWithChatGPT,
  true,
  'explicit configuration must enable the ChatGPT entry',
);

const chatGPTReadingUrl = buildChatGPTReadingUrl(
  'https://example.com/base/',
  'hello world',
  'Summarize this article:',
);
const parsedChatGPTUrl = new URL(chatGPTReadingUrl);
assert.equal(
  parsedChatGPTUrl.origin,
  'https://chatgpt.com',
  'the reading action must open the public ChatGPT web app',
);
assert.equal(
  parsedChatGPTUrl.searchParams.get('q'),
  'Summarize this article: https://example.com/base/blog/hello%20world/',
  'the prompt must contain an absolute canonical article URL',
);
assert.match(
  chatGPTReadingUrl,
  /q=Summarize\+this\+article%3A\+https%3A%2F%2Fexample\.com%2Fbase%2Fblog%2Fhello%2520world%2F/,
  'the complete prompt and canonical URL must be percent-encoded',
);

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
  getActiveHeadingSlug(
    [
      { slug: 'previous', offsetTop: 800 },
      { slug: 'short-final-section', offsetTop: 1900 },
    ],
    1200,
    120,
    2000,
    800,
  ),
  'short-final-section',
  'the final short section must become active when the document reaches bottom',
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
const circularProgressComponent = read(
  'src/components/circular-progress/index.tsx',
);
const affixTitleComponent = read('src/components/affix-title/index.tsx');
const articlePage = read('src/pages/blog/[...slug].astro');
const blogStyles = read('src/assets/style/blog.css');
const commonStyles = read('src/assets/style/common.css');
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
assert.doesNotMatch(
  tocComponent,
  /else\s*\{\s*window\.addEventListener\(['"]scroll['"]/,
  'desktop TOC scroll fallback must remain active even when IntersectionObserver exists',
);
assert.match(
  tocComponent,
  /aria-current=\{[\s\S]*?'location'[\s\S]*?\}/,
  'the active desktop TOC link must expose aria-current=location',
);
assert.match(
  tocComponent,
  /behavior:[\s\S]*?['"]smooth['"]/,
  'desktop TOC selection must scroll smoothly',
);
assert.match(
  tocComponent,
  /behavior:[\s\S]*?prefers-reduced-motion:\s*reduce[\s\S]*?['"]auto['"][\s\S]*?['"]smooth['"]/,
  'desktop TOC scrolling must respect reduced-motion preferences',
);
assert.match(
  blogStyles,
  /h2[\s\S]*h3[\s\S]*h4[\s\S]*scroll-margin-top:/,
  'article section headings must clear the floating title',
);

assert.match(
  mobileTocComponent,
  /top-\[4\.5rem\][\s\S]*?size-7[\s\S]*?right:\s*'max\(1rem, calc\(\(100vw - 45rem\) \/ 2 \+ 1rem\)\)'/,
  'mobile TOC trigger must match the personal-blog position and quiet icon size',
);
assert.match(
  mobileTocComponent,
  /mobile-toc-icon size-5[\s\S]*?mobile-toc-icon-bar top[\s\S]*?mobile-toc-icon-bar middle[\s\S]*?mobile-toc-icon-bar bottom/,
  'mobile TOC trigger must use the personal-blog three-line morphing icon',
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
  /bg-slate12\/25 absolute inset-0[\s\S]*?onClick=\{closeDialog\}/,
  'the personal-blog overlay button must dismiss the mobile TOC',
);
assert.match(
  mobileTocComponent,
  /previousOverflow\s*=\s*document\.body\.style\.overflow[\s\S]*?document\.body\.style\.overflow\s*=\s*['"]hidden['"][\s\S]*?document\.body\.style\.overflow\s*=\s*previousOverflow/,
  'body scroll locking must restore the previous inline overflow value',
);
assert.match(
  mobileTocComponent,
  /aria-controls=\{dialogId\}[\s\S]*?id=\{dialogId\}[\s\S]*?role=["']dialog["']/,
  'the disclosure control must reference the dialog element it opens',
);
assert.match(
  mobileTocComponent,
  /role=["']dialog["'][\s\S]{0,200}?aria-hidden=\{!isOpen\}/,
  'the closed mobile dialog must be removed from the accessibility tree',
);
assert.match(
  mobileTocComponent,
  /triggerRef\.current\?\.focus\(\)/,
  'closing the mobile TOC must restore focus to its trigger',
);
assert.match(
  mobileTocComponent,
  /matchMedia\(['"]\(min-width:\s*1280px\)['"]\)[\s\S]*?setIsOpen\(false\)/,
  'crossing into the xl desktop breakpoint must close the mobile dialog',
);
assert.match(
  articlePage,
  /<MobileToc[\s\S]*?dataSource=\{headings\}[\s\S]*?client:load/,
  'article pages must immediately hydrate the mobile TOC with the same heading records',
);
assert.match(english, /tableOfContents:/, 'English mobile TOC copy must exist');
assert.match(chinese, /tableOfContents:/, 'Chinese mobile TOC copy must exist');
assert.match(
  mobileTocComponent,
  /closeLabel:\s*string[\s\S]*?aria-label=\{closeLabel\}/,
  'the mobile dialog close action must use localized accessible copy',
);
assert.match(
  mobileTocComponent,
  /dialogRef\.current\?\.focus\(\{ preventScroll:\s*true \}\)/,
  'opening must focus the panel itself like the personal-blog interaction',
);
assert.match(
  mobileTocComponent,
  /top-16 bottom-2[\s\S]*?mobile-toc-panel--open[\s\S]*?mobile-toc-panel--closed pointer-events-none/,
  'mobile TOC panel must use the personal-blog floating-card geometry and states',
);
assert.match(
  mobileTocComponent,
  /opacity:\s*isOpen \? 1 : 0[\s\S]*?translateY\(0\)[\s\S]*?translateY\(4px\)[\s\S]*?180 \+ index \* 10/,
  'mobile TOC rows must use the personal-blog staggered fade and lift',
);
assert.match(
  commonStyles,
  /\.mobile-toc-icon-bar[\s\S]*?transform 220ms cubic-bezier\(0\.4, 0, 0\.2, 1\)[\s\S]*?\.mobile-toc-icon\.is-open \.mobile-toc-icon-bar\.top[\s\S]*?translateY\(4px\) rotate\(45deg\)/,
  'mobile TOC icon must use the personal-blog morph timing',
);
assert.match(
  commonStyles,
  /\.mobile-toc-panel[\s\S]*?transform-origin:\s*top right[\s\S]*?transform 240ms cubic-bezier\(0\.4, 0, 0\.2, 1\)[\s\S]*?\.mobile-toc-panel--open[\s\S]*?transition-delay:\s*60ms/,
  'mobile panel must expand from the trigger after the overlay appears',
);
assert.match(
  commonStyles,
  /prefers-reduced-motion:\s*reduce[\s\S]*?mobile-toc-icon-bar[\s\S]*?mobile-toc-panel[\s\S]*?mobile-toc-item/,
  'mobile TOC motion must be disabled when reduced motion is preferred',
);

assert.match(
  circularProgressComponent,
  /addEventListener\(['"]scroll['"][\s\S]*?passive:\s*true/,
  'circular progress must use a passive scroll listener',
);
assert.match(
  circularProgressComponent,
  /requestAnimationFrame[\s\S]*?cancelAnimationFrame/,
  'circular progress must schedule and clean up animation frames',
);
assert.match(
  circularProgressComponent,
  /calculateReadingProgress/,
  'the UI must use the tested safe progress calculation',
);
assert.match(
  circularProgressComponent,
  /role=["']progressbar["'][\s\S]*?aria-valuenow/,
  'reading progress must expose its percentage to assistive technology',
);
assert.match(
  circularProgressComponent,
  /isComplete[\s\S]*?width=\{size \* 0\.5\}[\s\S]*?viewBox="0 0 24 24"[\s\S]*?M20 6L9 17L4 12/,
  'one hundred percent must render the personal-blog 14px SVG check',
);
assert.match(
  circularProgressComponent,
  /isComplete[\s\S]*?scale-100 rotate-0 opacity-100[\s\S]*?scale-75 rotate-45 opacity-0[\s\S]*?isComplete[\s\S]*?scale-75 rotate-45 opacity-0[\s\S]*?scale-100 rotate-0 opacity-100/,
  'check and percentage must cross-fade with the personal-blog scale and rotation',
);
assert.match(
  commonStyles,
  /prefers-reduced-motion:\s*reduce[\s\S]*?reading-progress-motion[\s\S]*?transition:\s*none/,
  'all completion-state layers must stop transitioning when reduced motion is preferred',
);
assert.match(
  affixTitleComponent,
  /readingProgress[\s\S]*?<CircularProgress/,
  'disabling reading progress must hide only the circular indicator',
);
assert.match(
  affixTitleComponent,
  /progressiveBlur[\s\S]*?<LinearBlur[\s\S]*?strength=\{36\}[\s\S]*?steps=\{12\}[\s\S]*?falloffPercentage=\{82\}/,
  'progressive floating title must use the personal-blog LinearBlur settings',
);
assert.match(
  affixTitleComponent,
  /!progressiveBlur && 'affix-title-fallback'/,
  'disabled progressive blur must switch to the fallback background',
);
assert.match(
  articlePage,
  /readingProgress=\{slateConfig\.readingProgress\}[\s\S]*?progressiveBlur=\{slateConfig\.progressiveBlur\}/,
  'article pages must pass normalized reading UI settings to the floating title',
);
assert.match(
  affixTitleComponent,
  /h-40 overflow-hidden[\s\S]*?from-slate1\/46 via-slate1\/14[\s\S]*?to-transparent/,
  'progressive blur must use the personal-blog depth and tint overlay',
);
assert.match(
  affixTitleComponent,
  /motion-reduce:transition-none/,
  'floating-title entrance motion must stop when reduced motion is preferred',
);
assert.match(
  commonStyles,
  /\.affix-title-fallback[\s\S]*?backdrop-filter:/,
  'disabled progressive blur must retain an ordinary backdrop blur',
);
assert.match(
  commonStyles,
  /prefers-reduced-motion:\s*reduce[\s\S]*?\.reading-progress-motion[\s\S]*?transition:\s*none/,
  'circular progress transitions must stop when reduced motion is preferred',
);
assert.match(
  articlePage,
  /chatGPTReadingUrl\s*=\s*slateConfig\.readWithChatGPT[\s\S]*?buildChatGPTReadingUrl/,
  'the ChatGPT URL must be constructed only when explicitly enabled',
);
assert.match(
  articlePage,
  /slateConfig\.readWithChatGPT\s*&&[\s\S]*?href=\{chatGPTReadingUrl\}/,
  'the ChatGPT entry must render only when explicitly enabled',
);
assert.match(
  articlePage,
  /target=["']_blank["'][\s\S]*?rel=["']noopener noreferrer["']/,
  'the external ChatGPT link must open safely in a new tab',
);
assert.match(
  articlePage,
  /aria-label=\{i18next\.t\(['"]blog\.readWithChatGPT['"]\)\}/,
  'the ChatGPT entry must have localized accessible copy',
);
assert.match(
  english,
  /readWithChatGPT:/,
  'English ChatGPT entry copy must exist',
);
assert.match(
  chinese,
  /readWithChatGPT:/,
  'Chinese ChatGPT entry copy must exist',
);
assert.match(
  articlePage,
  /text-slate10 flex flex-wrap items-center gap-2/,
  'article metadata must wrap when optional actions exceed the viewport',
);

console.log('reading navigation tests passed');
