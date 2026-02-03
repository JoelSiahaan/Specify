/**
 * Database Connection Retry Logic Tests
 * 
 * Tests the database connection retry mechanism with exponential backoff.
 * Requirements: 21.1 - Database connection retry logic
 */

import { PrismaClient } from '@prisma/client';
import { connectWithRetry } from '../client.js';
import { logger } from '../../../logging/logger.js';

// Mock logger to prevent console output during tests
jest.mock('../../../logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('Database Connection Retry Logic', () => {
  let mockPrismaClient: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock Prisma client
    mockPrismaClient = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $queryRaw: jest.fn()
    } as unknown as jest.Mocked<PrismaClient>;
  });

  describe('connectWithRetry', () => {
    it('should connect successfully on first attempt', async () => {
      mockPrismaClient.$connect.mockResolvedValueOnce(undefined);
      (mockPrismaClient as any).$queryRaw = jest.fn().mockResolvedValueOnce([{ '?column?': 1 }]);

      await connectWithRetry(mockPrismaClient);

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Attempting database connection', {
        attempt: 1,
        maxRetries: 5,
        environment: process.env.NODE_ENV
      });
      expect(logger.info).toHaveBeenCalledWith('Database connection successful', {
        attempt: 1
      });
    });

    it('should retry on connection failure and succeed on second attempt', async () => {
      mockPrismaClient.$connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);
      (mockPrismaClient as any).$queryRaw = jest.fn().mockResolvedValueOnce([{ '?column?': 1 }]);
      (mockPrismaClient as any).$disconnect = jest.fn().mockResolvedValue(undefined);

      await connectWithRetry(mockPrismaClient);

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith('Database connection failed', {
        attempt: 1,
        maxRetries: 5,
        error: 'Connection failed'
      });
      expect(logger.info).toHaveBeenCalledWith('Retrying database connection', {
        nextAttempt: 2,
        delayMs: 2000
      });
      expect(logger.info).toHaveBeenCalledWith('Database connection successful', {
        attempt: 2
      });
    });

    it('should retry on connection failure and succeed on third attempt', async () => {
      mockPrismaClient.$connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);
      (mockPrismaClient as any).$queryRaw = jest.fn().mockResolvedValueOnce([{ '?column?': 1 }]);
      (mockPrismaClient as any).$disconnect = jest.fn().mockResolvedValue(undefined);

      await connectWithRetry(mockPrismaClient);

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith('Retrying database connection', {
        nextAttempt: 2,
        delayMs: 2000
      });
      expect(logger.info).toHaveBeenCalledWith('Retrying database connection', {
        nextAttempt: 3,
        delayMs: 4000
      });
      expect(logger.info).toHaveBeenCalledWith('Database connection successful', {
        attempt: 3
      });
    });

    it('should throw error after 5 failed attempts', async () => {
      const connectionError = new Error('Connection refused');
      mockPrismaClient.$connect.mockRejectedValue(connectionError);
      (mockPrismaClient as any).$disconnect = jest.fn().mockResolvedValue(undefined);

      await expect(connectWithRetry(mockPrismaClient)).rejects.toThrow(
        'Failed to connect to database after 5 attempts: Connection refused'
      );

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(5);
      expect(logger.warn).toHaveBeenCalledTimes(5);
      expect(logger.error).toHaveBeenCalledWith('Database connection failed after all retries', {
        maxRetries: 5,
        error: 'Connection refused',
        stack: expect.any(String)
      });
    });

    it('should use exponential backoff delays (2s, 4s, 8s)', async () => {
      const startTime = Date.now();
      mockPrismaClient.$connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);
      (mockPrismaClient as any).$queryRaw = jest.fn().mockResolvedValueOnce([{ '?column?': 1 }]);
      (mockPrismaClient as any).$disconnect = jest.fn().mockResolvedValue(undefined);

      await connectWithRetry(mockPrismaClient);

      const endTime = Date.now();
      const totalDelay = endTime - startTime;

      // Total delay should be approximately 2000ms + 4000ms = 6000ms
      // Allow some tolerance for test execution time
      expect(totalDelay).toBeGreaterThanOrEqual(5900);
      expect(totalDelay).toBeLessThan(6500);

      expect(logger.info).toHaveBeenCalledWith('Retrying database connection', {
        nextAttempt: 2,
        delayMs: 2000
      });
      expect(logger.info).toHaveBeenCalledWith('Retrying database connection', {
        nextAttempt: 3,
        delayMs: 4000
      });
    });

    it('should log all connection attempts', async () => {
      mockPrismaClient.$connect
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockRejectedValueOnce(new Error('Attempt 3 failed'))
        .mockRejectedValueOnce(new Error('Attempt 4 failed'))
        .mockRejectedValueOnce(new Error('Attempt 5 failed'));
      (mockPrismaClient as any).$disconnect = jest.fn().mockResolvedValue(undefined);

      await expect(connectWithRetry(mockPrismaClient)).rejects.toThrow();

      // Verify all attempts were logged
      expect(logger.info).toHaveBeenCalledWith('Attempting database connection', {
        attempt: 1,
        maxRetries: 5,
        environment: process.env.NODE_ENV
      });
      expect(logger.info).toHaveBeenCalledWith('Attempting database connection', {
        attempt: 2,
        maxRetries: 5,
        environment: process.env.NODE_ENV
      });
      expect(logger.info).toHaveBeenCalledWith('Attempting database connection', {
        attempt: 3,
        maxRetries: 5,
        environment: process.env.NODE_ENV
      });
      expect(logger.info).toHaveBeenCalledWith('Attempting database connection', {
        attempt: 4,
        maxRetries: 5,
        environment: process.env.NODE_ENV
      });
      expect(logger.info).toHaveBeenCalledWith('Attempting database connection', {
        attempt: 5,
        maxRetries: 5,
        environment: process.env.NODE_ENV
      });

      // Verify all failures were logged
      expect(logger.warn).toHaveBeenCalledWith('Database connection failed', {
        attempt: 1,
        maxRetries: 5,
        error: 'Attempt 1 failed'
      });
      expect(logger.warn).toHaveBeenCalledWith('Database connection failed', {
        attempt: 2,
        maxRetries: 5,
        error: 'Attempt 2 failed'
      });
      expect(logger.warn).toHaveBeenCalledWith('Database connection failed', {
        attempt: 3,
        maxRetries: 5,
        error: 'Attempt 3 failed'
      });
      expect(logger.warn).toHaveBeenCalledWith('Database connection failed', {
        attempt: 4,
        maxRetries: 5,
        error: 'Attempt 4 failed'
      });
      expect(logger.warn).toHaveBeenCalledWith('Database connection failed', {
        attempt: 5,
        maxRetries: 5,
        error: 'Attempt 5 failed'
      });
    });
  });
});
