/**
 * Enrollment Validation Schemas
 * 
 * Zod schemas for validating enrollment-related requests.
 * These schemas enforce input validation at the presentation layer.
 * 
 * Requirements:
 * - 18.4: Input validation and structured data
 * - 20.2: Validation and sanitization
 * - 6.5: Course code validation for enrollment
 * - 6.7: Invalid course code rejection
 */

import { z } from 'zod';

/**
 * Course code schema for enrollment
 * 
 * Validates course code format (6-character alphanumeric)
 * Requirement 6.5: Valid course code for enrollment
 * Requirement 6.7: Invalid course code rejection
 */
export const EnrollmentCourseCodeSchema = z
  .string({
    required_error: 'Course code is required',
    invalid_type_error: 'Course code must be a string'
  })
  .trim()
  .toUpperCase()
  .length(6, 'Course code must be exactly 6 characters')
  .regex(/^[A-Z0-9]{6}$/, 'Course code must contain only uppercase letters and numbers');

/**
 * Enroll in course request schema
 * 
 * Validates course enrollment request body
 * Requirements: 6.5, 6.7, 18.4, 20.2
 */
export const EnrollCourseRequestSchema = z.object({
  courseCode: EnrollmentCourseCodeSchema
});

/**
 * Bulk unenroll request schema
 * 
 * Validates bulk unenrollment request body
 * Requirements: 5.8, 18.4, 20.2
 */
export const BulkUnenrollRequestSchema = z.object({
  studentIds: z
    .array(
      z.string({
        required_error: 'Student ID is required',
        invalid_type_error: 'Student ID must be a string'
      }).uuid('Student ID must be a valid UUID')
    )
    .min(1, 'At least one student ID is required')
    .max(100, 'Cannot unenroll more than 100 students at once')
});

/**
 * Type exports for TypeScript
 * 
 * These types can be used throughout the application for type safety
 */
export type EnrollCourseRequest = z.infer<typeof EnrollCourseRequestSchema>;
export type BulkUnenrollRequest = z.infer<typeof BulkUnenrollRequestSchema>;
