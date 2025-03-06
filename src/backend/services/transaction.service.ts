import hyperLiquidApi from './hyperliquid-api.service';
import { Transaction, TransactionStatus, TransactionType, HyperLiquidTradeInfo } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Transaction Service
 * Handles fetching and processing transaction data from HyperLiquid API
 */
class TransactionService {
  /**
   * Fetch transactions for a wallet
   * @param walletId The wallet ID
   * @param address The wallet address
   * @returns List of transactions
   */
  async fetchTransactions(walletId: string, address: string): Promise<Transaction[]> {
    try {
      // Fetch user fills from HyperLiquid API
      const userFills = await hyperLiquidApi.getUserFills(address);
      
      // Process fills into transactions
      const transactions = this.processUserFills(walletId, address, userFills.fills);
      
      return transactions;
    } catch (error) {
      console.error(`Error fetching transactions for wallet ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Process user fills into transactions
   * @param walletId The wallet ID
   * @param address The wallet address
   * @param fills The user fills
   * @returns List of transactions
   */
  private processUserFills(
    walletId: string,
    address: string,
    fills: HyperLiquidTradeInfo[]
  ): Transaction[] {
    return fills.map(fill => {
      const isBuy = fill.side === 'B';
      
      // Determine transaction type
      let type = TransactionType.TRADE;
      
      // Create transaction
      const transaction: Transaction = {
        id: uuidv4(),
        walletId,
        hash: fill.hash,
        blockNumber: 0, // Not available in HyperLiquid API
        timestamp: new Date(fill.time),
        from: isBuy ? 'market' : address,
        to: isBuy ? address : 'market',
        value: fill.sz,
        asset: fill.coin,
        type,
        status: TransactionStatus.CONFIRMED,
        fee: fill.fee,
        metadata: {
          crossed: fill.crossed,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return transaction;
    });
  }

  /**
   * Get transaction by hash
   * @param hash The transaction hash
   * @returns The transaction or null if not found
   */
  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    // This would typically query the database
    // For now, we'll return null as we haven't implemented database storage yet
    return null;
  }

  /**
   * Get transactions for a wallet
   * @param walletId The wallet ID
   * @param page Page number
   * @param limit Number of items per page
   * @returns List of transactions and pagination info
   */
  async getTransactionsForWallet(
    walletId: string,
    page = 1,
    limit = 20
  ): Promise<{ transactions: Transaction[]; total: number }> {
    // This would typically query the database
    // For now, we'll return an empty array as we haven't implemented database storage yet
    return {
      transactions: [],
      total: 0,
    };
  }
}

// Export a singleton instance
export default new TransactionService(); 