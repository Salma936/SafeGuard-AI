import React from 'react';
import { motion } from 'motion/react';

export interface LiveStatusIndicatorProps {
  status?: 'active' | 'warning' | 'critical' | 'idle';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorStyles = {
  active: {
    dot: 'bg-emerald-400',
    ping: 'bg-emerald-400/50',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
  },
  warning: {
    dot: 'bg-amber-400',
    ping: 'bg-amber-400/50',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
  },
  critical: {
    dot: 'bg-rose-400',
    ping: 'bg-rose-400/50',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
  },
  idle: {
    dot: 'bg-slate-400',
    ping: 'bg-slate-400/40',
    border: 'border-slate-500/20',
    text: 'text-slate-400',
  },
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

const pingSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({
  status = 'active',
  label,
  size = 'md',
  className = '',
}) => {
  const current = colorStyles[status] || colorStyles.active;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex items-center justify-center">
        <motion.span
          animate={{
            scale: [1, 2.2, 1],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute inline-flex rounded-full ${pingSizes[size]} ${current.ping}`}
        />
        <motion.span
          animate={{
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`relative inline-flex rounded-full ${dotSizes[size]} ${current.dot} shadow-[0_0_8px_currentColor]`}
        />
      </span>
      {label && (
        <span className={`text-xs font-mono font-medium ${current.text}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default LiveStatusIndicator;
