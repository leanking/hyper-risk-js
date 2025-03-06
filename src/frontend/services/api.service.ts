import axios from 'axios';
import { Wallet, Transaction, Position, RiskMetrics } from '@shared/types';

// Define response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: Date;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * API Service
 * Handles API requests to the backend
 */
class ApiService {
  private api: ReturnType<typeof axios.create>;
  
  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        const axiosError = error as { response?: { data: unknown }; message?: string };
        console.error('API Error:', axiosError.response?.data || axiosError.message);
        return Promise.reject(error);
      }
    );
  }
  
  // Wallet endpoints
  
  /**
   * Get all wallets
   * @param page Page number
   * @param limit Number of items per page
   * @returns List of wallets and pagination info
   */
  async getWallets(page = 1, limit = 20): Promise<{ wallets: Wallet[]; total: number; pages: number }> {
    const response = await this.api.get<ApiResponse<Wallet[]>>('/wallets', {
      params: { page, limit },
    });
    
    return {
      wallets: response.data.data,
      total: response.data.pagination?.total || 0,
      pages: response.data.pagination?.pages || 1,
    };
  }
  
  /**
   * Get a wallet by ID
   * @param id Wallet ID
   * @returns The wallet
   */
  async getWalletById(id: string): Promise<Wallet> {
    const response = await this.api.get<ApiResponse<Wallet>>(`/wallets/${id}`);
    return response.data.data;
  }
  
  /**
   * Create a new wallet
   * @param address Wallet address
   * @param name Optional wallet name
   * @returns The created wallet
   */
  async createWallet(address: string, name?: string): Promise<Wallet> {
    const response = await this.api.post<ApiResponse<Wallet>>('/wallets', {
      address,
      name,
    });
    
    return response.data.data;
  }
  
  /**
   * Update a wallet
   * @param id Wallet ID
   * @param updates Updates to apply
   * @returns The updated wallet
   */
  async updateWallet(id: string, updates: Partial<Wallet>): Promise<Wallet> {
    const response = await this.api.put<ApiResponse<Wallet>>(`/wallets/${id}`, updates);
    return response.data.data;
  }
  
  /**
   * Delete a wallet
   * @param id Wallet ID
   * @returns Success message
   */
  async deleteWallet(id: string): Promise<{ message: string }> {
    const response = await this.api.delete<ApiResponse<{ message: string }>>(`/wallets/${id}`);
    return response.data.data;
  }
  
  /**
   * Sync a wallet
   * @param id Wallet ID
   * @returns The synced wallet data
   */
  async syncWallet(id: string): Promise<{
    wallet: Wallet;
    transactions: Transaction[];
    positions: Position[];
    riskMetrics: RiskMetrics;
  }> {
    const response = await this.api.post<ApiResponse<{
      wallet: Wallet;
      transactions: Transaction[];
      positions: Position[];
      riskMetrics: RiskMetrics;
    }>>(`/wallets/${id}/sync`);
    
    return response.data.data;
  }
  
  // Transaction endpoints
  
  /**
   * Get transactions for a wallet
   * @param walletId Wallet ID
   * @param page Page number
   * @param limit Number of items per page
   * @returns List of transactions and pagination info
   */
  async getTransactions(
    walletId: string,
    page = 1,
    limit = 20
  ): Promise<{ transactions: Transaction[]; total: number; pages: number }> {
    const response = await this.api.get<ApiResponse<Transaction[]>>(`/transactions`, {
      params: { walletId, page, limit },
    });
    
    return {
      transactions: response.data.data,
      total: response.data.pagination?.total || 0,
      pages: response.data.pagination?.pages || 1,
    };
  }
  
  // Position endpoints
  
  /**
   * Get positions for a wallet
   * @param walletId Wallet ID
   * @param status Filter by position status (optional)
   * @returns List of positions
   */
  async getPositions(walletId: string, status?: string): Promise<Position[]> {
    const response = await this.api.get<ApiResponse<Position[]>>(`/positions`, {
      params: { walletId, status },
    });
    
    return response.data.data;
  }
  
  // Risk metrics endpoints
  
  /**
   * Get risk metrics for a wallet
   * @param walletId Wallet ID
   * @returns Risk metrics
   */
  async getRiskMetrics(walletId: string): Promise<RiskMetrics> {
    const response = await this.api.get<ApiResponse<RiskMetrics>>(`/risk-metrics`, {
      params: { walletId },
    });
    
    return response.data.data;
  }
  
  // Health check
  
  /**
   * Check if the API is healthy
   * @returns Health status
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await this.api.get<ApiResponse<{ status: string; message: string }>>('/health');
    return response.data.data;
  }
}

// Export a singleton instance
export default new ApiService(); 