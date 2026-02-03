// infrastructure/persistence/prisma/client.ts
// Prisma Client singleton instance for database access with retry logic

import { PrismaClient } from '@prisma/client';
import { logger } from '../../logging/logger.js';

/**
 * Database connection retry configuration
 * Requirements: 21.1 - Database connection retry logic
 */
const MAX_RETRIES = 5; // Increased from 3 to 5 for production stability
const INITIAL_RETRY_DELAY = 2000; // Increased from 1s to 2s
const MAX_RETRY_DELAY = 10000; // Maximum 10 seconds between retries

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with max cap
 * @param attempt - Current retry attempt (0-indexed)
 * @returns Delay in milliseconds
 */
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * Check if database is reachable
 */
async function isDatabaseReachable(client: PrismaClient): Promise<boolean> {
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Connect to database with retry logic
 * Implements exponential backoff with max cap: 2s, 4s, 8s, 10s, 10s
 */
async function connectWithRetry(client: PrismaClient): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.info('Attempting database connection', {
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES,
        environment: process.env.NODE_ENV
      });

      // First, try to connect
      await client.$connect();
      
      // Then verify connection is actually working
      const isReachable = await isDatabaseReachable(client);
      
      if (!isReachable) {
        throw new Error('Database connected but not reachable');
      }
      
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

      // Disconnect before retry to clean up
      try {
        await client.$disconnect();
      } catch (disconnectError) {
        logger.debug('Error during disconnect before retry', {
          error: (disconnectError as Error).message
        });
      }

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
let prisma: PrismaClient | null = null;
let connectionPromise: Promise<void> | null = null;
let isConnected = false;

/**
 * Initialize Prisma Client
 */
function initializePrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    });
  }
  return prisma;
}

/**
 * Get database connection with retry logic
 * Ensures connection is established before returning client
 * Handles reconnection on restart
 */
export async function getPrismaClient(): Promise<PrismaClient> {
  const client = initializePrismaClient();
  
  // If already connected, verify connection is still alive
  if (isConnected) {
    try {
      await client.$queryRaw`SELECT 1`;
      return client;
    } catch (error) {
      logger.warn('Existing connection lost, reconnecting...', {
        error: (error as Error).message
      });
      isConnected = false;
      connectionPromise = null;
    }
  }
  
  // If not connected or connection lost, establish new connection
  if (!connectionPromise) {
    connectionPromise = connectWithRetry(client).then(() => {
      isConnected = true;
    });
  }
  
  await connectionPromise;
  return client;
}

/**
 * Reset connection state (useful for testing or manual reconnection)
 */
export function resetConnection(): void {
  isConnected = false;
  connectionPromise = null;
}

// Graceful shutdown handler
async function disconnectPrisma() {
  if (!prisma) return;
  
  try {
    await prisma.$disconnect();
    isConnected = false;
    connectionPromise = null;
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

// Export singleton instance for direct use (with lazy initialization)
export { prisma, connectWithRetry };
