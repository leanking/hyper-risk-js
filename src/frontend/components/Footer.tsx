import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-text">
          &copy; {currentYear} Wallet PNL Tracker. All rights reserved.
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