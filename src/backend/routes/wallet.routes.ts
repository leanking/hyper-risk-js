import { Router } from 'express';
import WalletController from '../controllers/wallet.controller';

const router = Router();

/**
 * @route GET /api/wallets
 * @desc Get all wallets with pagination
 */
router.get('/', WalletController.getAll);

/**
 * @route GET /api/wallets/:id
 * @desc Get a wallet by ID
 */
router.get('/:id', WalletController.getById);

/**
 * @route GET /api/wallets/address/:address
 * @desc Get a wallet by address
 */
router.get('/address/:address', WalletController.getByAddress);

/**
 * @route POST /api/wallets
 * @desc Create a new wallet
 */
router.post('/', WalletController.create);

/**
 * @route PUT /api/wallets/:id
 * @desc Update a wallet
 */
router.put('/:id', WalletController.update);

/**
 * @route DELETE /api/wallets/:id
 * @desc Delete a wallet
 */
router.delete('/:id', WalletController.delete);

/**
 * @route POST /api/wallets/:id/sync
 * @desc Sync a wallet with HyperLiquid API
 */
router.post('/:id/sync', WalletController.sync);

/**
 * @route POST /api/wallets/analyze
 * @desc Analyze a wallet by address (positions, risk metrics, PNL)
 */
router.post('/analyze', WalletController.analyze);

export default router; 