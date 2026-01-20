/**
 * Validation Middleware
 * 
 * Validates request data using Zod schemas.
 * Returns 400 Bad Request with validation errors if validation fails.
 * 
 * Requirements:
 * - 18.4: Input validation
 * - 20.2: Validation and sanitization
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation target types
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation middleware factory
 * 
 * Creates a middleware function that validates request data against a Zod schema.
 * 
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, query, or params)
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * router.post('/register', 
 *   validate(RegisterRequestSchema, 'body'),
 *   authController.register
 * );
 * ```
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get data to validate based on target
      const dataToValidate = req[target];

      // Validate data against schema
      const validatedData = schema.parse(dataToValidate);

      // Replace request data with validated (and potentially transformed) data
      // This ensures any transformations (like toLowerCase, trim) are applied
      req[target] = validatedData;

      // Continue to next middleware
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        // Extract field errors from Zod error
        const details: Record<string, string> = {};
        
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          details[field] = err.message;
        });

        // Return 400 Bad Request with validation errors
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Input validation failed',
          details
        });
        return;
      }

      // Unexpected error (should not happen with Zod)
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during validation'
      });
    }
  };
}

/**
 * Convenience function for validating request body
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * router.post('/register', validateBody(RegisterRequestSchema), authController.register);
 * ```
 */
export function validateBody(schema: ZodSchema) {
  return validate(schema, 'body');
}

/**
 * Convenience function for validating query parameters
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * router.get('/courses', validateQuery(CourseQuerySchema), courseController.list);
 * ```
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

/**
 * Convenience function for validating path parameters
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * router.get('/courses/:id', validateParams(CourseParamsSchema), courseController.get);
 * ```
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}
