import { Request, Response } from 'express';
import { ApiResponse } from '@shared/types';
import hyperLiquidApi from '../services/hyperliquid-api.service';
import { isValidEthereumAddress } from '@shared/utils';

/**
 * PNL Controller
 * Handles PNL-related API endpoints
 */
class PnlController {
  /**
   * Get historical PNL data for a wallet
   * @param req Express request
   * @param res Express response
   */
  static async getHistoricalPnl(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const { startTime, endTime } = req.query;
      
      // Validate address
      if (!address || !isValidEthereumAddress(address)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid Ethereum address',
          timestamp: new Date(),
        };
        return res.status(400).json(response);
      }
      
      // Parse time parameters
      const parsedStartTime = startTime ? parseInt(startTime as string, 10) : undefined;
      const parsedEndTime = endTime ? parseInt(endTime as string, 10) : undefined;
      
      // Get historical PNL data
      const pnlData = await hyperLiquidApi.getHistoricalPnl(
        address,
        parsedStartTime,
        parsedEndTime
      );
      
      // Calculate total realized PNL across all assets
      let totalRealizedPnl = 0;
      for (const asset of Object.values(pnlData)) {
        totalRealizedPnl += asset.totalRealizedPnl;
      }
      
      // Prepare response
      const response: ApiResponse<{
        byAsset: typeof pnlData;
        totalRealizedPnl: number;
      }> = {
        success: true,
        data: {
          byAsset: pnlData,
          totalRealizedPnl,
        },
        timestamp: new Date(),
      };
      
      return res.status(200).json(response);
    } catch (error) {
      console.error('Error getting historical PNL:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to get historical PNL data',
        timestamp: new Date(),
      };
      
      return res.status(500).json(response);
    }
  }
}

export default PnlController; 