// test-models.js
const { PrismaClient } = require('@prisma/client');

console.log('Testando Prisma Client...');

try {
  const prisma = new PrismaClient();
  
  console.log('Modelos disponíveis no Prisma:');
  const models = Object.keys(prisma).filter(key => 
    !key.startsWith('_') && 
    !key.startsWith('$') && 
    typeof prisma[key] === 'object'
  );
  
  console.log(models);
  
  // Verificar especificamente o recurringTransaction
  if (prisma.recurringTransaction) {
    console.log('✅ recurringTransaction encontrado!');
    console.log('Métodos disponíveis:', Object.getOwnPropertyNames(prisma.recurringTransaction));
  } else {
    console.log('❌ recurringTransaction NÃO encontrado!');
  }
  
  prisma.$disconnect();
} catch (error) {
  console.error('Erro ao testar Prisma:', error);
}