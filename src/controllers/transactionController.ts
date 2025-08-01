import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

interface AuthRequest extends Request {
  userId?: number;
}

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      include: {
        category: true
      },
      orderBy: { date: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description, categoryId, date } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        categoryId: parseInt(categoryId),
        userId: req.userId!,
        date: new Date(date)
      },
      include: {
        category: true
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};



export const getBalance = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      include: { category: true }
    });

    let income = 0;
    let expense = 0;

    for (const transaction of transactions) {
      if (transaction.category) {
        if (transaction.category.type === 'income') {
          income += transaction.amount;
        } else if (transaction.category.type === 'expense') {
          expense += transaction.amount;
        }
      }
    }

    const balance = income - expense;

    res.json({ 
      income: Number(income.toFixed(2)), 
      expense: Number(expense.toFixed(2)), 
      balance: Number(balance.toFixed(2)) 
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};