/**
 * PrismaMaterialRepository Implementation (Adapter)
 * 
 * Concrete implementation of IMaterialRepository using Prisma ORM.
 * This is an Adapter in Clean Architecture - implements the Port defined in domain layer.
 * 
 * Requirements:
 * - 17.1: Data persistence with PostgreSQL
 * - 17.2: Repository pattern implementation
 * - 17.3: Infrastructure layer implements domain interfaces
 * 
 * Design Decisions:
 * - Uses Prisma Client for database operations
 * - Maps between Prisma models and domain entities
 * - Handles database-specific errors (foreign key constraints, etc.)
 * - Registered as singleton in DI container (shared connection pool)
 */

import { PrismaClient, MaterialType as PrismaMaterialType } from '@prisma/client';
import { injectable, inject } from 'tsyringe';
import { IMaterialRepository } from '../../../domain/repositories/IMaterialRepository.js';
import { Material, MaterialType } from '../../../domain/entities/Material.js';

@injectable()
export class PrismaMaterialRepository implements IMaterialRepository {
  constructor(@inject('PrismaClient') private readonly prisma: PrismaClient) {}

  /**
   * Save a material entity (create or update)
   * 
   * Uses upsert to handle both create and update operations.
   * 
   * Requirements:
   * - 7.1: Store uploaded file metadata
   * - 7.2: Store text content
   * - 7.3: Store video link
   * 
   * @param material - Material entity to save
   * @returns Promise resolving to saved Material entity
   * @throws Error if foreign key constraint violated (invalid courseId)
   */
  async save(material: Material): Promise<Material> {
    try {
      const dbMaterial = await this.prisma.material.upsert({
        where: { id: material.getId() },
        create: {
          id: material.getId(),
          courseId: material.getCourseId(),
          title: material.getTitle(),
          type: this.mapTypeToPrisma(material.getType()),
          content: material.getContent() || null,
          filePath: material.getFilePath() || null,
          fileName: material.getFileName() || null,
          fileSize: material.getFileSize() || null,
          mimeType: material.getMimeType() || null,
          createdAt: material.getCreatedAt(),
          updatedAt: material.getUpdatedAt()
        },
        update: {
          title: material.getTitle(),
          content: material.getContent() || null,
          filePath: material.getFilePath() || null,
          fileName: material.getFileName() || null,
          fileSize: material.getFileSize() || null,
          mimeType: material.getMimeType() || null,
          updatedAt: material.getUpdatedAt()
        }
      });

      return this.toDomain(dbMaterial);
    } catch (error: any) {
      // Handle Prisma foreign key constraint violation (P2003)
      if (error.code === 'P2003') {
        throw new Error('Course not found');
      }
      throw new Error(`Failed to save material: ${error.message}`);
    }
  }

  /**
   * Find a material by ID
   * 
   * Requirements:
   * - 8.1: Display materials
   * - 8.2: Download files
   * 
   * @param id - Material ID (UUID)
   * @returns Promise resolving to Material entity or null if not found
   */
  async findById(id: string): Promise<Material | null> {
    const dbMaterial = await this.prisma.material.findUnique({
      where: { id }
    });

    return dbMaterial ? this.toDomain(dbMaterial) : null;
  }

  /**
   * Find all materials for a course
   * 
   * Requirements:
   * - 8.1: Display all materials for a course
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Material entities
   */
  async findByCourseId(courseId: string): Promise<Material[]> {
    const dbMaterials = await this.prisma.material.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' }
    });

    return dbMaterials.map(dbMaterial => this.toDomain(dbMaterial));
  }

  /**
   * Update a material entity
   * 
   * Requirements:
   * - 7.7: Allow teachers to edit existing materials
   * 
   * @param material - Material entity to update
   * @returns Promise resolving to updated Material entity
   * @throws Error if material not found or update operation fails
   */
  async update(material: Material): Promise<Material> {
    try {
      const dbMaterial = await this.prisma.material.update({
        where: { id: material.getId() },
        data: {
          title: material.getTitle(),
          content: material.getContent() || null,
          filePath: material.getFilePath() || null,
          fileName: material.getFileName() || null,
          fileSize: material.getFileSize() || null,
          mimeType: material.getMimeType() || null,
          updatedAt: material.getUpdatedAt()
        }
      });

      return this.toDomain(dbMaterial);
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Material with ID ${material.getId()} not found`);
      }
      throw new Error(`Failed to update material: ${error.message}`);
    }
  }

  /**
   * Delete a material by ID
   * 
   * Requirements:
   * - 7.6: Delete material
   * 
   * Note: File deletion from storage is handled by use case layer
   * This method only removes the database record
   * 
   * @param id - Material ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if material not found or delete operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.material.delete({
        where: { id }
      });
    } catch (error: any) {
      // Handle Prisma record not found (P2025)
      if (error.code === 'P2025') {
        throw new Error(`Material with ID ${id} not found`);
      }
      throw new Error(`Failed to delete material: ${error.message}`);
    }
  }

  /**
   * Delete all materials for a course
   * 
   * Requirements:
   * - 5.7: Cascade delete when course is deleted
   * 
   * Note: File deletion from storage is handled by use case layer
   * This method only removes the database records
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to number of deleted materials
   */
  async deleteByCourseId(courseId: string): Promise<number> {
    const result = await this.prisma.material.deleteMany({
      where: { courseId }
    });

    return result.count;
  }

  /**
   * Map Prisma Material model to domain Material entity
   * 
   * @param dbMaterial - Prisma Material model
   * @returns Domain Material entity
   */
  private toDomain(dbMaterial: any): Material {
    return Material.reconstitute({
      id: dbMaterial.id,
      courseId: dbMaterial.courseId,
      title: dbMaterial.title,
      type: this.mapTypeToDomain(dbMaterial.type),
      content: dbMaterial.content || undefined,
      filePath: dbMaterial.filePath || undefined,
      fileName: dbMaterial.fileName || undefined,
      fileSize: dbMaterial.fileSize || undefined,
      mimeType: dbMaterial.mimeType || undefined,
      createdAt: dbMaterial.createdAt,
      updatedAt: dbMaterial.updatedAt
    });
  }

  /**
   * Map domain MaterialType to Prisma MaterialType enum
   * 
   * @param type - Domain MaterialType
   * @returns Prisma MaterialType enum
   */
  private mapTypeToPrisma(type: MaterialType): PrismaMaterialType {
    return type as unknown as PrismaMaterialType;
  }

  /**
   * Map Prisma MaterialType enum to domain MaterialType
   * 
   * @param type - Prisma MaterialType enum
   * @returns Domain MaterialType
   */
  private mapTypeToDomain(type: PrismaMaterialType): MaterialType {
    return type as unknown as MaterialType;
  }
}
