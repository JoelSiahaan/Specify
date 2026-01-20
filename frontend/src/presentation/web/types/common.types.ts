/**
 * Common Types
 * 
 * Shared types used across the application.
 */

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * API Error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * User roles
 */
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
}

/**
 * Course status
 */
export enum CourseStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Submission status
 */
export enum SubmissionStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
}

/**
 * Material type
 */
export enum MaterialType {
  FILE = 'FILE',
  TEXT = 'TEXT',
  VIDEO_LINK = 'VIDEO_LINK',
}

/**
 * Submission type
 */
export enum SubmissionType {
  FILE = 'FILE',
  TEXT = 'TEXT',
  BOTH = 'BOTH',
}

/**
 * Question type
 */
export enum QuestionType {
  MCQ = 'MCQ',
  ESSAY = 'ESSAY',
}
