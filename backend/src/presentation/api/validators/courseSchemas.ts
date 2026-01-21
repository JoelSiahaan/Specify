/**
 * Course Validation Schemas
 * 
 * Zod schemas for validating course-related requests.
 * These schemas enforce input validation at the presentation layer.
 * 
 * Requirements:
 * - 18.4: Input validation and structured data
 * - 20.2: Validation and sanitization
 * - 5.9: Course name validation
 */

import { z } from 'zod';

/**
 * Course name schema
 * 
 * Validates course name is provided and within length limits
 * Requirement 5.9: Course name validation
 */
export const CourseNameSchema = z
  .string({
    required_error: 'Course name is required',
    invalid_type_error: 'Course name must be a string'
  })
  .trim()
  .min(1, 'Course name is required')
  .max(200, 'Course name must not exceed 200 characters');

/**
 * Course description schema
 * 
 * Validates course description
 * Optional field, but if provided must be within length limits
 */
export const CourseDescriptionSchema = z
  .string({
    required_error: 'Course description is required',
    invalid_type_error: 'Course description must be a string'
  })
  .trim()
  .min(1, 'Course description is required')
  .max(5000, 'Course description must not exceed 5000 characters');

/**
 * Course code schema
 * 
 * Validates course code format (6-character alphanumeric)
 * Requirement 5.1: Course code format validation
 */
export const CourseCodeSchema = z
  .string({
    required_error: 'Course code is required',
    invalid_type_error: 'Course code must be a string'
  })
  .trim()
  .toUpperCase()
  .length(6, 'Course code must be exactly 6 characters')
  .regex(/^[A-Z0-9]{6}$/, 'Course code must contain only uppercase letters and numbers');

/**
 * Course status schema
 * 
 * Validates course status is either ACTIVE or ARCHIVED
 */
export const CourseStatusSchema = z.enum(['ACTIVE', 'ARCHIVED'], {
  errorMap: () => ({ message: 'Course status must be either ACTIVE or ARCHIVED' })
});

/**
 * Create course request schema
 * 
 * Validates course creation request body
 * Requirements: 5.1, 5.9, 18.4, 20.2
 */
export const CreateCourseRequestSchema = z.object({
  name: CourseNameSchema,
  description: CourseDescriptionSchema
});

/**
 * Update course request schema
 * 
 * Validates course update request body
 * Both fields are optional (partial update)
 * Requirements: 5.3, 18.4, 20.2
 */
export const UpdateCourseRequestSchema = z.object({
  name: CourseNameSchema.optional(),
  description: CourseDescriptionSchema.optional()
}).refine(
  (data) => data.name !== undefined || data.description !== undefined,
  {
    message: 'At least one field (name or description) must be provided for update'
  }
);

/**
 * Enroll in course request schema
 * 
 * Validates course enrollment request body
 * Requirements: 6.5, 18.4, 20.2
 */
export const EnrollCourseRequestSchema = z.object({
  courseCode: CourseCodeSchema
});

/**
 * Course query parameters schema
 * 
 * Validates query parameters for listing courses
 * Requirements: 5.10, 18.4
 */
export const CourseQuerySchema = z.object({
  status: CourseStatusSchema.optional()
});

/**
 * Type exports for TypeScript
 * 
 * These types can be used throughout the application for type safety
 */
export type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;
export type UpdateCourseRequest = z.infer<typeof UpdateCourseRequestSchema>;
export type EnrollCourseRequest = z.infer<typeof EnrollCourseRequestSchema>;
export type CourseQuery = z.infer<typeof CourseQuerySchema>;
export type CourseStatus = z.infer<typeof CourseStatusSchema>;

