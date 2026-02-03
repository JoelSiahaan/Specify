/**
 * IMaterialRepository Interface (Port)
 * 
 * Repository interface for Material entity data access.
 * This is a Port in Clean Architecture - defines the contract for data access
 * without specifying implementation details.
 * 
 * Requirements:
 * - 17.1: Data persistence abstraction
 * - 17.2: Repository pattern for data access
 * - 17.3: Domain layer independence from infrastructure
 * 
 * Implementation:
 * - Infrastructure layer provides concrete implementation (Adapter)
 * - Domain layer depends only on this interface (Dependency Inversion)
 */

import { Material } from '../entities/Material.js';

export interface IMaterialRepository {
  /**
   * Save a material entity (create or update)
   * 
   * Requirements:
   * - 7.1: Store uploaded file metadata
   * - 7.2: Store text content
   * - 7.3: Store video link
   * 
   * @param material - Material entity to save
   * @returns Promise resolving to saved Material entity
   * @throws Error if save operation fails
   */
  save(material: Material): Promise<Material>;

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
  findById(id: string): Promise<Material | null>;

  /**
   * Find all materials for a course
   * 
   * Requirements:
   * - 8.1: Display all materials for a course
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Material entities
   */
  findByCourseId(courseId: string): Promise<Material[]>;

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
  update(material: Material): Promise<Material>;

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
  delete(id: string): Promise<void>;

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
  deleteByCourseId(courseId: string): Promise<number>;
}
