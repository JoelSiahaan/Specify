/**
 * Delete Material Use Case
 * 
 * Handles material deletion with teacher authorization and file cleanup.
 * Deletes file from storage if material type is FILE.
 * 
 * Requirements:
 * - 7.6: Allow teachers to delete materials
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IMaterialRepository } from '../../../domain/repositories/IMaterialRepository.js';
import { PrismaMaterialRepository } from '../../../infrastructure/persistence/repositories/PrismaMaterialRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import type { IFileStorage } from '../../../domain/storage/IFileStorage.js';
import { LocalFileStorage } from '../../../infrastructure/storage/LocalFileStorage.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { AuthorizationPolicy } from '../../policies/AuthorizationPolicy.js';
import { User } from '../../../domain/entities/User.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class DeleteMaterialUseCase {
  constructor(
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(PrismaMaterialRepository) private materialRepository: IMaterialRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(LocalFileStorage) private fileStorage: IFileStorage,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute material deletion
   * 
   * @param materialId - ID of the material to delete
   * @param userId - ID of the user deleting the material
   * @returns Promise resolving to void on success
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if material not found
   */
  async execute(materialId: string, userId: string): Promise<void> {
    // Load user to check authorization
    const user = await this.loadUser(userId);

    // Load material
    const material = await this.materialRepository.findById(materialId);
    if (!material) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Material not found',
        404
      );
    }

    // Load course for authorization
    const course = await this.courseRepository.findById(material.getCourseId());
    if (!course) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Course not found',
        404
      );
    }

    // Validate teacher ownership FIRST (Authorization before business logic)
    // Requirement 7.6: Only course owner can delete materials
    if (!this.authPolicy.canManageMaterials(user, course)) {
      throw new ApplicationError(
        'FORBIDDEN_RESOURCE',
        'Only the course owner can delete materials',
        403
      );
    }

    // Validate course is not archived (read-only)
    if (course.isArchived()) {
      throw new ApplicationError(
        'RESOURCE_ARCHIVED',
        'Cannot delete materials from archived course',
        400
      );
    }

    // Delete file from storage if material is FILE type
    if (material.isFile()) {
      const filePath = material.getFilePath();
      if (filePath) {
        try {
          await this.fileStorage.delete(filePath);
        } catch (error) {
          // Log error but don't fail deletion if file doesn't exist
          // Material record should still be deleted from database
          console.error(`Failed to delete file: ${filePath}`, error);
        }
      }
    }

    // Delete material from repository
    await this.materialRepository.delete(materialId);

    // Success - no return value needed
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
}
