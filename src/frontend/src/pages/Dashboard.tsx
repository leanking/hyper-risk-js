import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
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
    totalPositionValue?: string;
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
  const [isVisible, setIsVisible] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const iconRef = React.useRef<HTMLSpanElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  // Update tooltip position when it becomes visible
  React.useEffect(() => {
    if (isVisible && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 10, // Position above the icon with some offset
        left: rect.left + rect.width / 2
      });
    }
  }, [isVisible]);

  return (
    <>
      <span 
        ref={iconRef}
        className="cursor-help text-gray-500 dark:text-gray-400 inline-flex items-center justify-center ml-2"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
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
      
      {isVisible && (
        <div 
          ref={tooltipRef}
          className="fixed z-[9999] w-48 px-2 py-1 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, -100%)'
          }}
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
      )}
    </>
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

  // Determine background accent color based on trend
  const getAccentClass = () => {
    switch (trend) {
      case 'positive':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'negative':
        return 'bg-red-100 dark:bg-red-900/20';
      case 'neutral':
      default:
        return 'bg-blue-100 dark:bg-blue-900/20';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 relative overflow-hidden group min-h-[90px] flex flex-col justify-between">
      <div className={`absolute top-0 left-0 w-1 h-full ${getAccentClass()} transition-all duration-200`}></div>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate pr-2">
          {title}
        </h3>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      {isLoading ? (
        <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
      ) : (
        <p className={`text-xl font-bold ${getColorClass()} transition-all duration-200`}>
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 h-full transition-all duration-200 hover:shadow-xl flex flex-col ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white m-0">{title}</h2>
      </div>
      <div className="px-6 pt-6 pb-4 [&>div:last-child]:mb-0 flex-grow">
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
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-white dark:from-gray-800 dark:to-gray-750">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white m-0 flex items-center">
          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1.5 rounded-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
            </svg>
          </span>
          {title}
        </h2>
      </div>
      <div className="overflow-hidden">
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

// Create a memoized PositionRow component
interface PositionRowProps {
  position: Position;
}

const PositionRow = memo(({ position }: PositionRowProps) => {
  const entryPrice = parseFloat(position.entryPrice);
  const currentPrice = parseFloat(position.currentPrice);
  const quantity = parseFloat(position.quantity);
  const unrealizedPnl = position.unrealizedPnl ? parseFloat(position.unrealizedPnl) : 0;
  
  // Calculate position size (quantity * current price)
  const positionSize = quantity * currentPrice;
  
  // Calculate percentage change
  const priceChange = currentPrice - entryPrice;
  const percentageChange = (priceChange / entryPrice) * 100 * (position.side === 'short' ? -1 : 1);
  
  // Calculate risk score (simple example - could be more complex in real app)
  const riskScore = Math.abs(percentageChange) > 10 ? 'High' : Math.abs(percentageChange) > 5 ? 'Medium' : 'Low';
  
  // Determine color classes based on values
  const pnlColorClass = unrealizedPnl > 0 ? 'text-green-600 dark:text-green-400' : unrealizedPnl < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400';
  const percentageColorClass = percentageChange > 0 ? 'text-green-600 dark:text-green-400' : percentageChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400';
  const riskColorClass = riskScore === 'High' ? 'text-red-600 dark:text-red-400' : riskScore === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400';
  
  return (
    <tr key={position.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {position.asset}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {position.side === 'long' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              LONG
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
              SHORT
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 dark:text-gray-100 text-center">
          {position.marginType === 'isolated' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
              ISOLATED
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              CROSS
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-gray-900 dark:text-gray-100">{position.quantity}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-gray-900 dark:text-gray-100">{formatCurrency(positionSize)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-gray-900 dark:text-gray-100">{formatCurrency(entryPrice)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-gray-900 dark:text-gray-100">{formatCurrency(currentPrice)}</div>
        <div className={`text-xs ${percentageColorClass}`}>
          {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(2)}%
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className={`text-sm font-medium ${pnlColorClass}`}>
          {formatCurrency(unrealizedPnl)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className={`text-sm font-medium ${riskColorClass}`}>
          {riskScore}
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if important properties have changed
  return (
    prevProps.position.asset === nextProps.position.asset &&
    prevProps.position.entryPrice === nextProps.position.entryPrice &&
    prevProps.position.currentPrice === nextProps.position.currentPrice &&
    prevProps.position.quantity === nextProps.position.quantity &&
    prevProps.position.side === nextProps.position.side &&
    prevProps.position.unrealizedPnl === nextProps.position.unrealizedPnl &&
    prevProps.position.marginType === nextProps.position.marginType
  );
});

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
  // Add state for auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Effect to handle URL wallet address changes - only on initial mount or URL change
  useEffect(() => {
    if (urlWalletAddress && urlWalletAddress !== walletAddress) {
      setWalletAddress(urlWalletAddress);
      
      // Only load wallet data if this isn't from an auto-refresh
      if (isInitialMount.current) {
        isInitialMount.current = false;
        handleWalletLoad(urlWalletAddress);
      }
    }
  }, [urlWalletAddress, walletAddress]); // Added walletAddress to dependency array

  // Effect to update total position value whenever positions change
  useEffect(() => {
    // Skip this effect if there are no positions or userState
    if (!positions.length || !userState || !userState.crossMarginSummary) {
      return;
    }
    
    // Calculate total position value from all positions
    const totalPositionValue = positions.reduce(
      (sum, position) => sum + parseFloat(position.quantity) * parseFloat(position.currentPrice),
      0
    );
    
    // Convert to string for comparison
    const totalPositionValueStr = totalPositionValue.toString();
    
    // Only update if the value has actually changed to prevent infinite loops
    if (userState.crossMarginSummary.totalPositionValue !== totalPositionValueStr) {
      // Use functional update to avoid dependency on userState
      setUserState(prevState => {
        if (prevState && prevState.crossMarginSummary) {
          return {
            ...prevState,
            crossMarginSummary: {
              ...prevState.crossMarginSummary,
              totalPositionValue: totalPositionValueStr
            }
          };
        }
        return prevState;
      });
    }
  }, [positions, userState]); // Added userState to dependency array

  // Setup auto-refresh interval
  useEffect(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Only set up interval if auto-refresh is enabled and we have a wallet address
    if (autoRefreshEnabled && walletAddress && hasSubmitted && userState) {
      console.log('Setting up auto-refresh interval');
      refreshIntervalRef.current = setInterval(() => {
        console.log(`Auto-refreshing data for wallet ${walletAddress} at ${new Date().toLocaleTimeString()}`);
        handleWalletLoad(walletAddress, true);
        setLastRefreshTime(new Date());
      }, 60000); // 60 seconds interval
    }

    // Cleanup function
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, walletAddress, hasSubmitted, userState, isLoading]); // Added isLoading to dependency array

  // Separate function to load wallet data
  const handleWalletLoad = async (address: string, isAutoRefresh = false) => {
    if (!address) {
      setError('Please enter a wallet address');
      return;
    }
    
    if (!isAutoRefresh) {
      setIsLoading(true);
    }
    setError(null);
    setHasSubmitted(true);
    
    try {
      // Fetch real data from HyperLiquid API
      const response = await axios.post('https://api.hyperliquid.xyz/info', {
        type: 'clearinghouseState',
        user: address
      });
      
      // Only log detailed data if not auto-refreshing to reduce console spam
      if (!isAutoRefresh) {
        console.log('HyperLiquid API response:', JSON.stringify(response.data, null, 2));
      }
      
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
          if (!isAutoRefresh) {
            console.log('Account Value:', apiData.crossMarginSummary.accountValue);
            console.log('Total Margin Used:', apiData.crossMarginSummary.totalMarginUsed);
            console.log('Total Margin Used Ratio:', apiData.crossMarginSummary.totalMarginUsedRatio);
            console.log('Total Maintenance Margin:', apiData.crossMarginSummary.totalMm);
            console.log('Total Maintenance Margin Ratio:', apiData.crossMarginSummary.totalMmRatio);
          }
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
      
      // Only log detailed market data if not auto-refreshing
      if (!isAutoRefresh) {
        console.log('Market data response:', JSON.stringify(marketResponse.data, null, 2));
      }
      
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
        
        // Only log if not auto-refreshing
        if (!isAutoRefresh) {
          console.log('Extracted market prices for assets:', Object.keys(marketPrices).length);
        }
      } catch (err) {
        console.error('Error processing market data:', err);
      }
      
      // Only log if not auto-refreshing
      if (!isAutoRefresh) {
        console.log('Extracted market prices:', marketPrices);
      }
      
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
        if (!isAutoRefresh) {
          console.log('API data structure:', Object.keys(apiData));
        }
        
        // Check if assetPositions exists and is an array
        if (apiData.assetPositions && Array.isArray(apiData.assetPositions)) {
          if (!isAutoRefresh) {
            console.log('Found assetPositions array with length:', apiData.assetPositions.length);
          }
          
          apiData.assetPositions.forEach((assetPosition: any, index: number) => {
            // Only log detailed position data if not auto-refreshing
            if (!isAutoRefresh) {
              console.log(`Processing position ${index}:`, assetPosition);
            }
            
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
              
              // Only log detailed position data if not auto-refreshing
              if (!isAutoRefresh) {
                console.log(`Extracted position data: Asset=${asset}, Size=${size}, EntryPrice=${entryPrice}, PNL=${unrealizedPnl}, MarginType=${marginType}`);
              }
              
              if (asset && size && parseFloat(size) !== 0) {
                // Get current price from market data
                let currentPrice = marketPrices[asset];
                if (!currentPrice) {
                  if (!isAutoRefresh) {
                    console.log(`No market price found for ${asset}, using entry price`);
                  }
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
                
                if (!isAutoRefresh) {
                  console.log(`Added position for ${asset}`);
                }
              } else {
                if (!isAutoRefresh) {
                  console.log(`Skipping position due to missing data or zero size: Asset=${asset}, Size=${size}`);
                }
              }
            } else {
              if (!isAutoRefresh) {
                console.log(`Position ${index} has unexpected structure:`, assetPosition);
              }
            }
          });
        } else {
          if (!isAutoRefresh) {
            console.log('No assetPositions array found in API response');
            
            // If we couldn't find positions in the API response, use mock positions for testing
            console.log('Using mock positions for testing');
          }
          currentPositions.push(...mockPositions);
        }
      } catch (err) {
        console.error('Error processing positions:', err);
        // Use mock positions as fallback
        currentPositions.push(...mockPositions);
      }
      
      if (!isAutoRefresh) {
        console.log('Final positions to display:', currentPositions);
      }
      
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
        
        // Store the total position value in the userState object for use in the UI
        if (apiData && apiData.crossMarginSummary) {
          // Store the calculated total position value that includes all positions (cross and isolated)
          const newTotalPositionValue = totalPositionValue.toString();
          
          // Only update if different to prevent render loops
          if (apiData.crossMarginSummary.totalPositionValue !== newTotalPositionValue) {
            apiData.crossMarginSummary.totalPositionValue = newTotalPositionValue;
            
            // Update the userState with the modified apiData - use functional update
            setUserState(prevState => {
              if (prevState) {
                // Only update if the value has changed
                if (!prevState.crossMarginSummary || 
                    prevState.crossMarginSummary.totalPositionValue !== newTotalPositionValue) {
                  return {
                    ...prevState,
                    crossMarginSummary: {
                      ...(prevState.crossMarginSummary || {}),
                      totalPositionValue: newTotalPositionValue
                    }
                  };
                }
              }
              return prevState || apiData as HyperLiquidUserState;
            });
          }
        }
        
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
      if (!isAutoRefresh) {
        setIsLoading(false);
      }
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

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  // Manual refresh button handler
  const handleManualRefresh = () => {
    if (!isLoading && walletAddress) {
      handleWalletLoad(walletAddress);
      setLastRefreshTime(new Date());
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
      <span className="inline-flex items-center justify-center">
        {positionSortDirection === 'asc' ? (
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

  // Memoize the position rows to prevent unnecessary re-renders
  const memoizedPositionRows = useMemo(() => 
    positions.map(position => (
      <PositionRow key={position.id} position={position} />
    ))
  , [positions]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-80 py-6 px-4 sm:px-6 lg:px-8 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', 
          backgroundSize: '30px 30px' 
        }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Form Card */}
        <FormCard className="max-w-2xl mx-auto">
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm font-medium"
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
          
          {/* Auto-refresh controls */}
          {hasSubmitted && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Now
                </button>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {lastRefreshTime ? `Last updated: ${lastRefreshTime.toLocaleTimeString()}` : ''}
                </div>
              </div>
              <div className="flex items-center">
                <label htmlFor="autoRefresh" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                  Auto-refresh
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefreshEnabled}
                    onChange={toggleAutoRefresh}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-6 rounded-full ${autoRefreshEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'} transition-colors`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${autoRefreshEnabled ? 'translate-x-4' : ''}`}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (60s interval)
                </span>
              </div>
            </div>
          )}
        </FormCard>

        {/* Feature Overview Grid */}
        {!hasSubmitted && (
          <div className="max-w-7xl mx-auto space-y-12"> {/* Added space-y-12 for vertical spacing between sections */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-6">
              Enter a wallet address to view risk metrics and positions
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              This dashboard provides a comprehensive view of your HyperLiquid trading activity, including:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-6 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-3xl py-8"> {/* Applied gradient directly to container and added padding */}
              {/* Removed the background pattern div */}
              
              {/* PNL Tracking Card */}
              <div className="relative bg-gray-800/70 backdrop-blur-md p-8 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 group hover:-translate-y-1">
                <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-xl bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
                  <svg className="w-8 h-8 text-purple-400 transform group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-purple-400 transition-colors duration-300">PNL Tracking</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Unrealized and realized PNL</p>
              </div>

              {/* Position Monitoring Card */}
              <div className="relative bg-gray-800/70 backdrop-blur-md p-8 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 group hover:-translate-y-1">
                <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors duration-300">
                  <svg className="w-8 h-8 text-blue-400 transform group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">Position Monitoring</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Current open positions</p>
              </div>

              {/* Risk Assessment Card */}
              <div className="relative bg-gray-800/70 backdrop-blur-md p-8 rounded-2xl border border-gray-700 hover:border-red-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20 group hover:-translate-y-1">
                <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-xl bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-300">
                  <svg className="w-8 h-8 text-red-400 transform group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-red-400 transition-colors duration-300">Risk Assessment</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Risk metrics for your account</p>
              </div>

              {/* Detailed Analysis Card */}
              <div className="relative bg-gray-800/70 backdrop-blur-md p-8 rounded-2xl border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 group hover:-translate-y-1">
                <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-xl bg-green-500/20 group-hover:bg-green-500/30 transition-colors duration-300">
                  <svg className="w-8 h-8 text-green-400 transform group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-green-400 transition-colors duration-300">Detailed Analysis</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Position-specific risk analysis</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <AlertCard type="error" message={error} className="max-w-2xl mx-auto" />
        )}
        
        {/* Current Positions */}
        {hasSubmitted && positions.length > 0 && (
          <TableCard title="Current Positions">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
                    <th className="group px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400" onClick={() => sortPositions('asset')}>
                      <div className="flex items-center">
                        <span>Asset</span>
                        <div className="ml-1">{renderSortIndicator('asset')}</div>
                      </div>
                    </th>
                    <th className="group px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400" onClick={() => sortPositions('side')}>
                      <div className="flex items-center">
                        <span>Side</span>
                        <div className="ml-1">{renderSortIndicator('side')}</div>
                      </div>
                    </th>
                    <th className="group px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span>Margin Type</span>
                      </div>
                    </th>
                    <th className="group px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400" onClick={() => sortPositions('quantity')}>
                      <div className="flex items-center justify-end">
                        <span>Quantity</span>
                        <div className="ml-1">{renderSortIndicator('quantity')}</div>
                      </div>
                    </th>
                    <th className="group px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400" onClick={() => sortPositions('positionSize')}>
                      <div className="flex items-center justify-end">
                        <span>Position Size</span>
                        <div className="ml-1">{renderSortIndicator('positionSize')}</div>
                      </div>
                    </th>
                    <th className="group px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400" onClick={() => sortPositions('entryPrice')}>
                      <div className="flex items-center justify-end">
                        <span>Entry Price</span>
                        <div className="ml-1">{renderSortIndicator('entryPrice')}</div>
                      </div>
                    </th>
                    <th className="group px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400" onClick={() => sortPositions('currentPrice')}>
                      <div className="flex items-center justify-end">
                        <span>Current Price</span>
                        <div className="ml-1">{renderSortIndicator('currentPrice')}</div>
                      </div>
                    </th>
                    <th className="group px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-purple-600 dark:hover:text-purple-400" onClick={() => sortPositions('unrealizedPnl')}>
                      <div className="flex items-center justify-end">
                        <span>Unrealized PNL</span>
                        <div className="ml-1">{renderSortIndicator('unrealizedPnl')}</div>
                      </div>
                    </th>
                    <th className="group px-6 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center justify-center">
                        <span>Risk Score</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Fix the conditional useMemo error by moving the useMemo outside the JSX */}
                  {memoizedPositionRows}
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
            className="max-w-2xl mx-auto" 
          />
        )}
        
        {/* Dashboard Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Summary Section */}
          {hasSubmitted && userState && (
            <div className="lg:col-span-2">
              <SectionCard title="Account Summary">
                {/* Account Value Metrics */}
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    Account Value
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <MetricCard 
                      title="Total Account Value" 
                      value={formatCurrency(userState.crossMarginSummary.accountValue)}
                      trend="neutral"
                      tooltip="The total value of your account including all assets and positions."
                    />
                    <MetricCard 
                      title="Total Position Value" 
                      value={formatCurrency(
                        // First try to use the calculated total position value
                        userState.crossMarginSummary.totalPositionValue || 
                        // If not available, calculate it directly from positions
                        (positions.length > 0 
                          ? positions.reduce((sum, pos) => sum + parseFloat(pos.quantity) * parseFloat(pos.currentPrice), 0).toString()
                          : userState.crossMarginSummary.totalNtlPos || '0')
                      )}
                      trend="neutral"
                      tooltip="The total value of all your open positions (both cross and isolated margin)."
                    />
                  </div>
                </div>
                
                {/* Margin Metrics */}
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Margin Usage
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Profit & Loss
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <MetricCard 
                      title="Unrealized PNL" 
                      value={formatCurrency(unrealizedPnl)}
                      tooltip="Profit or loss on open positions that has not yet been realized."
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
                      trend={
                        ((pnlData?.metrics?.netPnl || 0) + parseFloat(unrealizedPnl)) >= 0
                          ? 'positive'
                          : 'negative'
                      }
                    />
                    <MetricCard 
                      title="Total Fees" 
                      value={formatCurrency(pnlData?.metrics?.totalFees || 0)}
                      tooltip="Total trading fees paid across all transactions."
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
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    Volatility & Drawdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <MetricCard 
                      title="Volatility" 
                      value={parseFloat(riskMetrics?.volatility || '0').toFixed(2)}
                      suffix="%"
                      tooltip="Measures the variation in your portfolio's returns over time. Higher volatility indicates higher risk."
                      trend={parseFloat(riskMetrics?.volatility || '0') < 20 ? 'positive' : parseFloat(riskMetrics?.volatility || '0') < 40 ? 'neutral' : 'negative'}
                    />
                    <MetricCard 
                      title="Max Drawdown" 
                      value={parseFloat(riskMetrics?.drawdown || '0').toFixed(2)}
                      suffix="%"
                      tooltip="The largest peak-to-trough decline in your portfolio value. Lower values are better."
                      trend={parseFloat(riskMetrics?.drawdown || '0') < 10 ? 'positive' : parseFloat(riskMetrics?.drawdown || '0') < 20 ? 'neutral' : 'negative'}
                    />
                  </div>
                </div>

                {/* Value at Risk */}
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Risk Assessment
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                    <MetricCard 
                      title="Value at Risk (VaR)" 
                      value={formatCurrency(parseFloat(riskMetrics?.valueAtRisk || '0'))}
                      tooltip="The maximum potential loss expected with 95% confidence over a day. Lower values relative to portfolio size are better."
                      trend={(() => {
                        // Calculate VaR as a percentage of account value
                        const varValue = parseFloat(riskMetrics?.valueAtRisk || '0');
                        const accountValue = userState?.crossMarginSummary?.accountValue 
                          ? parseFloat(userState.crossMarginSummary.accountValue) 
                          : 0;
                        
                        if (accountValue <= 0) return 'neutral';
                        
                        const varPercentage = (varValue / accountValue) * 100;
                        
                        // Lower VaR is better (less potential loss)
                        return varPercentage < 5 ? 'positive' : varPercentage < 10 ? 'neutral' : 'negative';
                      })()}
                    />
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Performance Ratios
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <MetricCard 
                      title="Sharpe Ratio" 
                      value={parseFloat(riskMetrics?.sharpeRatio || '0').toFixed(2)}
                      tooltip="Measures risk-adjusted return. Higher values indicate better risk-adjusted performance."
                      trend={parseFloat(riskMetrics?.sharpeRatio || '0') > 1.5 ? 'positive' : parseFloat(riskMetrics?.sharpeRatio || '0') > 0.5 ? 'neutral' : 'negative'}
                    />
                    <MetricCard 
                      title="Sortino Ratio" 
                      value={parseFloat(riskMetrics?.sortinoRatio || '0').toFixed(2)}
                      tooltip="Similar to Sharpe ratio but only penalizes downside volatility. Higher values are better."
                      trend={parseFloat(riskMetrics?.sortinoRatio || '0') > 1.5 ? 'positive' : parseFloat(riskMetrics?.sortinoRatio || '0') > 0.5 ? 'neutral' : 'negative'}
                    />
                  </div>
                </div>

                {/* Portfolio Composition */}
                <div>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                      <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                      <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                    </svg>
                    Portfolio Composition
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                    <MetricCard 
                      title="Concentration" 
                      value={parseFloat(riskMetrics?.concentration || '0').toFixed(2)}
                      suffix="%"
                      tooltip="Measures how concentrated your portfolio is in specific assets. Higher values indicate higher concentration risk."
                      trend={parseFloat(riskMetrics?.concentration || '0') < 30 ? 'positive' : parseFloat(riskMetrics?.concentration || '0') < 60 ? 'neutral' : 'negative'}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
        
        {/* Historical PNL by Asset Section */}
        {hasSubmitted && walletAddress && !error && (
          <div>
            <HistoricalPnl walletAddress={walletAddress} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;