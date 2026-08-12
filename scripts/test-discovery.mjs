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

const { defineConfig } = await importTypeScript('src/helpers/config-helper.ts');
const { calculateRelatedPostScore, getRelatedPosts } = await importTypeScript(
  'src/helpers/related-posts.ts',
);

const requiredConfig = {
  site: 'https://example.com',
  title: 'Example',
  description: 'Example blog',
};

const defaultDiscoveryConfig = defineConfig(requiredConfig);
assert.deepEqual(
  defaultDiscoveryConfig.relatedPosts,
  { enabled: false, limit: 3 },
  'related posts must be disabled by default with a limit of three',
);

const enabledDiscoveryConfig = defineConfig({
  ...requiredConfig,
  relatedPosts: { enabled: true },
});
assert.deepEqual(
  enabledDiscoveryConfig.relatedPosts,
  { enabled: true, limit: 3 },
  'partial related-post settings must preserve sibling defaults',
);

for (const invalidLimit of [0, -1, 1.5, Number.NaN]) {
  const config = defineConfig({
    ...requiredConfig,
    relatedPosts: { enabled: true, limit: invalidLimit },
  });
  assert.equal(
    config.relatedPosts?.limit,
    3,
    `invalid related-post limit ${invalidLimit} must fall back to three`,
  );
}

const day = 24 * 60 * 60 * 1000;
const makePost = ({
  slug,
  tags = [],
  daysFromCurrent = 0,
  draft = false,
  hasPubDate = true,
}) => ({
  slug,
  data: {
    title: slug,
    tags,
    draft,
    pubDate: hasPubDate
      ? new Date(Date.UTC(2026, 0, 1) + daysFromCurrent * day)
      : undefined,
  },
});

const currentPost = makePost({ slug: 'current', tags: ['astro', 'design'] });
assert.ok(
  Math.abs(
    calculateRelatedPostScore(
      currentPost,
      makePost({ slug: 'same-day', tags: ['astro'], daysFromCurrent: 0 }),
    ) - 0.65,
  ) < Number.EPSILON,
  'score must use 70% tag overlap and 30% date proximity',
);

const candidates = [
  currentPost,
  makePost({ slug: 'draft', tags: ['astro', 'design'], draft: true }),
  makePost({ slug: 'missing-date', tags: ['astro'], hasPubDate: false }),
  makePost({ slug: 'older-match', tags: ['astro'], daysFromCurrent: 60 }),
  makePost({ slug: 'newer-match', tags: ['astro'], daysFromCurrent: 30 }),
  makePost({ slug: 'date-only', daysFromCurrent: 1 }),
];

assert.deepEqual(
  getRelatedPosts(currentPost, candidates, 3).map((post) => post.slug),
  ['newer-match', 'older-match', 'date-only'],
  'recommendations must exclude current, draft, and undated posts before sorting',
);

const tieCandidates = [
  makePost({ slug: 'z-older', tags: ['astro'], daysFromCurrent: -10 }),
  makePost({ slug: 'b-newer', tags: ['astro'], daysFromCurrent: 10 }),
  makePost({ slug: 'a-newer', tags: ['astro'], daysFromCurrent: 10 }),
];
assert.deepEqual(
  getRelatedPosts(currentPost, tieCandidates, 2).map((post) => post.slug),
  ['a-newer', 'b-newer'],
  'equal scores must use publication date descending and slug ascending',
);
assert.deepEqual(
  getRelatedPosts(currentPost, [
    makePost({ slug: 'ä', tags: ['astro'], daysFromCurrent: 10 }),
    makePost({ slug: 'z', tags: ['astro'], daysFromCurrent: 10 }),
  ]).map((post) => post.slug),
  ['z', 'ä'],
  'slug tie-breaking must use locale-independent code-point order',
);

assert.deepEqual(
  getRelatedPosts(
    makePost({ slug: 'untagged-current' }),
    [
      makePost({ slug: 'near', daysFromCurrent: 2 }),
      makePost({ slug: 'far', daysFromCurrent: 300 }),
    ],
    1,
  ).map((post) => post.slug),
  ['near'],
  'untagged articles must still receive date-based recommendations',
);

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const homePage = read('src/pages/index.astro');
const articlePage = read('src/pages/blog/[...slug].astro');
const relatedPostsComponent = read('src/components/related-posts/index.astro');
const blogStyles = read('src/assets/style/blog.css');
const english = read('src/i18n/lang/en-us.ts');
const chinese = read('src/i18n/lang/zh-cn.ts');

assert.match(
  homePage,
  /posts\.map\(\(post\) =>/,
  'home page must server-render every article instead of delegating the list to hydration',
);
assert.doesNotMatch(
  homePage,
  /TagFilterPosts|client:(load|only|idle|visible)[^>]*posts=/,
  'the core article list must not depend on a client island',
);
assert.doesNotMatch(
  homePage,
  /import\.meta\.env\.DEV\s*\|\|\s*data\.draft\s*!==\s*true/,
  'home page filters must never expose drafts, including local preview',
);
assert.match(
  homePage,
  /title:\s*post\.data\.title[\s\S]*pubDate:[\s\S]*tags:\s*post\.data\.tags/,
  'home page must serialize only the fields needed for filtering and display',
);
assert.doesNotMatch(
  homePage,
  /data:\s*post\.data/,
  'home page must not serialize the complete content entry data',
);
assert.match(
  homePage,
  /<button[\s\S]*aria-pressed=/,
  'tags must use toggle buttons',
);
assert.match(
  homePage,
  /data-tag=/,
  'tag buttons must use a value separate from their label',
);
assert.doesNotMatch(
  homePage,
  /slug:\s*post\.slug/,
  'client post payload must omit a redundant slug',
);
assert.match(
  homePage,
  /post\.hidden\s*=/,
  'the enhancement script must filter server-rendered posts',
);
assert.match(
  homePage,
  /scrollIntoView\([\s\S]*behavior:/,
  'tag changes must scroll to the list',
);
assert.match(
  homePage,
  /prefers-reduced-motion/,
  'smooth scrolling must respect reduced motion',
);
assert.match(homePage, /no-posts/, 'empty results must use localized copy');
assert.match(english, /noPostsForTag:/, 'English empty-state copy must exist');
assert.match(chinese, /noPostsForTag:/, 'Chinese empty-state copy must exist');
assert.match(
  articlePage,
  /slateConfig\.relatedPosts\?\.enabled[\s\S]*getRelatedPosts/,
  'article page must calculate recommendations only when explicitly enabled',
);
assert.match(
  articlePage,
  /relatedPosts\.length\s*>\s*0[\s\S]*<RelatedPosts/,
  'article page must omit an empty recommendation section',
);
assert.doesNotMatch(
  articlePage,
  /client:(load|idle|visible|only)[^>]*RelatedPosts/,
  'static recommendations must not add unnecessary client hydration',
);
assert.match(
  relatedPostsComponent,
  /<time[^>]*datetime=/i,
  'related dates must be semantic',
);
assert.match(
  relatedPostsComponent,
  /post\.tags\?\.slice\(0, 3\)/,
  'at most three tags may be shown',
);
assert.match(
  blogStyles,
  /\.related-posts-link,\s*\.related-posts-link:hover\s*\{[^}]*text-decoration-line:\s*none/,
  'related-post cards must suppress the article-link underline on hover',
);
assert.match(
  english,
  /relatedPosts:/,
  'English related-post heading must exist',
);
assert.match(
  chinese,
  /relatedPosts:/,
  'Chinese related-post heading must exist',
);

console.log('discovery model tests passed');
