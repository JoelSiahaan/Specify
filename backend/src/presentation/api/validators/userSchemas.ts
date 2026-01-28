/**
 * User Profile Validation Schemas
 * 
 * Zod schemas for validating user profile management requests.
 * These schemas enforce input validation at the presentation layer.
 * 
 * Requirements:
 * - 2.2: Name validation (1-100 chars after trim)
 * - 2.3: Password strength validation
 * - 20.2: Validation and sanitization
 */

import { z } from 'zod';
import { NameSchema, PasswordSchema } from './authSchemas';

/**
 * Update profile request schema
 * 
 * Validates profile update request body (name only)
 * Requirement 2.2: Name validation (1-100 chars after trim)
 */
export const UpdateProfileRequestSchema = z.object({
  name: NameSchema
});

/**
 * Change password request schema
 * 
 * Validates password change request body
 * Uses same password validation as registration (minimum 8 characters)
 * Requirements: 2.3, 2.4, 2.5
 */
export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string({
      required_error: 'Current password is required',
      invalid_type_error: 'Current password must be a string'
    }).min(1, 'Current password is required'),
    newPassword: PasswordSchema,
    confirmPassword: z.string({
      required_error: 'Confirm password is required',
      invalid_type_error: 'Confirm password must be a string'
    }).min(1, 'Confirm password is required')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

/**
 * Type exports for TypeScript
 * 
 * These types can be used throughout the application for type safety
 */
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
