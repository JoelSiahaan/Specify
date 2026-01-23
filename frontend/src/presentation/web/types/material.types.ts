/**
 * Material Types
 * 
 * TypeScript types for material-related data structures.
 * 
 * Note: MaterialType enum is defined in common.types.ts
 */

import type { MaterialType } from './common.types';

/**
 * Material entity
 */
export interface Material {
  id: string;
  title: string;
  type: MaterialType;
  courseId: string;
  content?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create material request (FILE type)
 */
export interface CreateFileMaterialRequest {
  title: string;
  type: 'FILE';
  file: File;
}

/**
 * Create material request (TEXT type)
 */
export interface CreateTextMaterialRequest {
  title: string;
  type: 'TEXT';
  content: string;
}

/**
 * Create material request (VIDEO_LINK type)
 */
export interface CreateVideoMaterialRequest {
  title: string;
  type: 'VIDEO_LINK';
  content: string;
}

/**
 * Union type for create material requests
 */
export type CreateMaterialRequest = 
  | CreateFileMaterialRequest 
  | CreateTextMaterialRequest 
  | CreateVideoMaterialRequest;

/**
 * Update material request (TEXT type)
 */
export interface UpdateTextMaterialRequest {
  title: string;
  content: string;
}

/**
 * Update material request (VIDEO_LINK type)
 */
export interface UpdateVideoMaterialRequest {
  title: string;
  content: string;
}

/**
 * Update material request (FILE type)
 */
export interface UpdateFileMaterialRequest {
  title: string;
  file?: File;
}

/**
 * Union type for update material requests
 */
export type UpdateMaterialRequest = 
  | UpdateTextMaterialRequest 
  | UpdateVideoMaterialRequest 
  | UpdateFileMaterialRequest;

/**
 * List materials response
 */
export interface ListMaterialsResponse {
  data: Material[];
}

/**
 * Material icon mapping
 */
export const MATERIAL_TYPE_ICONS: Record<MaterialType, string> = {
  FILE: '📄',
  TEXT: '📝',
  VIDEO_LINK: '🎥',
};

/**
 * Material type labels
 */
export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  FILE: 'File',
  TEXT: 'Text Content',
  VIDEO_LINK: 'Video Link',
};
