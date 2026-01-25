/**
 * Assignment Validation Schemas
 * 
 * Zod schemas for validating assignment-related requests.
 * These schemas enforce input validation at the presentation layer.
 * 
 * Requirements:
 * - 18.4: Input validation and structured data
 * - 20.2: Validation and sanitization
 * - 9.1: Assignment creation validation
 * - 9.2: Due date validation (must be in future)
 * - 9.4: Submission type validation
 * - 9.5: File format specification
 * - 9.7: Required fields validation
 * - 10.4: Submission content validation
 * - 10.5: File format validation
 * - 10.13: Supported file formats (PDF, DOCX, JPG, PNG)
 */

import { z } from 'zod';

/**
 * Submission type enum schema
 * 
 * Validates submission type is one of: FILE, TEXT, BOTH
 * Requirement 9.4: Submission type specification
 */
export const SubmissionTypeSchema = z.enum(['FILE', 'TEXT', 'BOTH'], {
  errorMap: () => ({ message: 'Submission type must be FILE, TEXT, or BOTH' })
});

/**
 * Assignment title schema
 * 
 * Validates assignment title is provided and within length limits
 * Requirement 9.7: Title validation
 */
export const AssignmentTitleSchema = z
  .string({
    required_error: 'Assignment title is required',
    invalid_type_error: 'Assignment title must be a string'
  })
  .trim()
  .min(1, 'Assignment title is required')
  .max(200, 'Assignment title must not exceed 200 characters');

/**
 * Assignment description schema
 * 
 * Validates assignment description with rich text support
 * Requirement 9.6: Rich text formatting support
 * Requirement 9.7: Description validation
 */
export const AssignmentDescriptionSchema = z
  .string({
    required_error: 'Assignment description is required',
    invalid_type_error: 'Assignment description must be a string'
  })
  .trim()
  .min(1, 'Assignment description is required')
  .max(10000, 'Assignment description must not exceed 10000 characters');

/**
 * Due date schema
 * 
 * Validates due date is in ISO 8601 format and in the future
 * Requirement 9.2: Due date must be in the future
 * Requirement 9.7: Due date validation
 */
export const DueDateSchema = z
  .string({
    required_error: 'Due date is required',
    invalid_type_error: 'Due date must be a string'
  })
  .trim()
  .datetime({ message: 'Due date must be a valid ISO 8601 datetime' })
  .refine(
    (dateString) => {
      const dueDate = new Date(dateString);
      const now = new Date();
      return dueDate > now;
    },
    {
      message: 'Due date must be in the future'
    }
  );

/**
 * Accepted file formats schema
 * 
 * Validates file formats are from allowed list
 * Requirement 9.5: File format specification
 * Requirement 10.13: Supported formats (PDF, DOCX, JPG, PNG)
 */
export const AcceptedFileFormatsSchema = z
  .array(
    z.enum(['pdf', 'docx', 'jpg', 'jpeg', 'png'], {
      errorMap: () => ({ message: 'File format must be one of: pdf, docx, jpg, jpeg, png' })
    })
  )
  .min(1, 'At least one file format must be specified when file upload is enabled')
  .max(5, 'Cannot specify more than 5 file formats')
  .optional();

/**
 * Create assignment request schema
 * 
 * Validates assignment creation request body
 * Requirements: 9.1, 9.2, 9.4, 9.5, 9.7, 18.4, 20.2
 */
export const CreateAssignmentRequestSchema = z.object({
  title: AssignmentTitleSchema,
  description: AssignmentDescriptionSchema,
  dueDate: DueDateSchema,
  submissionType: SubmissionTypeSchema,
  acceptedFileFormats: AcceptedFileFormatsSchema
}).refine(
  (data) => {
    // If submission type is FILE or BOTH, acceptedFileFormats must be provided
    if (data.submissionType === 'FILE' || data.submissionType === 'BOTH') {
      return data.acceptedFileFormats && data.acceptedFileFormats.length > 0;
    }
    return true;
  },
  {
    message: 'Accepted file formats must be specified when submission type is FILE or BOTH',
    path: ['acceptedFileFormats']
  }
);

/**
 * Update assignment request schema
 * 
 * Validates assignment update request body
 * All fields are optional (partial update)
 * Requirements: 9.8, 9.9, 18.4, 20.2
 */
export const UpdateAssignmentRequestSchema = z.object({
  title: AssignmentTitleSchema.optional(),
  description: AssignmentDescriptionSchema.optional(),
  dueDate: DueDateSchema.optional()
}).refine(
  (data) => data.title !== undefined || data.description !== undefined || data.dueDate !== undefined,
  {
    message: 'At least one field (title, description, or dueDate) must be provided for update'
  }
);

/**
 * Submission content schema (for TEXT submissions)
 * 
 * Validates text submission content
 * Requirement 10.2: Text submission validation
 * Requirement 10.4: Required content validation
 */
export const SubmissionContentSchema = z
  .string({
    required_error: 'Submission content is required for TEXT submissions',
    invalid_type_error: 'Submission content must be a string'
  })
  .trim()
  .min(1, 'Submission content cannot be empty')
  .max(50000, 'Submission content must not exceed 50000 characters');

/**
 * Submit assignment request schema (for TEXT submissions)
 * 
 * Validates text submission request
 * Requirements: 10.2, 10.4, 18.4, 20.2
 */
export const SubmitTextAssignmentRequestSchema = z.object({
  submissionType: z.literal('TEXT'),
  content: SubmissionContentSchema
});

/**
 * Submit assignment request schema (for FILE submissions)
 * 
 * Validates file submission request
 * Note: File validation happens in multer middleware and use case
 * This schema validates the form fields only
 * Requirements: 10.1, 10.5, 10.13, 18.4, 20.2
 */
export const SubmitFileAssignmentRequestSchema = z.object({
  submissionType: z.literal('FILE')
  // File itself is handled by multer middleware
  // File validation (type, size) happens in use case
});

/**
 * Submit assignment request schema (for BOTH submissions)
 * 
 * Validates combined file and text submission request
 * Requirements: 10.3, 10.4, 18.4, 20.2
 */
export const SubmitBothAssignmentRequestSchema = z.object({
  submissionType: z.literal('BOTH'),
  content: SubmissionContentSchema
  // File is handled by multer middleware
});

/**
 * Submit assignment request schema (discriminated union)
 * 
 * Validates assignment submission based on submission type
 * Uses discriminated union to enforce type-specific validation
 */
export const SubmitAssignmentRequestSchema = z.discriminatedUnion('submissionType', [
  SubmitTextAssignmentRequestSchema,
  SubmitFileAssignmentRequestSchema,
  SubmitBothAssignmentRequestSchema
]);

/**
 * Grade submission request schema
 * 
 * Validates grading request body
 * Requirements: 13.3, 13.4, 13.6, 18.4, 20.2
 */
export const GradeSubmissionRequestSchema = z.object({
  grade: z
    .number({
      required_error: 'Grade is required',
      invalid_type_error: 'Grade must be a number'
    })
    .int('Grade must be an integer')
    .min(0, 'Grade must be between 0 and 100')
    .max(100, 'Grade must be between 0 and 100'),
  feedback: z
    .string({
      invalid_type_error: 'Feedback must be a string'
    })
    .trim()
    .max(5000, 'Feedback must not exceed 5000 characters')
    .optional(),
  version: z
    .number({
      invalid_type_error: 'Version must be a number'
    })
    .int('Version must be an integer')
    .positive('Version must be positive')
    .optional()
});

/**
 * Assignment query parameters schema
 * 
 * Validates query parameters for listing assignments
 * Currently no filters, but can be extended in future
 */
export const AssignmentQuerySchema = z.object({
  // Future: Add filters like status, search, etc.
});

/**
 * Type exports for TypeScript
 * 
 * These types can be used throughout the application for type safety
 */
export type SubmissionType = z.infer<typeof SubmissionTypeSchema>;
export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;
export type UpdateAssignmentRequest = z.infer<typeof UpdateAssignmentRequestSchema>;
export type SubmitTextAssignmentRequest = z.infer<typeof SubmitTextAssignmentRequestSchema>;
export type SubmitFileAssignmentRequest = z.infer<typeof SubmitFileAssignmentRequestSchema>;
export type SubmitBothAssignmentRequest = z.infer<typeof SubmitBothAssignmentRequestSchema>;
export type SubmitAssignmentRequest = z.infer<typeof SubmitAssignmentRequestSchema>;
export type GradeSubmissionRequest = z.infer<typeof GradeSubmissionRequestSchema>;
export type AssignmentQuery = z.infer<typeof AssignmentQuerySchema>;
