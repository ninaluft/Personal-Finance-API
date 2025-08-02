import { Router } from 'express';
import { getTransactions, createTransaction, getBalance, updateTransaction, deleteTransaction } from '../controllers/transactionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getTransactions);
router.post('/', authenticateToken, createTransaction);
router.put('/:id', authenticateToken, updateTransaction);     
router.delete('/:id', authenticateToken, deleteTransaction); 
router.get('/balance', authenticateToken, getBalance);

export default router;