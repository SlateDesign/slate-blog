/*
 * @file: Configuration handler
 */
import type {
  RelatedPostsOptions,
  SlateConfig,
  ThemeOptions,
} from '@/typings/config';

/** Default configuration */
const defaultConfig: Partial<SlateConfig> = {
  lang: 'zh-CN',
  theme: {
    mode: 'auto',
    enableUserChange: true,
  },
  readTime: false,
  lastModified: false,
  readingProgress: true,
  progressiveBlur: true,
  readWithChatGPT: false,
  relatedPosts: {
    enabled: false,
    limit: 3,
  },
};

export function defineConfig(config: SlateConfig): SlateConfig {
  const mergedConfig: Partial<SlateConfig> = {};

  if (typeof config.theme === 'string') {
    mergedConfig.theme = {
      ...(defaultConfig.theme as ThemeOptions),
      mode: config.theme,
    };
  } else {
    mergedConfig.theme = {
      ...(defaultConfig.theme as ThemeOptions),
      ...config.theme,
    };
  }

  const relatedPosts = {
    ...(defaultConfig.relatedPosts as RelatedPostsOptions),
    ...config.relatedPosts,
  };
  if (!Number.isInteger(relatedPosts.limit) || (relatedPosts.limit ?? 0) <= 0) {
    relatedPosts.limit = 3;
  }
  mergedConfig.relatedPosts = relatedPosts;

  return Object.assign({}, defaultConfig, config, mergedConfig);
}
