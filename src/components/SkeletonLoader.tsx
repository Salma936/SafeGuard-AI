import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <motion.div
      animate={{
        opacity: [0.35, 0.75, 0.35],
      }}
      transition={{
        duration: 1.6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`bg-slate-800/80 rounded-lg ${className}`}
    />
  );
};

export const EvidenceCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 space-y-3.5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Skeleton className="h-7 w-full rounded-lg" />
        <Skeleton className="h-7 w-full rounded-lg" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-28 rounded-md" />
        <Skeleton className="h-6 w-36 rounded-md" />
      </div>
    </div>
  );
};

export const TimelineItemSkeleton: React.FC = () => {
  return (
    <div className="relative pl-6 pb-6 border-l-2 border-slate-800 space-y-2">
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-24 rounded" />
      </div>
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-3 w-72" />
    </div>
  );
};

export const ActionItemSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-3.5">
      <Skeleton className="w-4 h-4 rounded mt-1 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
};

export const ForensicReportSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
};

export default Skeleton;
