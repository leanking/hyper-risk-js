import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Server configuration
export const SERVER_CONFIG = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

// Supabase configuration
export const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || '',
  key: process.env.SUPABASE_KEY || '',
};

// HyperLiquid API configuration
export const HYPERLIQUID_CONFIG = {
  apiUrl: process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz',
  wsUrl: process.env.HYPERLIQUID_WS_URL || 'wss://api.hyperliquid.xyz/ws',
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

// CORS configuration
export const CORS_CONFIG = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://www.hyper-flow.xyz', 'https://hyper-risk-js.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Database table names
export const DB_TABLES = {
  wallets: 'wallets',
  transactions: 'transactions',
  positions: 'positions',
  pnlRecords: 'pnl_records',
  riskMetrics: 'risk_metrics',
  requestTracking: 'request_tracking',
};

// API endpoints
export const API_ENDPOINTS = {
  wallets: '/api/wallets',
  transactions: '/api/transactions',
  positions: '/api/positions',
  pnl: '/api/pnl',
  riskMetrics: '/api/risk-metrics',
  health: '/api/health',
};

// Default pagination values
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
};

// Export all configurations
export default {
  server: SERVER_CONFIG,
  supabase: SUPABASE_CONFIG,
  hyperliquid: HYPERLIQUID_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  cors: CORS_CONFIG,
  dbTables: DB_TABLES,
  apiEndpoints: API_ENDPOINTS,
  pagination: PAGINATION,
}; 