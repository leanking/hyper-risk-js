import { Router } from 'express';
import PnlController from '../controllers/pnl.controller';

const router = Router();

/**
 * @route GET /api/pnl/historical/:address
 * @desc Get historical PNL data for a wallet
 * @access Public
 * @param {string} address - Ethereum address
 * @param {number} [startTime] - Start time in milliseconds
 * @param {number} [endTime] - End time in milliseconds
 * @returns {Object} Historical PNL data
 */
router.get('/historical/:address', PnlController.getHistoricalPnl);

export default router; 