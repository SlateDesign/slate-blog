/*
 * @file: Configuration handler
 */
import type { SlateConfig } from '@/typings/config';

/** Default configuration */
const defaultConfig: Partial<SlateConfig> = {
  lang: 'zh-CN',
  theme: {
    mode: 'auto',
    enableUserChange: true,
  },
  readTime: false,
  lastModified: false,
};

export function defineConfig(config: SlateConfig): SlateConfig {
  return {
    ...defaultConfig,
    ...config,
    theme: {
      ...defaultConfig.theme,
      ...config.theme
    } as SlateConfig['theme']
  }
}

