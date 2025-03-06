import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/App.css';

const Dashboard: React.FC = () => {
  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Dashboard</h1>
          <Link to="/wallets" className="btn btn-primary">
            Manage Wallets
          </Link>
        </div>
        <div className="card-body">
          <p>
            Welcome to the Wallet PNL Tracker. This dashboard provides an overview of your cryptocurrency wallet performance.
          </p>
          <div className="mt-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Getting Started</h3>
              </div>
              <div className="card-body">
                <p>To get started, add a wallet address to track:</p>
                <Link to="/wallets" className="btn btn-outline-primary">
                  Add Wallet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 