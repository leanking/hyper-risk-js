import React from 'react';
import { Link } from 'react-router-dom';

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
          <div className="row mt-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Wallets</h3>
                </div>
                <div className="card-body">
                  <p>No wallets added yet.</p>
                  <Link to="/wallets" className="btn btn-outline-primary">
                    Add Wallet
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Positions</h3>
                </div>
                <div className="card-body">
                  <p>No positions found.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Risk Metrics</h3>
                </div>
                <div className="card-body">
                  <p>No risk metrics available.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 