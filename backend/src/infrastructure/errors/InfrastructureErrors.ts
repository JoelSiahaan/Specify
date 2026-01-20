/**
 * Infrastructure Layer Errors
 * 
 * Infrastructure-level errors for external system failures.
 * These errors wrap underlying errors from databases, file systems, etc.
 * 
 * Requirements:
 * - 18.3: Error handling
 * - 21.3: Logging
 */

/**
 * Database error
 * 
 * Thrown when database operation fails.
 * Wraps the original database error for logging.
 */
export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError: Error) {
    super(message);
    this.name = 'DatabaseError';
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * File system error
 * 
 * Thrown when file operation fails.
 * Wraps the original file system error for logging.
 */
export class FileSystemError extends Error {
  constructor(message: string, public readonly originalError: Error) {
    super(message);
    this.name = 'FileSystemError';
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
