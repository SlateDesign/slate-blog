import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pangu } from 'pangu';
import ts from 'typescript';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const importTypeScript = async (path) => {
  const source = read(path);
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

const packageJson = JSON.parse(read('package.json'));
const astroConfig = read('astro.config.mjs');
const articlePage = read('src/pages/blog/[...slug].astro');
const blogStyles = read('src/assets/style/blog.css');
const envTypes = read('src/env.d.ts');

assert.equal(
  typeof packageJson.dependencies.pangu,
  'string',
  'pangu must be declared as a production dependency',
);
assert.equal(
  pangu.spacingText('Slate博客运行在Astro 5上'),
  'Slate 博客运行在 Astro 5 上',
  'pangu must space mixed Chinese, Latin text, and numbers',
);
assert.match(
  articlePage,
  /import\s+\{\s*pangu\s*\}\s+from\s+['"]pangu\/browser['"]/,
  'the article page must import pangu from pangu/browser',
);
assert.match(
  articlePage,
  /pangu\.spacingNode\(blogContent\)/,
  'the article page must apply spacing to the rendered article element',
);

for (const [path, source] of [
  ['src/pages/blog/[...slug].astro', articlePage],
  ['src/assets/style/blog.css', blogStyles],
  ['src/env.d.ts', envTypes],
]) {
  assert.doesNotMatch(
    source,
    /heti/i,
    `${path} must not contain Heti runtime or compatibility code`,
  );
}

assert.match(
  astroConfig,
  /themes:\s*\[\s*['"]github-light['"]\s*,\s*['"]github-dark['"]\s*\]/,
  'Expressive Code must define matching light and dark themes',
);
assert.match(
  astroConfig,
  /themeCssSelector:\s*\(theme\)\s*=>\s*`\[data-theme=['"]\$\{theme\.type\}['"]\]`/,
  'Expressive Code themes must follow the site data-theme attribute',
);
assert.match(
  astroConfig,
  /borderRadius:\s*['"]1rem['"]/,
  'code frames must use the article radius',
);
assert.match(
  astroConfig,
  /shadowColor:\s*['"]transparent['"]/,
  'code frames must not add a theme-specific shadow',
);
assert.match(
  astroConfig,
  /import\s+\{\s*rehypeTableWrapper\s*\}\s+from\s+['"]\.\/plugins\/rehype-table-wrapper['"]/,
  'Astro must import the table wrapper rehype plugin',
);
assert.match(
  astroConfig,
  /rehypePlugins:\s*\[\s*rehypeKatex\s*,\s*rehypeFigure\s*,\s*rehypeTableWrapper\s*\]/,
  'Astro must register the table wrapper after its existing rehype plugins',
);

const { rehypeTableWrapper } = await importTypeScript(
  'plugins/rehype-table-wrapper.ts',
);
const table = {
  type: 'element',
  tagName: 'table',
  properties: { id: 'comparison' },
  children: [{ type: 'element', tagName: 'tbody', properties: {}, children: [] }],
};
const tree = {
  type: 'root',
  children: [
    { type: 'element', tagName: 'p', properties: {}, children: [] },
    table,
  ],
};

rehypeTableWrapper()(tree);

const wrapper = tree.children[1];
assert.equal(wrapper.tagName, 'div', 'tables must be wrapped in a div');
assert.deepEqual(
  wrapper.properties,
  { className: ['table-scroll'] },
  'the wrapper must have the table-scroll class',
);
assert.strictEqual(
  wrapper.children[0],
  table,
  'wrapping must preserve the original table node',
);

rehypeTableWrapper()(tree);
assert.strictEqual(
  tree.children[1],
  wrapper,
  'tables must be wrapped exactly once across repeated transforms',
);

assert.match(
  blogStyles,
  /\.blog-content\s*\{[\s\S]*?overflow-wrap:\s*break-word/,
  'article content must wrap long unbroken text',
);
assert.match(
  blogStyles,
  /h1\s*\{[\s\S]*?text-3xl[\s\S]*?sm:text-4xl/,
  'article h1 must use a smaller mobile size',
);
assert.match(
  blogStyles,
  /h2\s*\{[\s\S]*?text-2xl[\s\S]*?sm:text-3xl/,
  'article h2 must use a smaller mobile size',
);
assert.match(
  blogStyles,
  /h3\s*\{[\s\S]*?text-xl[\s\S]*?sm:text-2xl/,
  'article h3 must use a smaller mobile size',
);
assert.match(
  blogStyles,
  /img\s*\{[\s\S]*?max-width:\s*100%/,
  'article images must stay within the content width',
);
assert.match(
  blogStyles,
  /code\s*\{[\s\S]*?word-break:\s*break-all/,
  'long inline code must wrap',
);
assert.match(
  blogStyles,
  /table\s*\{[\s\S]*?display:\s*block;[\s\S]*?overflow-x:\s*auto/,
  'wide tables must scroll inside the article instead of widening the page',
);
assert.match(
  blogStyles,
  /\.expressive-code\s*\{[\s\S]*?pre[\s\S]*?overflow-x-auto/,
  'code blocks must scroll horizontally inside their frame',
);
assert.doesNotMatch(
  blogStyles,
  /var\(--slate6\)/,
  'code frame styles must use a defined Slate token',
);
assert.match(
  blogStyles,
  /var\(--slate-6\)/,
  'code frame borders must use the Slate 6 CSS variable',
);

console.log('typesetting migration constraints passed');
