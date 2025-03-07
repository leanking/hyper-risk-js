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

// API endpoints
export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  wallets: `${API_BASE_URL}/wallets`,
  pnl: `${API_BASE_URL}/pnl`,
  // Add other endpoints as needed
};

export default {
  baseUrl: API_BASE_URL,
  endpoints: API_ENDPOINTS,
}; 