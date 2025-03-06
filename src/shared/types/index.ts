// Wallet Types
export interface Wallet {
  id: string;
  address: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

// Transaction Types
export interface Transaction {
  id: string;
  walletId: string;
  hash: string;
  blockNumber: number;
  timestamp: Date;
  from: string;
  to: string;
  value: string;
  asset: string;
  type: TransactionType;
  status: TransactionStatus;
  fee?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRADE = 'trade',
  TRANSFER = 'transfer',
  OTHER = 'other',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

// Position Types
export interface Position {
  id: string;
  walletId: string;
  asset: string;
  entryPrice: string;
  currentPrice: string;
  quantity: string;
  side: PositionSide;
  status: PositionStatus;
  openedAt: Date;
  closedAt?: Date;
  realizedPnl?: string;
  unrealizedPnl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PositionSide {
  LONG = 'long',
  SHORT = 'short',
}

export enum PositionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

// PNL Types
export interface PnlRecord {
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

export enum PnlType {
  REALIZED = 'realized',
  UNREALIZED = 'unrealized',
}

// Risk Metrics Types
export interface RiskMetrics {
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

// Request Tracking Types
export interface RequestTracking {
  id: string;
  ipAddress: string;
  endpoint: string;
  timestamp: Date;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// HyperLiquid API Types
export interface HyperLiquidTrade {
  coin: string;
  side: string;
  px: string;
  sz: string;
  time: number;
  hash: string;
  tid: number;
}

export interface HyperLiquidBookLevel {
  px: string;
  sz: string;
  n: number;
}

export interface HyperLiquidL2BookData {
  coin: string;
  time: number;
  levels: HyperLiquidBookLevel[][];
}

export interface HyperLiquidAllMidsData {
  mids: Record<string, string>;
}

export interface HyperLiquidTradeInfo {
  coin: string;
  side: string;
  px: string;
  sz: string;
  time: number;
  hash: string;
  start_position: string;
  dir: string;
  closed_pnl: string;
  oid: number;
  cloid?: string;
  crossed: boolean;
  fee: string;
  tid: number;
}

export interface HyperLiquidUserFillsData {
  is_snapshot?: boolean;
  user: string;
  fills: HyperLiquidTradeInfo[];
}

export interface HyperLiquidCandleData {
  time_close: number;
  close: string;
  high: string;
  interval: string;
  low: string;
  num_trades: number;
  open: string;
  coin: string;
  time_open: number;
  volume: string;
}

export interface HyperLiquidOrderUpdate {
  order: HyperLiquidBasicOrder;
  status: string;
  status_timestamp: number;
}

export interface HyperLiquidBasicOrder {
  coin: string;
  side: string;
  limit_px: string;
  sz: string;
  oid: number;
  timestamp: number;
  orig_sz: string;
  cloid?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
} 