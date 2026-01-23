/**
 * Update Material Use Case
 * 
 * Handles material updates with teacher authorization, file replacement validation,
 * HTML sanitization, and URL validation based on material type.
 * 
 * Requirements:
 * - 7.7: Allow teachers to edit existing materials
 * - 7.8: Sanitize HTML content before storage
 * - 20.2: Input validation and sanitization
 */

import { injectable, inject } from 'tsyringe';
import sanitizeHtml from 'sanitize-html';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IMaterialRepository } from '../../../domain/repositories/IMaterialRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { MaterialType } from '../../../domain/entities/Material';
import { UpdateMaterialDTO, MaterialDTO } from '../../dtos/MaterialDTO';
import { MaterialMapper } from '../../mappers/MaterialMapper';
import { ApplicationError } from '../../errors/ApplicationErrors';

/**
 * Allowed file MIME types
 * Requirements: 7.4, 7.10
 */
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  // Images
  'image/jpeg',
  'image/png',
  'image/gif'
];

/**
 * Maximum file size in bytes (10MB)
 * Requirement: 7.5, 7.9
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@injectable()
export class UpdateMaterialUseCase {
  constructor(
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IMaterialRepository') private materialRepository: IMaterialRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute material update
   * 
   * @param materialId - ID of the material to update
   * @param dto - UpdateMaterialDTO with updated material data
   * @param userId - ID of the user updating the material
   * @returns MaterialDTO of the updated material
   * @throws ApplicationError if validation fails or user is not authorized
   */
  async execute(materialId: string, dto: UpdateMaterialDTO, userId: string): Promise<MaterialDTO> {
    // Load material
    const material = await this.loadMaterial(materialId);

    // Load user and course for authorization
    const user = await this.loadUser(userId);
    const course = await this.loadCourse(material.getCourseId());

    // Validate teacher ownership (Requirement 7.7)
    if (!this.authPolicy.canManageMaterials(user, course)) {
      throw new ApplicationError(
        'FORBIDDEN_RESOURCE',
        'Only the course owner can update materials',
        403
      );
    }

    // Validate course is not archived (read-only)
    if (course.isArchived()) {
      throw new ApplicationError(
        'RESOURCE_ARCHIVED',
        'Cannot update materials in archived course',
        400
      );
    }

    // Update title if provided
    if (dto.title !== undefined) {
      if (!dto.title || dto.title.trim().length === 0) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          'Material title cannot be empty',
          400
        );
      }
      material.updateTitle(dto.title);
    }

    // Update type-specific content based on material type
    switch (material.getType()) {
      case MaterialType.FILE:
        await this.updateFileContent(material, dto);
        break;
      
      case MaterialType.TEXT:
        this.updateTextContent(material, dto);
        break;
      
      case MaterialType.VIDEO_LINK:
        this.updateVideoLink(material, dto);
        break;
    }

    // Save updated material to repository
    const updatedMaterial = await this.materialRepository.update(material);

    // Return material DTO
    return MaterialMapper.toDTO(updatedMaterial);
  }

  /**
   * Update file content (file replacement)
   * 
   * Requirements:
   * - 7.7: Allow teachers to edit existing materials
   * - 7.4: Validate file types
   * - 7.5: Enforce file size limit
   * - 7.9: Validate file size before upload
   * 
   * @param material - Material entity to update
   * @param dto - UpdateMaterialDTO with new file data
   * @throws ApplicationError if validation fails
   * @private
   */
  private async updateFileContent(material: any, dto: UpdateMaterialDTO): Promise<void> {
    // Only update if new file data is provided
    if (!dto.filePath && !dto.fileName && !dto.fileSize && !dto.mimeType) {
      return; // No file update requested
    }

    // If any file metadata is provided, all must be provided
    if (!dto.filePath || !dto.fileName || !dto.fileSize || !dto.mimeType) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'All file metadata (filePath, fileName, fileSize, mimeType) must be provided for file replacement',
        400
      );
    }

    // Requirement 7.5, 7.9: Validate file size (10MB max)
    if (dto.fileSize > MAX_FILE_SIZE) {
      throw new ApplicationError(
        'INVALID_FILE_SIZE',
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        400
      );
    }

    // Requirement 7.4: Validate file type
    if (!ALLOWED_MIME_TYPES.includes(dto.mimeType)) {
      throw new ApplicationError(
        'INVALID_FILE_TYPE',
        'File type not allowed. Only PDF, DOCX, and images (JPEG, PNG, GIF) are supported',
        400
      );
    }

    // Update file metadata
    material.updateFile(dto.filePath, dto.fileName, dto.fileSize, dto.mimeType);
  }

  /**
   * Update text content
   * 
   * Requirements:
   * - 7.7: Allow teachers to edit existing materials
   * - 7.2: Text content with rich text formatting
   * - 7.8: Sanitize HTML content before storage
   * - 20.2: Input validation and sanitization
   * 
   * @param material - Material entity to update
   * @param dto - UpdateMaterialDTO with new text content
   * @throws ApplicationError if validation fails
   * @private
   */
  private updateTextContent(material: any, dto: UpdateMaterialDTO): void {
    // Only update if new content is provided
    if (dto.content === undefined) {
      return; // No content update requested
    }

    // Validate content is not empty
    if (!dto.content || dto.content.trim().length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Content cannot be empty for TEXT type material',
        400
      );
    }

    // Requirement 7.8, 20.2: Sanitize HTML content
    const sanitizedContent = sanitizeHtml(dto.content, {
      allowedTags: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
      ],
      allowedAttributes: {
        'a': ['href', 'target', 'rel']
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      transformTags: {
        'a': (_tagName, attribs) => {
          // Force external links to open in new tab with security attributes
          return {
            tagName: 'a',
            attribs: {
              ...attribs,
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          };
        }
      }
    });

    // Update text content
    material.updateTextContent(sanitizedContent);
  }

  /**
   * Update video link
   * 
   * Requirements:
   * - 7.7: Allow teachers to edit existing materials
   * - 7.3: Validate URL format
   * - 7.11: Only YouTube and Vimeo links allowed
   * 
   * @param material - Material entity to update
   * @param dto - UpdateMaterialDTO with new video URL
   * @throws ApplicationError if validation fails
   * @private
   */
  private updateVideoLink(material: any, dto: UpdateMaterialDTO): void {
    // Only update if new content (URL) is provided
    if (dto.content === undefined) {
      return; // No URL update requested
    }

    // Validate URL is not empty
    if (!dto.content || dto.content.trim().length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'URL cannot be empty for VIDEO_LINK type material',
        400
      );
    }

    // Requirement 7.3, 7.11: Validate URL format and platform
    try {
      const url = new URL(dto.content);
      
      // Must use HTTPS
      if (url.protocol !== 'https:') {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          'Video links must use HTTPS protocol',
          400
        );
      }

      // Requirement 7.11: Only YouTube and Vimeo allowed
      const hostname = url.hostname.toLowerCase();
      const isYouTube = hostname.includes('youtube.com') || hostname.includes('youtu.be');
      const isVimeo = hostname.includes('vimeo.com');

      if (!isYouTube && !isVimeo) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          'Video links must be from YouTube or Vimeo',
          400
        );
      }

      // Update video URL
      material.updateVideoUrl(dto.content);
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Invalid URL format for video link',
        400
      );
    }
  }

  /**
   * Load material from repository
   * 
   * @param materialId - Material ID
   * @returns Material entity
   * @throws ApplicationError if material not found
   * @private
   */
  private async loadMaterial(materialId: string) {
    const material = await this.materialRepository.findById(materialId);
    
    if (!material) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Material not found',
        404
      );
    }
    
    return material;
  }

  /**
   * Load user from repository
   * 
   * @param userId - User ID
   * @returns User entity
   * @throws ApplicationError if user not found
   * @private
   */
  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError(
        'AUTH_REQUIRED',
        'User not found',
        401
      );
    }
    
    return user;
  }

  /**
   * Load course from repository
   * 
   * @param courseId - Course ID
   * @returns Course entity
   * @throws ApplicationError if course not found
   * @private
   */
  private async loadCourse(courseId: string) {
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Course not found',
        404
      );
    }
    
    return course;
  }
}
