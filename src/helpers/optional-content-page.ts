export const OPTIONAL_PAGE_SOURCES = {
  now: '/src/content/now.md',
  about: '/src/content/about.md',
} as const;

export type OptionalPageSource =
  (typeof OPTIONAL_PAGE_SOURCES)[keyof typeof OPTIONAL_PAGE_SOURCES];

export function findOptionalPage<T>(
  modules: Record<string, T>,
  source: OptionalPageSource,
): T | undefined {
  return modules[source];
}
