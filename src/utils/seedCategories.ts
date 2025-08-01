import { prisma } from '../lib/prisma';

export const seedCategories = async () => {
  const existingCategories = await prisma.category.count();
  
  if (existingCategories === 0) {
    await prisma.category.createMany({
      data: [
        // Despesas
        { name: 'Alimentação', type: 'expense', color: '#FF6B6B', icon: '🍔' },
        { name: 'Transporte', type: 'expense', color: '#4ECDC4', icon: '🚗' },
        { name: 'Moradia', type: 'expense', color: '#45B7D1', icon: '🏠' },
        { name: 'Entretenimento', type: 'expense', color: '#96CEB4', icon: '🎬' },
        { name: 'Saúde', type: 'expense', color: '#FFEAA7', icon: '🏥' },
        
        // Receitas
        { name: 'Salário', type: 'income', color: '#00B894', icon: '💰' },
        { name: 'Freelance', type: 'income', color: '#6C5CE7', icon: '💻' },
        { name: 'Investimentos', type: 'income', color: '#A29BFE', icon: '📈' },
      ]
    });
    console.log('✅ Categorias criadas!');
  }
};