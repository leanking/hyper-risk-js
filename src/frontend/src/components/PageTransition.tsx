import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  // Animation variants for page transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -20,
    },
  };

  // Transition settings - adjusted for smoother animation
  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut', // Changed from 'anticipate' for smoother motion
    duration: 0.4, // Slightly faster
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: '100%' }} // Ensure full width
    >
      {children}
    </motion.div>
  );
};

export default PageTransition; 