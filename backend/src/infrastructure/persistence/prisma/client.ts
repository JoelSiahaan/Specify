// infrastructure/persistence/prisma/client.ts
// Prisma Client singleton instance for database access with retry logic

import { PrismaClient } from '@prisma/client';
import { logger } from '../../logging/logger';

/**
 * Database connection retry configuration
 * Requirements: 21.1 - Database connection retry logic
 */
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param attempt - Current retry attempt (0-indexed)
 * @returns Delay in milliseconds
 */
function getRetryDelay(attempt: number): number {
  return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
}

/**
 * Connect to database with retry logic
 * Implements exponential backoff: 1s, 2s, 4s
 */
async function connectWithRetry(client: PrismaClient): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.info('Attempting database connection', {
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES
      });

      await client.$connect();
      
      logger.info('Database connection successful', {
        attempt: attempt + 1
      });
      
      return; // Connection successful
    } catch (error) {
      lastError = error as Error;
      
      logger.warn('Database connection failed', {
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES,
        error: lastError.message
      });

      // If this was the last attempt, don't wait
      if (attempt < MAX_RETRIES - 1) {
        const delay = getRetryDelay(attempt);
        logger.info('Retrying database connection', {
          nextAttempt: attempt + 2,
          delayMs: delay
        });
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  logger.error('Database connection failed after all retries', {
    maxRetries: MAX_RETRIES,
    error: lastError?.message,
    stack: lastError?.stack
  });

  throw new Error(
    `Failed to connect to database after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

// Create Prisma Client instance with logging configuration
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
});

// Initialize connection with retry logic
let connectionPromise: Promise<void> | null = null;

/**
 * Get database connection with retry logic
 * Ensures connection is established before returning client
 */
export async function getPrismaClient(): Promise<PrismaClient> {
  if (!connectionPromise) {
    connectionPromise = connectWithRetry(prisma);
  }
  
  await connectionPromise;
  return prisma;
}

// Graceful shutdown handler
async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error disconnecting from database', {
      error: (error as Error).message
    });
  }
}

// Register shutdown handlers
process.on('beforeExit', disconnectPrisma);
process.on('SIGINT', disconnectPrisma);
process.on('SIGTERM', disconnectPrisma);

// Export both the client and the connection function
export { prisma, connectWithRetry };
