/**
 * Get Material By ID Use Case
 * 
 * Retrieves a single material by ID with authorization check.
 * 
 * Requirements:
 * - 8.1: Students view all materials in enrolled courses
 */

import { injectable, inject } from 'tsyringe';
import type { IMaterialRepository } from '../../../domain/repositories/IMaterialRepository.js';
import { PrismaMaterialRepository } from '../../../infrastructure/persistence/repositories/PrismaMaterialRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import { PrismaEnrollmentRepository } from '../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { AuthorizationPolicy } from '../../policies/AuthorizationPolicy.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { MaterialDTO } from '../../dtos/MaterialDTO.js';
import { MaterialMapper } from '../../mappers/MaterialMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class GetMaterialByIdUseCase {
  constructor(
    @inject(PrismaMaterialRepository) private materialRepository: IMaterialRepository,
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(PrismaEnrollmentRepository) private enrollmentRepository: IEnrollmentRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute get material by ID
   * 
   * @param materialId - Material ID
   * @param userId - ID of the user requesting the material
   * @returns MaterialDTO
   * @throws ApplicationError if material not found
   * @throws ApplicationError if user not authorized
   */
  async execute(materialId: string, userId: string): Promise<MaterialDTO> {
    // Load material
    const material = await this.materialRepository.findById(materialId);
    
    if (!material) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Material not found',
        404
      );
    }

    // Load course to check authorization
    const course = await this.courseRepository.findById(material.getCourseId());
    
    if (!course) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Course not found',
        404
      );
    }

    // Load user
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError(
        'AUTH_REQUIRED',
        'User not found',
        401
      );
    }

    // Check authorization: teacher owns course OR student is enrolled
    const isTeacher = this.authPolicy.canAccessCourse(user, course, { isEnrolled: false });
    
    if (!isTeacher) {
      // Check if student is enrolled
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
        userId,
        material.getCourseId()
      );
      
      if (!enrollment) {
        throw new ApplicationError(
          'NOT_ENROLLED',
          'You must be enrolled in this course to view materials',
          403
        );
      }
    }

    // Convert to DTO
    return MaterialMapper.toDTO(material);
  }
}
