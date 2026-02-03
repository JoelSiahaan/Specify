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
} from './authSchemas.js';

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
} from './courseSchemas.js';

export {
  MaterialTypeSchema,
  MaterialTitleSchema,
  TextContentSchema,
  VideoURLSchema,
  FileNameSchema,
  FileSizeSchema,
  MimeTypeSchema,
  CreateTextMaterialRequestSchema,
  CreateVideoLinkMaterialRequestSchema,
  CreateFileMaterialRequestSchema,
  CreateMaterialRequestSchema,
  UpdateTextMaterialRequestSchema,
  UpdateVideoLinkMaterialRequestSchema,
  UpdateFileMaterialRequestSchema,
  UpdateMaterialRequestSchema,
  MaterialQuerySchema,
  type MaterialType,
  type CreateTextMaterialRequest,
  type CreateVideoLinkMaterialRequest,
  type CreateFileMaterialRequest,
  type CreateMaterialRequest,
  type UpdateTextMaterialRequest,
  type UpdateVideoLinkMaterialRequest,
  type UpdateFileMaterialRequest,
  type UpdateMaterialRequest,
  type MaterialQuery
} from './materialSchemas.js';

export {
  EnrollCourseRequestSchema,
  BulkUnenrollRequestSchema,
  EnrollmentCourseCodeSchema,
  type EnrollCourseRequest,
  type BulkUnenrollRequest
} from './enrollmentSchemas.js';

export {
  QuestionTypeSchema,
  MCQQuestionSchema,
  EssayQuestionSchema,
  QuestionSchema,
  AnswerSchema,
  CreateQuizRequestSchema,
  UpdateQuizRequestSchema,
  AutoSaveQuizRequestSchema,
  SubmitQuizRequestSchema,
  GradeQuizSubmissionRequestSchema,
  type QuestionType,
  type MCQQuestion,
  type EssayQuestion,
  type Question,
  type Answer,
  type CreateQuizRequest,
  type UpdateQuizRequest,
  type AutoSaveQuizRequest,
  type SubmitQuizRequest,
  type GradeQuizSubmissionRequest
} from './quizSchemas.js';

export {
  SubmissionTypeSchema,
  AssignmentTitleSchema,
  AssignmentDescriptionSchema,
  DueDateSchema,
  AcceptedFileFormatsSchema,
  CreateAssignmentRequestSchema,
  UpdateAssignmentRequestSchema,
  SubmissionContentSchema,
  SubmitTextAssignmentRequestSchema,
  SubmitFileAssignmentRequestSchema,
  SubmitBothAssignmentRequestSchema,
  SubmitAssignmentRequestSchema,
  GradeSubmissionRequestSchema,
  AssignmentQuerySchema,
  type SubmissionType,
  type CreateAssignmentRequest,
  type UpdateAssignmentRequest,
  type SubmitTextAssignmentRequest,
  type SubmitFileAssignmentRequest,
  type SubmitBothAssignmentRequest,
  type SubmitAssignmentRequest,
  type GradeSubmissionRequest,
  type AssignmentQuery
} from './assignmentSchemas.js';
