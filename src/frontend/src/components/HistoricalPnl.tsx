import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define types for the historical PNL data
interface TradeInfo {
  coin: string;
  side: string;
  px: string;
  sz: string;
  time: number;
  hash: string;
  startPosition: string;
  dir: string;
  closedPnl: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken?: string;
}

interface AssetPnlData {
  totalRealizedPnl: number;
  trades: TradeInfo[];
}

interface HistoricalPnlData {
  byAsset: Record<string, AssetPnlData>;
  totalRealizedPnl: number;
}

// Interface for the summary data
interface AssetPnlSummary {
  asset: string;
  totalRealizedPnl: number;
  totalFees: number;
  netPnl: number;
  tradeCount: number;
}

// Interface for overall trading metrics
interface TradingMetrics {
  totalRealizedPnl: number;
  totalFees: number;
  netPnl: number;
  totalTrades: number;
  profitableTrades: number;
  unprofitableTrades: number;
  winRate: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

interface HistoricalPnlProps {
  walletAddress: string;
}

// Helper function to format currency values
const formatCurrency = (
  value: string | number,
  currency = '$',
  decimals = 2
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return `${currency}0.00`;
  }
  
  return `${currency}${numValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

// Helper function to format percentage
const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

const HistoricalPnl: React.FC<HistoricalPnlProps> = ({ walletAddress }) => {
  const [pnlData, setPnlData] = useState<HistoricalPnlData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<AssetPnlSummary[]>([]);
  const [metrics, setMetrics] = useState<TradingMetrics | null>(null);

  useEffect(() => {
    const fetchHistoricalPnl = async () => {
      if (!walletAddress) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get<ApiResponse<HistoricalPnlData>>(`http://localhost:3001/api/pnl/historical/${walletAddress}`);
        
        if (response.data.success && response.data.data) {
          setPnlData(response.data.data);
          calculateSummary(response.data.data);
        } else {
          setError(response.data.error || 'Failed to fetch historical PNL data');
        }
      } catch (err) {
        console.error('Error fetching historical PNL:', err);
        setError('Failed to fetch historical PNL data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistoricalPnl();
  }, [walletAddress]);

  // Calculate summary data from the PNL data
  const calculateSummary = (data: HistoricalPnlData) => {
    const summary: AssetPnlSummary[] = [];
    let netPnlTotal = 0;
    let totalFees = 0;
    let totalTrades = 0;
    let profitableTrades = 0;
    let unprofitableTrades = 0;

    Object.entries(data.byAsset).forEach(([asset, assetData]) => {
      // Calculate total fees for this asset
      const assetFees = assetData.trades.reduce((sum, trade) => {
        return sum + parseFloat(trade.fee || '0');
      }, 0);

      totalFees += assetFees;

      // Calculate net PNL (realized PNL minus fees)
      const netPnl = assetData.totalRealizedPnl - assetFees;
      netPnlTotal += netPnl;

      // Count trades and calculate win/loss metrics
      assetData.trades.forEach(trade => {
        const pnl = parseFloat(trade.closedPnl || '0');
        if (pnl > 0) {
          profitableTrades++;
        } else if (pnl < 0) {
          unprofitableTrades++;
        }
      });

      totalTrades += assetData.trades.length;

      summary.push({
        asset,
        totalRealizedPnl: assetData.totalRealizedPnl,
        totalFees: assetFees,
        netPnl,
        tradeCount: assetData.trades.length
      });
    });

    // Calculate trading metrics
    const winRate = profitableTrades > 0 
      ? (profitableTrades / (profitableTrades + unprofitableTrades)) * 100 
      : 0;

    setMetrics({
      totalRealizedPnl: data.totalRealizedPnl,
      totalFees,
      netPnl: netPnlTotal,
      totalTrades,
      profitableTrades,
      unprofitableTrades,
      winRate
    });

    // Sort by net PNL (highest to lowest)
    summary.sort((a, b) => b.netPnl - a.netPnl);
    setSummaryData(summary);
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  if (!pnlData || !metrics) {
    return (
      <div className="alert alert-info">
        Enter a wallet address to view historical PNL data.
      </div>
    );
  }

  return (
    <>
      {/* Trading Performance Summary Card */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title">Trading Performance Summary</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title">Total Realized PNL</h6>
                  <p className={`card-text ${metrics.totalRealizedPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(metrics.totalRealizedPnl)}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title">Total Fees</h6>
                  <p className="card-text text-danger">
                    {formatCurrency(metrics.totalFees)}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title">Net PNL</h6>
                  <p className={`card-text ${metrics.netPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(metrics.netPnl)}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title">Win Rate</h6>
                  <p className={`card-text ${metrics.winRate >= 50 ? 'text-success' : 'text-danger'}`}>
                    {formatPercentage(metrics.winRate)}
                  </p>
                  <small className="text-muted">
                    {metrics.profitableTrades} wins / {metrics.unprofitableTrades} losses
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PNL by Asset Card */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title">PNL by Asset</h5>
        </div>
        <div className="card-body">
          {summaryData.length === 0 ? (
            <div className="alert alert-info">
              No trade history found for this wallet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Realized PNL</th>
                    <th>Fees</th>
                    <th>Net PNL</th>
                    <th>Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((summary) => (
                    <tr key={summary.asset}>
                      <td><strong>{summary.asset}</strong></td>
                      <td className={summary.totalRealizedPnl >= 0 ? 'text-success' : 'text-danger'}>
                        {formatCurrency(summary.totalRealizedPnl)}
                      </td>
                      <td className="text-danger">
                        {formatCurrency(summary.totalFees)}
                      </td>
                      <td className={summary.netPnl >= 0 ? 'text-success' : 'text-danger'}>
                        <strong>{formatCurrency(summary.netPnl)}</strong>
                      </td>
                      <td>{summary.tradeCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistoricalPnl; 