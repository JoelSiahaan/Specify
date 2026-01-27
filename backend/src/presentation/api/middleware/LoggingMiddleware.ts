/**
 * Request/Response Logging Middleware
 * 
 * Logs all HTTP requests and responses with structured data.
 * Requirements:
 * - 21.2: Error tracking with context
 * - 21.3: Logging with timestamp and context
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../infrastructure/logging/logger';
import type { AuthenticatedRequest } from './AuthenticationMiddleware';

/**
 * Extract user ID from authenticated request
 */
function getUserId(req: Request): string | undefined {
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.id;
}

/**
 * Sanitize request body to remove sensitive data
 * Never log passwords, tokens, or other sensitive information
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Request logging middleware
 * Logs incoming HTTP requests with method, path, and user context
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const userId = getUserId(req);

  // Log incoming request
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    query: req.query,
    userId,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log request body for POST/PUT/PATCH (sanitized)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    logger.debug('Request body', {
      method: req.method,
      path: req.path,
      body: sanitizeBody(req.body),
      userId
    });
  }

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;

    // Log response
    logger.info('HTTP Response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId
    });

    // Log response body for errors (4xx, 5xx)
    if (res.statusCode >= 400) {
      logger.warn('Error response', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        body: typeof data === 'string' ? JSON.parse(data) : data,
        userId
      });
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Error logging middleware
 * Logs errors with full context for debugging
 * Should be used before error handler middleware
 */
export function errorLogger(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = getUserId(req);

  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    name: error.name,
    method: req.method,
    path: req.path,
    query: req.query,
    body: sanitizeBody(req.body),
    userId,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  next(error);
}
