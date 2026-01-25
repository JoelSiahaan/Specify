/**
 * Types Index
 * 
 * Re-export all types for easy importing.
 */

export * from './common.types';
export * from './user.types';
export * from './course.types';

// Re-export material types (using export type for isolatedModules compliance)
export type {
  Material,
  CreateFileMaterialRequest,
  CreateTextMaterialRequest,
  CreateVideoMaterialRequest,
  CreateMaterialRequest,
  UpdateTextMaterialRequest,
  UpdateVideoMaterialRequest,
  UpdateFileMaterialRequest,
  UpdateMaterialRequest,
  ListMaterialsResponse,
} from './material.types';

// Re-export material constants
export { MATERIAL_TYPE_ICONS, MATERIAL_TYPE_LABELS } from './material.types';

// Re-export quiz types
export * from './quiz.types';

// Re-export assignment types (using export type for isolatedModules compliance)
export type {
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  ListAssignmentsResponse,
  Submission,
  SubmitAssignmentRequest,
  ListSubmissionsResponse,
} from './assignment.types';

// Re-export assignment constants
export { 
  SUBMISSION_TYPE_LABELS, 
  SUBMISSION_STATUS_LABELS, 
  SUBMISSION_STATUS_COLORS 
} from './assignment.types';
