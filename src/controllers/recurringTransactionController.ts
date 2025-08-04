import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

interface AuthRequest extends Request {
  userId?: number;
}

// Função para calcular a próxima data de vencimento
const calculateNextDue = (currentDate: Date, frequency: string): Date => {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Padrão para mensal se não especificado
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
};

// GET /api/recurring - Listar todas as transações recorrentes do usuário
export const getRecurringTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: { userId: req.userId },
      include: {
        category: true
      },
      orderBy: { nextDue: 'asc' }
    });

    res.json(recurringTransactions);
  } catch (error) {
    console.error('Get recurring transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/recurring - Criar nova transação recorrente
export const createRecurringTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { description, amount, categoryId, frequency, startDate } = req.body;

    // Validação básica
    if (!description || !amount || !categoryId || !frequency || !startDate) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Validar frequência
    const validFrequencies = ['weekly', 'monthly', 'yearly'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({ error: 'Frequência deve ser weekly, monthly ou yearly' });
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      return res.status(400).json({ error: 'Categoria não encontrada' });
    }

    // Calcular a primeira data de vencimento
    const startDateObj = new Date(startDate);
    const nextDue = calculateNextDue(startDateObj, frequency);

    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        description,
        amount: parseFloat(amount), // Float funciona perfeitamente com parseFloat
        categoryId: parseInt(categoryId),
        userId: req.userId!,
        frequency,
        startDate: startDateObj,
        nextDue,
        isActive: true
      },
      include: {
        category: true
      }
    });

    res.status(201).json(recurringTransaction);
  } catch (error) {
    console.error('Create recurring transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/recurring/:id - Atualizar transação recorrente
export const updateRecurringTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { description, amount, categoryId, frequency, startDate, isActive } = req.body;

    // Validação básica
    if (!description || !amount || !categoryId || !frequency) {
      return res.status(400).json({ error: 'Campos obrigatórios: description, amount, categoryId, frequency' });
    }

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await prisma.recurringTransaction.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId
      }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transação recorrente não encontrada' });
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      return res.status(400).json({ error: 'Categoria não encontrada' });
    }

    // Se a frequência ou data inicial mudou, recalcular a próxima data
    let nextDue = existingTransaction.nextDue;
    if (frequency !== existingTransaction.frequency || 
        (startDate && new Date(startDate).getTime() !== existingTransaction.startDate.getTime())) {
      const baseDate = startDate ? new Date(startDate) : existingTransaction.startDate;
      nextDue = calculateNextDue(baseDate, frequency);
    }

    const updatedTransaction = await prisma.recurringTransaction.update({
      where: { id: parseInt(id) },
      data: {
        description,
        amount: parseFloat(amount),
        categoryId: parseInt(categoryId),
        frequency,
        startDate: startDate ? new Date(startDate) : existingTransaction.startDate,
        nextDue,
        isActive: isActive !== undefined ? isActive : existingTransaction.isActive
      },
      include: {
        category: true
      }
    });

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update recurring transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/recurring/:id - Deletar transação recorrente
export const deleteRecurringTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await prisma.recurringTransaction.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId
      }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transação recorrente não encontrada' });
    }

    await prisma.recurringTransaction.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Transação recorrente excluída com sucesso' });
  } catch (error) {
    console.error('Delete recurring transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/recurring/:id/toggle - Ativar/Desativar transação recorrente
export const toggleRecurringTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await prisma.recurringTransaction.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId
      }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transação recorrente não encontrada' });
    }

    const updatedTransaction = await prisma.recurringTransaction.update({
      where: { id: parseInt(id) },
      data: {
        isActive: !existingTransaction.isActive
      },
      include: {
        category: true
      }
    });

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Toggle recurring transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/recurring/:id/generate - Gerar transação baseada na recorrente
export const generateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar a transação recorrente
    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId
      },
      include: {
        category: true
      }
    });

    if (!recurringTransaction) {
      return res.status(404).json({ error: 'Transação recorrente não encontrada' });
    }

    if (!recurringTransaction.isActive) {
      return res.status(400).json({ error: 'Não é possível gerar transação de uma recorrência inativa' });
    }

    // Criar a transação regular
    const newTransaction = await prisma.transaction.create({
      data: {
        amount: recurringTransaction.amount,
        description: `${recurringTransaction.description} (Automático)`,
        categoryId: recurringTransaction.categoryId,
        userId: req.userId!,
        date: recurringTransaction.nextDue
      },
      include: {
        category: true
      }
    });

    // Atualizar a transação recorrente com a nova data de vencimento
    const newNextDue = calculateNextDue(recurringTransaction.nextDue, recurringTransaction.frequency);
    
    await prisma.recurringTransaction.update({
      where: { id: parseInt(id) },
      data: {
        nextDue: newNextDue,
        lastGenerated: recurringTransaction.nextDue
      }
    });

    res.status(201).json({
      message: 'Transação gerada com sucesso',
      transaction: newTransaction,
      nextDue: newNextDue
    });
  } catch (error) {
    console.error('Generate transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/recurring/due - Buscar transações recorrentes vencidas ou próximas ao vencimento
export const getDueRecurringTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { days = 7 } = req.query; // Padrão: próximos 7 dias
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days as string));

    const dueTransactions = await prisma.recurringTransaction.findMany({
      where: {
        userId: req.userId,
        isActive: true,
        nextDue: {
          lte: futureDate
        }
      },
      include: {
        category: true
      },
      orderBy: { nextDue: 'asc' }
    });

    res.json(dueTransactions);
  } catch (error) {
    console.error('Get due recurring transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/recurring/generate-due - Gerar automaticamente todas as transações vencidas
export const generateAllDueTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    
    // Buscar todas as transações recorrentes vencidas
    const dueTransactions = await prisma.recurringTransaction.findMany({
      where: {
        userId: req.userId,
        isActive: true,
        nextDue: {
          lte: today
        }
      },
      include: {
        category: true
      }
    });

    if (dueTransactions.length === 0) {
      return res.json({ 
        message: 'Nenhuma transação recorrente vencida encontrada',
        generated: 0 
      });
    }

    let generatedCount = 0;
    
    // Gerar transações em uma transação do banco
    await prisma.$transaction(async (tx) => {
      for (const recurringTx of dueTransactions) {
        // Criar a transação regular
        await tx.transaction.create({
          data: {
            amount: recurringTx.amount,
            description: `${recurringTx.description} (Automático)`,
            categoryId: recurringTx.categoryId,
            userId: req.userId!,
            date: recurringTx.nextDue
          }
        });

        // Atualizar a próxima data de vencimento
        const newNextDue = calculateNextDue(recurringTx.nextDue, recurringTx.frequency);
        
        await tx.recurringTransaction.update({
          where: { id: recurringTx.id },
          data: {
            nextDue: newNextDue,
            lastGenerated: recurringTx.nextDue
          }
        });

        generatedCount++;
      }
    });

    res.json({
      message: `${generatedCount} transação(ões) gerada(s) com sucesso`,
      generated: generatedCount
    });
  } catch (error) {
    console.error('Generate all due transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};