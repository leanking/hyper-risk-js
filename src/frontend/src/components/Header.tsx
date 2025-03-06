import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../styles/App.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="container header-container">
        <Link to="/" className="logo">
          Wallet PNL Tracker
        </Link>
        <nav>
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
            <li className="nav-item">
              <NavLink 
                to="/wallets" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Wallets
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 