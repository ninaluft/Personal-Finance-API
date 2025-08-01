import { Router } from 'express';
import { getTransactions, createTransaction, getBalance } from '../controllers/transactionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getTransactions);
router.post('/', authenticateToken, createTransaction);
router.get('/balance', authenticateToken, getBalance);

export default router;