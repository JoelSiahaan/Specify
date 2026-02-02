/**
 * Logging Middleware Tests
 * 
 * Tests request/response logging and error logging middleware.
 * Requirements: 21.2, 21.3 - Logging with context
 */

import { Request, Response, NextFunction } from 'express';
import { requestLogger, errorLogger } from '../LoggingMiddleware';
import { logger } from '../../../../infrastructure/logging/logger';

// Mock logger
jest.mock('../../../../infrastructure/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('LoggingMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      method: 'GET',
      path: '/api/courses',
      query: {},
      body: {},
      ip: '127.0.0.1',
      get: jest.fn((header: string) => {
        if (header === 'user-agent') return 'Jest Test Agent';
        return undefined;
      })
    };

    mockResponse = {
      statusCode: 200,
      send: jest.fn().mockReturnThis()
    };

    nextFunction = jest.fn();
  });

  describe('requestLogger', () => {
    it('should log incoming GET request', () => {
      requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.info).toHaveBeenCalledWith('HTTP Request', {
        method: 'GET',
        path: '/api/courses',
        query: {},
        userId: undefined,
        ip: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      });

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should log request with authenticated user', () => {
      mockRequest.user = { userId: 'user-123', email: 'test@example.com', role: 'STUDENT' };

      requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.info).toHaveBeenCalledWith('HTTP Request', {
        method: 'GET',
        path: '/api/courses',
        query: {},
        userId: 'user-123',
        ip: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      });
    });

    it('should log POST request body (sanitized)', () => {
      mockRequest.method = 'POST';
      mockRequest.body = {
        name: 'Test Course',
        description: 'Test Description'
      };

      requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.debug).toHaveBeenCalledWith('Request body', {
        method: 'POST',
        path: '/api/courses',
        body: {
          name: 'Test Course',
          description: 'Test Description'
        },
        userId: undefined
      });
    });

    it('should sanitize sensitive data in request body', () => {
      mockRequest.method = 'POST';
      mockRequest.path = '/api/auth/login';
      mockRequest.body = {
        email: 'test@example.com',
        password: 'secret123'
      };

      requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.debug).toHaveBeenCalledWith('Request body', {
        method: 'POST',
        path: '/api/auth/login',
        body: {
          email: 'test@example.com',
          password: '[REDACTED]'
        },
        userId: undefined
      });
    });

    it('should log response with duration', () => {
      const originalSend = mockResponse.send;
      
      requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

      // Simulate response
      mockResponse.send!({ data: 'test' });

      expect(logger.info).toHaveBeenCalledWith('HTTP Response', {
        method: 'GET',
        path: '/api/courses',
        statusCode: 200,
        duration: expect.stringMatching(/\d+ms/),
        userId: undefined
      });
    });

    it('should log error response (4xx)', () => {
      mockResponse.statusCode = 400;

      requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

      // Simulate error response
      const errorBody = { code: 'VALIDATION_FAILED', message: 'Invalid input' };
      mockResponse.send!(JSON.stringify(errorBody));

      expect(logger.warn).toHaveBeenCalledWith('Error response', {
        method: 'GET',
        path: '/api/courses',
        statusCode: 400,
        body: errorBody,
        userId: undefined
      });
    });

    it('should log server error response (5xx)', () => {
      mockResponse.statusCode = 500;

      requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

      // Simulate error response
      const errorBody = { code: 'INTERNAL_ERROR', message: 'Server error' };
      mockResponse.send!(JSON.stringify(errorBody));

      expect(logger.warn).toHaveBeenCalledWith('Error response', {
        method: 'GET',
        path: '/api/courses',
        statusCode: 500,
        body: errorBody,
        userId: undefined
      });
    });
  });

  describe('errorLogger', () => {
    it('should log error with full context', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorLogger(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.error).toHaveBeenCalledWith('Request error', {
        error: 'Test error',
        stack: 'Error stack trace',
        name: 'Error',
        method: 'GET',
        path: '/api/courses',
        query: {},
        body: {},
        userId: undefined,
        ip: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      });

      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('should log error with authenticated user context', () => {
      mockRequest.user = { userId: 'user-123', email: 'test@example.com', role: 'TEACHER' };
      const error = new Error('Unauthorized');

      errorLogger(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.error).toHaveBeenCalledWith('Request error', {
        error: 'Unauthorized',
        stack: expect.any(String),
        name: 'Error',
        method: 'GET',
        path: '/api/courses',
        query: {},
        body: {},
        userId: 'user-123',
        ip: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      });
    });

    it('should sanitize sensitive data in error logs', () => {
      mockRequest.method = 'POST';
      mockRequest.body = {
        email: 'test@example.com',
        password: 'secret123',
        token: 'jwt-token'
      };

      const error = new Error('Authentication failed');

      errorLogger(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.error).toHaveBeenCalledWith('Request error', {
        error: 'Authentication failed',
        stack: expect.any(String),
        name: 'Error',
        method: 'POST',
        path: '/api/courses',
        query: {},
        body: {
          email: 'test@example.com',
          password: '[REDACTED]',
          token: '[REDACTED]'
        },
        userId: undefined,
        ip: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      });
    });

    it('should pass error to next middleware', () => {
      const error = new Error('Test error');

      errorLogger(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });

  describe('Sensitive data sanitization', () => {
    it('should redact all sensitive fields', () => {
      mockRequest.method = 'POST';
      mockRequest.body = {
        email: 'test@example.com',
        password: 'secret123',
        token: 'jwt-token',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        secret: 'api-secret',
        normalField: 'normal-value'
      };

      requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.debug).toHaveBeenCalledWith('Request body', {
        method: 'POST',
        path: '/api/courses',
        body: {
          email: 'test@example.com',
          password: '[REDACTED]',
          token: '[REDACTED]',
          accessToken: '[REDACTED]',
          refreshToken: '[REDACTED]',
          secret: '[REDACTED]',
          normalField: 'normal-value'
        },
        userId: undefined
      });
    });
  });
});
