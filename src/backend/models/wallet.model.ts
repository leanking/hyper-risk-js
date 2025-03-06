import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase';
import { DB_TABLES } from '../config';
import { Wallet } from '../../shared/types';
import { isValidEthereumAddress } from '../../shared/utils';
import { AppError } from '../middleware/error-handler.middleware';

/**
 * Wallet Model
 * Handles database operations for wallet entities
 */
class WalletModel {
  /**
   * Create a new wallet
   * @param address Ethereum address of the wallet
   * @param name Optional name for the wallet
   * @returns The created wallet
   */
  async create(address: string, name?: string): Promise<Wallet> {
    // Validate address
    if (!isValidEthereumAddress(address)) {
      throw new AppError('Invalid Ethereum address', 400);
    }

    // Check if wallet already exists
    const { data: existingWallet } = await supabase
      .from(DB_TABLES.wallets)
      .select('*')
      .eq('address', address)
      .single();

    if (existingWallet) {
      throw new AppError('Wallet with this address already exists', 400);
    }

    const now = new Date();
    const wallet: Omit<Wallet, 'id'> & { id?: string } = {
      address,
      name,
      createdAt: now,
      updatedAt: now,
    };

    // Generate UUID if not provided
    wallet.id = uuidv4();

    // Insert wallet into database
    const { data, error } = await supabase
      .from(DB_TABLES.wallets)
      .insert({
        ...wallet,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating wallet:', error);
      throw new AppError('Failed to create wallet', 500);
    }

    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : undefined,
    } as Wallet;
  }

  /**
   * Get a wallet by ID
   * @param id Wallet ID
   * @returns The wallet or null if not found
   */
  async getById(id: string): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from(DB_TABLES.wallets)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        return null;
      }
      console.error('Error fetching wallet by ID:', error);
      throw new AppError('Failed to fetch wallet', 500);
    }

    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : undefined,
    } as Wallet;
  }

  /**
   * Get a wallet by address
   * @param address Ethereum address
   * @returns The wallet or null if not found
   */
  async getByAddress(address: string): Promise<Wallet | null> {
    // Validate address
    if (!isValidEthereumAddress(address)) {
      throw new AppError('Invalid Ethereum address', 400);
    }

    const { data, error } = await supabase
      .from(DB_TABLES.wallets)
      .select('*')
      .eq('address', address)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        return null;
      }
      console.error('Error fetching wallet by address:', error);
      throw new AppError('Failed to fetch wallet', 500);
    }

    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : undefined,
    } as Wallet;
  }

  /**
   * Get all wallets
   * @param page Page number
   * @param limit Number of items per page
   * @returns List of wallets and pagination info
   */
  async getAll(page = 1, limit = 20): Promise<{ wallets: Wallet[]; total: number }> {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from(DB_TABLES.wallets)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting wallets:', countError);
      throw new AppError('Failed to fetch wallets', 500);
    }

    // Get wallets with pagination
    const { data, error } = await supabase
      .from(DB_TABLES.wallets)
      .select('*')
      .range(offset, offset + limit - 1)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching wallets:', error);
      throw new AppError('Failed to fetch wallets', 500);
    }

    const wallets = data.map(wallet => ({
      ...wallet,
      createdAt: new Date(wallet.createdAt),
      updatedAt: new Date(wallet.updatedAt),
      lastSyncedAt: wallet.lastSyncedAt ? new Date(wallet.lastSyncedAt) : undefined,
    })) as Wallet[];

    return {
      wallets,
      total: count || 0,
    };
  }

  /**
   * Update a wallet
   * @param id Wallet ID
   * @param updates Updates to apply
   * @returns The updated wallet
   */
  async update(id: string, updates: Partial<Wallet>): Promise<Wallet> {
    // Get existing wallet
    const existingWallet = await this.getById(id);
    if (!existingWallet) {
      throw new AppError('Wallet not found', 404);
    }

    // Prevent updating certain fields
    const { id: _, createdAt, address, ...allowedUpdates } = updates;

    // Add updated timestamp
    const now = new Date();
    const updatedWallet = {
      ...allowedUpdates,
      updatedAt: now.toISOString(),
    };

    // Update wallet in database
    const { data, error } = await supabase
      .from(DB_TABLES.wallets)
      .update(updatedWallet)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating wallet:', error);
      throw new AppError('Failed to update wallet', 500);
    }

    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : undefined,
    } as Wallet;
  }

  /**
   * Delete a wallet
   * @param id Wallet ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    // Get existing wallet
    const existingWallet = await this.getById(id);
    if (!existingWallet) {
      return false;
    }

    // Delete wallet from database
    const { error } = await supabase
      .from(DB_TABLES.wallets)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting wallet:', error);
      throw new AppError('Failed to delete wallet', 500);
    }

    return true;
  }

  /**
   * Update last synced timestamp
   * @param id Wallet ID
   * @returns The updated wallet
   */
  async updateLastSynced(id: string): Promise<Wallet> {
    const now = new Date();
    return this.update(id, { lastSyncedAt: now });
  }
}

// Export a singleton instance
export default new WalletModel(); 