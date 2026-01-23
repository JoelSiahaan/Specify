/**
 * Material Data Transfer Objects (DTOs)
 * 
 * DTOs for transferring material data between application layers.
 * These objects are used for API requests and responses.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 * - 7.1: File upload support
 * - 7.2: Text content support
 * - 7.3: Video link support
 */

import { MaterialType } from '../../domain/entities/Material';

/**
 * Material DTO for API responses
 * Contains all material information for display
 */
export interface MaterialDTO {
  id: string;
  courseId: string;
  title: string;
  type: MaterialType;
  content?: string;      // For TEXT: HTML content; For VIDEO_LINK: URL
  filePath?: string;     // For FILE: path to uploaded file
  fileName?: string;     // For FILE: original file name
  fileSize?: number;     // For FILE: file size in bytes
  mimeType?: string;     // For FILE: MIME type
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Material DTO for material creation
 * Type-specific fields are optional and validated based on type
 */
export interface CreateMaterialDTO {
  title: string;
  type: MaterialType;
  content?: string;      // Required for TEXT and VIDEO_LINK types
  filePath?: string;     // Required for FILE type
  fileName?: string;     // Required for FILE type
  fileSize?: number;     // Required for FILE type
  mimeType?: string;     // Required for FILE type
}

/**
 * Update Material DTO for material updates
 * Allows updating title and type-specific content
 */
export interface UpdateMaterialDTO {
  title?: string;
  content?: string;      // For TEXT and VIDEO_LINK types
  filePath?: string;     // For FILE type (file replacement)
  fileName?: string;     // For FILE type (file replacement)
  fileSize?: number;     // For FILE type (file replacement)
  mimeType?: string;     // For FILE type (file replacement)
}

/**
 * Material List DTO for listing materials
 * Simplified version for list views
 */
export interface MaterialListDTO {
  id: string;
  courseId: string;
  title: string;
  type: MaterialType;
  fileName?: string;     // For FILE type: display file name
  fileSize?: number;     // For FILE type: display file size
  createdAt: Date;
  updatedAt: Date;
}

/**
 * File Upload DTO for file upload requests
 * Used when uploading files via multipart/form-data
 */
export interface FileUploadDTO {
  title: string;
  file: Buffer;          // File buffer from multer
  originalName: string;  // Original file name
  mimeType: string;      // MIME type
  size: number;          // File size in bytes
}
