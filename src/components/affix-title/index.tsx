import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
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

  const classes = classNames(
    'fixed top-0 right-0 left-0 z-10 w-full transform transition-all duration-300 ease-in-out',
    progressiveBlur ? 'affix-title-progressive-blur' : 'affix-title-fallback',
    isVisible
      ? ['translate-y-0', 'opacity-100']
      : ['-translate-y-full', 'opacity-0'],
  );

  const handleScroll = () => {
    const scrollTop = document.documentElement.scrollTop;
    setIsVisible(scrollTop >= offsetTop);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div ref={affixTitleRef} className={classes}>
      <div className="mx-auto flex h-16 max-w-180 items-center justify-between px-4">
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
