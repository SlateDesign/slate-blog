import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/vite';
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
import { rehypeTableWrapper } from './plugins/rehype-table-wrapper';
import slateConfig from './slate.config';

function computedIntegrations() {
  const result = [
    astroExpressiveCode({
      themes: ['github-light', 'github-dark'],
      themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
      styleOverrides: {
        borderRadius: '1rem',
        frames: {
          shadowColor: 'transparent',
        },
      },
    }),
    mdx(),
    react(),
    sitemap(slateConfig.sitemap),
  ];

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
      rehypePlugins: [rehypeKatex, rehypeFigure, rehypeTableWrapper],
    },
    vite: {
      plugins: [svgr(), tailwindcss()],
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
