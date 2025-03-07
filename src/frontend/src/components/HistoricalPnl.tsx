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

  // Render sort indicator
  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    
    return (
      <span className="inline-flex items-center justify-center">
        {sortDirection === 'asc' ? (
          <svg 
            className="w-4 h-4 text-purple-500 dark:text-purple-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg 
            className="w-4 h-4 text-purple-500 dark:text-purple-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-white dark:from-gray-800 dark:to-gray-750 flex justify-between items-center">
        <h5 className="text-xl font-semibold text-gray-900 dark:text-white m-0 flex items-center">
          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1.5 rounded-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
          </span>
          Historical PNL by Asset
        </h5>
        <button 
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors duration-150 flex items-center"
          onClick={() => setShowAssetTable(!showAssetTable)}
        >
          {showAssetTable ? (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Hide Details
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              Show Details
            </>
          )}
        </button>
      </div>
      <div className={`${showAssetTable ? 'p-4' : 'p-0'}`}>
        {showAssetTable ? (
          summaryData.length === 0 ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg my-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">No trade history found for this wallet.</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
                    <th 
                      className="group px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => handleSort('asset')}
                    >
                      <div className="flex items-center">
                        <span>Asset</span>
                        <div className="ml-1">{renderSortIndicator('asset')}</div>
                      </div>
                    </th>
                    <th 
                      className="group px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => handleSort('totalRealizedPnl')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Realized PNL</span>
                        <div className="ml-1">{renderSortIndicator('totalRealizedPnl')}</div>
                      </div>
                    </th>
                    <th 
                      className="group px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => handleSort('totalFees')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Fees</span>
                        <div className="ml-1">{renderSortIndicator('totalFees')}</div>
                      </div>
                    </th>
                    <th 
                      className="group px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => handleSort('netPnl')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Net PNL</span>
                        <div className="ml-1">{renderSortIndicator('netPnl')}</div>
                      </div>
                    </th>
                    <th 
                      className="group px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => handleSort('tradeCount')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Trades</span>
                        <div className="ml-1">{renderSortIndicator('tradeCount')}</div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {summaryData.map((summary) => (
                    <tr key={summary.asset} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-3 font-medium">
                            {summary.asset.substring(0, 1)}
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">{summary.asset}</div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${summary.totalRealizedPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <div className="flex items-center justify-end">
                          <span>{formatCurrency(summary.totalRealizedPnl)}</span>
                          <span className="ml-1.5">
                            {summary.totalRealizedPnl >= 0 ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-red-600 dark:text-red-400">
                        <div className="flex items-center justify-end">
                          <span>{formatCurrency(summary.totalFees)}</span>
                          <span className="ml-1.5">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${summary.netPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <div className="flex items-center justify-end">
                          <span>{formatCurrency(summary.netPnl)}</span>
                          <span className="ml-1.5">
                            {summary.netPnl >= 0 ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <div className="flex items-center justify-end">
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2.5 py-1 rounded-full">{summary.tradeCount}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {summaryData.length > 0 ? (
                <>{summaryData.length} assets traded • Click "Show Details" to view breakdown</>
              ) : (
                <>No trade history found for this wallet</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalPnl; 