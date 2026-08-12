import { useMemo, useRef, useState } from 'react';

export interface FilterablePost {
  url: string;
  title: string;
  pubDate: string;
  tags?: string[];
}

export interface TagCount {
  name: string;
  count: number;
}

interface TagFilterPostsProps {
  posts: FilterablePost[];
  tags: TagCount[];
  emptyState: string;
  lang: string;
}

export default function TagFilterPosts({
  posts,
  tags,
  emptyState,
  lang,
}: TagFilterPostsProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const filteredPosts = useMemo(
    () =>
      activeTag === null
        ? posts
        : posts.filter((post) => post.tags?.includes(activeTag)),
    [activeTag, posts],
  );

  const selectTag = (tag: string | null) => {
    setActiveTag(tag);
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    listRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div>
      <section ref={listRef} className="mb-16 scroll-mt-8">
        <div className="text-slate12 text-base">
          {filteredPosts.map((post) => (
            <a
              key={post.url}
              className="active:bg-slate4 sm:hover:bg-slate3 flex cursor-pointer flex-col justify-between rounded-lg py-2.5 transition-all active:scale-[0.995] sm:flex-row sm:items-center sm:px-2"
              href={post.url}
              title={post.title}
            >
              <span className="shrink-0">{post.title}</span>
              <span className="border-slate6 mx-8 hidden h-px w-full grow border-t border-dashed sm:flex" />
              <time className="text-slate8 shrink-0" dateTime={post.pubDate}>
                {new Date(post.pubDate).toLocaleDateString(lang, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            </a>
          ))}
          {filteredPosts.length === 0 && (
            <p className="text-slate10 py-8 text-center">{emptyState}</p>
          )}
        </div>
      </section>

      <section className="mb-16">
        <ul className="text-slate10 flex flex-wrap gap-2 text-base">
          {tags.map(({ name, count }, index) => {
            const tagValue = index === 0 ? null : name;
            const selected = activeTag === tagValue;
            return (
              <li key={tagValue === null ? `all:${name}` : `tag:${name}`}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectTag(tagValue)}
                  className={`focus-visible:outline-slate11 cursor-pointer rounded-full px-4 py-2 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    selected
                      ? 'bg-slate12 text-slate1'
                      : 'bg-slate3 text-slate10 hover:bg-slate4 hover:text-slate11'
                  }`}
                >
                  {name}
                  <sup className="ml-1 text-[10px] opacity-70">{count}</sup>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
