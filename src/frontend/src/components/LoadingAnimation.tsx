import React from 'react';
import { motion } from 'framer-motion';

interface LoadingAnimationProps {
  text?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ text = 'Analyzing wallet data...' }) => {
  // Animation variants for the container - no delay for immediate appearance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05, // Faster staggering for immediate appearance
        delayChildren: 0, // No delay for immediate appearance
      }
    }
  };

  // Animation variants for the dots - faster animation
  const dotVariants = {
    hidden: { y: 0, opacity: 0 },
    visible: {
      y: [0, -15, 0],
      opacity: 1,
      transition: {
        y: {
          repeat: Infinity,
          duration: 0.6, // Faster animation
          ease: "easeInOut",
        }
      }
    }
  };

  // Animation variants for the text - immediate appearance
  const textVariants = {
    hidden: { opacity: 0, y: 5 }, // Less movement for faster appearance
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.2 // Very fast text appearance
      }
    }
  };

  // Colors for the dots
  const colors = ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981'];

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex space-x-3 mb-6">
        {colors.map((color, index) => (
          <motion.div
            key={index}
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
            variants={dotVariants}
            transition={{ delay: index * 0.05 }} // Minimal delay between dots
          />
        ))}
      </div>
      
      <motion.div
        className="relative w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }} // Minimal delay for progress bar
      >
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500"
          initial={{ width: "0%" }}
          animate={{ 
            width: ["0%", "100%", "0%"],
            x: ["0%", "0%", "100%"],
          }}
          transition={{ 
            duration: 1.5, // Faster animation
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      <motion.p
        className="text-gray-600 dark:text-gray-300 text-lg font-medium"
        variants={textVariants}
      >
        {text}
      </motion.p>
      
      <motion.p
        className="text-gray-500 dark:text-gray-400 text-sm mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }} // Minimal delay for subtitle
      >
        Fetching positions, calculating metrics, and analyzing risk...
      </motion.p>
    </motion.div>
  );
};

export default LoadingAnimation; 