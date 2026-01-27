/**
 * Create Material Use Case
 * 
 * Handles material creation with teacher authorization, file upload validation,
 * HTML sanitization, and URL validation based on material type.
 * 
 * Requirements:
 * - 7.1: Upload files to course (FILE type)
 * - 7.2: Add text content with rich text formatting (TEXT type)
 * - 7.3: Add video links with URL validation (VIDEO_LINK type)
 * - 7.4: Validate file types (PDF, DOCX, images)
 * - 7.5: Enforce file size limit (10MB max)
 * - 7.8: Sanitize HTML content before storage
 * - 7.9: Validate file size before upload
 * - 7.10: No video file uploads allowed
 * - 7.11: Only YouTube and Vimeo links allowed
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
import { CreateMaterialDTO, MaterialDTO } from '../../dtos/MaterialDTO';
import { MaterialMapper } from '../../mappers/MaterialMapper';
import { ApplicationError } from '../../errors/ApplicationErrors';
import { FileValidator } from '../../../infrastructure/validation/FileValidator';

@injectable()
export class CreateMaterialUseCase {
  constructor(
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IMaterialRepository') private materialRepository: IMaterialRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute material creation
   * 
   * @param dto - CreateMaterialDTO with material data
   * @param courseId - ID of the course
   * @param userId - ID of the user creating the material
   * @returns MaterialDTO of the created material
   * @throws ApplicationError if validation fails or user is not authorized
   */
  async execute(dto: CreateMaterialDTO, courseId: string, userId: string): Promise<MaterialDTO> {
    // Load user and course for authorization
    const user = await this.loadUser(userId);
    const course = await this.loadCourse(courseId);

    // Validate teacher ownership (Requirement 7.1, 7.2, 7.3)
    if (!this.authPolicy.canManageMaterials(user, course)) {
      throw new ApplicationError(
        'FORBIDDEN_RESOURCE',
        'Only the course owner can create materials',
        403
      );
    }

    // Validate course is not archived (read-only)
    if (course.isArchived()) {
      throw new ApplicationError(
        'RESOURCE_ARCHIVED',
        'Cannot add materials to archived course',
        400
      );
    }

    // Validate material title
    if (!dto.title || dto.title.trim().length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Material title is required',
        400
      );
    }

    // Validate and process material based on type
    let processedDTO: CreateMaterialDTO;
    
    switch (dto.type) {
      case MaterialType.FILE:
        processedDTO = await this.processFileUpload(dto);
        break;
      
      case MaterialType.TEXT:
        processedDTO = this.processTextContent(dto);
        break;
      
      case MaterialType.VIDEO_LINK:
        processedDTO = this.processVideoLink(dto);
        break;
      
      default:
        throw new ApplicationError(
          'VALIDATION_FAILED',
          `Invalid material type: ${dto.type}`,
          400
        );
    }

    // Create material entity
    const material = MaterialMapper.toDomain(processedDTO, courseId);

    // Save material to repository
    const savedMaterial = await this.materialRepository.save(material);

    // Return material DTO
    return MaterialMapper.toDTO(savedMaterial);
  }

  /**
   * Process file upload
   * 
   * Requirements:
   * - 7.1: Upload files to course
   * - 7.4: Validate file types
   * - 7.5: Enforce file size limit
   * - 7.9: Validate file size before upload
   * - 7.10: No video file uploads
   * - 20.4: Validate file types before accepting uploads
   * - 20.5: Enforce file size limits on all uploads
   * 
   * Note: File validation is now handled by FileValidator in LocalFileStorage.
   * This method validates that file metadata is provided and enforces size limits.
   * 
   * @param dto - CreateMaterialDTO with file data
   * @returns Processed CreateMaterialDTO with file path
   * @throws ApplicationError if validation fails
   * @private
   */
  private async processFileUpload(dto: CreateMaterialDTO): Promise<CreateMaterialDTO> {
    // Validate file metadata is provided
    if (!dto.filePath || !dto.fileName || !dto.fileSize || !dto.mimeType) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'File metadata is required for FILE type material',
        400
      );
    }

    // Requirement 7.5, 7.9, 20.5: Enforce file size limit (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (dto.fileSize > MAX_FILE_SIZE) {
      throw new ApplicationError(
        'INVALID_FILE_SIZE',
        `File size exceeds maximum allowed size of 10MB (${dto.fileSize} bytes)`,
        400
      );
    }

    // File validation (type, content) is also handled by FileValidator
    // in LocalFileStorage.upload() method.
    // The controller uploads the file first, which triggers validation.
    // If we reach here, the file has already been validated and uploaded.

    // Return the DTO with validated metadata
    return dto;
  }

  /**
   * Process text content
   * 
   * Requirements:
   * - 7.2: Add text content with rich text formatting
   * - 7.8: Sanitize HTML content before storage
   * - 20.2: Input validation and sanitization
   * 
   * @param dto - CreateMaterialDTO with text content
   * @returns Processed CreateMaterialDTO with sanitized HTML
   * @throws ApplicationError if validation fails
   * @private
   */
  private processTextContent(dto: CreateMaterialDTO): CreateMaterialDTO {
    // Validate content is provided
    if (!dto.content || dto.content.trim().length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Content is required for TEXT type material',
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

    return {
      ...dto,
      content: sanitizedContent
    };
  }

  /**
   * Process video link
   * 
   * Requirements:
   * - 7.3: Add video links with URL validation
   * - 7.11: Only YouTube and Vimeo links allowed
   * 
   * @param dto - CreateMaterialDTO with video URL
   * @returns Processed CreateMaterialDTO with validated URL
   * @throws ApplicationError if validation fails
   * @private
   */
  private processVideoLink(dto: CreateMaterialDTO): CreateMaterialDTO {
    // Validate URL is provided
    if (!dto.content || dto.content.trim().length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'URL is required for VIDEO_LINK type material',
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

      return dto;
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
