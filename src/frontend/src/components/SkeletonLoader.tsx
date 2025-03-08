import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  type: 'card' | 'table' | 'metric' | 'chart';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonProps> = ({ type, count = 1 }) => {
  // Animation for the shimmer effect
  const shimmer = {
    hidden: { x: '-100%' },
    visible: { 
      x: '100%',
      transition: { 
        repeat: Infinity, 
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  // Staggered animation for multiple items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      }
    }
  };

  // Animation for individual items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="relative overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800 h-40 w-full">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={shimmer}
              initial="hidden"
              animate="visible"
            />
          </div>
        );
      
      case 'metric':
        return (
          <div className="relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 p-6 w-full">
            <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-8 w-2/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={shimmer}
              initial="hidden"
              animate="visible"
            />
          </div>
        );
      
      case 'table':
        return (
          <div className="relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 w-full">
            <div className="h-10 bg-gray-300 dark:bg-gray-700 mb-2"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-300 dark:bg-gray-700 mb-2 opacity-80"></div>
            ))}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={shimmer}
              initial="hidden"
              animate="visible"
            />
          </div>
        );
      
      case 'chart':
        return (
          <div className="relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 h-64 w-full">
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gray-300 dark:bg-gray-700 opacity-50">
              <div className="h-full w-full bg-gradient-to-t from-gray-300 dark:from-gray-700 to-transparent"></div>
            </div>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={shimmer}
              initial="hidden"
              animate="visible"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div 
      className="w-full grid gap-4"
      style={{ 
        gridTemplateColumns: `repeat(${count > 3 ? 3 : count}, 1fr)`,
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {[...Array(count)].map((_, index) => (
        <motion.div key={index} variants={itemVariants}>
          {renderSkeleton()}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SkeletonLoader; 