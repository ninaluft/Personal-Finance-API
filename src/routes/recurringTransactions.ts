import { Router } from 'express';
import { 
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransaction,
  generateTransaction,
  getDueRecurringTransactions,
  generateAllDueTransactions
} from '../controllers/recurringTransactionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/recurring - Listar todas as transações recorrentes do usuário
router.get('/', authenticateToken, getRecurringTransactions);

// GET /api/recurring/due - Buscar transações recorrentes vencidas ou próximas
router.get('/due', authenticateToken, getDueRecurringTransactions);

// POST /api/recurring - Criar nova transação recorrente
router.post('/', authenticateToken, createRecurringTransaction);

// POST /api/recurring/generate-due - Gerar automaticamente todas as transações vencidas
router.post('/generate-due', authenticateToken, generateAllDueTransactions);

// PUT /api/recurring/:id - Atualizar transação recorrente
router.put('/:id', authenticateToken, updateRecurringTransaction);

// PUT /api/recurring/:id/toggle - Ativar/Desativar transação recorrente
router.put('/:id/toggle', authenticateToken, toggleRecurringTransaction);

// POST /api/recurring/:id/generate - Gerar transação baseada na recorrente
router.post('/:id/generate', authenticateToken, generateTransaction);

// DELETE /api/recurring/:id - Deletar transação recorrente
router.delete('/:id', authenticateToken, deleteRecurringTransaction);

export default router;