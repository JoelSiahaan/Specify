/**
 * Error Handler Middleware
 * 
 * Centralized error handling for all API errors.
 * Maps domain/application/infrastructure errors to HTTP responses.
 * Logs errors with context and never exposes internal details.
 * 
 * Requirements:
 * - 18.3: Error handling
 * - 21.3: Logging
 * - 21.2: Error tracking
 */

import { Request, Response, NextFunction } from 'express';
import { ApplicationError, ValidationError } from '../../../application/errors/ApplicationErrors';
import { DomainError } from '../../../domain/errors/DomainErrors';
import { DatabaseError, FileSystemError } from '../../../infrastructure/errors/InfrastructureErrors';
import { logger, logError } from '../../../infrastructure/logging/logger';
import { AuthenticatedRequest } from './AuthenticationMiddleware';

/**
 * Error response interface
 */
interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string>;
}

/**
 * Global error handler middleware
 * 
 * Handles all errors thrown in the application.
 * Must be registered as the last middleware in Express app.
 * 
 * @param error - Error object
 * @param req - Express request
 * @param res - Express response
 * @param _next - Express next function (required for Express error handler signature, but unused)
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Extract user ID if available
  const userId = (req as AuthenticatedRequest).user?.userId;

  // Log error with context
  logError(error, {
    method: req.method,
    path: req.path,
    userId,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Handle known application errors
  if (error instanceof ApplicationError) {
    const response: ErrorResponse = {
      code: error.code,
      message: error.message
    };

    // Include validation details if present
    if (error instanceof ValidationError && error.details) {
      response.details = error.details;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle domain errors (business rule violations)
  if (error instanceof DomainError) {
    res.status(400).json({
      code: 'BUSINESS_RULE_VIOLATION',
      message: error.message
    });
    return;
  }

  // Handle database errors
  if (error instanceof DatabaseError) {
    // Log original error for debugging
    logger.error('Database error details', {
      originalError: error.originalError.message,
      stack: error.originalError.stack
    });

    // Return generic error to user (never expose database details)
    res.status(500).json({
      code: 'DATABASE_ERROR',
      message: 'A database error occurred. Please try again later.'
    });
    return;
  }

  // Handle file system errors
  if (error instanceof FileSystemError) {
    // Log original error for debugging
    logger.error('File system error details', {
      originalError: error.originalError.message,
      stack: error.originalError.stack
    });

    // Return generic error to user
    res.status(500).json({
      code: 'FILE_SYSTEM_ERROR',
      message: 'A file operation failed. Please try again later.'
    });
    return;
  }

  // Handle JSON parsing errors (malformed JSON from body-parser)
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      code: 'INVALID_JSON',
      message: 'Invalid JSON format in request body'
    });
    return;
  }

  // Handle Zod validation errors (from validation middleware)
  if (error.name === 'ZodError') {
    const zodError = error as any;
    const details: Record<string, string> = {};

    // Extract field errors from Zod error
    if (zodError.errors && Array.isArray(zodError.errors)) {
      zodError.errors.forEach((err: any) => {
        const field = err.path.join('.');
        details[field] = err.message;
      });
    }

    res.status(400).json({
      code: 'VALIDATION_FAILED',
      message: 'Input validation failed',
      details
    });
    return;
  }

  // Handle unknown errors (catch-all)
  logger.error('Unexpected error', {
    error: error.message,
    stack: error.stack,
    name: error.name
  });

  // Return generic error (never expose internal details)
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.'
  });
}
