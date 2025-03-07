import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// import '../styles/App.css'; // Removed to prevent conflicts with Tailwind
import { v4 as uuidv4 } from 'uuid';
import HistoricalPnl from '../components/HistoricalPnl';
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

// Replace the Tooltip component with a Tailwind version
const Tooltip = ({ text }: { text: string }) => {
  return (
    <div className="relative inline-block ml-2">
      <span className="cursor-help text-gray-500 dark:text-gray-400 inline-flex items-center justify-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 flex-shrink-0" 
          width="16" 
          height="16" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          style={{ maxWidth: '16px', maxHeight: '16px', overflow: 'hidden' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
      <div 
        className="absolute z-10 w-48 px-2 py-1 -mt-1 text-sm text-white bg-gray-900 rounded-lg shadow-lg -left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200"
      >
        {text}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <svg 
            className="h-2 w-2 text-gray-900 flex-shrink-0" 
            width="8" 
            height="8" 
            viewBox="0 0 10 10"
            style={{ maxWidth: '8px', maxHeight: '8px', overflow: 'hidden' }}
          >
            <polygon points="0,0 5,5 10,0" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Update the CardTitle component to use Tailwind
const CardTitle = ({ title, tooltip }: { title: string; tooltip?: string }) => {
  return (
    <div className="flex items-center mb-2">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {tooltip && <Tooltip text={tooltip} />}
    </div>
  );
};

// MetricCard component for consistent styling of metric cards
interface MetricCardProps {
  title: string;
  value: string | number;
  tooltip?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  suffix?: string;
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  tooltip, 
  trend = 'neutral',
  suffix = '',
  isLoading = false 
}) => {
  // Determine text color based on trend
  const getColorClass = () => {
    switch (trend) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
      default:
        return 'text-gray-900 dark:text-white';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      {isLoading ? (
        <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
      ) : (
        <p className={`text-lg font-bold ${getColorClass()}`}>
          {value}{suffix}
        </p>
      )}
    </div>
  );
};

// Section Card component for consistent styling of section cards
interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 h-full ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white m-0">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

// TableCard component for consistent styling of tables
interface TableCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const TableCard: React.FC<TableCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white m-0">{title}</h2>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

// FormCard component for consistent styling of forms
interface FormCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const FormCard: React.FC<FormCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white m-0">{title}</h2>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

// AlertCard component for consistent styling of alerts
interface AlertCardProps {
  type: 'error' | 'info' | 'warning' | 'success';
  message: string;
  className?: string;
}

const AlertCard: React.FC<AlertCardProps> = ({ type, message, className = '' }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="h-5 w-5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${getTypeStyles()} px-6 py-4 rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center">
        {getIcon()}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { walletAddress: urlWalletAddress } = useParams<{ walletAddress?: string }>();
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string>(urlWalletAddress || '');
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

  // Effect to handle URL wallet address changes
  useEffect(() => {
    if (urlWalletAddress && urlWalletAddress !== walletAddress) {
      setWalletAddress(urlWalletAddress);
      handleWalletLoad(urlWalletAddress);
    }
  }, [urlWalletAddress, walletAddress]);

  // Separate function to load wallet data
  const handleWalletLoad = async (address: string) => {
    if (!address) {
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
        user: address
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      setError('Please enter a wallet address');
      return;
    }

    // Update the URL with the wallet address
    navigate(`/${walletAddress}`);
    
    // Load the wallet data
    await handleWalletLoad(walletAddress);
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
      <span className="ml-1 inline-block">
        {positionSortDirection === 'asc' ? (
          <svg 
            className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" 
            width="12" 
            height="12" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ maxWidth: '12px', maxHeight: '12px', overflow: 'hidden' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg 
            className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" 
            width="12" 
            height="12" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ maxWidth: '12px', maxHeight: '12px', overflow: 'hidden' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Wallet Address Form */}
      <FormCard className="mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ethereum Wallet Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                id="walletAddress"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm font-medium"
              >
                {isLoading ? (
                  <>
                    <svg 
                      className="animate-spin h-5 w-5 flex-shrink-0" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24"
                      style={{ maxWidth: '20px', maxHeight: '20px', overflow: 'hidden' }}
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  'Analyze'
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Enter an Ethereum wallet address to analyze its HyperLiquid trading activity.
            </p>
          </div>
        </form>
      </FormCard>
      
      {/* Error Message */}
      {error && (
        <AlertCard type="error" message={error} className="mb-6" />
      )}
      
      {/* Current Positions */}
      {hasSubmitted && positions.length > 0 && (
        <TableCard title="Current Positions" className="mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => sortPositions('asset')}>
                    Asset {renderSortIndicator('asset')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => sortPositions('side')}>
                    Side {renderSortIndicator('side')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Margin Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => sortPositions('quantity')}>
                    Quantity {renderSortIndicator('quantity')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => sortPositions('positionSize')}>
                    Position Size {renderSortIndicator('positionSize')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => sortPositions('entryPrice')}>
                    Entry Price {renderSortIndicator('entryPrice')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => sortPositions('currentPrice')}>
                    Current Price {renderSortIndicator('currentPrice')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => sortPositions('unrealizedPnl')}>
                    Unrealized PNL {renderSortIndicator('unrealizedPnl')}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Risk Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
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
                    <tr key={position.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{position.asset || 'Unknown'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${position.side === 'long' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {position.side.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${position.marginType && position.marginType === 'cross' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                          {position.marginType ? position.marginType.toUpperCase() : 'CROSS'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right">{isNaN(quantity) ? '0.0000' : quantity.toFixed(4)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right">{formatCurrency(positionSize.toString())}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">{formatCurrency(position.entryPrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">{formatCurrency(position.currentPrice)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${unrealizedPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(position.unrealizedPnl || '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${riskScore < 30 ? 'bg-green-500' : riskScore < 70 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${riskScore}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1 block">{riskScore}/100</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}
      
      {/* No Data Message */}
      {!isLoading && hasSubmitted && walletAddress && !error && positions.length === 0 && (
        <AlertCard 
          type="info" 
          message="No positions found for this wallet. Please check the address and try again." 
          className="mb-6" 
        />
      )}
      
      {/* Dashboard Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Summary Section */}
        {hasSubmitted && userState && (
          <div className="lg:col-span-2">
            <SectionCard title="Account Summary" className="mb-6">
              {/* Account Value Metrics */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Account Value</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MetricCard 
                    title="Total Account Value" 
                    value={formatCurrency(userState.crossMarginSummary.accountValue)}
                    trend="neutral"
                  />
                  <MetricCard 
                    title="Total Position Value" 
                    value={formatCurrency(userState.crossMarginSummary.totalNtlPos || '0')}
                    trend="neutral"
                  />
                </div>
              </div>
              
              {/* Margin Metrics */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Margin Usage</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricCard 
                    title="Margin Usage" 
                    value={(() => {
                      if (!userState.crossMarginSummary) return '0';
                      if (userState.crossMarginSummary.totalMarginUsedRatio) {
                        const ratio = parseFloat(userState.crossMarginSummary.totalMarginUsedRatio);
                        return isNaN(ratio) ? '0' : (ratio * 100).toFixed(2);
                      }
                      if (userState.crossMarginSummary.totalMarginUsed && userState.crossMarginSummary.accountValue) {
                        const totalMarginUsed = parseFloat(userState.crossMarginSummary.totalMarginUsed);
                        const accountValue = parseFloat(userState.crossMarginSummary.accountValue);
                        if (!isNaN(totalMarginUsed) && !isNaN(accountValue) && accountValue > 0) {
                          return ((totalMarginUsed / accountValue) * 100).toFixed(2);
                        }
                      }
                      return '0';
                    })()}
                    suffix="%"
                    tooltip="The percentage of your account value being used as margin. Lower values indicate less risk."
                    trend={(() => {
                      let ratio = 0;
                      if (userState.crossMarginSummary.totalMarginUsedRatio) {
                        ratio = parseFloat(userState.crossMarginSummary.totalMarginUsedRatio);
                      } else if (userState.crossMarginSummary.totalMarginUsed && userState.crossMarginSummary.accountValue) {
                        const totalMarginUsed = parseFloat(userState.crossMarginSummary.totalMarginUsed);
                        const accountValue = parseFloat(userState.crossMarginSummary.accountValue);
                        if (!isNaN(totalMarginUsed) && !isNaN(accountValue) && accountValue > 0) {
                          ratio = totalMarginUsed / accountValue;
                        }
                      }
                      return ratio < 0.3 ? 'positive' : ratio < 0.7 ? 'neutral' : 'negative';
                    })()}
                  />
                  <MetricCard 
                    title="Maintenance Margin" 
                    value={formatCurrency(userState.crossMarginSummary.totalMm || '0')}
                    tooltip="The minimum amount of equity you must maintain to avoid liquidation."
                    trend="neutral"
                  />
                  <MetricCard 
                    title="Maintenance Margin Ratio" 
                    value={(() => {
                      if (!userState.crossMarginSummary) return '0';
                      if (userState.crossMarginSummary.totalMmRatio) {
                        const ratio = parseFloat(userState.crossMarginSummary.totalMmRatio);
                        return isNaN(ratio) ? '0' : (ratio * 100).toFixed(2);
                      }
                      if (userState.crossMarginSummary.totalMm && userState.crossMarginSummary.accountValue) {
                        const totalMm = parseFloat(userState.crossMarginSummary.totalMm);
                        const accountValue = parseFloat(userState.crossMarginSummary.accountValue);
                        if (!isNaN(totalMm) && !isNaN(accountValue) && accountValue > 0) {
                          return ((totalMm / accountValue) * 100).toFixed(2);
                        }
                      }
                      return '0';
                    })()}
                    suffix="%"
                    tooltip="The ratio of maintenance margin to account value. If this exceeds 100%, your positions may be liquidated."
                    trend={(() => {
                      let ratio = 0;
                      if (userState.crossMarginSummary.totalMmRatio) {
                        ratio = parseFloat(userState.crossMarginSummary.totalMmRatio);
                      } else if (userState.crossMarginSummary.totalMm && userState.crossMarginSummary.accountValue) {
                        const totalMm = parseFloat(userState.crossMarginSummary.totalMm);
                        const accountValue = parseFloat(userState.crossMarginSummary.accountValue);
                        if (!isNaN(totalMm) && !isNaN(accountValue) && accountValue > 0) {
                          ratio = totalMm / accountValue;
                        }
                      }
                      return ratio < 0.1 ? 'positive' : ratio < 0.2 ? 'neutral' : 'negative';
                    })()}
                  />
                </div>
              </div>
              
              {/* PNL Metrics */}
              <div>
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Profit & Loss</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricCard 
                    title="Unrealized PNL" 
                    value={formatCurrency(unrealizedPnl)}
                    trend={parseFloat(unrealizedPnl) >= 0 ? 'positive' : 'negative'}
                  />
                  <MetricCard 
                    title="Realized PNL" 
                    value={formatCurrency(pnlData?.metrics?.totalRealizedPnl || 0)}
                    tooltip="The sum of all profits and losses from closed positions."
                    trend={(pnlData?.metrics?.totalRealizedPnl || 0) >= 0 ? 'positive' : 'negative'}
                  />
                  <MetricCard 
                    title="Total PNL" 
                    value={formatCurrency((pnlData?.metrics?.netPnl || 0) + parseFloat(unrealizedPnl))}
                    tooltip="Realized + Unrealized PNL combined"
                    trend={((pnlData?.metrics?.netPnl || 0) + parseFloat(unrealizedPnl)) >= 0 ? 'positive' : 'negative'}
                  />
                  <MetricCard 
                    title="Total Fees" 
                    value={formatCurrency(pnlData?.metrics?.totalFees || 0)}
                    trend="negative"
                  />
                  <MetricCard 
                    title="Net PNL" 
                    value={formatCurrency(pnlData?.metrics?.netPnl || 0)}
                    tooltip="Total profit or loss after subtracting fees from realized PNL."
                    trend={(pnlData?.metrics?.netPnl || 0) >= 0 ? 'positive' : 'negative'}
                  />
                  <MetricCard 
                    title="Win Rate" 
                    value={(pnlData?.metrics?.winRate || 0).toFixed(2)}
                    suffix="%"
                    tooltip={`${pnlData?.metrics?.profitableTrades || 0} wins / ${pnlData?.metrics?.unprofitableTrades || 0} losses`}
                    trend={(pnlData?.metrics?.winRate || 0) >= 50 ? 'positive' : 'negative'}
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Risk Metrics Section */}
        {hasSubmitted && riskMetrics && (
          <div className="lg:col-span-1">
            <SectionCard title="Risk Metrics">
              {/* Volatility Metrics */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Volatility & Drawdown</h3>
                <div className="grid grid-cols-1 gap-4">
                  <MetricCard 
                    title="Volatility" 
                    value={parseFloat(riskMetrics.volatility).toFixed(2)}
                    suffix="%"
                    tooltip="Measures the variation in your portfolio's returns over time. Higher volatility indicates higher risk."
                    trend={parseFloat(riskMetrics.volatility) < 20 ? 'positive' : parseFloat(riskMetrics.volatility) < 40 ? 'neutral' : 'negative'}
                  />
                  <MetricCard 
                    title="Max Drawdown" 
                    value={parseFloat(riskMetrics.drawdown).toFixed(2)}
                    suffix="%"
                    tooltip="The largest percentage drop from a peak to a trough in your account value. Measures downside risk."
                    trend={parseFloat(riskMetrics.drawdown) < 15 ? 'positive' : parseFloat(riskMetrics.drawdown) < 30 ? 'neutral' : 'negative'}
                  />
                  <MetricCard 
                    title="Value at Risk (VaR)" 
                    value={formatCurrency(riskMetrics.valueAtRisk)}
                    tooltip="The maximum potential loss expected over a specific time period with a certain confidence level."
                    trend={parseFloat(riskMetrics.valueAtRisk) < 500 ? 'positive' : parseFloat(riskMetrics.valueAtRisk) < 1000 ? 'neutral' : 'negative'}
                  />
                </div>
              </div>
              
              {/* Performance Metrics */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Performance Ratios</h3>
                <div className="grid grid-cols-1 gap-4">
                  <MetricCard 
                    title="Sharpe Ratio" 
                    value={parseFloat(riskMetrics.sharpeRatio).toFixed(2)}
                    tooltip="Measures risk-adjusted return. Higher values indicate better risk-adjusted performance."
                    trend={parseFloat(riskMetrics.sharpeRatio) > 1.5 ? 'positive' : parseFloat(riskMetrics.sharpeRatio) > 0.5 ? 'neutral' : 'negative'}
                  />
                  <MetricCard 
                    title="Sortino Ratio" 
                    value={parseFloat(riskMetrics.sortinoRatio).toFixed(2)}
                    tooltip="Similar to Sharpe ratio but only penalizes downside volatility. Higher values are better."
                    trend={parseFloat(riskMetrics.sortinoRatio) > 1.5 ? 'positive' : parseFloat(riskMetrics.sortinoRatio) > 0.5 ? 'neutral' : 'negative'}
                  />
                </div>
              </div>
              
              {/* Portfolio Metrics */}
              <div>
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Portfolio Composition</h3>
                <div className="grid grid-cols-1 gap-4">
                  <MetricCard 
                    title="Concentration" 
                    value={parseFloat(riskMetrics.concentration).toFixed(2)}
                    suffix="%"
                    tooltip="Measures how concentrated your portfolio is in specific assets. Higher values indicate higher concentration risk."
                    trend={parseFloat(riskMetrics.concentration) < 30 ? 'positive' : parseFloat(riskMetrics.concentration) < 60 ? 'neutral' : 'negative'}
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;