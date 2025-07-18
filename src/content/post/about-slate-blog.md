---
title: About Slate Blog
description: I use Obsidian to think, take notes, write essays, and publish this site. This is my bottom-up approach to note-taking and organizing things I am interested in. It embraces chaos and laziness to create emergent structure.
tags:
  - Dev
  - Tailwind
  - Astro
  - Design
pubDate: 2025-01-21
---

## Why We build it?
We love writing and sharing, and we also appreciate great internet products. So we created this minimalist blogging product, focusing on content itself, providing a smooth and pure writing and reading experience, and built on the latest technology framework to make it faster and lighter.

It also works seamlessly with [Obsidian](https://obsidian.md/), helping you turn your notes into published posts effortlessly.

## ✨ Features

- Minimalist design theme
- Mobile-first responsive layout
- Light and dark mode support
- Quick setup with zero configuration required
- Draft mode with local preview and automatic production filtering
- Built-in RSS feed with Follow authentication
- Integrated Algolia search functionality
- Comprehensive SEO optimization for better search rankings

## 🪜 Framework

- Astro + React + Typescript  
- Tailwindcss + @radix-ui/colors
  - Updated to [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) (Jan 10, 2025)
- Docsearch

## 🔨 Usage

```bash
# Start local server
npm run dev
# or
yarn dev
# or
pnpm dev

# Build
npm run build
# or
yarn build
# or
pnpm build
```

## 🗂 Directory Structure

```
- plugins/            # Custom plugins
- src/
  ├── assets/         # Asset files
  ├── components/     # Components
  ├── content/        # Content collections
  ├── helpers/        # Business logic
  ├── pages/          # Pages
  └── typings/        # Common types
```

> Articles are stored in the `src/content/post` directory, supporting markdown and mdx formats. The filename is the path name. For example, `src/content/post/my-first-post.md` => `https://your-blog.com/blog/my-first-post`.

## Configuration

Theme configuration is done through `slate.config.ts` in the root directory.

| Option | Description | Type | Default |
| --- | --- | --- | --- |
| site | Final deployment link | `string` | - |
| title | Website title | `string` | - |
| description | Website description | `string` | - |
| lang | Language | `string` | `zh-CN` |
| theme | Theme | `{ mode: 'auto' | 'light' | 'dark', enableUserChange: boolean }` | `{ mode: 'auto', enableUserChange: true }` |
| avatar | Avatar | `string` | - |
| sitemap | Website sitemap configuration | [SitemapOptions](https://docs.astro.build/en/guides/integrations-guide/sitemap/)  | - |
| readTime | Show reading time | `boolean` | `false` |
| lastModified | Show last modified time | `boolean` | `false` |
| algolia | Docsearch configuration | `{ appId: string, apiKey: string, indexName: string }` | - |
| follow | Follow subscription authentication configuration | `{ feedId: string, userId: string }` | - |
| footer | Website footer configuration | `{ copyright: string }` | - |

### Algolia Application

1. Deploy your site first
2. Apply for an `apiKey` at [algolia](https://docsearch.algolia.com/apply/)
3. After successful application, configure `algolia` in `slate.config.ts`
4. Redeploy

### Follow Subscription Authentication

1. Register a [follow](https://follow.is/) account
2. Deploy your site
3. Click the `+` button on `follow`, select `RSS` subscription, and enter the `rss` link (usually `[site]/rss.xml`, where `site` is the value of `site` in `slate.config.ts`)
4. Redeploy

## Article Frontmatter Description

| Option | Description | Type | Required |
| --- | --- | --- | --- |
| title | Article title | `string` | Yes |
| description | Article description | `string` | No |
| tags | Article tags | `string[]` | No |
| draft | Whether it's a draft. When not provided or `false`, `pubDate` must be provided; drafts are only visible in local preview | `boolean` | No |
| pubDate | Article publication date | `date` | No, required when `draft` is `false` |

**For more details, check the `src/content/config.ts` file**

### Example

```md
---
title: 40 questions
description: This repo maintains revisons and translations to the list of 40 questions I ask myself each year and each decade.
tags:
  - Life
  - Thinking
  - Writing
pubDate: 2025-01-06
---
```

## Markdown Syntax Support

In addition to standard Markdown syntax, the following extended syntax is supported:

### Basic Syntax
- Headers, lists, blockquotes, code blocks and other basic syntax
- Tables
- Links and images
- **Bold**, *italic*, and ~strikethrough~ text

### Extended Syntax
#### Container syntax
Using `:::` markers
  ```md
  :::info
  This is an information prompt
  :::
  ```
  The result will be displayed as:

  :::info
  This is an information prompt
  :::

#### LaTeX Mathematical Formulas
  - Inline formula: $E = mc^2$
  - Block formula: $$ E = mc^2 $$

#### Support for image captions
  ```md
  ![Image caption](image-url)
  ```
The result will be displayed as:

![Slate Blog Preview](https://pub-acdbc21bc3964d18a684b0c51010a4e5.r2.dev/slate-blog-preview.png)
  
## Updates

### Version 1.3.0
- Support Social Links
- Optimize RSS article detail generation.
- Add a script to synchronize the latest slate-blog version
  
### Version 1.2.0
- Support i18n (English and Chinese)
- Fixed known issues

### Version 1.1.1
- Fixed known issues

### Version 1.1.0
- Upgraded to support [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- Added dark mode support
- Fixed known issues

:::info
From [Slate Blog](https://github.com/SlateDesign/slate-blog)
:::
