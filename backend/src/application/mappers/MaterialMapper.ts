/**
 * Material Mapper
 * 
 * Maps between Material domain entity and MaterialDTOs.
 * Handles bidirectional conversion between domain and application layers.
 * 
 * Requirements:
 * - 18.4: Data transformation between layers
 * - 7.1: File upload support
 * - 7.2: Text content support
 * - 7.3: Video link support
 */

import { Material, MaterialType } from '../../domain/entities/Material';
import { 
  MaterialDTO, 
  CreateMaterialDTO, 
  UpdateMaterialDTO, 
  MaterialListDTO 
} from '../dtos/MaterialDTO';
import { randomUUID } from 'crypto';

export class MaterialMapper {
  /**
   * Convert Material entity to MaterialDTO
   * 
   * @param material - Material domain entity
   * @returns MaterialDTO for API response
   */
  static toDTO(material: Material): MaterialDTO {
    return {
      id: material.getId(),
      courseId: material.getCourseId(),
      title: material.getTitle(),
      type: material.getType(),
      content: material.getContent(),
      filePath: material.getFilePath(),
      fileName: material.getFileName(),
      fileSize: material.getFileSize(),
      mimeType: material.getMimeType(),
      createdAt: material.getCreatedAt(),
      updatedAt: material.getUpdatedAt()
    };
  }

  /**
   * Convert CreateMaterialDTO to Material entity
   * Used for material creation
   * 
   * Requirements:
   * - 7.1: FILE type requires file metadata
   * - 7.2: TEXT type requires content
   * - 7.3: VIDEO_LINK type requires URL
   * 
   * @param dto - CreateMaterialDTO from API request
   * @param courseId - ID of the course
   * @returns Material domain entity
   */
  static toDomain(dto: CreateMaterialDTO, courseId: string): Material {
    return Material.create({
      id: randomUUID(),
      courseId: courseId,
      title: dto.title,
      type: dto.type,
      content: dto.content,
      filePath: dto.filePath,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Convert multiple Material entities to MaterialDTOs
   * 
   * @param materials - Array of Material domain entities
   * @returns Array of MaterialDTOs
   */
  static toDTOList(materials: Material[]): MaterialDTO[] {
    return materials.map(material => this.toDTO(material));
  }

  /**
   * Convert Material entity to MaterialListDTO
   * Used for listing materials with simplified information
   * 
   * @param material - Material domain entity
   * @returns MaterialListDTO for API response
   */
  static toListDTO(material: Material): MaterialListDTO {
    return {
      id: material.getId(),
      courseId: material.getCourseId(),
      title: material.getTitle(),
      type: material.getType(),
      fileName: material.getFileName(),
      fileSize: material.getFileSize(),
      createdAt: material.getCreatedAt(),
      updatedAt: material.getUpdatedAt()
    };
  }

  /**
   * Convert multiple Material entities to MaterialListDTOs
   * 
   * @param materials - Array of Material domain entities
   * @returns Array of MaterialListDTOs
   */
  static toListDTOList(materials: Material[]): MaterialListDTO[] {
    return materials.map(material => this.toListDTO(material));
  }

  /**
   * Apply UpdateMaterialDTO to existing Material entity
   * Updates only the fields provided in the DTO based on material type
   * 
   * Requirements:
   * - 7.7: Allow teachers to edit existing materials
   * - 7.1: FILE type updates (file replacement)
   * - 7.2: TEXT type updates (content editing)
   * - 7.3: VIDEO_LINK type updates (URL editing)
   * 
   * @param material - Existing Material domain entity
   * @param dto - UpdateMaterialDTO with fields to update
   * @returns Updated Material entity
   */
  static applyUpdate(material: Material, dto: UpdateMaterialDTO): Material {
    // Update title if provided
    if (dto.title !== undefined) {
      material.updateTitle(dto.title);
    }

    // Update type-specific content
    if (material.getType() === MaterialType.TEXT && dto.content !== undefined) {
      material.updateTextContent(dto.content);
    }

    if (material.getType() === MaterialType.VIDEO_LINK && dto.content !== undefined) {
      material.updateVideoUrl(dto.content);
    }

    if (material.getType() === MaterialType.FILE) {
      // File replacement: all file metadata must be provided together
      if (dto.filePath && dto.fileName && dto.fileSize && dto.mimeType) {
        material.updateFile(dto.filePath, dto.fileName, dto.fileSize, dto.mimeType);
      }
    }

    return material;
  }

  /**
   * Create Material entity from file upload
   * Helper method for creating FILE type materials
   * 
   * Requirements:
   * - 7.1: File upload support
   * 
   * @param courseId - ID of the course
   * @param title - Material title
   * @param filePath - Path to uploaded file
   * @param fileName - Original file name
   * @param fileSize - File size in bytes
   * @param mimeType - MIME type
   * @returns Material domain entity
   */
  static fromFileUpload(
    courseId: string,
    title: string,
    filePath: string,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): Material {
    return Material.create({
      id: randomUUID(),
      courseId: courseId,
      title: title,
      type: MaterialType.FILE,
      filePath: filePath,
      fileName: fileName,
      fileSize: fileSize,
      mimeType: mimeType,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Create Material entity from text content
   * Helper method for creating TEXT type materials
   * 
   * Requirements:
   * - 7.2: Text content support
   * 
   * @param courseId - ID of the course
   * @param title - Material title
   * @param content - HTML content
   * @returns Material domain entity
   */
  static fromTextContent(
    courseId: string,
    title: string,
    content: string
  ): Material {
    return Material.create({
      id: randomUUID(),
      courseId: courseId,
      title: title,
      type: MaterialType.TEXT,
      content: content,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Create Material entity from video link
   * Helper method for creating VIDEO_LINK type materials
   * 
   * Requirements:
   * - 7.3: Video link support
   * 
   * @param courseId - ID of the course
   * @param title - Material title
   * @param url - Video URL (YouTube or Vimeo)
   * @returns Material domain entity
   */
  static fromVideoLink(
    courseId: string,
    title: string,
    url: string
  ): Material {
    return Material.create({
      id: randomUUID(),
      courseId: courseId,
      title: title,
      type: MaterialType.VIDEO_LINK,
      content: url,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}
