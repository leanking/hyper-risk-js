import React from 'react';
import '../styles/App.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="content-container footer-container">
        <div className="footer-text">
          &copy; {currentYear} hyper-flow.xyz. All rights reserved.
        </div>
        <div>
          <a href="https://hyperliquid.xyz" target="_blank" rel="noopener noreferrer" className="footer-link">
            Powered by HyperLiquid
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 