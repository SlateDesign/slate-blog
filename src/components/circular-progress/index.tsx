import { useEffect, useState } from 'react';
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
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate5"
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
          className="reading-progress-ring text-indigo9 transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <span
        aria-hidden="true"
        className="text-slate10 absolute inset-0 flex items-center justify-center font-mono text-[9px] font-medium"
      >
        {isComplete ? '✓' : roundedProgress}
      </span>
    </div>
  );
}
