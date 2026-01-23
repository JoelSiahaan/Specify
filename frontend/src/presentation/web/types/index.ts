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
