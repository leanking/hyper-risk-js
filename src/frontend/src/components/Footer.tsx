import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          &copy; {currentYear} hyper-flow.xyz. All rights reserved.
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Hypio's always free
        </div>
        <div>
          <a 
            href="https://hyperliquid.xyz" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm"
          >
            Powered by HyperLiquid
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 