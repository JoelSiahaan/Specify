/**
 * Domain Layer Errors
 * 
 * Domain-level errors representing business rule violations.
 * These errors are thrown by domain entities and services.
 * 
 * Requirements:
 * - 18.3: Error handling
 */

/**
 * Base domain error class
 * 
 * All domain errors extend this class.
 * Domain errors represent business rule violations.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Invalid state error
 * 
 * Thrown when entity is in invalid state for the operation.
 * Example: Trying to archive an already archived course.
 */
export class InvalidStateError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateError';
  }
}

/**
 * Invalid operation error
 * 
 * Thrown when operation is not allowed on the entity.
 * Example: Trying to submit assignment after grading started.
 */
export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOperationError';
  }
}
