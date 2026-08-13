/*
 * @Author: kim
 * @Description: 目录
 */
import type { MarkdownHeading } from 'astro';
import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import {
  filterTocHeadings,
  getActiveHeadingSlug,
  getHeadingScrollTop,
  type HeadingPosition,
} from '@/helpers/reading-navigation';

interface TocProps {
  className?: string;
  listClassName?: string;
  dataSource?: MarkdownHeading[];
}

function Toc(props: TocProps) {
  const { dataSource = [], className, listClassName } = props;
  const headings = useMemo(() => filterTocHeadings(dataSource), [dataSource]);
  const [activeSlug, setActiveSlug] = useState('');
  const listClasses = classNames('text-slate8', listClassName);

  useEffect(() => {
    if (headings.length === 0) return;

    let frameId = 0;
    const getPositions = (): HeadingPosition[] =>
      headings.flatMap(({ slug }) => {
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
    const updateActiveHeading = () => {
      frameId = 0;
      setActiveSlug(getActiveHeadingSlug(getPositions(), window.scrollY));
    };
    const scheduleUpdate = () => {
      if (frameId === 0) {
        frameId = window.requestAnimationFrame(updateActiveHeading);
      }
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(scheduleUpdate, {
        rootMargin: '-120px 0px -70% 0px',
        threshold: 0,
      });
      headings.forEach(({ slug }) => {
        const element = document.getElementById(slug);
        if (element) observer?.observe(element);
      });
    }

    return () => {
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
    };
  }, [headings]);

  const scrollToHeading = (slug: string) => {
    const element = document.getElementById(slug);
    if (!element) return;

    const offsetTop = element.getBoundingClientRect().top + window.scrollY;
    window.history.pushState(null, '', `#${encodeURIComponent(slug)}`);
    window.scrollTo({
      top: getHeadingScrollTop(offsetTop, 96),
      behavior: 'smooth',
    });
    setActiveSlug(slug);
  };

  return (
    headings.length > 0 && (
      <div className={className}>
        <nav
          aria-label="Table of contents"
          className="h-full w-full overflow-auto"
        >
          <ul className={listClasses}>
            {headings.map((item) => {
              return (
                <li key={item.slug}>
                  <a
                    aria-current={
                      activeSlug === item.slug ? 'location' : undefined
                    }
                    className={classNames(
                      'hover:text-slate12 inline-block cursor-pointer py-0.5 transition-colors',
                      activeSlug === item.slug && 'text-slate12 font-medium',
                    )}
                    style={{ marginLeft: `${(item.depth - 2) * 8}px` }}
                    href={`#${item.slug}`}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToHeading(item.slug);
                    }}
                  >
                    {item.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    )
  );
}

export default Toc;
