import type { MarkdownHeading } from 'astro';
import classNames from 'classnames';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  filterTocHeadings,
  getHeadingScrollTop,
} from '@/helpers/reading-navigation';

interface MobileTocProps {
  dataSource?: MarkdownHeading[];
  label: string;
}

function MobileToc({ dataSource = [], label }: MobileTocProps) {
  const headings = useMemo(() => filterTocHeadings(dataSource), [dataSource]);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const titleId = useId();

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const firstLink = dialogRef.current?.querySelector<HTMLAnchorElement>('a');
    firstLink?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('a, button'),
      );
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const desktopQuery = window.matchMedia('(min-width: 1280px)');
    const handleDesktopBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) closeDialog();
    };

    document.addEventListener('keydown', handleKeyDown);
    desktopQuery.addEventListener('change', handleDesktopBreakpoint);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      desktopQuery.removeEventListener('change', handleDesktopBreakpoint);
    };
  }, [closeDialog, isOpen]);

  if (headings.length === 0) return null;

  const selectHeading = (slug: string) => {
    const element = document.getElementById(slug);
    if (!element) {
      closeDialog();
      return;
    }

    const offsetTop = element.getBoundingClientRect().top + window.scrollY;
    window.history.pushState(null, '', `#${encodeURIComponent(slug)}`);
    closeDialog();
    window.scrollTo({
      top: getHeadingScrollTop(offsetTop, 96),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  };

  return (
    <div className="mobile-toc xl:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? dialogId : undefined}
        className="border-slate6 bg-slate1/90 text-slate11 hover:text-slate12 focus-visible:ring-indigo8 fixed right-4 bottom-4 z-20 cursor-pointer rounded-full border px-4 py-2 shadow-lg backdrop-blur-md transition focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => setIsOpen(true)}
      >
        {label}
      </button>

      {isOpen && (
        <div
          className="mobile-toc-overlay fixed inset-0 z-30 flex items-end bg-black/40 p-3 sm:items-center sm:justify-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="mobile-toc-panel border-slate6 bg-slate1 max-h-[75vh] w-full overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:max-w-lg"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id={titleId} className="text-slate12 text-lg font-semibold">
                {label}
              </h2>
              <button
                type="button"
                aria-label={`Close ${label}`}
                className="text-slate10 hover:text-slate12 focus-visible:ring-indigo8 cursor-pointer rounded-full px-2 py-1 text-xl focus-visible:ring-2 focus-visible:outline-none"
                onClick={closeDialog}
              >
                ×
              </button>
            </div>
            <nav aria-label={label}>
              <ul className="space-y-1">
                {headings.map((heading, index) => (
                  <li
                    key={heading.slug}
                    className="mobile-toc-item"
                    style={{ '--toc-item-index': index } as React.CSSProperties}
                  >
                    <a
                      href={`#${heading.slug}`}
                      className={classNames(
                        'text-slate10 hover:bg-slate3 hover:text-slate12 focus-visible:ring-indigo8 block rounded-lg px-3 py-2 transition focus-visible:ring-2 focus-visible:outline-none',
                      )}
                      style={{
                        paddingLeft: `${12 + (heading.depth - 2) * 10}px`,
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        selectHeading(heading.slug);
                      }}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileToc;
