export const NOW_PAGE_SOURCE = '/src/content/now.md' as const;

export function findNowPage<T>(modules: Record<string, T>): T | undefined {
  return modules[NOW_PAGE_SOURCE];
}
