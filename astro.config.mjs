import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import svgr from 'vite-plugin-svgr';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkGemoji from 'remark-gemoji';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import codeImport from 'remark-code-import';
import remarkBlockContainers from 'remark-block-containers';
import astroExpressiveCode from 'astro-expressive-code';
import rehypeFigure from 'rehype-figure';

import { remarkModifiedTime } from './plugins/remark-modified-time';
import { remarkReadingTime } from './plugins/remark-reading-time';
import slateConfig from './slate.config';

function computedIntegrations() {
  const result = [astroExpressiveCode(), mdx(), react(), tailwind(), sitemap(slateConfig.sitemap)];

  return result;
}

function generateAstroConfigure() {
  const astroConfig = {
    site: slateConfig.site,
    integrations: computedIntegrations(),
    markdown: {
      remarkPlugins: [
        remarkGemoji,
        remarkMath,
        codeImport,
        // [codesandbox, { mode: 'button' }],
        remarkBlockContainers,
      ],
      rehypePlugins: [rehypeKatex, rehypeFigure],
    },
    adapter: vercel(),
    vite: {
      plugins: [
        svgr(),
      ],
    },
  };

  if (slateConfig.lastModified) {
    astroConfig.markdown.remarkPlugins.push(remarkModifiedTime);
  }

  if (slateConfig.readTime) {
    astroConfig.markdown.remarkPlugins.push(remarkReadingTime);
  }

  return astroConfig;
}

// https://astro.build/config
export default defineConfig(generateAstroConfigure());
