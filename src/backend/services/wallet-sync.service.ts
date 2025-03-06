import WalletModel from '../models/wallet.model';
import TransactionService from './transaction.service';
import PositionService from './position.service';
import RiskMetricsService from './risk-metrics.service';
import { AppError } from '../middleware/error-handler.middleware';

/**
 * Wallet Sync Service
 * Coordinates the synchronization of wallet data
 */
class WalletSyncService {
  /**
   * Sync a wallet
   * @param walletId The wallet ID
   * @returns The synced wallet
   */
  async syncWallet(walletId: string) {
    try {
      // Get the wallet
      const wallet = await WalletModel.getById(walletId);
      if (!wallet) {
        throw new AppError('Wallet not found', 404);
      }

      // Fetch transactions
      const transactions = await TransactionService.fetchTransactions(walletId, wallet.address);
      
      // Detect positions
      const positions = await PositionService.detectPositions(walletId, transactions);
      
      // Update current prices for open positions
      const updatedPositions = await PositionService.updateCurrentPrices(positions);
      
      // Calculate risk metrics
      const riskMetrics = RiskMetricsService.calculateRiskMetrics(walletId, updatedPositions, transactions);
      
      // Update last synced timestamp
      const updatedWallet = await WalletModel.updateLastSynced(walletId);
      
      // Return the synced data
      return {
        wallet: updatedWallet,
        transactions,
        positions: updatedPositions,
        riskMetrics,
      };
    } catch (error) {
      console.error(`Error syncing wallet ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Sync all wallets
   * @returns The number of synced wallets
   */
  async syncAllWallets() {
    try {
      // Get all wallets
      const { wallets } = await WalletModel.getAll(1, 1000);
      
      // Sync each wallet
      const syncPromises = wallets.map(wallet => this.syncWallet(wallet.id));
      const results = await Promise.allSettled(syncPromises);
      
      // Count successful syncs
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      
      return {
        total: wallets.length,
        success: successCount,
        failed: wallets.length - successCount,
      };
    } catch (error) {
      console.error('Error syncing all wallets:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new WalletSyncService(); 