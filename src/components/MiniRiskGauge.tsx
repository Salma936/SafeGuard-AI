import React, { useState, useEffect, useRef } from 'react';

interface MiniRiskGaugeProps {
  score: number; // 0 - 100
  riskLevel?: string;
  size?: number; // default 42
  className?: string;
}

export const MiniRiskGauge: React.FC<MiniRiskGaugeProps> = ({
  score,
  riskLevel,
  size = 42,
  className = '',
}) => {
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [animatedProgress, setAnimatedProgress] = useState<number>(0);
  const animationRef = useRef<number | null>(null);

  const getColor = (val: number) => {
    if (val >= 75) return '#D9705A'; // high/critical
    if (val >= 50) return '#E0A458'; // medium
    return '#5FC9E8'; // low
  };

  const currentColor = getColor(score);
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayScore(score);
      setAnimatedProgress(score);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();
    const startVal = 0;
    const targetVal = Math.min(100, Math.max(0, score));
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setDisplayScore(Math.round(startVal + (targetVal - startVal) * eased));
      setAnimatedProgress(startVal + (targetVal - startVal) * eased);

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

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          style={{
            filter: `drop-shadow(0 0 6px ${currentColor}55)`,
          }}
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#151B22"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
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
        {/* Centered Score */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-mono text-[11px] font-bold leading-none text-[#E8ECEF]">
            {displayScore}
          </span>
        </div>
      </div>

      {riskLevel && (
        <div className="flex flex-col text-left">
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-wider leading-tight"
            style={{ color: currentColor }}
          >
            {riskLevel} RISK
          </span>
          <span className="font-mono text-[10px] text-[#7A8794] leading-tight">
            {score}/100
          </span>
        </div>
      )}
    </div>
  );
};
