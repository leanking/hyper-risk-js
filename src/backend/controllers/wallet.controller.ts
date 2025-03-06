import { Request, Response, NextFunction } from 'express';
import WalletModel from '../models/wallet.model';
import { AppError } from '../middleware/error-handler.middleware';
import { PAGINATION } from '../config';
import { generatePagination } from '../../shared/utils';
import { v4 as uuidv4 } from 'uuid';
import PositionService from '../services/position.service';
import RiskMetricsService from '../services/risk-metrics.service';
import TransactionService from '../services/transaction.service';
import hyperLiquidApi from '../services/hyperliquid-api.service';
import { Position } from '../../shared/types';

/**
 * Wallet Controller
 * Handles API requests for wallet operations
 */
export default class WalletController {
  /**
   * Create a new wallet
   * @route POST /api/wallets
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address, name } = req.body;

      if (!address) {
        throw new AppError('Wallet address is required', 400);
      }

      const wallet = await WalletModel.create(address, name);

      res.status(201).json({
        success: true,
        data: wallet,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a wallet by ID
   * @route GET /api/wallets/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const wallet = await WalletModel.getById(id);

      if (!wallet) {
        throw new AppError('Wallet not found', 404);
      }

      res.status(200).json({
        success: true,
        data: wallet,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a wallet by address
   * @route GET /api/wallets/address/:address
   */
  static async getByAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const wallet = await WalletModel.getByAddress(address);

      if (!wallet) {
        throw new AppError('Wallet not found', 404);
      }

      res.status(200).json({
        success: true,
        data: wallet,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all wallets with pagination
   * @route GET /api/wallets
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || PAGINATION.defaultPage;
      const limit = parseInt(req.query.limit as string) || PAGINATION.defaultLimit;

      // Validate pagination parameters
      if (page < 1) {
        throw new AppError('Page must be greater than 0', 400);
      }

      if (limit < 1 || limit > PAGINATION.maxLimit) {
        throw new AppError(`Limit must be between 1 and ${PAGINATION.maxLimit}`, 400);
      }

      const { wallets, total } = await WalletModel.getAll(page, limit);

      res.status(200).json({
        success: true,
        data: wallets,
        pagination: generatePagination(total, page, limit),
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a wallet
   * @route PUT /api/wallets/:id
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const wallet = await WalletModel.update(id, updates);

      res.status(200).json({
        success: true,
        data: wallet,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a wallet
   * @route DELETE /api/wallets/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await WalletModel.delete(id);

      if (!deleted) {
        throw new AppError('Wallet not found', 404);
      }

      res.status(200).json({
        success: true,
        data: { message: 'Wallet deleted successfully' },
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync a wallet
   * @route POST /api/wallets/:id/sync
   */
  static async sync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get the wallet
      const wallet = await WalletModel.getById(id);
      if (!wallet) {
        throw new AppError('Wallet not found', 404);
      }

      // TODO: Implement wallet synchronization with HyperLiquid API
      // This will be implemented in a later phase

      // Update last synced timestamp
      const updatedWallet = await WalletModel.updateLastSynced(id);

      res.status(200).json({
        success: true,
        data: updatedWallet,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze a wallet by address
   * @route POST /api/wallets/analyze
   */
  static async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.body;

      if (!address) {
        throw new AppError('Wallet address is required', 400);
      }

      // For demo purposes, generate mock data
      const walletId = uuidv4();
      
      // Mock positions
      const positions = [
        {
          id: uuidv4(),
          walletId,
          asset: 'BTC',
          entryPrice: '30000',
          currentPrice: '31500',
          quantity: '0.5',
          side: 'long',
          status: 'open',
          openedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          unrealizedPnl: '750',
          realizedPnl: '0',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          walletId,
          asset: 'ETH',
          entryPrice: '2000',
          currentPrice: '1900',
          quantity: '5',
          side: 'long',
          status: 'open',
          openedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          unrealizedPnl: '-500',
          realizedPnl: '0',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          walletId,
          asset: 'SOL',
          entryPrice: '100',
          currentPrice: '120',
          quantity: '20',
          side: 'long',
          status: 'open',
          openedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          unrealizedPnl: '400',
          realizedPnl: '0',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Mock risk metrics
      const riskMetrics = {
        id: uuidv4(),
        walletId,
        volatility: '15.5',
        drawdown: '8.2',
        valueAtRisk: '1200',
        sharpeRatio: '1.8',
        sortinoRatio: '2.1',
        concentration: '65',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock PNL records
      const pnlRecords = positions.map(position => {
        return [
          // Unrealized PNL
          {
            id: `${position.id}-unrealized`,
            walletId,
            positionId: position.id,
            asset: position.asset,
            amount: position.unrealizedPnl,
            type: 'unrealized',
            timestamp: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          // Realized PNL if available
          ...(position.realizedPnl && position.realizedPnl !== '0' ? [{
            id: `${position.id}-realized`,
            walletId,
            positionId: position.id,
            asset: position.asset,
            amount: position.realizedPnl,
            type: 'realized',
            timestamp: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }] : [])
        ];
      }).flat();

      res.status(200).json({
        success: true,
        data: {
          positions,
          riskMetrics,
          pnl: pnlRecords,
          userState: {
            address,
            totalValue: '35000',
            marginUsage: '45%'
          }
        },
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }
} 