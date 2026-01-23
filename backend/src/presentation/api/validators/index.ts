/**
 * Validation Schemas Export
 * 
 * Central export point for all validation schemas.
 * This simplifies imports throughout the application.
 */

export {
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshTokenRequestSchema,
  RoleSchema,
  EmailSchema,
  PasswordSchema,
  NameSchema,
  type RegisterRequest,
  type LoginRequest,
  type RefreshTokenRequest,
  type Role
} from './authSchemas';

export {
  CreateCourseRequestSchema,
  UpdateCourseRequestSchema,
  CourseQuerySchema,
  CourseNameSchema,
  CourseDescriptionSchema,
  CourseCodeSchema,
  CourseStatusSchema,
  type CreateCourseRequest,
  type UpdateCourseRequest,
  type CourseQuery,
  type CourseStatus
} from './courseSchemas';

export {
  EnrollCourseRequestSchema,
  BulkUnenrollRequestSchema,
  EnrollmentCourseCodeSchema,
  type EnrollCourseRequest,
  type BulkUnenrollRequest
} from './enrollmentSchemas';
