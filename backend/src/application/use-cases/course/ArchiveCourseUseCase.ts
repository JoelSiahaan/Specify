/**
 * Archive Course Use Case
 * 
 * Handles course archiving with teacher ownership validation.
 * Archiving a course prevents new enrollments and closes all assignments/quizzes.
 * 
 * Requirements:
 * - 5.4: Archive course (hide from active lists, prevent new enrollments)
 * - 5.5: Automatically close all open assignments and quizzes
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { AuthorizationPolicy } from '../../policies/AuthorizationPolicy.js';
import { User } from '../../../domain/entities/User.js';
import { CourseDTO } from '../../dtos/CourseDTO.js';
import { CourseMapper } from '../../mappers/CourseMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class ArchiveCourseUseCase {
  constructor(
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute course archiving
   * 
   * @param courseId - ID of the course to archive
   * @param userId - ID of the user archiving the course
   * @returns CourseDTO of the archived course
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if course not found
   * @throws ApplicationError if course is already archived
   */
  async execute(courseId: string, userId: string): Promise<CourseDTO> {
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

    // Validate course is not already archived FIRST (Requirement 5.4)
    // Business logic check should happen before authorization check
    if (course.isArchived()) {
      throw new ApplicationError(
        'RESOURCE_ARCHIVED',
        'Course is already archived',
        400
      );
    }

    // Validate teacher ownership (Requirement 5.4)
    if (!this.authPolicy.canArchiveCourse(user, course)) {
      throw new ApplicationError(
        'NOT_OWNER',
        'You do not have permission to archive this course',
        403
      );
    }

    // Archive the course (Requirement 5.4)
    // This will set status to ARCHIVED
    course.archive();

    // Save archived course to repository
    // Note: Requirement 5.5 (closing assignments/quizzes) will be handled
    // by the repository implementation or a separate service when those
    // features are implemented
    const archivedCourse = await this.courseRepository.update(course);

    // Return course DTO
    return CourseMapper.toDTO(archivedCourse);
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
