/**
 * Upload Material File Use Case
 * 
 * Handles file upload for material creation.
 * Validates file and uploads to storage.
 * 
 * Requirements:
 * - 7.1: Upload files to courses
 * - 7.4: Validate file types (PDF, DOCX, images)
 * - 7.5: Enforce file size limit (10MB max)
 */

import { injectable, inject } from 'tsyringe';
import type { IFileStorage } from '../../../domain/storage/IFileStorage.js';
import { LocalFileStorage } from '../../../infrastructure/storage/LocalFileStorage.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

export interface UploadFileDTO {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  directory: string;
}

export interface FileMetadataDTO {
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@injectable()
export class UploadMaterialFileUseCase {
  constructor(
    @inject(LocalFileStorage) private fileStorage: IFileStorage
  ) {}

  /**
   * Execute file upload
   * 
   * @param dto - Upload file data
   * @returns File metadata with storage path
   * @throws ApplicationError if file validation fails
   */
  async execute(dto: UploadFileDTO): Promise<FileMetadataDTO> {
    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (dto.size > MAX_FILE_SIZE) {
      throw new ApplicationError(
        'INVALID_FILE_SIZE',
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        400
      );
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedMimeTypes.includes(dto.mimeType)) {
      throw new ApplicationError(
        'INVALID_FILE_TYPE',
        'File type not allowed. Only PDF, DOCX, and images (JPEG, PNG, GIF) are allowed.',
        400
      );
    }

    // Upload file to storage
    const filePath = await this.fileStorage.upload(dto.buffer, {
      originalName: dto.originalName,
      mimeType: dto.mimeType,
      size: dto.size,
      directory: dto.directory
    });

    // Return file metadata
    return {
      path: filePath,
      originalName: dto.originalName,
      mimeType: dto.mimeType,
      size: dto.size
    };
  }
}
