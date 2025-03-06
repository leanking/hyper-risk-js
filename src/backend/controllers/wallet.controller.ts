import { Request, Response, NextFunction } from 'express';
import WalletModel from '../models/wallet.model';
import { AppError } from '../middleware/error-handler.middleware';
import { PAGINATION } from '../config';
import { generatePagination } from '@shared/utils';

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
} 