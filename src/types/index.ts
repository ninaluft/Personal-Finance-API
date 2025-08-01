export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
}

export interface Transaction {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  description: string;
  date: Date;
  type: 'income' | 'expense';
}