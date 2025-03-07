import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api.config';

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

// Type for sort column
type SortColumn = 'asset' | 'totalRealizedPnl' | 'totalFees' | 'netPnl' | 'tradeCount';

// Type for sort direction
type SortDirection = 'asc' | 'desc';

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
// const formatPercentage = (value: number): string => {
//   return `${value.toFixed(2)}%`;
// };

const HistoricalPnl: React.FC<HistoricalPnlProps> = ({ walletAddress }) => {
  const [pnlData, setPnlData] = useState<HistoricalPnlData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<AssetPnlSummary[]>([]);
  const [metrics, setMetrics] = useState<TradingMetrics | null>(null);
  const [showAssetTable, setShowAssetTable] = useState<boolean>(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('netPnl');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Calculate summary data from the PNL data
  const calculateSummary = useCallback((data: HistoricalPnlData) => {
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

    // Sort by the default sort column and direction
    const sortedSummary = sortSummaryData(summary, sortColumn, sortDirection);
    setSummaryData(sortedSummary);
  }, [sortColumn, sortDirection]);

  const fetchHistoricalPnl = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch historical PNL data from the API
      const response = await axios.get<ApiResponse<HistoricalPnlData>>(
        `${API_BASE_URL}${API_ENDPOINTS.pnl}/historical/${walletAddress}`
      );
      
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
  }, [walletAddress, calculateSummary]);

  useEffect(() => {
    if (walletAddress) {
      fetchHistoricalPnl();
    }
  }, [walletAddress, fetchHistoricalPnl]);

  // Function to sort summary data
  const sortSummaryData = (
    data: AssetPnlSummary[], 
    column: SortColumn, 
    direction: SortDirection
  ): AssetPnlSummary[] => {
    return [...data].sort((a, b) => {
      let comparison = 0;
      
      switch (column) {
        case 'asset':
          comparison = a.asset.localeCompare(b.asset);
          break;
        case 'totalRealizedPnl':
          comparison = a.totalRealizedPnl - b.totalRealizedPnl;
          break;
        case 'totalFees':
          comparison = a.totalFees - b.totalFees;
          break;
        case 'netPnl':
          comparison = a.netPnl - b.netPnl;
          break;
        case 'tradeCount':
          comparison = a.tradeCount - b.tradeCount;
          break;
        default:
          comparison = 0;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortColumn(column);
      setSortDirection('desc');
    }
    
    // Re-sort the data
    const sortedData = sortSummaryData(summaryData, column, 
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    );
    setSummaryData(sortedData);
  };

  // Toggle asset table visibility
  const toggleAssetTable = () => {
    setShowAssetTable(!showAssetTable);
  };

  // Render sort indicator
  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    
    return (
      <span className="ms-1">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
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
      {/* Trading Performance Summary Card - Removed as it's now in the Account Summary card */}
      
      {/* PNL by Asset Card */}
      <div className="card mb-4 historical-pnl-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Historical PNL by Asset</h5>
          <button 
            className="btn btn-sm btn-outline-primary" 
            onClick={toggleAssetTable}
          >
            {showAssetTable ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        <div className={`card-body ${showAssetTable ? 'p-3' : 'p-0'}`}>
          {showAssetTable ? (
            summaryData.length === 0 ? (
              <div className="alert alert-info text-center">
                <i className="bi bi-info-circle me-2"></i>
                No trade history found for this wallet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th 
                        className="cursor-pointer" 
                        onClick={() => handleSort('asset')}
                      >
                        Asset {renderSortIndicator('asset')}
                      </th>
                      <th 
                        className="cursor-pointer" 
                        onClick={() => handleSort('totalRealizedPnl')}
                      >
                        Realized PNL {renderSortIndicator('totalRealizedPnl')}
                      </th>
                      <th 
                        className="cursor-pointer" 
                        onClick={() => handleSort('totalFees')}
                      >
                        Fees {renderSortIndicator('totalFees')}
                      </th>
                      <th 
                        className="cursor-pointer" 
                        onClick={() => handleSort('netPnl')}
                      >
                        Net PNL {renderSortIndicator('netPnl')}
                      </th>
                      <th 
                        className="cursor-pointer" 
                        onClick={() => handleSort('tradeCount')}
                      >
                        Trades {renderSortIndicator('tradeCount')}
                      </th>
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
                        <td><strong>{summary.tradeCount}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-3" style={{ borderTop: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.02)' }}>
              {summaryData.length > 0 ? (
                <>{summaryData.length} assets traded • Click "Show Details" to view breakdown</>
              ) : (
                <>No trade history found for this wallet</>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistoricalPnl; 