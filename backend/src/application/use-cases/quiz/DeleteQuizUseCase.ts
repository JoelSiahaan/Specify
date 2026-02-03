/**
 * Delete Quiz Use Case
 * 
 * Handles quiz deletion with teacher ownership validation.
 * Quizzes can be deleted at any time (Requirement 11.13).
 * 
 * Requirements:
 * - 11.13: Allow teachers to delete entire quizzes at any time
 * - 2.1: Role-based access control (only teachers)
 * - 2.2: Resource ownership validation
 */

import { injectable, inject } from 'tsyringe';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { User } from '../../../domain/entities/User.js';
import { Course } from '../../../domain/entities/Course.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class DeleteQuizUseCase {
  constructor(
    @inject('IQuizRepository') private quizRepository: IQuizRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute quiz deletion
   * 
   * @param quizId - ID of the quiz to delete
   * @param userId - ID of the user deleting the quiz
   * @returns Promise resolving to void
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if quiz not found
   */
  async execute(quizId: string, userId: string): Promise<void> {
    // Load user to check authorization
    const user = await this.loadUser(userId);

    // Load quiz
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Quiz not found',
        404
      );
    }

    // Load course to check authorization
    const course = await this.loadCourse(quiz.getCourseId());

    // Validate teacher ownership (Requirements 2.1, 2.2, 11.13)
    if (!this.authPolicy.canManageAssignments(user, course)) {
      throw new ApplicationError(
        'NOT_OWNER',
        'You do not have permission to delete this quiz',
        403
      );
    }

    // Delete quiz from repository (Requirement 11.13)
    // Note: Cascade deletion of quiz submissions is handled by database constraints
    await this.quizRepository.delete(quizId);
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
  private async loadCourse(courseId: string): Promise<Course> {
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
