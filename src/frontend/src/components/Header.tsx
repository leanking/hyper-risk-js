import React from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import CustomConnectButton from './CustomConnectButton';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <a href="https://www.hyper-flow.xyz" className="text-xl font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
          hyper-flow.xyz
        </a>
        <nav className="flex items-center space-x-6">
          <ul className="flex space-x-4">
            <li>
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive 
                    ? 'text-purple-600 dark:text-purple-400 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
                }
                end
              >
                Dashboard
              </NavLink>
            </li>
          </ul>
          <div className="flex items-center space-x-4">
            <CustomConnectButton />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header; 