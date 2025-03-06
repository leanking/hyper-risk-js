import axios from 'axios';
import WebSocket from 'ws';
import { HYPERLIQUID_CONFIG } from '../config';
import {
  HyperLiquidAllMidsData,
  HyperLiquidCandleData,
  HyperLiquidL2BookData,
  HyperLiquidTrade,
  HyperLiquidUserFillsData,
} from '@shared/types';

/**
 * HyperLiquid API Service
 * Provides methods to interact with the HyperLiquid API
 */
class HyperLiquidApiService {
  private apiUrl: string;
  private wsUrl: string;
  private wsConnections: Map<string, WebSocket>;

  constructor() {
    this.apiUrl = HYPERLIQUID_CONFIG.apiUrl;
    this.wsUrl = HYPERLIQUID_CONFIG.wsUrl;
    this.wsConnections = new Map();
  }

  /**
   * Get exchange metadata
   * @returns Exchange metadata
   */
  async getMeta() {
    try {
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'Meta',
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching exchange metadata:', error);
      throw error;
    }
  }

  /**
   * Get all mid prices
   * @returns All mid prices
   */
  async getAllMids(): Promise<HyperLiquidAllMidsData> {
    try {
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'AllMids',
      });
      return response.data as HyperLiquidAllMidsData;
    } catch (error) {
      console.error('Error fetching all mids:', error);
      throw error;
    }
  }

  /**
   * Get recent trades for a coin
   * @param coin The coin symbol
   * @returns Recent trades
   */
  async getRecentTrades(coin: string): Promise<HyperLiquidTrade[]> {
    try {
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'RecentTrades',
        coin,
      });
      return response.data as HyperLiquidTrade[];
    } catch (error) {
      console.error(`Error fetching recent trades for ${coin}:`, error);
      throw error;
    }
  }

  /**
   * Get L2 order book snapshot for a coin
   * @param coin The coin symbol
   * @returns L2 order book snapshot
   */
  async getL2Snapshot(coin: string): Promise<HyperLiquidL2BookData> {
    try {
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'L2Book',
        coin,
      });
      return response.data as HyperLiquidL2BookData;
    } catch (error) {
      console.error(`Error fetching L2 snapshot for ${coin}:`, error);
      throw error;
    }
  }

  /**
   * Get candles snapshot for a coin
   * @param coin The coin symbol
   * @param interval The candle interval
   * @param startTime The start time
   * @param endTime The end time
   * @returns Candles snapshot
   */
  async getCandlesSnapshot(
    coin: string,
    interval: string,
    startTime: number,
    endTime: number
  ): Promise<HyperLiquidCandleData[]> {
    try {
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'CandleSnapshot',
        req: {
          coin,
          interval,
          startTime,
          endTime,
        },
      });
      return response.data as HyperLiquidCandleData[];
    } catch (error) {
      console.error(`Error fetching candles snapshot for ${coin}:`, error);
      throw error;
    }
  }

  /**
   * Get user fills
   * @param address The user's Ethereum address
   * @returns User fills
   */
  async getUserFills(address: string): Promise<HyperLiquidUserFillsData> {
    try {
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'UserFills',
        user: address,
      });
      return response.data as HyperLiquidUserFillsData;
    } catch (error) {
      console.error(`Error fetching user fills for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get user funding history
   * @param address The user's Ethereum address
   * @param startTime The start time
   * @param endTime The end time (optional)
   * @returns User funding history
   */
  async getUserFundingHistory(
    address: string,
    startTime: number,
    endTime?: number
  ) {
    try {
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'UserFunding',
        user: address,
        startTime,
        endTime,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching user funding history for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get user state
   * @param address The user's Ethereum address
   * @returns User state
   */
  async getUserState(address: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'UserState',
        user: address,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching user state for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get open orders for a user
   * @param address The user's Ethereum address
   * @returns Open orders
   */
  async getOpenOrders(address: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'OpenOrders',
        user: address,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching open orders for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to WebSocket updates
   * @param subscriptionType The subscription type
   * @param params The subscription parameters
   * @param callback The callback function to handle updates
   * @returns The WebSocket connection ID
   */
  subscribeToWebSocket(
    subscriptionType: string,
    params: any,
    callback: (data: any) => void
  ): string {
    const connectionId = `${subscriptionType}-${JSON.stringify(params)}`;
    
    if (this.wsConnections.has(connectionId)) {
      return connectionId;
    }
    
    const ws = new WebSocket(this.wsUrl);
    
    ws.on('open', () => {
      console.log(`WebSocket connection opened for ${subscriptionType}`);
      
      // Send subscription message
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: {
          type: subscriptionType,
          ...params,
        },
      }));
    });
    
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        callback(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${subscriptionType}:`, error);
    });
    
    ws.on('close', () => {
      console.log(`WebSocket connection closed for ${subscriptionType}`);
      this.wsConnections.delete(connectionId);
    });
    
    this.wsConnections.set(connectionId, ws);
    
    return connectionId;
  }

  /**
   * Unsubscribe from WebSocket updates
   * @param connectionId The WebSocket connection ID
   */
  unsubscribeFromWebSocket(connectionId: string): void {
    const ws = this.wsConnections.get(connectionId);
    
    if (ws) {
      ws.close();
      this.wsConnections.delete(connectionId);
    }
  }

  /**
   * Close all WebSocket connections
   */
  closeAllWebSocketConnections(): void {
    for (const [connectionId, ws] of this.wsConnections.entries()) {
      ws.close();
      this.wsConnections.delete(connectionId);
    }
  }
}

// Export a singleton instance
export default new HyperLiquidApiService(); 