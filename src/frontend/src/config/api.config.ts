/**
 * API Configuration
 * 
 * This file contains the configuration for the API endpoints.
 * In development, it points to the local development server.
 * In production, it points to the deployed backend.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// Base URL for API requests
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001/api' 
  : '/api';

// API endpoints configuration
export const API_ENDPOINTS = {
  wallets: '/wallets',
  transactions: '/transactions',
  positions: '/positions',
  pnl: '/pnl',
  riskMetrics: '/risk-metrics'
};

// API configuration object
const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: API_ENDPOINTS,
};

export default apiConfig; 