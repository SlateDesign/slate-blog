# Slate blog

[English](./README.md) · 中文

## 我们为什么创作这样一个博客主题
我们热爱写作与分享，也很欣赏精致的互联网产品。正因如此，我们创作了这个简洁的博客主题，它专注于内容本身，提供流畅、纯粹的写作与阅读体验。而基于各种现代的技术栈，也让其更快速、轻便和高效。

它还能与 [Obsidian](https://obsidian.md/) 无缝结合，你可以轻松将笔记转化为精致的博客文章。

## ✨ 特性

- 简洁优雅的设计
- 移动端适配
- 支持 `light` 和 `dark` 颜色模式
- 0 基础快速配置和部署
- 支持文章草稿，本地允许预览，生产构建自动过滤
- 支持 RSS 订阅和 Follow 认证
- 支持 Algolia 搜索
- 完善的 SEO 支持

## 🪜 框架

- Astro + React + Typescript
- Tailwindcss + @radix-ui/colors
  - 支持 [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) (Jan 10, 2025)
- Docsearch

## 🔨 使用

```bash
# 启动本地服务器
npm run dev
# or
yarn dev
# or
pnpm dev

# 构建
npm run build
# or
yarn build
# or
pnpm build
```

> 如果你 Fork 仓库后，并将仓库设置为私有，默认会失去与上游仓库关联，可以通过运行 `pnpm sync-latest` 同步 Slate Blog 最新版本代码。

## 🗂 目录

```
- plugins/            # 自定义插件
- src/
  ├── assets/         # 图片文件
  ├── components/     # 组件
  ├── content/        # 内容
  ├── helpers/        # 业务逻辑
  ├── pages/          # 页面
  └── typings/        # 通用类型

```

## 配置

通过根目录下的 `slate.config.ts` 进行主题配置。

| 选项 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| site | 最终部署的链接 | `string` | - |
| title | 网站标题 | `string` | - |
| description | 网站描述 | `string` | - |
| lang | 语言 | `string` | `zh-CN` |
| theme | 主题 | `{ mode: 'auto' \| 'light' \| 'dark', enableUserChange: boolean }` | `{ mode: 'auto', enableUserChange: true }` |
| avatar | 头像 | `string` | - |
| sitemap | 网站 sitemap 配置 | [SitemapOptions](https://docs.astro.build/zh-cn/guides/integrations-guide/sitemap/) | - |
| readTime | 是否显示阅读时间 | `boolean` | `false` |
| lastModified | 是否显示最后修改时间 | `boolean` | `false` |
| algolia | docsearch 配置 | `{ appId: string, apiKey: string, indexName: string }` | - |
| follow | follow 订阅认证配置 | `{ feedId: string, userId: string }` | - |
| footer | 网站底部配置 | `{ copyright: string }` | - |
| socialLinks | 社交链接配置 | `{ icon: [SocialLinkIcon](#SocialLinkIcon), link: string, ariaLabel?: string }` | - |

### SocialLinkIcon

```ts
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
  | { svg: string }
```

### algolia 申请

1. 部署网站
2. 在 [Algolia](https://docsearch.algolia.com/apply/) 申请应用 `apiKey`
3. 申请完成后且通过，在 `slate.config.ts` 中配置 `algolia` 
4. 重新部署网站

### Follow 订阅认证

1. 注册 [Follow](https://follow.is/) 账号
2. 部署站点
3. 在 Follow 点击 `+` 号，选择 `RSS` 订阅，填入 `rss` 链接，一般为 `[site]/rss.xml`, `site` 为 `slate.config.ts` 配置文件中 `site` 的值。
4. 重新部署网站


## 文章 frontmatter 说明

| 选项 | 说明 | 类型 | 是否必须 |
| --- | --- | --- | --- |
| title | 文章标题 | `string` | 是 |
| description | 文章描述 | `string` | 否 |
| tags | 文章标签 | `string[]` | 否 |
| draft | 是否是草稿，当不传或者为 `false` 时，`pubDate` 必须传；草稿仅本地预览可见 | `boolean` | 否 |
| pubDate | 文章发布时间 | `date` | 否，当 `draft` 为 `false` 时，必须传 |

**详细可以查看 `src/content/config.ts` 文件**

### 示例

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
## Markdown 语法支持

除了标准的 Markdown 语法外，我们还支持部分扩展语法。

### 基础语法
- 标题、列表、引用、代码块等基础语法
- 表格
- 链接和图片
- **粗体**、*斜体*和~删除线~文本

### 扩展语法
#### 容器
使用 `:::` 标记
  ```md
  :::info
  这是一个信息提示
  :::
  ```

#### LaTeX 数学公式
  - 行内公式: $E = mc^2$
  - 块级公式: $$ E = mc^2 $$

#### 支持图片说明
  ```md
  ![Image caption](image-url)
  ```
  
## 更新日志
### 版本 1.3.0
- 支持显示社交链接
- 优化 RSS 生成
- 添加同步最新版本脚本

### 版本 1.2.0
- 支持多语言（中文和英语）
- 修复已知问题

### 版本 1.1.1
- 修复已知问题

### 版本 1.1.0
- 升级支持 [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- 支持深色模式
- 修复已知问题

## Star

[![Star History Chart](https://api.star-history.com/svg?repos=SlateDesign/slate-blog&type=Date)](https://www.star-history.com/#SlateDesign/slate-blog&Date)
