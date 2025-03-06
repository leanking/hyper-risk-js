import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import '../styles/App.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="container header-container">
        <Link to="/" className="logo">
          HyperLiquid Risk
        </Link>
        <nav className="d-flex">
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                end
              >
                Dashboard
              </NavLink>
            </li>
          </ul>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Header; 