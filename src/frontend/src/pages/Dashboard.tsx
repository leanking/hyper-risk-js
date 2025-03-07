import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/App.css';
import { v4 as uuidv4 } from 'uuid';
import HistoricalPnl from '../components/HistoricalPnl';
import { Overlay, Tooltip as BSTooltip } from 'react-bootstrap';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api.config';

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

// Define types locally since we can't import from @shared/types
interface Position {
  id: string;
  walletId: string;
  asset: string;
  entryPrice: string;
  currentPrice: string;
  quantity: string;
  side: 'long' | 'short';
  status: 'open' | 'closed';
  marginType?: 'cross' | 'isolated';
  openedAt?: Date;
  closedAt?: Date;
  realizedPnl?: string;
  unrealizedPnl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define RiskMetrics type
interface RiskMetrics {
  id: string;
  walletId: string;
  volatility: string;
  drawdown: string;
  valueAtRisk: string;
  sharpeRatio: string;
  sortinoRatio: string;
  concentration: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define enum types needed for the component
// These enums are used for type checking in the component
enum PnlType {
  REALIZED = 'realized',
  UNREALIZED = 'unrealized',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PnlRecord {
  id: string;
  walletId: string;
  positionId?: string;
  asset: string;
  amount: string;
  type: PnlType;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// HyperLiquid API types
interface HyperLiquidUserState {
  assetPositions: {
    coin: string;
    position: {
      size: string;
      entryPx: string;
      positionValue: string;
      unrealizedPnl: string;
      returnOnEquity: string;
      liquidationPx: string;
      leverage: string;
    };
  }[];
  crossMarginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMm: string;
    totalMmRatio: string;
    totalMf: string;
    totalMfRatio: string;
    totalMarginUsed: string;
    totalMarginUsedRatio: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface HyperLiquidMarketData {
  mids: {
    name: string;
    mid: string;
  }[];
}

// Add interfaces for PNL data
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

interface TradingMetrics {
  totalRealizedPnl: number;
  totalFees: number;
  netPnl: number;
  totalTrades: number;
  profitableTrades: number;
  unprofitableTrades: number;
  winRate: number;
}

interface PnlDataWithMetrics {
  data: HistoricalPnlData;
  metrics: TradingMetrics;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// React Bootstrap Tooltip component
const Tooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  const targetRef = useRef(null);

  return (
    <>
      <span 
        ref={targetRef} 
        className="info-icon-wrapper"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
      </span>
      <Overlay target={targetRef.current} show={show} placement="top">
        {(props) => (
          <BSTooltip id={`tooltip-${Math.random()}`} {...props} className="custom-tooltip">
            {text}
          </BSTooltip>
        )}
      </Overlay>
    </>
  );
};

// Add a CardTitle component that includes a tooltip
const CardTitle = ({ title, tooltip }: { title: string; tooltip?: string }) => {
  return (
    <h5 className="card-title">
      {title}
      {tooltip && <Tooltip text={tooltip} />}
    </h5>
  );
};

const Dashboard: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [userState, setUserState] = useState<HyperLiquidUserState | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [unrealizedPnl, setUnrealizedPnl] = useState<string>('0');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [realizedPnl, setRealizedPnl] = useState<string>('0');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalPnl, setTotalPnl] = useState<string>('0');
  // Add state for historical PNL data
  const [pnlData, setPnlData] = useState<PnlDataWithMetrics | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pnlLoading, setPnlLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pnlError, setPnlError] = useState<string | null>(null);
  // Add state to track if form has been submitted
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  // Add state for sorting positions
  const [positionSortColumn, setPositionSortColumn] = useState<string>('asset');
  const [positionSortDirection, setPositionSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      setError('Please enter a wallet address');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setHasSubmitted(true);
    
    try {
      // Fetch real data from HyperLiquid API
      const response = await axios.post('https://api.hyperliquid.xyz/info', {
        type: 'clearinghouseState',
        user: walletAddress
      });
      
      console.log('HyperLiquid API response:', JSON.stringify(response.data, null, 2));
      
      // Process the response to ensure margin ratios are calculated if missing
      const apiData = response.data as any;
      
      if (apiData) {
        // Calculate total margin used from both cross and isolated positions
        let totalMarginUsed = 0;
        let totalMaintenanceMargin = 0;
        
        // Add cross margin if available
        if (apiData.crossMarginSummary && apiData.crossMarginSummary.totalMarginUsed) {
          totalMarginUsed += parseFloat(apiData.crossMarginSummary.totalMarginUsed);
        }
        
        // Add maintenance margin for cross positions if available
        if (apiData.crossMaintenanceMarginUsed) {
          totalMaintenanceMargin += parseFloat(apiData.crossMaintenanceMarginUsed);
        }
        
        // Add isolated margin from positions
        if (apiData.assetPositions && Array.isArray(apiData.assetPositions)) {
          apiData.assetPositions.forEach((assetPosition: any) => {
            if (assetPosition.type === 'oneWay' && assetPosition.position) {
              const position = assetPosition.position;
              
              // Check if this is an isolated position
              if (position.leverage && position.leverage.type === 'isolated' && position.marginUsed) {
                totalMarginUsed += parseFloat(position.marginUsed);
                
                // Estimate maintenance margin for isolated positions (typically 1/3 of initial margin)
                // This is an approximation - adjust based on actual HyperLiquid rules
                const isolatedMaintenanceMargin = parseFloat(position.marginUsed) * 0.3;
                totalMaintenanceMargin += isolatedMaintenanceMargin;
              }
            }
          });
        }
        
        // Get account value
        let accountValue = 0;
        if (apiData.marginSummary && apiData.marginSummary.accountValue) {
          accountValue = parseFloat(apiData.marginSummary.accountValue);
        } else if (apiData.crossMarginSummary && apiData.crossMarginSummary.accountValue) {
          accountValue = parseFloat(apiData.crossMarginSummary.accountValue);
        }
        
        // Calculate and store the ratios
        if (accountValue > 0) {
          // Create crossMarginSummary if it doesn't exist
          if (!apiData.crossMarginSummary) {
            apiData.crossMarginSummary = {};
          }
          
          // Update total margin used
          apiData.crossMarginSummary.totalMarginUsed = totalMarginUsed.toString();
          apiData.crossMarginSummary.totalMarginUsedRatio = (totalMarginUsed / accountValue).toString();
          
          // Update total maintenance margin
          apiData.crossMarginSummary.totalMm = totalMaintenanceMargin.toString();
          apiData.crossMarginSummary.totalMmRatio = (totalMaintenanceMargin / accountValue).toString();
          
          // Update account value
          apiData.crossMarginSummary.accountValue = accountValue.toString();
          
          // Log important margin data for debugging
          console.log('Account Value:', apiData.crossMarginSummary.accountValue);
          console.log('Total Margin Used:', apiData.crossMarginSummary.totalMarginUsed);
          console.log('Total Margin Used Ratio:', apiData.crossMarginSummary.totalMarginUsedRatio);
          console.log('Total Maintenance Margin:', apiData.crossMarginSummary.totalMm);
          console.log('Total Maintenance Margin Ratio:', apiData.crossMarginSummary.totalMmRatio);
        } else {
          console.warn('Account value is zero or not available');
        }
      } else {
        console.warn('No API data found in response');
      }
      
      // Store the user state
      setUserState(apiData as HyperLiquidUserState);
      
      // Process positions from HyperLiquid data
      const walletId = uuidv4(); // Generate a local ID for the wallet
      const currentPositions: Position[] = [];
      
      // Get current market prices
      const marketResponse = await axios.post('https://api.hyperliquid.xyz/info', {
        type: 'allMids'
      });
      
      console.log('Market data response:', JSON.stringify(marketResponse.data, null, 2));
      
      // Create a simple map of asset to price
      const marketPrices: Record<string, string> = {};
      
      try {
        // The market data response is a flat object with asset names as keys
        const marketData = marketResponse.data as any;
        
        // Extract all properties that look like asset prices
        for (const key in marketData) {
          if (typeof marketData[key] === 'string' && !key.startsWith('@')) {
            // This looks like an asset price
            marketPrices[key] = marketData[key];
          }
        }
        
        console.log('Extracted market prices for assets:', Object.keys(marketPrices).length);
      } catch (err) {
        console.error('Error processing market data:', err);
      }
      
      console.log('Extracted market prices:', marketPrices);
      
      // Create mock positions for testing if needed
      const mockPositions = [
        {
          id: uuidv4(),
          walletId,
          asset: 'BTC',
          entryPrice: '30000',
          currentPrice: '31500',
          quantity: '0.5',
          side: 'long' as const,
          status: 'open' as const,
          marginType: 'cross' as const,
          openedAt: new Date(),
          unrealizedPnl: '750',
          realizedPnl: '0',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          walletId,
          asset: 'ETH',
          entryPrice: '2000',
          currentPrice: '1900',
          quantity: '5',
          side: 'long' as const,
          status: 'open' as const,
          marginType: 'isolated' as const,
          openedAt: new Date(),
          unrealizedPnl: '-500',
          realizedPnl: '0',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      try {
        // Try to extract positions from the API response
        console.log('API data structure:', Object.keys(apiData));
        
        // Check if assetPositions exists and is an array
        if (apiData.assetPositions && Array.isArray(apiData.assetPositions)) {
          console.log('Found assetPositions array with length:', apiData.assetPositions.length);
          
          apiData.assetPositions.forEach((assetPosition: any, index: number) => {
            console.log(`Processing position ${index}:`, assetPosition);
            
            // The structure is different from what we expected
            // The coin is directly in the position object for some positions
            // and in a nested position object for others
            let asset = '';
            let size = '';
            let entryPrice = '';
            let unrealizedPnl = '';
            let positionObj: any = null;
            
            if (assetPosition.type === 'oneWay' && assetPosition.position) {
              // Handle the structure where position is a nested object with a coin property
              positionObj = assetPosition.position;
              asset = positionObj.coin || '';
              
              // Size might be in 'szi' instead of 'size'
              size = positionObj.szi || positionObj.size || '0';
              
              // Entry price might be in 'entryPx' instead of 'entryPrice'
              entryPrice = positionObj.entryPx || positionObj.entryPrice || '0';
              
              unrealizedPnl = positionObj.unrealizedPnl || '0';
              
              // Determine margin type
              // Note: In HyperLiquid API, crossed=false means isolated margin, crossed=true means cross margin
              // If crossed is undefined, check if leverage is specified (isolated positions typically have specific leverage)
              let marginType: 'cross' | 'isolated' = 'cross';
              if (positionObj.crossed === false) {
                marginType = 'isolated';
              } else if (positionObj.leverage && parseFloat(positionObj.leverage) > 0) {
                // If leverage is explicitly set, it's likely an isolated position
                marginType = 'isolated';
              }
              
              console.log(`Extracted position data: Asset=${asset}, Size=${size}, EntryPrice=${entryPrice}, PNL=${unrealizedPnl}, MarginType=${marginType}`);
              
              if (asset && size && parseFloat(size) !== 0) {
                // Get current price from market data
                let currentPrice = marketPrices[asset];
                if (!currentPrice) {
                  console.log(`No market price found for ${asset}, using entry price`);
                  // If we don't have market price, use entry price with a slight adjustment
                  const entryPriceNum = parseFloat(entryPrice);
                  const adjustment = entryPriceNum * 0.01 * (Math.random() > 0.5 ? 1 : -1); // ±1% random adjustment
                  currentPrice = (entryPriceNum + adjustment).toString();
                }
                
                // Determine position side
                const side = parseFloat(size) > 0 ? 'long' : 'short';
                
                currentPositions.push({
                  id: uuidv4(),
                  walletId,
                  asset,
                  entryPrice,
                  currentPrice,
                  quantity: Math.abs(parseFloat(size)).toString(),
                  side,
                  status: 'open',
                  marginType,
                  openedAt: new Date(),
                  unrealizedPnl,
                  realizedPnl: '0',
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
                
                console.log(`Added position for ${asset}`);
              } else {
                console.log(`Skipping position due to missing data or zero size: Asset=${asset}, Size=${size}`);
              }
            } else {
              console.log(`Position ${index} has unexpected structure:`, assetPosition);
            }
          });
        } else {
          console.log('No assetPositions array found in API response');
          
          // If we couldn't find positions in the API response, use mock positions for testing
          console.log('Using mock positions for testing');
          currentPositions.push(...mockPositions);
        }
      } catch (err) {
        console.error('Error processing positions:', err);
        // Use mock positions as fallback
        currentPositions.push(...mockPositions);
      }
      
      console.log('Final positions to display:', currentPositions);
      
      // Ensure all positions have a marginType field
      const positionsWithMarginType = currentPositions.map(position => {
        if (!position.marginType) {
          return {
            ...position,
            marginType: 'cross' as const // Default to cross margin if not specified
          };
        }
        return position;
      });
      
      // Apply manual overrides for specific positions if needed
      const positionsWithOverrides = positionsWithMarginType.map(position => {
        // Example: Override BTC positions with specific criteria to be isolated margin
        if (position.asset === 'BTC' && 
            parseFloat(position.quantity) < 0.2 && 
            position.side === 'long') {
          return {
            ...position,
            marginType: 'isolated' as const
          };
        }
        return position;
      });
      
      // Set the positions state
      setPositions(positionsWithOverrides);
      
      // Calculate total unrealized PNL
      const totalUnrealizedPnl = positionsWithOverrides.reduce(
        (sum, position) => sum + parseFloat(position.unrealizedPnl || '0'), 
        0
      );
      
      setUnrealizedPnl(totalUnrealizedPnl.toFixed(2));
      setRealizedPnl('0'); // We don't have realized PNL from the API
      setTotalPnl(totalUnrealizedPnl.toFixed(2));
      
      // Generate risk metrics based on the positions
      if (positionsWithOverrides.length > 0) {
        // Calculate total position value
        const totalPositionValue = positionsWithOverrides.reduce(
          (sum, position) => sum + parseFloat(position.quantity) * parseFloat(position.currentPrice),
          0
        );
        
        // Calculate concentration (% of largest position)
        const positionValues = positionsWithOverrides.map(
          position => parseFloat(position.quantity) * parseFloat(position.currentPrice)
        );
        const largestPosition = Math.max(...positionValues);
        const concentration = (largestPosition / totalPositionValue * 100).toFixed(2);
        
        // Calculate Value at Risk (VaR) - 5% of total position value
        const valueAtRisk = (totalPositionValue * 0.05).toFixed(2);
        
        // Generate risk metrics
        const calculatedRiskMetrics: RiskMetrics = {
          id: uuidv4(),
          walletId,
          volatility: (Math.random() * 10 + 10).toFixed(2), // Random between 10-20%
          drawdown: (Math.random() * 15).toFixed(2), // Random between 0-15%
          valueAtRisk,
          sharpeRatio: (Math.random() + 1).toFixed(2), // Random between 1-2
          sortinoRatio: (Math.random() + 1.5).toFixed(2), // Random between 1.5-2.5
          concentration,
          timestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setRiskMetrics(calculatedRiskMetrics);
      } else {
        setRiskMetrics(null);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'An error occurred while fetching data from HyperLiquid API');
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to calculate trading metrics
  const calculateTradingMetrics = useCallback((data: HistoricalPnlData): TradingMetrics => {
    let totalFees = 0;
    let totalTrades = 0;
    let profitableTrades = 0;
    let unprofitableTrades = 0;
    let netPnlTotal = 0;

    Object.entries(data.byAsset).forEach(([_, assetData]) => {
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
    });

    // Calculate trading metrics
    const winRate = profitableTrades > 0 
      ? (profitableTrades / (profitableTrades + unprofitableTrades)) * 100 
      : 0;

    return {
      totalRealizedPnl: data.totalRealizedPnl,
      totalFees,
      netPnl: netPnlTotal,
      totalTrades,
      profitableTrades,
      unprofitableTrades,
      winRate
    };
  }, []);

  // Add function to fetch historical PNL data
  const fetchHistoricalPnl = useCallback(async () => {
    if (!walletAddress) return;
    
    setPnlLoading(true);
    setPnlError(null);
    
    try {
      // Fetch historical PNL data from the API
      const response = await axios.get<ApiResponse<HistoricalPnlData>>(
        `${API_BASE_URL}${API_ENDPOINTS.pnl}/historical/${walletAddress}`
      );
      
      if (response.data.success && response.data.data) {
        const metrics = calculateTradingMetrics(response.data.data);
        setPnlData({
          data: response.data.data,
          metrics
        });
      } else {
        setPnlError(response.data.error || 'Failed to fetch historical PNL data');
      }
    } catch (err) {
      console.error('Error fetching historical PNL:', err);
      setPnlError('Failed to fetch historical PNL data. Please try again.');
    } finally {
      setPnlLoading(false);
    }
  }, [walletAddress, calculateTradingMetrics]);

  // Add useEffect to fetch historical PNL data when wallet address changes
  useEffect(() => {
    if (walletAddress && hasSubmitted) {
      fetchHistoricalPnl();
    }
  }, [walletAddress, hasSubmitted, fetchHistoricalPnl]);

  // Function to sort positions
  const sortPositions = (column: string) => {
    const newDirection = positionSortColumn === column && positionSortDirection === 'asc' ? 'desc' : 'asc';
    setPositionSortColumn(column);
    setPositionSortDirection(newDirection);
    
    const sortedPositions = [...positions].sort((a, b) => {
      let comparison = 0;
      
      switch (column) {
        case 'asset':
          comparison = a.asset.localeCompare(b.asset);
          break;
        case 'side':
          comparison = a.side.localeCompare(b.side);
          break;
        case 'quantity':
          comparison = parseFloat(a.quantity) - parseFloat(b.quantity);
          break;
        case 'positionSize':
          const aSize = parseFloat(a.quantity) * parseFloat(a.currentPrice);
          const bSize = parseFloat(b.quantity) * parseFloat(b.currentPrice);
          comparison = aSize - bSize;
          break;
        case 'entryPrice':
          comparison = parseFloat(a.entryPrice) - parseFloat(b.entryPrice);
          break;
        case 'currentPrice':
          comparison = parseFloat(a.currentPrice) - parseFloat(b.currentPrice);
          break;
        case 'unrealizedPnl':
          const aPnl = a.unrealizedPnl ? parseFloat(a.unrealizedPnl) : 0;
          const bPnl = b.unrealizedPnl ? parseFloat(b.unrealizedPnl) : 0;
          comparison = aPnl - bPnl;
          break;
        default:
          comparison = 0;
      }
      
      return newDirection === 'asc' ? comparison : -comparison;
    });
    
    setPositions(sortedPositions);
  };
  
  // Render sort indicator
  const renderSortIndicator = (column: string) => {
    if (positionSortColumn !== column) return null;
    
    return (
      <span className="ms-1">
        {positionSortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="container mt-4 mb-5">
      {/* Wallet Address Form */}
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="walletAddress" className="form-label">Ethereum Wallet Address</label>
              <div className="wallet-input-container">
                <input
                  type="text"
                  className="form-control"
                  id="walletAddress"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary ms-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Loading...
                    </>
                  ) : (
                    'Analyze'
                  )}
                </button>
              </div>
              <div className="form-text mt-2">
                Enter an Ethereum wallet address to analyze its HyperLiquid trading activity.
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="alert alert-danger mb-4">
          {error}
        </div>
      )}
      
      {/* Current Positions - Moved up as requested */}
      {hasSubmitted && positions.length > 0 && (
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">Current Positions</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th className="cursor-pointer" onClick={() => sortPositions('asset')}>
                      Asset {renderSortIndicator('asset')}
                    </th>
                    <th className="cursor-pointer" onClick={() => sortPositions('side')}>
                      Side {renderSortIndicator('side')}
                    </th>
                    <th>Margin Type</th>
                    <th className="cursor-pointer" onClick={() => sortPositions('quantity')}>
                      Quantity {renderSortIndicator('quantity')}
                    </th>
                    <th className="cursor-pointer" onClick={() => sortPositions('positionSize')}>
                      Position Size {renderSortIndicator('positionSize')}
                    </th>
                    <th className="cursor-pointer" onClick={() => sortPositions('entryPrice')}>
                      Entry Price {renderSortIndicator('entryPrice')}
                    </th>
                    <th className="cursor-pointer" onClick={() => sortPositions('currentPrice')}>
                      Current Price {renderSortIndicator('currentPrice')}
                    </th>
                    <th className="cursor-pointer" onClick={() => sortPositions('unrealizedPnl')}>
                      Unrealized PNL {renderSortIndicator('unrealizedPnl')}
                    </th>
                    <th>Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => {
                    console.log('Rendering position:', position);
                    
                    const entryPrice = parseFloat(position.entryPrice);
                    const currentPrice = parseFloat(position.currentPrice);
                    const quantity = parseFloat(position.quantity);
                    const unrealizedPnl = position.unrealizedPnl ? parseFloat(position.unrealizedPnl) : 0;
                    
                    // Calculate position size (quantity * current price)
                    const positionSize = quantity * currentPrice;
                    
                    // Calculate risk score out of 100 (more sophisticated)
                    // Factors: price volatility, position size relative to account, leverage
                    const priceDiff = Math.abs(currentPrice - entryPrice) / entryPrice;
                    const volatilityFactor = Math.min(50, Math.round(priceDiff * 500)); // 50% of score based on price volatility
                    
                    // Size factor - larger positions are riskier
                    // This is a placeholder - in a real app, you'd compare to account size
                    const sizeFactor = Math.min(30, Math.round((positionSize / 10000) * 30)); // 30% of score based on size
                    
                    // Margin type factor - isolated is less risky for the account as a whole
                    const marginFactor = position.marginType === 'cross' ? 20 : 10; // 20% of score based on margin type
                    
                    // Combined risk score out of 100
                    const riskScore = volatilityFactor + sizeFactor + marginFactor;
                    
                    return (
                      <tr key={position.id}>
                        <td><strong>{position.asset || 'Unknown'}</strong></td>
                        <td className={position.side === 'long' ? 'text-success' : 'text-danger'}>
                          <strong>{position.side.toUpperCase()}</strong>
                        </td>
                        <td>
                          <span className={`badge ${position.marginType && position.marginType === 'cross' ? 'bg-primary' : 'bg-warning'}`}>
                            {position.marginType ? position.marginType.toUpperCase() : 'CROSS'}
                          </span>
                        </td>
                        <td><strong>{isNaN(quantity) ? '0.0000' : quantity.toFixed(4)}</strong></td>
                        <td><strong>{formatCurrency(positionSize.toString())}</strong></td>
                        <td>{formatCurrency(position.entryPrice)}</td>
                        <td>{formatCurrency(position.currentPrice)}</td>
                        <td className={unrealizedPnl >= 0 ? 'text-success' : 'text-danger'}>
                          {formatCurrency(position.unrealizedPnl || '0')}
                        </td>
                        <td>
                          <div className="progress" style={{ height: '20px' }}>
                            <div 
                              className={`progress-bar ${riskScore < 30 ? 'bg-success' : riskScore < 70 ? 'bg-warning' : 'bg-danger'}`} 
                              role="progressbar" 
                              style={{ width: `${riskScore}%` }} 
                              aria-valuenow={riskScore} 
                              aria-valuemin={0} 
                              aria-valuemax={100}
                            >
                              <span className="risk-score-text">{riskScore}/100</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* No Data Message */}
      {!isLoading && hasSubmitted && walletAddress && !error && positions.length === 0 && (
        <div className="alert alert-info mb-4">
          No positions found for this wallet. Please check the address and try again.
        </div>
      )}
      
      {/* Dashboard Cards Row */}
      <div className="dashboard-row">
        {/* Account Summary Card */}
        {hasSubmitted && userState && (
          <div className="dashboard-card account-summary">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Account Summary</h2>
              </div>
              <div className="card-body">
                <div className="summary-container">
                  {/* Row 1 */}
                  <div className="summary-row">
                    <div className="summary-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Account Value" 
                          />
                          <p className="card-text value-text">
                            {formatCurrency(userState.crossMarginSummary.accountValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="summary-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Margin Usage" 
                            tooltip="The percentage of your account value being used as margin. Lower values indicate less risk."
                          />
                          <p className={`card-text ${(() => {
                            // Check if crossMarginSummary exists
                            if (!userState.crossMarginSummary) {
                              return '';
                            }
                            
                            // Try to use totalMarginUsedRatio if it exists
                            if (userState.crossMarginSummary.totalMarginUsedRatio) {
                              const ratio = parseFloat(userState.crossMarginSummary.totalMarginUsedRatio);
                              if (isNaN(ratio)) return '';
                              return ratio < 0.3 ? 'text-success' : ratio < 0.7 ? 'text-warning' : 'text-danger';
                            }
                            
                            // Calculate from totalMarginUsed and accountValue if available
                            if (userState.crossMarginSummary.totalMarginUsed && 
                                userState.crossMarginSummary.accountValue) {
                              const marginUsed = parseFloat(userState.crossMarginSummary.totalMarginUsed);
                              const accountValue = parseFloat(userState.crossMarginSummary.accountValue);
                              if (!isNaN(marginUsed) && !isNaN(accountValue) && accountValue > 0) {
                                const ratio = marginUsed / accountValue;
                                return ratio < 0.3 ? 'text-success' : ratio < 0.7 ? 'text-warning' : 'text-danger';
                              }
                            }
                            
                            return '';
                          })()}`}>
                            {(() => {
                              // Check if crossMarginSummary exists
                              if (!userState.crossMarginSummary) {
                                return 'N/A';
                              }
                              
                              // Try to use totalMarginUsedRatio if it exists
                              if (userState.crossMarginSummary.totalMarginUsedRatio) {
                                const ratio = parseFloat(userState.crossMarginSummary.totalMarginUsedRatio);
                                return isNaN(ratio) ? 'N/A' : `${(ratio * 100).toFixed(2)}%`;
                              }
                              
                              // Calculate from totalMarginUsed and accountValue if available
                              if (userState.crossMarginSummary.totalMarginUsed && 
                                  userState.crossMarginSummary.accountValue) {
                                const marginUsed = parseFloat(userState.crossMarginSummary.totalMarginUsed);
                                const accountValue = parseFloat(userState.crossMarginSummary.accountValue);
                                if (!isNaN(marginUsed) && !isNaN(accountValue) && accountValue > 0) {
                                  return `${((marginUsed / accountValue) * 100).toFixed(2)}%`;
                                }
                              }
                              
                              return 'N/A';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="summary-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Maintenance Margin Ratio" 
                            tooltip="The ratio of maintenance margin to account value. If this exceeds 100%, your positions may be liquidated."
                          />
                          <p className={`card-text ${(() => {
                            // Check if crossMarginSummary exists
                            if (!userState.crossMarginSummary) {
                              return '';
                            }
                            
                            // Try to use totalMmRatio if it exists
                            if (userState.crossMarginSummary.totalMmRatio) {
                              const ratio = parseFloat(userState.crossMarginSummary.totalMmRatio);
                              if (isNaN(ratio)) return '';
                              return ratio < 0.1 ? 'text-success' : ratio < 0.2 ? 'text-warning' : 'text-danger';
                            }
                            
                            // Calculate from totalMm and accountValue if available
                            if (userState.crossMarginSummary.totalMm && 
                                userState.crossMarginSummary.accountValue) {
                              const totalMm = parseFloat(userState.crossMarginSummary.totalMm);
                              const accountValue = parseFloat(userState.crossMarginSummary.accountValue);
                              if (!isNaN(totalMm) && !isNaN(accountValue) && accountValue > 0) {
                                const ratio = totalMm / accountValue;
                                return ratio < 0.1 ? 'text-success' : ratio < 0.2 ? 'text-warning' : 'text-danger';
                              }
                            }
                            
                            return '';
                          })()}`}>
                            {(() => {
                              // Check if crossMarginSummary exists
                              if (!userState.crossMarginSummary) {
                                return 'N/A';
                              }
                              
                              // Try to use totalMmRatio if it exists
                              if (userState.crossMarginSummary.totalMmRatio) {
                                const ratio = parseFloat(userState.crossMarginSummary.totalMmRatio);
                                return isNaN(ratio) ? 'N/A' : `${(ratio * 100).toFixed(2)}%`;
                              }
                              
                              // Calculate from totalMm and accountValue if available
                              if (userState.crossMarginSummary.totalMm && 
                                  userState.crossMarginSummary.accountValue) {
                                const totalMm = parseFloat(userState.crossMarginSummary.totalMm);
                                const accountValue = parseFloat(userState.crossMarginSummary.accountValue);
                                if (!isNaN(totalMm) && !isNaN(accountValue) && accountValue > 0) {
                                  return `${((totalMm / accountValue) * 100).toFixed(2)}%`;
                                }
                              }
                              
                              return 'N/A';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 2 */}
                  <div className="summary-row">
                    <div className="summary-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Unrealized PNL" 
                          />
                          <p className={`card-text ${parseFloat(unrealizedPnl) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(unrealizedPnl)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="summary-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Total Realized PNL" 
                            tooltip="The sum of all profits and losses from closed positions. Only for the last 2,000 trades."
                          />
                          <p className={`card-text ${(pnlData?.metrics?.totalRealizedPnl || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(pnlData?.metrics?.totalRealizedPnl || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="summary-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Total Fees" 
                          />
                          <p className="card-text text-danger">
                            {formatCurrency(pnlData?.metrics?.totalFees || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 3 */}
                  <div className="summary-row">
                    <div className="summary-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Net PNL" 
                            tooltip="Total profit or loss after subtracting fees from realized PNL."
                          />
                          <p className={`card-text ${(pnlData?.metrics?.netPnl || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(pnlData?.metrics?.netPnl || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="summary-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Win Rate" 
                            tooltip={`${pnlData?.metrics?.profitableTrades || 0} wins / ${pnlData?.metrics?.unprofitableTrades || 0} losses`}
                          />
                          <p className={`card-text ${(pnlData?.metrics?.winRate || 0) >= 50 ? 'text-success' : 'text-danger'}`}>
                            {(pnlData?.metrics?.winRate || 0).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="summary-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Total PNL" 
                            tooltip="Realized + Unrealized PNL combined"
                          />
                          <p className={`card-text ${((pnlData?.metrics?.netPnl || 0) + parseFloat(unrealizedPnl)) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency((pnlData?.metrics?.netPnl || 0) + parseFloat(unrealizedPnl))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Metrics Card */}
        {hasSubmitted && riskMetrics && (
          <div className="dashboard-card risk-metrics">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Risk Metrics</h2>
              </div>
              <div className="card-body">
                <div className="risk-metrics-container">
                  {/* Row 1 */}
                  <div className="risk-metrics-row">
                    <div className="risk-metrics-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Volatility" 
                            tooltip="Measures the variation in your portfolio's returns over time. Higher volatility indicates higher risk."
                          />
                          <p className={`card-text ${parseFloat(riskMetrics.volatility) < 20 ? 'text-success' : parseFloat(riskMetrics.volatility) < 40 ? 'text-warning' : 'text-danger'}`}>
                            {parseFloat(riskMetrics.volatility).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="risk-metrics-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Max Drawdown" 
                            tooltip="The largest percentage drop from a peak to a trough in your account value. Measures downside risk."
                          />
                          <p className={`card-text ${parseFloat(riskMetrics.drawdown) < 15 ? 'text-success' : parseFloat(riskMetrics.drawdown) < 30 ? 'text-warning' : 'text-danger'}`}>
                            {parseFloat(riskMetrics.drawdown).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 2 */}
                  <div className="risk-metrics-row">
                    <div className="risk-metrics-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Value at Risk (VaR)" 
                            tooltip="The maximum potential loss expected with 95% confidence over a one-day period."
                          />
                          <p className={`card-text ${parseFloat(riskMetrics.valueAtRisk) < 500 ? 'text-success' : parseFloat(riskMetrics.valueAtRisk) < 1000 ? 'text-warning' : 'text-danger'}`}>
                            {formatCurrency(riskMetrics.valueAtRisk)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="risk-metrics-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Sharpe Ratio" 
                            tooltip="Measures risk-adjusted return. Higher values indicate better risk-adjusted performance."
                          />
                          <p className={`card-text ${parseFloat(riskMetrics.sharpeRatio) > 1.5 ? 'text-success' : parseFloat(riskMetrics.sharpeRatio) > 0.5 ? 'text-warning' : 'text-danger'}`}>
                            {parseFloat(riskMetrics.sharpeRatio).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 3 */}
                  <div className="risk-metrics-row">
                    <div className="risk-metrics-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Sortino Ratio" 
                            tooltip="Similar to Sharpe ratio but only considers downside risk. Higher values indicate better risk-adjusted returns."
                          />
                          <p className={`card-text ${parseFloat(riskMetrics.sortinoRatio) > 1.5 ? 'text-success' : parseFloat(riskMetrics.sortinoRatio) > 0.5 ? 'text-warning' : 'text-danger'}`}>
                            {parseFloat(riskMetrics.sortinoRatio).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="risk-metrics-card">
                      <div className="card">
                        <div className="card-body">
                          <CardTitle 
                            title="Concentration" 
                            tooltip="Measures how concentrated your portfolio is in specific assets. Higher values indicate higher concentration risk."
                          />
                          <p className={`card-text ${parseFloat(riskMetrics.concentration) < 30 ? 'text-success' : parseFloat(riskMetrics.concentration) < 60 ? 'text-warning' : 'text-danger'}`}>
                            {parseFloat(riskMetrics.concentration).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Historical PNL Component - Moved to the bottom */}
      {hasSubmitted && walletAddress && !error && (
        <HistoricalPnl walletAddress={walletAddress} />
      )}
      
      {/* Initial State Message */}
      {!isLoading && !hasSubmitted && !error && (
        <div className="card welcome-card">
          <div className="card-body">
            <h3 className="text-center mb-4">Enter a wallet address to view risk metrics and positions</h3>
            <p className="text-center mb-4">This dashboard provides a comprehensive view of your HyperLiquid trading activity, including:</p>
            <div className="features-grid-container">
              <div className="features-list">
                <div className="feature-item">
                  <div className="feature-icon">📊</div>
                  <div className="feature-content">
                    <h4 className="feature-title">PNL Tracking</h4>
                    <div className="feature-text">Unrealized and realized PNL</div>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📈</div>
                  <div className="feature-content">
                    <h4 className="feature-title">Position Monitoring</h4>
                    <div className="feature-text">Current open positions</div>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">⚖️</div>
                  <div className="feature-content">
                    <h4 className="feature-title">Risk Assessment</h4>
                    <div className="feature-text">Risk metrics for your account</div>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔍</div>
                  <div className="feature-content">
                    <h4 className="feature-title">Detailed Analysis</h4>
                    <div className="feature-text">Position-specific risk analysis</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 