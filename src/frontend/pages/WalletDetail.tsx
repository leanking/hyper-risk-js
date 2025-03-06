import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatCurrency, formatPercentage, truncateString } from '@shared/utils';

// This is a placeholder component that will be replaced with actual API calls
const WalletDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    // Placeholder for API call
    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      // Mock data
      const mockWallet = {
        id,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        name: `Wallet ${id}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
      };
      
      const mockTransactions = [
        {
          id: '1',
          walletId: id,
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          blockNumber: 12345678,
          timestamp: new Date(),
          from: '0x1234567890abcdef1234567890abcdef12345678',
          to: 'market',
          value: '1.5',
          asset: 'BTC',
          type: 'trade',
          status: 'confirmed',
          fee: '0.001',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          walletId: id,
          hash: '0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba',
          blockNumber: 12345679,
          timestamp: new Date(),
          from: 'market',
          to: '0x1234567890abcdef1234567890abcdef12345678',
          value: '0.5',
          asset: 'ETH',
          type: 'trade',
          status: 'confirmed',
          fee: '0.0005',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      const mockPositions = [
        {
          id: '1',
          walletId: id,
          asset: 'BTC',
          entryPrice: '50000',
          currentPrice: '55000',
          quantity: '1.5',
          side: 'long',
          status: 'open',
          openedAt: new Date(),
          unrealizedPnl: '7500',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          walletId: id,
          asset: 'ETH',
          entryPrice: '3000',
          currentPrice: '2800',
          quantity: '5',
          side: 'long',
          status: 'open',
          openedAt: new Date(),
          unrealizedPnl: '-1000',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      const mockRiskMetrics = {
        id: '1',
        walletId: id,
        volatility: '0.25',
        drawdown: '0.15',
        valueAtRisk: '12500',
        sharpeRatio: '1.8',
        sortinoRatio: '2.2',
        concentration: '0.65',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setWallet(mockWallet);
      setTransactions(mockTransactions);
      setPositions(mockPositions);
      setRiskMetrics(mockRiskMetrics);
      setIsLoading(false);
    }, 1000);
  }, [id]);

  const handleSync = () => {
    setIsSyncing(true);
    
    // Simulate API call
    setTimeout(() => {
      setWallet({
        ...wallet,
        lastSyncedAt: new Date(),
      });
      setIsSyncing(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center py-5">
          <h2>Loading wallet data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger mt-4">
          <h4>Error</h4>
          <p>{error}</p>
          <Link to="/wallets" className="btn btn-primary">
            Back to Wallets
          </Link>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="container">
        <div className="alert alert-warning mt-4">
          <h4>Wallet Not Found</h4>
          <p>The wallet you are looking for does not exist.</p>
          <Link to="/wallets" className="btn btn-primary">
            Back to Wallets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">{wallet.name}</h1>
          <div>
            <button
              className="btn btn-primary mr-2"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync Wallet'}
            </button>
            <Link to="/wallets" className="btn btn-secondary">
              Back to Wallets
            </Link>
          </div>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <h3>Wallet Information</h3>
              <table className="table">
                <tbody>
                  <tr>
                    <th>Address</th>
                    <td>{wallet.address}</td>
                  </tr>
                  <tr>
                    <th>Created</th>
                    <td>{new Date(wallet.createdAt).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th>Last Synced</th>
                    <td>{wallet.lastSyncedAt ? new Date(wallet.lastSyncedAt).toLocaleString() : 'Never'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h3>Risk Metrics</h3>
              {riskMetrics ? (
                <table className="table">
                  <tbody>
                    <tr>
                      <th>Volatility</th>
                      <td>{formatPercentage(parseFloat(riskMetrics.volatility) * 100)}</td>
                    </tr>
                    <tr>
                      <th>Maximum Drawdown</th>
                      <td>{formatPercentage(parseFloat(riskMetrics.drawdown) * 100)}</td>
                    </tr>
                    <tr>
                      <th>Value at Risk (95%)</th>
                      <td>{formatCurrency(riskMetrics.valueAtRisk)}</td>
                    </tr>
                    <tr>
                      <th>Sharpe Ratio</th>
                      <td>{parseFloat(riskMetrics.sharpeRatio).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <th>Sortino Ratio</th>
                      <td>{parseFloat(riskMetrics.sortinoRatio).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <th>Concentration</th>
                      <td>{formatPercentage(parseFloat(riskMetrics.concentration) * 100)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p>No risk metrics available.</p>
              )}
            </div>
          </div>

          <h3 className="mb-3">Positions</h3>
          {positions.length === 0 ? (
            <p>No positions found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Side</th>
                    <th>Quantity</th>
                    <th>Entry Price</th>
                    <th>Current Price</th>
                    <th>Unrealized PnL</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.id}>
                      <td>{position.asset}</td>
                      <td>{position.side.toUpperCase()}</td>
                      <td>{position.quantity}</td>
                      <td>{formatCurrency(position.entryPrice)}</td>
                      <td>{formatCurrency(position.currentPrice)}</td>
                      <td className={parseFloat(position.unrealizedPnl) >= 0 ? 'text-success' : 'text-danger'}>
                        {formatCurrency(position.unrealizedPnl)}
                      </td>
                      <td>{position.status.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 className="mb-3 mt-4">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Hash</th>
                    <th>Type</th>
                    <th>Asset</th>
                    <th>Value</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{truncateString(transaction.hash, 8)}</td>
                      <td>{transaction.type.toUpperCase()}</td>
                      <td>{transaction.asset}</td>
                      <td>{transaction.value}</td>
                      <td>{truncateString(transaction.from, 8)}</td>
                      <td>{truncateString(transaction.to, 8)}</td>
                      <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletDetail; 