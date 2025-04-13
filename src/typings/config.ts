export const languages = ['zh-CN', 'en-US'] as const;
export type LangType = (typeof languages)[number];

export const theme = ['auto', 'light', 'dark'] as const;
/** Theme mode */
export type ThemeMode = (typeof theme)[number];
export interface ThemeOptions {
  /** Mode */
  mode: ThemeMode;
  /** Whether to allow user to change theme */
  enableUserChange?: boolean;
}

/** 社交链接配置 */
export interface SocialLink {
  icon: SocialLinkIcon;
  link: string;
  ariaLabel?: string;
}

type SocialLinkIcon =
  | 'dribbble'
  | 'facebook'
  | 'figma'
  | 'github'
  | 'instagram'
  | 'link'
  | 'mail'
  | 'notion'
  | 'rss'
  | 'threads'
  | 'x'
  | 'youtube'
  | { svg: string };

export interface SlateConfig {
  /** Language */
  lang?: LangType;
  /** Theme */
  theme?: ThemeOptions;
  /** Avatar */
  avatar?: string;
  /** Website title */
  title: string;
  /** Website description */
  description: string;
  /** Whether to show reading time */
  readTime?: boolean;
  /** Whether to show last modified time */
  lastModified?: boolean;
  /** Docsearch configuration */
  algolia?: {
    appId: string;
    apiKey: string;
    indexName: string;
  };
  /** Website footer configuration */
  footer?: {
    copyright: string;
  };
  /** Follow subscription authentication configuration */
  follow?: {
    feedId: string;
    userId: string;
  };
  /** 社交链接 */
  socialLinks?: SocialLink[];
}
