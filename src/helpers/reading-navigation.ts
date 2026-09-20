import type { MarkdownHeading } from 'astro';

export interface HeadingPosition {
  slug: string;
  offsetTop: number;
}

export function filterTocHeadings<T extends Pick<MarkdownHeading, 'depth'>>(
  headings: T[],
): T[] {
  return headings.filter((heading) => heading.depth > 1);
}

export function getActiveHeadingSlug(
  positions: HeadingPosition[],
  scrollTop: number,
  threshold = 120,
  scrollHeight?: number,
  clientHeight?: number,
): string {
  if (positions.length === 0) return '';

  const safeScrollTop = Number.isFinite(scrollTop) ? scrollTop : 0;
  const safeThreshold = Number.isFinite(threshold) ? threshold : 0;
  const hasDocumentMeasurements =
    Number.isFinite(scrollHeight) && Number.isFinite(clientHeight);
  const maxScrollTop =
    hasDocumentMeasurements &&
    scrollHeight !== undefined &&
    clientHeight !== undefined
      ? Math.max(0, scrollHeight - clientHeight)
      : undefined;

  if (maxScrollTop !== undefined && safeScrollTop >= maxScrollTop - 1) {
    return positions.at(-1)?.slug ?? '';
  }

  const activationPoint = safeScrollTop + safeThreshold;
  let activeSlug = '';

  for (const position of positions) {
    if (!Number.isFinite(position.offsetTop)) continue;
    if (position.offsetTop > activationPoint) break;
    activeSlug = position.slug;
  }

  return activeSlug;
}

export function calculateReadingProgress(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const safeScrollHeight = Number.isFinite(scrollHeight) ? scrollHeight : 0;
  const safeClientHeight = Number.isFinite(clientHeight) ? clientHeight : 0;
  const scrollableHeight = safeScrollHeight - safeClientHeight;

  if (scrollableHeight <= 0) return 100;

  const safeScrollTop = Number.isFinite(scrollTop) ? scrollTop : 0;
  const progress = (safeScrollTop / scrollableHeight) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function getHeadingScrollTop(
  headingOffsetTop: number,
  chromeOffset: number,
): number {
  const safeOffsetTop = Number.isFinite(headingOffsetTop)
    ? headingOffsetTop
    : 0;
  const safeChromeOffset = Number.isFinite(chromeOffset) ? chromeOffset : 0;
  return Math.max(0, safeOffsetTop - safeChromeOffset);
}

export function buildChatGPTReadingUrl(
  site: string,
  slug: string,
  prompt: string,
): string {
  const baseUrl = new URL(site);
  const normalizedBasePath = baseUrl.pathname.replace(/\/$/, '');
  const encodedSlug = slug
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  baseUrl.pathname = `${normalizedBasePath}/blog/${encodedSlug}/`;
  baseUrl.search = '';
  baseUrl.hash = '';

  const chatGPTUrl = new URL('https://chatgpt.com/');
  chatGPTUrl.searchParams.set('q', `${prompt} ${baseUrl.toString()}`);
  return chatGPTUrl.toString();
}
