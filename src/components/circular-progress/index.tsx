import { useEffect, useState } from 'react';
import classNames from 'classnames';
import { calculateReadingProgress } from '@/helpers/reading-navigation';

interface CircularProgressProps {
  label: string;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({
  label,
  size = 28,
  strokeWidth = 2,
}: CircularProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const updateProgress = () => {
      frameId = 0;
      const root = document.documentElement;
      setProgress(
        calculateReadingProgress(
          window.scrollY,
          root.scrollHeight,
          root.clientHeight,
        ),
      );
    };
    const scheduleUpdate = () => {
      if (frameId === 0) {
        frameId = window.requestAnimationFrame(updateProgress);
      }
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const roundedProgress = Math.round(progress);
  const isComplete = roundedProgress >= 100;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={roundedProgress}
      aria-valuetext={`${roundedProgress}%`}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        className="-rotate-90 transform"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isComplete ? 'transparent' : 'currentColor'}
          strokeWidth={strokeWidth}
          fill={isComplete ? 'currentColor' : 'transparent'}
          className="reading-progress-motion text-slate12/10 transition-all duration-300 ease-in-out"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          strokeLinecap="round"
          className={classNames(
            'reading-progress-ring reading-progress-motion text-indigo9 transition-all duration-300 ease-in-out',
            isComplete ? 'opacity-0' : 'opacity-100',
          )}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          className={classNames(
            'reading-progress-motion absolute flex items-center justify-center transition-all duration-300 ease-in-out',
            isComplete
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-75 rotate-45 opacity-0',
          )}
        >
          <svg
            width={size * 0.5}
            height={size * 0.5}
            viewBox="0 0 24 24"
            fill="none"
            className="text-slate12/70"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div
          className={classNames(
            'reading-progress-motion absolute flex items-center justify-center transition-all duration-300 ease-in-out',
            isComplete
              ? 'scale-75 rotate-45 opacity-0'
              : 'scale-100 rotate-0 opacity-100',
          )}
        >
          <span className="text-slate12/60 font-mono text-[10px] font-medium">
            {roundedProgress}
          </span>
        </div>
      </div>
    </div>
  );
}
