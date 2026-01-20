/**
 * Authentication Validation Schemas
 * 
 * Zod schemas for validating authentication requests.
 * These schemas enforce input validation at the presentation layer.
 * 
 * Requirements:
 * - 18.4: Input validation
 * - 20.2: Validation and sanitization
 * - 1.7: Email format validation
 */

import { z } from 'zod';

/**
 * Role enum schema
 * 
 * Validates that role is either STUDENT or TEACHER
 */
export const RoleSchema = z.enum(['STUDENT', 'TEACHER'], {
  errorMap: () => ({ message: 'Role must be either STUDENT or TEACHER' })
});

/**
 * Email schema
 * 
 * Validates email format according to RFC 5322
 * Requirement 1.7: Email format validation
 */
export const EmailSchema = z
  .string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string'
  })
  .trim() // Trim first before validation
  .min(1, 'Email is required') // Check empty after trim
  .email('Invalid email format')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase(); // Normalize to lowercase

/**
 * Password schema
 * 
 * Validates password meets minimum security requirements
 * Requirement 20.1: Password security
 */
export const PasswordSchema = z
  .string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string'
  })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');

/**
 * Name schema
 * 
 * Validates user name
 */
export const NameSchema = z
  .string({
    required_error: 'Name is required',
    invalid_type_error: 'Name must be a string'
  })
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .trim();

/**
 * Register request schema
 * 
 * Validates user registration request body
 * Requirements: 1.7, 20.1, 20.2
 */
export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: NameSchema,
  role: RoleSchema
});

/**
 * Login request schema
 * 
 * Validates user login request body
 * Requirements: 1.1, 20.2
 */
export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string'
  }).min(1, 'Password is required')
  // Note: No max length validation on login to allow any password attempt
});

/**
 * Refresh token request schema
 * 
 * Validates refresh token request body
 * Requirements: 1.4, 20.2
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string({
    required_error: 'Refresh token is required',
    invalid_type_error: 'Refresh token must be a string'
  }).min(1, 'Refresh token is required')
});

/**
 * Type exports for TypeScript
 * 
 * These types can be used throughout the application for type safety
 */
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type Role = z.infer<typeof RoleSchema>;
