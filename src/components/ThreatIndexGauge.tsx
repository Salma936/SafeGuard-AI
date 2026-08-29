import React, { useState, useEffect, useRef } from 'react';

interface ThreatIndexGaugeProps {
  score: number; // 0 to 100
  size?: number; // size in pixels, default 180
  radius?: number; // default 72
  strokeWidth?: number; // default 10
  showSubtext?: boolean;
  className?: string;
}

export const ThreatIndexGauge: React.FC<ThreatIndexGaugeProps> = ({
  score,
  size = 180,
  radius = 72,
  strokeWidth = 10,
  showSubtext = true,
  className = '',
}) => {
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [animatedProgress, setAnimatedProgress] = useState<number>(0);
  const animationRef = useRef<number | null>(null);

  // Determine severity color
  const getColor = (val: number) => {
    if (val >= 75) return '#D9705A'; // high
    if (val >= 50) return '#E0A458'; // medium
    return '#5FC9E8'; // low
  };

  const currentColor = getColor(score);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayScore(score);
      setAnimatedProgress(score);
      return;
    }

    const duration = 1600; // ~1.6s
    const startTime = performance.now();
    const startVal = 0;
    const targetVal = Math.min(100, Math.max(0, score));

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentScoreVal = Math.round(startVal + (targetVal - startVal) * easedProgress);
      const currentProgressVal = startVal + (targetVal - startVal) * easedProgress;

      setDisplayScore(currentScoreVal);
      setAnimatedProgress(currentProgressVal);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score]);

  const center = size / 2;

  return (
    <div className={`flex flex-col items-center justify-center relative select-none ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          style={{
            filter: `drop-shadow(0 0 14px ${currentColor}33)`,
          }}
        >
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#151B22"
            strokeWidth={strokeWidth}
          />

          {/* Animated Progress Stroke */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke 300ms ease',
            }}
          />
        </svg>

        {/* Center Live Number & Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span
            className="font-mono font-bold leading-none tracking-tight text-[#E8ECEF]"
            style={{ fontSize: `${Math.round(size * 0.23)}px` }}
          >
            {displayScore}
          </span>
          {showSubtext && (
            <span
              className="font-mono uppercase tracking-widest text-[#7A8794] font-semibold mt-1"
              style={{ fontSize: '10px' }}
            >
              RISK INDEX
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
