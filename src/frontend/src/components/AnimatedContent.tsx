import React, { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';

interface AnimatedContentProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  animation?: 'fade' | 'slide' | 'scale' | 'bounce';
  className?: string;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  animation = 'fade',
  className = '',
}) => {
  // Define animation variants
  const getVariants = (): Variants => {
    switch (animation) {
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { 
              duration,
              delay,
            }
          }
        };
      case 'slide':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
              duration,
              delay,
              type: 'spring',
              stiffness: 300,
              damping: 24
            }
          }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { 
            opacity: 1, 
            scale: 1,
            transition: { 
              duration,
              delay,
              type: 'spring',
              stiffness: 300,
              damping: 24
            }
          }
        };
      case 'bounce':
        return {
          hidden: { opacity: 0, y: 50 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
              duration,
              delay,
              type: 'spring',
              stiffness: 400,
              damping: 10
            }
          }
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { 
              duration,
              delay
            }
          }
        };
    }
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={getVariants()}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContent; 