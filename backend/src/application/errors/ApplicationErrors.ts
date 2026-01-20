/**
 * Application Layer Errors
 * 
 * Application-level errors with HTTP status codes and error codes.
 * These errors are thrown by use cases and handled by error handler middleware.
 * 
 * Requirements:
 * - 18.3: Error handling
 * - 21.3: Logging
 */

/**
 * Base application error class
 * 
 * All application errors extend this class.
 */
export class ApplicationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'ApplicationError';
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Unauthorized error (401)
 * 
 * Thrown when authentication is required but missing or invalid.
 */
export class UnauthorizedError extends ApplicationError {
  constructor(code: string = 'AUTH_REQUIRED', message: string = 'Authentication required') {
    super(code, message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error (403)
 * 
 * Thrown when user is authenticated but not authorized for the action.
 */
export class ForbiddenError extends ApplicationError {
  constructor(code: string = 'FORBIDDEN_RESOURCE', message: string = 'Access denied') {
    super(code, message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not found error (404)
 * 
 * Thrown when requested resource does not exist.
 */
export class NotFoundError extends ApplicationError {
  constructor(code: string = 'RESOURCE_NOT_FOUND', message: string = 'Resource not found') {
    super(code, message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error (400)
 * 
 * Thrown when input validation fails.
 * Includes optional details object with field-specific errors.
 */
export class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>
  ) {
    super('VALIDATION_FAILED', message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Conflict error (409)
 * 
 * Thrown when operation conflicts with current state.
 */
export class ConflictError extends ApplicationError {
  constructor(code: string = 'DUPLICATE_ENTRY', message: string = 'Resource already exists') {
    super(code, message, 409);
    this.name = 'ConflictError';
  }
}
