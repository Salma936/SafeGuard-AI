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
    dot: 'bg-[#5FC9E8]',
    ping: 'bg-[#5FC9E8]/50',
    border: 'border-[#5FC9E8]/20',
    text: 'text-[#5FC9E8]',
  },
  warning: {
    dot: 'bg-[#E0A458]',
    ping: 'bg-[#E0A458]/50',
    border: 'border-[#E0A458]/20',
    text: 'text-[#E0A458]',
  },
  critical: {
    dot: 'bg-[#D9705A]',
    ping: 'bg-[#D9705A]/50',
    border: 'border-[#D9705A]/20',
    text: 'text-[#D9705A]',
  },
  idle: {
    dot: 'bg-[#7A8794]',
    ping: 'bg-[#7A8794]/40',
    border: 'border-[#7A8794]/20',
    text: 'text-[#7A8794]',
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
