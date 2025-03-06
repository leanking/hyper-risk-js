import { v4 as uuidv4 } from 'uuid';
import hyperLiquidApi from './hyperliquid-api.service';
import { Position, PositionSide, PositionStatus, Transaction, TransactionType, MarginType } from '@shared/types';
import { calculatePnl } from '@shared/utils';

/**
 * Position Service
 * Handles position detection and tracking
 */
class PositionService {
  /**
   * Detect positions from transactions
   * @param walletId The wallet ID
   * @param transactions List of transactions
   * @returns List of positions
   */
  async detectPositions(walletId: string, transactions: Transaction[]): Promise<Position[]> {
    // Group transactions by asset
    const transactionsByAsset = this.groupTransactionsByAsset(transactions);
    
    // Process each asset group to detect positions
    const positions: Position[] = [];
    
    for (const [asset, assetTransactions] of Object.entries(transactionsByAsset)) {
      // Sort transactions by timestamp (oldest first)
      assetTransactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Process transactions to detect positions
      const assetPositions = this.processTransactionsForPositions(walletId, asset, assetTransactions);
      positions.push(...assetPositions);
    }
    
    return positions;
  }

  /**
   * Group transactions by asset
   * @param transactions List of transactions
   * @returns Transactions grouped by asset
   */
  private groupTransactionsByAsset(transactions: Transaction[]): Record<string, Transaction[]> {
    const result: Record<string, Transaction[]> = {};
    
    for (const transaction of transactions) {
      if (transaction.type === TransactionType.TRADE) {
        if (!result[transaction.asset]) {
          result[transaction.asset] = [];
        }
        
        result[transaction.asset].push(transaction);
      }
    }
    
    return result;
  }

  /**
   * Process transactions for a specific asset to detect positions
   * @param walletId The wallet ID
   * @param asset The asset
   * @param transactions List of transactions for the asset
   * @returns List of positions
   */
  private processTransactionsForPositions(
    walletId: string,
    asset: string,
    transactions: Transaction[]
  ): Position[] {
    const positions: Position[] = [];
    let currentPosition: Position | null = null;
    
    for (const transaction of transactions) {
      const isBuy = transaction.to === walletId;
      const quantity = parseFloat(transaction.value);
      const price = transaction.fee ? parseFloat(transaction.fee) / quantity : 0;
      
      // Determine margin type from transaction metadata if available
      // Default to cross margin if not specified
      const marginType = transaction.metadata?.crossed === false ? 
        MarginType.ISOLATED : MarginType.CROSS;
      
      if (!currentPosition) {
        // Create a new position
        currentPosition = {
          id: uuidv4(),
          walletId,
          asset,
          entryPrice: price.toString(),
          currentPrice: price.toString(),
          quantity: quantity.toString(),
          side: isBuy ? PositionSide.LONG : PositionSide.SHORT,
          status: PositionStatus.OPEN,
          marginType,
          openedAt: transaction.timestamp,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        // Update existing position
        const currentQuantity = parseFloat(currentPosition.quantity);
        const newQuantity = isBuy ? currentQuantity + quantity : currentQuantity - quantity;
        
        if (newQuantity <= 0) {
          // Position is closed
          currentPosition.status = PositionStatus.CLOSED;
          currentPosition.closedAt = transaction.timestamp;
          currentPosition.realizedPnl = calculatePnl(
            price,
            parseFloat(currentPosition.entryPrice),
            currentQuantity
          ).toString();
          currentPosition.updatedAt = new Date();
          
          positions.push(currentPosition);
          currentPosition = null;
        } else {
          // Position is still open
          currentPosition.quantity = newQuantity.toString();
          // Update margin type if it has changed
          if (transaction.metadata?.crossed !== undefined) {
            currentPosition.marginType = transaction.metadata.crossed === false ? 
              MarginType.ISOLATED : MarginType.CROSS;
          }
          currentPosition.updatedAt = new Date();
        }
      }
    }
    
    // Add the current position if it's still open
    if (currentPosition) {
      positions.push(currentPosition);
    }
    
    return positions;
  }

  /**
   * Update current prices for open positions
   * @param positions List of positions
   * @returns Updated positions
   */
  async updateCurrentPrices(positions: Position[]): Promise<Position[]> {
    try {
      // Get all mid prices from HyperLiquid API
      const allMids = await hyperLiquidApi.getAllMids();
      
      // Update current prices and calculate unrealized PnL
      return positions.map(position => {
        if (position.status === PositionStatus.OPEN && allMids.mids[position.asset]) {
          const currentPrice = allMids.mids[position.asset];
          const unrealizedPnl = calculatePnl(
            parseFloat(currentPrice),
            parseFloat(position.entryPrice),
            parseFloat(position.quantity)
          ).toString();
          
          return {
            ...position,
            currentPrice,
            unrealizedPnl,
            updatedAt: new Date(),
          };
        }
        
        return position;
      });
    } catch (error) {
      console.error('Error updating current prices:', error);
      return positions;
    }
  }

  /**
   * Get positions for a wallet
   * @param walletId The wallet ID
   * @param status Filter by position status (optional)
   * @returns List of positions
   */
  async getPositionsForWallet(
    walletId: string,
    status?: PositionStatus
  ): Promise<Position[]> {
    // This would typically query the database
    // For now, we'll return an empty array as we haven't implemented database storage yet
    return [];
  }
}

// Export a singleton instance
export default new PositionService(); 