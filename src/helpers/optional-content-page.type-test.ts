import {
  findOptionalPage,
  OPTIONAL_PAGE_SOURCES,
} from './optional-content-page';

const modules = {
  [OPTIONAL_PAGE_SOURCES.now]: { id: 'now' },
  [OPTIONAL_PAGE_SOURCES.about]: { id: 'about' },
};

// @ts-expect-error Optional pages are restricted to the declared Now and About paths.
findOptionalPage(modules, '/src/content/contact.md');
