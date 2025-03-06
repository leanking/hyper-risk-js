import axios from 'axios';
import WebSocket from 'ws';
import { HYPERLIQUID_CONFIG } from '../config';
import {
  HyperLiquidAllMidsData,
  HyperLiquidCandleData,
  HyperLiquidL2BookData,
  HyperLiquidTrade,
  HyperLiquidUserFillsData,
  HyperLiquidTradeInfo,
} from '@shared/types';

/**
 * Interface for HyperLiquid Clearinghouse State response
 */
interface HyperLiquidClearinghouseState {
  assetPositions?: any[];
  crossMarginSummary?: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMm: string;
    totalMmRatio?: string;
    totalMf: string;
    totalMfRatio?: string;
    totalMarginUsed: string;
    totalMarginUsedRatio?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

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
      console.log(`Fetching user fills for address: ${address}`);
      console.log(`API URL: ${this.apiUrl}/info`);
      
      // Format the address according to the API documentation:
      // "Address in 42-character hexadecimal format; e.g. 0x000000000000000000000000000000000000000000."
      // Remove the '0x' prefix if present
      const formattedAddress = address.startsWith('0x') ? address.slice(2) : address;
      
      // Format the request according to the API documentation
      // The API expects "type": "userFills" (lowercase 'u')
      const payload = {
        type: 'userFills',
        user: formattedAddress,
      };
      
      console.log(`Request payload:`, JSON.stringify(payload, null, 2));
      
      const response = await axios.post(`${this.apiUrl}/info`, payload);
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response data type: ${typeof response.data}`);
      console.log(`Response data:`, JSON.stringify(response.data, null, 2));
      
      // Check if the response data is an array (direct list of fills)
      if (Array.isArray(response.data)) {
        console.log(`Response data is an array with ${response.data.length} items`);
        
        // Convert the array to the expected format
        return {
          is_snapshot: true,
          user: address,
          fills: response.data
        };
      }
      
      // If we get a successful response, return it
      if (response.status === 200 && response.data) {
        return response.data as HyperLiquidUserFillsData;
      }
      
      // If we get an empty response or an error, return an empty fills array
      console.log('Returning empty fills array due to empty response or error');
      return {
        is_snapshot: true,
        user: address,
        fills: []
      };
    } catch (error) {
      console.error(`Error fetching user fills for ${address}:`, error);
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
      }
      
      // Return an empty fills array in case of error
      return {
        is_snapshot: true,
        user: address,
        fills: []
      };
    }
  }

  /**
   * Get historical PNL data for a user
   * @param address The user's Ethereum address
   * @param startTime Optional start time in milliseconds
   * @param endTime Optional end time in milliseconds
   * @returns Historical PNL data grouped by asset
   */
  async getHistoricalPnl(
    address: string,
    startTime?: number,
    endTime?: number
  ): Promise<Record<string, { totalRealizedPnl: number, trades: HyperLiquidTradeInfo[] }>> {
    try {
      console.log(`Fetching historical PNL for address: ${address}`);
      
      // Get user fills which contain closedPnl information
      const userFills = await this.getUserFills(address);
      
      console.log(`Received user fills:`, JSON.stringify(userFills, null, 2));
      
      // If there are no fills, return an empty object
      if (!userFills.fills || userFills.fills.length === 0) {
        console.log('No fills found, returning empty PNL data');
        return {};
      }
      
      // Filter fills by time range if provided
      let filteredFills = userFills.fills;
      if (startTime) {
        console.log(`Filtering fills after ${new Date(startTime).toISOString()}`);
        filteredFills = filteredFills.filter(fill => fill.time >= startTime);
      }
      if (endTime) {
        console.log(`Filtering fills before ${new Date(endTime).toISOString()}`);
        filteredFills = filteredFills.filter(fill => fill.time <= endTime);
      }
      
      console.log(`Filtered to ${filteredFills.length} fills`);
      
      // Group fills by asset and calculate total realized PNL
      const pnlByAsset: Record<string, { totalRealizedPnl: number, trades: HyperLiquidTradeInfo[] }> = {};
      
      for (const fill of filteredFills) {
        if (!pnlByAsset[fill.coin]) {
          pnlByAsset[fill.coin] = {
            totalRealizedPnl: 0,
            trades: []
          };
        }
        
        // Add the closed PNL from this trade
        // The API returns 'closedPnl' (camelCase) not 'closed_pnl' (snake_case)
        const closedPnl = parseFloat(fill.closedPnl || '0') || 0;
        pnlByAsset[fill.coin].totalRealizedPnl += closedPnl;
        pnlByAsset[fill.coin].trades.push(fill);
      }
      
      console.log(`Calculated PNL by asset:`, JSON.stringify(pnlByAsset, null, 2));
      
      return pnlByAsset;
    } catch (error) {
      console.error(`Error fetching historical PNL for ${address}:`, error);
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      // Return an empty object in case of error
      return {};
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
      // Format the address according to the API documentation
      const formattedAddress = address.startsWith('0x') ? address.slice(2) : address;
      
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'userFunding',
        user: formattedAddress,
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
   * Get historical orders for a user
   * @param address The user's Ethereum address
   * @returns Historical orders
   */
  async getHistoricalOrders(address: string) {
    try {
      // Format the address according to the API documentation
      const formattedAddress = address.startsWith('0x') ? address.slice(2) : address;
      
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'historicalOrders',
        user: formattedAddress,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching historical orders for ${address}:`, error);
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
      console.log(`Fetching user state for address: ${address}`);
      
      // Format the address according to the API documentation
      const formattedAddress = address.startsWith('0x') ? address.slice(2) : address;
      
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'userState',
        user: formattedAddress,
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
      // Format the address according to the API documentation
      const formattedAddress = address.startsWith('0x') ? address.slice(2) : address;
      
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'openOrders',
        user: formattedAddress,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching open orders for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get clearinghouse state for a user
   * @param address The user's Ethereum address
   * @returns Clearinghouse state including margin information
   */
  async getClearinghouseState(address: string): Promise<HyperLiquidClearinghouseState> {
    try {
      // Format the address according to the API documentation
      const formattedAddress = address.startsWith('0x') ? address.slice(2) : address;
      
      const response = await axios.post(`${this.apiUrl}/info`, {
        type: 'clearinghouseState',
        user: formattedAddress,
      });
      
      // Log the response for debugging
      console.log(`Clearinghouse state for ${address}:`, JSON.stringify(response.data, null, 2));
      
      // Process the response to ensure margin ratios are calculated if missing
      const data = response.data as HyperLiquidClearinghouseState;
      
      if (data && data.crossMarginSummary) {
        // Calculate totalMarginUsedRatio if missing but we have the components
        if (!data.crossMarginSummary.totalMarginUsedRatio && 
            data.crossMarginSummary.totalMarginUsed && 
            data.crossMarginSummary.accountValue) {
          const marginUsed = parseFloat(data.crossMarginSummary.totalMarginUsed);
          const accountValue = parseFloat(data.crossMarginSummary.accountValue);
          if (!isNaN(marginUsed) && !isNaN(accountValue) && accountValue > 0) {
            data.crossMarginSummary.totalMarginUsedRatio = (marginUsed / accountValue).toString();
          }
        }
        
        // Calculate totalMmRatio if missing but we have the components
        if (!data.crossMarginSummary.totalMmRatio && 
            data.crossMarginSummary.totalMm && 
            data.crossMarginSummary.accountValue) {
          const totalMm = parseFloat(data.crossMarginSummary.totalMm);
          const accountValue = parseFloat(data.crossMarginSummary.accountValue);
          if (!isNaN(totalMm) && !isNaN(accountValue) && accountValue > 0) {
            data.crossMarginSummary.totalMmRatio = (totalMm / accountValue).toString();
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching clearinghouse state for ${address}:`, error);
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