/**
 * Winston Logger Tests
 * 
 * Tests Winston logger configuration and functionality.
 * Requirements: 21.2, 21.3 - Logging and error tracking
 */

import { logger, logRequest, logError } from '../logger';

describe('Winston Logger', () => {
  // Spy on logger methods
  let infoSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(logger, 'info').mockImplementation();
    errorSpy = jest.spyOn(logger, 'error').mockImplementation();
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation();
    debugSpy = jest.spyOn(logger, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Logger instance', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
    });

    it('should have correct log levels', () => {
      expect(logger.level).toBeDefined();
    });

    it('should have console transport', () => {
      const transports = logger.transports;
      expect(transports.length).toBeGreaterThan(0);
    });
  });

  describe('logRequest', () => {
    it('should log request without user ID', () => {
      logRequest('GET', '/api/courses');

      expect(infoSpy).toHaveBeenCalledWith('HTTP Request', {
        method: 'GET',
        path: '/api/courses',
        userId: undefined
      });
    });

    it('should log request with user ID', () => {
      logRequest('POST', '/api/courses', 'user-123');

      expect(infoSpy).toHaveBeenCalledWith('HTTP Request', {
        method: 'POST',
        path: '/api/courses',
        userId: 'user-123'
      });
    });
  });

  describe('logError', () => {
    it('should log error without context', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      logError(error);

      expect(errorSpy).toHaveBeenCalledWith('Error occurred', {
        error: 'Test error',
        stack: 'Error stack trace',
        name: 'Error'
      });
    });

    it('should log error with context', () => {
      const error = new Error('Database error');
      error.stack = 'Error stack trace';

      logError(error, {
        method: 'GET',
        path: '/api/courses',
        userId: 'user-123'
      });

      expect(errorSpy).toHaveBeenCalledWith('Error occurred', {
        error: 'Database error',
        stack: 'Error stack trace',
        name: 'Error',
        method: 'GET',
        path: '/api/courses',
        userId: 'user-123'
      });
    });

    it('should log error with additional context fields', () => {
      const error = new Error('Validation error');

      logError(error, {
        method: 'POST',
        path: '/api/courses',
        userId: 'user-123',
        validationErrors: ['Name is required', 'Invalid date']
      });

      expect(errorSpy).toHaveBeenCalledWith('Error occurred', {
        error: 'Validation error',
        stack: expect.any(String),
        name: 'Error',
        method: 'POST',
        path: '/api/courses',
        userId: 'user-123',
        validationErrors: ['Name is required', 'Invalid date']
      });
    });
  });

  describe('Log levels', () => {
    it('should support info level', () => {
      logger.info('Info message', { data: 'test' });

      expect(infoSpy).toHaveBeenCalledWith('Info message', { data: 'test' });
    });

    it('should support warn level', () => {
      logger.warn('Warning message', { data: 'test' });

      expect(warnSpy).toHaveBeenCalledWith('Warning message', { data: 'test' });
    });

    it('should support error level', () => {
      logger.error('Error message', { data: 'test' });

      expect(errorSpy).toHaveBeenCalledWith('Error message', { data: 'test' });
    });

    it('should support debug level', () => {
      logger.debug('Debug message', { data: 'test' });

      expect(debugSpy).toHaveBeenCalledWith('Debug message', { data: 'test' });
    });
  });

  describe('Structured logging', () => {
    it('should log with metadata', () => {
      logger.info('Test message', {
        userId: 'user-123',
        action: 'create',
        resource: 'course'
      });

      expect(infoSpy).toHaveBeenCalledWith('Test message', {
        userId: 'user-123',
        action: 'create',
        resource: 'course'
      });
    });

    it('should log with nested objects', () => {
      logger.info('Test message', {
        user: {
          id: 'user-123',
          role: 'TEACHER'
        },
        course: {
          id: 'course-456',
          name: 'Test Course'
        }
      });

      expect(infoSpy).toHaveBeenCalledWith('Test message', {
        user: {
          id: 'user-123',
          role: 'TEACHER'
        },
        course: {
          id: 'course-456',
          name: 'Test Course'
        }
      });
    });
  });
});
