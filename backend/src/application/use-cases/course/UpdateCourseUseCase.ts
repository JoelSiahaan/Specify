/**
 * Update Course Use Case
 * 
 * Handles course updates with teacher ownership validation and active status check.
 * Only active courses can be updated.
 * 
 * Requirements:
 * - 5.3: Update course details (name and description)
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { AuthorizationPolicy } from '../../policies/AuthorizationPolicy.js';
import { User } from '../../../domain/entities/User.js';
import { UpdateCourseDTO, CourseDTO } from '../../dtos/CourseDTO.js';
import { CourseMapper } from '../../mappers/CourseMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class UpdateCourseUseCase {
  constructor(
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute course update
   * 
   * @param courseId - ID of the course to update
   * @param dto - UpdateCourseDTO with updated course data
   * @param userId - ID of the user updating the course
   * @returns CourseDTO of the updated course
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if course not found
   * @throws ApplicationError if course is archived
   * @throws ApplicationError if validation fails
   */
  async execute(courseId: string, dto: UpdateCourseDTO, userId: string): Promise<CourseDTO> {
    // Load user to check authorization
    const user = await this.loadUser(userId);

    // Load course
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Course not found',
        404
      );
    }

    // Validate course is active FIRST (Requirement 5.3)
    // Business logic check should happen before authorization check
    if (!course.isActive()) {
      throw new ApplicationError(
        'RESOURCE_ARCHIVED',
        'Cannot update archived course',
        400
      );
    }

    // Validate teacher ownership (Requirement 5.3)
    if (!this.authPolicy.canModifyCourse(user, course)) {
      throw new ApplicationError(
        'NOT_OWNER',
        'You do not have permission to modify this course',
        403
      );
    }

    // Update course fields if provided
    if (dto.name !== undefined) {
      if (!dto.name || dto.name.trim().length === 0) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          'Course name cannot be empty',
          400
        );
      }
      course.updateName(dto.name);
    }

    if (dto.description !== undefined) {
      if (!dto.description || dto.description.trim().length === 0) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          'Course description cannot be empty',
          400
        );
      }
      course.updateDescription(dto.description);
    }

    // Save updated course to repository
    const updatedCourse = await this.courseRepository.update(course);

    // Return course DTO
    return CourseMapper.toDTO(updatedCourse);
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
