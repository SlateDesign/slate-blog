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
  getActiveHeadingSlug,
  getHeadingScrollTop,
  type HeadingPosition,
} from '@/helpers/reading-navigation';

interface MobileTocProps {
  dataSource?: MarkdownHeading[];
  label: string;
  closeLabel: string;
}

function MobileToc({ dataSource = [], label, closeLabel }: MobileTocProps) {
  const headings = useMemo(() => filterTocHeadings(dataSource), [dataSource]);
  const [activeSlug, setActiveSlug] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const dialogId = `mobile-toc-${useId().replace(/:/g, '')}`;

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    let frameId = 0;
    const updateActiveHeading = () => {
      frameId = 0;
      const root = document.documentElement;
      const positions: HeadingPosition[] = headings.flatMap(({ slug }) => {
        const element = document.getElementById(slug);
        return element
          ? [
              {
                slug,
                offsetTop: element.getBoundingClientRect().top + window.scrollY,
              },
            ]
          : [];
      });
      setActiveSlug(
        getActiveHeadingSlug(
          positions,
          window.scrollY,
          120,
          root.scrollHeight,
          root.clientHeight,
        ),
      );
    };
    const scheduleUpdate = () => {
      if (frameId === 0)
        frameId = window.requestAnimationFrame(updateActiveHeading);
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [headings]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const desktopQuery = window.matchMedia('(min-width: 1280px)');
    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus({ preventScroll: true });
    });
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [
        triggerRef.current,
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ),
      ].filter((element): element is HTMLElement => element !== null);
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
    const handleDesktopBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    desktopQuery.addEventListener('change', handleDesktopBreakpoint);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      desktopQuery.removeEventListener('change', handleDesktopBreakpoint);
    };
  }, [closeDialog, isOpen]);

  if (headings.length === 0) return null;

  const selectHeading = (slug: string) => {
    const element = document.getElementById(slug);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY;
      window.history.pushState(null, '', `#${encodeURIComponent(slug)}`);
      window.scrollTo({
        top: getHeadingScrollTop(offsetTop, 96),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
      setActiveSlug(slug);
    }
    closeDialog();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="text-slate11 hover:text-slate12 focus-visible:outline-slate9 fixed top-[4.5rem] z-[90] inline-flex size-7 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 xl:hidden"
        style={{ right: 'max(1rem, calc((100vw - 45rem) / 2 + 1rem))' }}
        aria-label={isOpen ? closeLabel : label}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={classNames(
            'mobile-toc-icon size-5 fill-none stroke-current',
            isOpen && 'is-open',
          )}
        >
          <line
            className="mobile-toc-icon-bar top"
            x1="3"
            y1="6"
            x2="17"
            y2="6"
          />
          <line
            className="mobile-toc-icon-bar middle"
            x1="3"
            y1="10"
            x2="17"
            y2="10"
          />
          <line
            className="mobile-toc-icon-bar bottom"
            x1="3"
            y1="14"
            x2="17"
            y2="14"
          />
        </svg>
      </button>

      <section
        ref={dialogRef}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-label={label}
        tabIndex={-1}
        className={classNames(
          'mobile-toc-panel bg-slate1 fixed top-16 bottom-2 z-[80] flex flex-col overflow-hidden rounded-2xl shadow-2xl motion-reduce:transition-none xl:hidden',
          isOpen
            ? 'mobile-toc-panel--open'
            : 'mobile-toc-panel--closed pointer-events-none',
        )}
        style={{
          right: 'max(0.5rem, calc((100vw - 45rem) / 2 + 0.5rem))',
          left: 'max(0.5rem, calc((100vw - 45rem) / 2 + 0.5rem))',
          width: 'auto',
        }}
      >
        <nav
          aria-label={label}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <ul className="text-slate8 space-y-1">
            {headings.map((heading, index) => (
              <li key={heading.slug}>
                <a
                  href={`#${heading.slug}`}
                  aria-current={
                    activeSlug === heading.slug ? 'location' : undefined
                  }
                  tabIndex={isOpen ? 0 : -1}
                  className={classNames(
                    'mobile-toc-item inline-block cursor-pointer py-1 transition-colors',
                    activeSlug === heading.slug
                      ? 'text-slate12'
                      : 'text-slate8 hover:text-slate12',
                  )}
                  style={{
                    marginLeft: `${(heading.depth - 2) * 8}px`,
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateY(0)' : 'translateY(4px)',
                    transitionDelay: isOpen ? `${180 + index * 10}ms` : '0ms',
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
      </section>

      <div
        className={classNames(
          'fixed inset-0 z-[70] transition-opacity duration-200 motion-reduce:transition-none xl:hidden',
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          className="bg-slate12/25 absolute inset-0 cursor-default"
          aria-label={closeLabel}
          tabIndex={isOpen ? 0 : -1}
          onClick={closeDialog}
        />
      </div>
    </>
  );
}

export default MobileToc;
