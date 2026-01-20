// infrastructure/persistence/prisma/client.ts
// Prisma Client singleton instance for database access

import { PrismaClient } from '@prisma/client';

// Create Prisma Client instance with logging configuration
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
});

// Graceful shutdown handler
async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Register shutdown handlers
process.on('beforeExit', disconnectPrisma);
process.on('SIGINT', disconnectPrisma);
process.on('SIGTERM', disconnectPrisma);

export { prisma };
