import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { LinearBlur } from 'progressive-blur';
import CircularProgress from '@/components/circular-progress';

export interface AffixTitleProps {
  /** 距离窗口顶部达到指定偏移量后触发, 默认 320 */
  offsetTop?: number;
  title: string;
  readingProgress?: boolean;
  progressiveBlur?: boolean;
  progressLabel: string;
}

const AffixTitle = (props: AffixTitleProps) => {
  const {
    title,
    offsetTop = 320,
    readingProgress = true,
    progressiveBlur = true,
    progressLabel,
  } = props;
  const affixTitleRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [blurOpacity, setBlurOpacity] = useState(0);

  const contentClasses = classNames(
    'relative z-10 mx-auto flex h-16 max-w-180 transform items-center justify-between px-4 transition-all duration-300 ease-in-out motion-reduce:transition-none',
    isVisible
      ? ['pointer-events-auto', 'translate-y-0', 'opacity-100']
      : ['pointer-events-none', '-translate-y-full', 'opacity-0'],
  );

  const handleScroll = () => {
    const scrollTop = document.documentElement.scrollTop;
    setIsVisible(scrollTop >= offsetTop);
    setBlurOpacity(offsetTop > 0 ? Math.min(scrollTop / offsetTop, 1) : 1);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      ref={affixTitleRef}
      className={classNames(
        'pointer-events-none fixed top-0 right-0 left-0 z-[60] w-full',
        !progressiveBlur && 'affix-title-fallback',
      )}
    >
      {progressiveBlur && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden"
          style={{ opacity: blurOpacity }}
        >
          <LinearBlur
            side="top"
            strength={36}
            steps={12}
            falloffPercentage={82}
            tint="rgba(var(--slate-1-rgb), 0.14)"
            className="absolute inset-0"
          />
          <div className="from-slate1/46 via-slate1/14 absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent" />
        </div>
      )}
      <div className={contentClasses}>
        <button
          onClick={() => (window.location.href = '/')}
          aria-label="Back to home"
          className="text-slate11 hover:text-slate12 hover:bg-slate12/5 flex h-6 w-8 cursor-pointer items-center justify-center rounded-full transition-colors active:scale-95"
        >
          ←
        </button>
        <div className="truncate px-3 font-bold">{title}</div>
        {readingProgress ? (
          <CircularProgress label={progressLabel} />
        ) : (
          <div className="w-8" aria-hidden="true" />
        )}
      </div>
    </div>
  );
};

export default AffixTitle;
