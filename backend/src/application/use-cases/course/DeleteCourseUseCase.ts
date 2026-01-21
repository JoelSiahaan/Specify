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
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { ApplicationError } from '../../errors/ApplicationErrors';

@injectable()
export class DeleteCourseUseCase {
  constructor(
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
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

    // Validate teacher ownership (Requirement 5.6)
    if (!this.authPolicy.canDeleteCourse(user, course)) {
      throw new ApplicationError(
        'NOT_OWNER',
        'You do not have permission to delete this course',
        403
      );
    }

    // Validate course is archived (Requirement 5.6)
    // This will throw an error if course is active
    try {
      course.validateCanDelete();
    } catch (error) {
      throw new ApplicationError(
        'RESOURCE_ACTIVE',
        'Cannot delete active course. Archive the course first',
        400
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
    // Note: In a real implementation, we would inject IUserRepository
    // For now, we create a mock user for authorization check
    // This will be properly implemented when IUserRepository is available in DI
    const { IUserRepository } = await import('../../../domain/repositories/IUserRepository');
    const { container } = await import('tsyringe');
    
    try {
      const userRepository = container.resolve<typeof IUserRepository>('IUserRepository' as any);
      const user = await (userRepository as any).findById(userId);
      
      if (!user) {
        throw new ApplicationError(
          'AUTH_REQUIRED',
          'User not found',
          401
        );
      }
      
      return user;
    } catch (error) {
      throw new ApplicationError(
        'AUTH_REQUIRED',
        'User not found',
        401
      );
    }
  }
}
