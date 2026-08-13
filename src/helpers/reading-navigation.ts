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
): string {
  const safeScrollTop = Number.isFinite(scrollTop) ? scrollTop : 0;
  const safeThreshold = Number.isFinite(threshold) ? threshold : 0;
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
