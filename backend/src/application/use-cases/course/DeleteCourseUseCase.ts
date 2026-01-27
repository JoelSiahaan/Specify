/**
 * Delete Course Use Case
 * 
 * Handles course deletion with teacher ownership validation and archived status check.
 * Only archived courses can be deleted, and deletion cascades to all related data.
 * 
 * Requirements:
 * - 5.6: Only archived courses can be deleted
 * - 5.7: Cascade delete all related data (materials, assignments, quizzes, submissions, enrollments)
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { ApplicationError } from '../../errors/ApplicationErrors';

@injectable()
export class DeleteCourseUseCase {
  constructor(
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute course deletion
   * 
   * @param courseId - ID of the course to delete
   * @param userId - ID of the user deleting the course
   * @returns Promise resolving to void on success
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if course not found
   * @throws ApplicationError if course is not archived
   */
  async execute(courseId: string, userId: string): Promise<void> {
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

    // Check if user is the owner
    const isOwner = this.authPolicy.canDeleteCourse(user, course);
    
    if (isOwner) {
      // Owner: Check business logic first (Requirement 5.6)
      // Return 400 if course is not archived
      try {
        course.validateCanDelete();
      } catch (error) {
        throw new ApplicationError(
          'RESOURCE_ACTIVE',
          'Cannot delete active course. Archive the course first',
          400
        );
      }
    } else {
      // Non-owner: Return 403 immediately (security first)
      throw new ApplicationError(
        'NOT_OWNER',
        'You do not have permission to delete this course',
        403
      );
    }

    // Delete course from repository (Requirement 5.7)
    // Repository implementation will handle cascade deletion of:
    // - Materials
    // - Assignments
    // - Quizzes
    // - Submissions
    // - Enrollments
    await this.courseRepository.delete(courseId);

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
