/**
 * List Materials Use Case
 * 
 * Handles material listing with enrollment or ownership validation.
 * Students can view materials if enrolled in the course.
 * Teachers can view materials if they own the course.
 * 
 * Requirements:
 * - 8.1: Students and teachers can view course materials
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import type { IMaterialRepository } from '../../../domain/repositories/IMaterialRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { User } from '../../../domain/entities/User.js';
import { MaterialDTO } from '../../dtos/MaterialDTO.js';
import { MaterialMapper } from '../../mappers/MaterialMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class ListMaterialsUseCase {
  constructor(
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IMaterialRepository') private materialRepository: IMaterialRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IEnrollmentRepository') private enrollmentRepository: IEnrollmentRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute material listing
   * 
   * Business Rules:
   * - Students: Can view materials if enrolled in the course
   * - Teachers: Can view materials if they own the course
   * - Materials are returned in creation order (oldest first)
   * 
   * @param courseId - ID of the course
   * @param userId - ID of the user requesting the list
   * @returns Array of MaterialDTO
   * @throws ApplicationError if user not found
   * @throws ApplicationError if course not found
   * @throws ApplicationError if user not authorized to view materials
   */
  async execute(courseId: string, userId: string): Promise<MaterialDTO[]> {
    // Load user and course for authorization
    const user = await this.loadUser(userId);
    const course = await this.loadCourse(courseId);

    // Check enrollment status for authorization context
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(userId, courseId);
    const isEnrolled = enrollment !== null;
    
    // Validate enrollment or ownership (Requirement 8.1)
    // Students must be enrolled, teachers must own the course
    if (!this.authPolicy.canViewMaterials(user, course, { isEnrolled })) {
      throw new ApplicationError(
        'FORBIDDEN_RESOURCE',
        'You do not have permission to view materials for this course',
        403
      );
    }

    // Get all materials for the course
    const materials = await this.materialRepository.findByCourseId(courseId);

    // Convert to DTOs
    return materials.map(material => MaterialMapper.toDTO(material));
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
