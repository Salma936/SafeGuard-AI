import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface AnimatedPageProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  className = 'flex-1 flex flex-col w-full min-w-0',
  ...props
}) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
