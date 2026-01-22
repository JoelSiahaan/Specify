/**
 * Material Validation Schemas
 * 
 * Zod schemas for validating material-related requests.
 * These schemas enforce input validation at the presentation layer.
 * 
 * Requirements:
 * - 18.4: Input validation and structured data
 * - 20.2: Validation and sanitization
 * - 7.1: File upload validation
 * - 7.2: Text content validation
 * - 7.3: Video link validation
 * - 7.4: File type validation
 * - 7.5: File size validation (10MB max)
 * - 7.11: YouTube/Vimeo URL validation
 */

import { z } from 'zod';

/**
 * Material type enum schema
 * 
 * Validates material type is one of: FILE, TEXT, VIDEO_LINK
 */
export const MaterialTypeSchema = z.enum(['FILE', 'TEXT', 'VIDEO_LINK'], {
  errorMap: () => ({ message: 'Material type must be FILE, TEXT, or VIDEO_LINK' })
});

/**
 * Material title schema
 * 
 * Validates material title is provided and within length limits
 */
export const MaterialTitleSchema = z
  .string({
    required_error: 'Material title is required',
    invalid_type_error: 'Material title must be a string'
  })
  .trim()
  .min(1, 'Material title is required')
  .max(200, 'Material title must not exceed 200 characters');

/**
 * Text content schema
 * 
 * Validates HTML content for TEXT type materials
 * Requirement 7.2: Text content validation
 */
export const TextContentSchema = z
  .string({
    required_error: 'Text content is required for TEXT type materials',
    invalid_type_error: 'Text content must be a string'
  })
  .trim()
  .min(1, 'Text content cannot be empty')
  .max(50000, 'Text content must not exceed 50000 characters');

/**
 * Video URL schema
 * 
 * Validates video URL is a valid YouTube or Vimeo URL
 * Requirements: 7.3, 7.11
 */
export const VideoURLSchema = z
  .string({
    required_error: 'Video URL is required for VIDEO_LINK type materials',
    invalid_type_error: 'Video URL must be a string'
  })
  .trim()
  .url('Video URL must be a valid URL')
  .refine(
    (url) => {
      const youtubePattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
      const vimeoPattern = /^https?:\/\/(www\.)?vimeo\.com\//;
      return youtubePattern.test(url) || vimeoPattern.test(url);
    },
    {
      message: 'Video URL must be a valid YouTube or Vimeo URL'
    }
  );

/**
 * File name schema
 * 
 * Validates file name format
 */
export const FileNameSchema = z
  .string({
    required_error: 'File name is required',
    invalid_type_error: 'File name must be a string'
  })
  .trim()
  .min(1, 'File name is required')
  .max(255, 'File name must not exceed 255 characters');

/**
 * File size schema
 * 
 * Validates file size is within limits (10MB max)
 * Requirement 7.5: File size validation
 */
export const FileSizeSchema = z
  .number({
    required_error: 'File size is required',
    invalid_type_error: 'File size must be a number'
  })
  .int('File size must be an integer')
  .positive('File size must be positive')
  .max(10 * 1024 * 1024, 'File size must not exceed 10MB');

/**
 * MIME type schema
 * 
 * Validates MIME type is one of the allowed types
 * Requirement 7.4: File type validation
 * 
 * Allowed types:
 * - PDF: application/pdf
 * - DOCX: application/vnd.openxmlformats-officedocument.wordprocessingml.document
 * - Images: image/jpeg, image/png, image/gif
 */
export const MimeTypeSchema = z
  .string({
    required_error: 'MIME type is required',
    invalid_type_error: 'MIME type must be a string'
  })
  .refine(
    (mimeType) => {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
      return allowedTypes.includes(mimeType);
    },
    {
      message: 'File type must be PDF, DOCX, JPEG, PNG, or GIF'
    }
  );

/**
 * Create TEXT material request schema
 * 
 * Validates TEXT material creation request
 * Requirements: 7.2, 18.4, 20.2
 */
export const CreateTextMaterialRequestSchema = z.object({
  title: MaterialTitleSchema,
  type: z.literal('TEXT'),
  content: TextContentSchema
});

/**
 * Create VIDEO_LINK material request schema
 * 
 * Validates VIDEO_LINK material creation request
 * Requirements: 7.3, 7.11, 18.4, 20.2
 */
export const CreateVideoLinkMaterialRequestSchema = z.object({
  title: MaterialTitleSchema,
  type: z.literal('VIDEO_LINK'),
  content: VideoURLSchema
});

/**
 * Create FILE material request schema (multipart/form-data)
 * 
 * Validates FILE material creation request
 * Note: File validation happens in multer middleware and use case
 * This schema validates the form fields only
 * Requirements: 7.1, 7.4, 7.5, 18.4, 20.2
 */
export const CreateFileMaterialRequestSchema = z.object({
  title: MaterialTitleSchema,
  type: z.literal('FILE')
  // File itself is handled by multer middleware
  // File validation (type, size) happens in use case
});

/**
 * Create material request schema (discriminated union)
 * 
 * Validates material creation based on type
 * Uses discriminated union to enforce type-specific validation
 */
export const CreateMaterialRequestSchema = z.discriminatedUnion('type', [
  CreateTextMaterialRequestSchema,
  CreateVideoLinkMaterialRequestSchema,
  CreateFileMaterialRequestSchema
]);

/**
 * Update TEXT material request schema
 * 
 * Validates TEXT material update request
 */
export const UpdateTextMaterialRequestSchema = z.object({
  title: MaterialTitleSchema.optional(),
  content: TextContentSchema.optional()
}).refine(
  (data) => data.title !== undefined || data.content !== undefined,
  {
    message: 'At least one field (title or content) must be provided for update'
  }
);

/**
 * Update VIDEO_LINK material request schema
 * 
 * Validates VIDEO_LINK material update request
 */
export const UpdateVideoLinkMaterialRequestSchema = z.object({
  title: MaterialTitleSchema.optional(),
  content: VideoURLSchema.optional()
}).refine(
  (data) => data.title !== undefined || data.content !== undefined,
  {
    message: 'At least one field (title or content) must be provided for update'
  }
);

/**
 * Update FILE material request schema
 * 
 * Validates FILE material update request
 * Can update title and/or replace file
 */
export const UpdateFileMaterialRequestSchema = z.object({
  title: MaterialTitleSchema.optional()
  // File replacement is handled by multer middleware
  // If file is provided, it will be validated in use case
});

/**
 * Update material request schema
 * 
 * Validates material update request
 * Note: Type cannot be changed, so we don't include type field
 */
export const UpdateMaterialRequestSchema = z.object({
  title: MaterialTitleSchema.optional(),
  content: z.string().trim().optional()
  // File replacement handled separately via multipart/form-data
}).refine(
  (data) => data.title !== undefined || data.content !== undefined,
  {
    message: 'At least one field must be provided for update'
  }
);

/**
 * Material query parameters schema
 * 
 * Validates query parameters for listing materials
 * Currently no filters, but can be extended in future
 */
export const MaterialQuerySchema = z.object({
  // Future: Add filters like type, search, etc.
});

/**
 * Type exports for TypeScript
 * 
 * These types can be used throughout the application for type safety
 */
export type MaterialType = z.infer<typeof MaterialTypeSchema>;
export type CreateTextMaterialRequest = z.infer<typeof CreateTextMaterialRequestSchema>;
export type CreateVideoLinkMaterialRequest = z.infer<typeof CreateVideoLinkMaterialRequestSchema>;
export type CreateFileMaterialRequest = z.infer<typeof CreateFileMaterialRequestSchema>;
export type CreateMaterialRequest = z.infer<typeof CreateMaterialRequestSchema>;
export type UpdateTextMaterialRequest = z.infer<typeof UpdateTextMaterialRequestSchema>;
export type UpdateVideoLinkMaterialRequest = z.infer<typeof UpdateVideoLinkMaterialRequestSchema>;
export type UpdateFileMaterialRequest = z.infer<typeof UpdateFileMaterialRequestSchema>;
export type UpdateMaterialRequest = z.infer<typeof UpdateMaterialRequestSchema>;
export type MaterialQuery = z.infer<typeof MaterialQuerySchema>;

