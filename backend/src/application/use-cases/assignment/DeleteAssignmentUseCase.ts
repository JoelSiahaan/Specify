/**
 * Delete Assignment Use Case
 * 
 * Handles assignment deletion with teacher ownership validation.
 * Teachers can delete assignments at any time (before or after due date).
 * 
 * Requirements:
 * - 9.10: Allow teachers to delete assignments at any time
 */

import { injectable, inject } from 'tsyringe';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { Course } from '../../../domain/entities/Course';
import { Assignment } from '../../../domain/entities/Assignment';
import { ApplicationError, NotFoundError } from '../../errors/ApplicationErrors';

@injectable()
export class DeleteAssignmentUseCase {
  constructor(
    @inject('IAssignmentRepository') private assignmentRepository: IAssignmentRepository,
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute assignment deletion
   * 
   * @param assignmentId - ID of the assignment to delete
   * @param userId - ID of the user deleting the assignment
   * @returns Promise resolving to void
   * @throws NotFoundError if user, assignment, or course not found
   * @throws ApplicationError if user is not authorized
   */
  async execute(assignmentId: string, userId: string): Promise<void> {
    // Load user to check authorization
    const user = await this.loadUser(userId);

    // Load assignment to get course ID
    const assignment = await this.loadAssignment(assignmentId);

    // Load course to check ownership
    const course = await this.loadCourse(assignment.getCourseId());

    // Validate teacher ownership (Requirement 9.10)
    if (!this.authPolicy.canManageAssignments(user, course)) {
      throw new ApplicationError(
        'FORBIDDEN_ROLE',
        'Only the course teacher can delete assignments',
        403
      );
    }

    // Delete assignment from repository
    await this.assignmentRepository.delete(assignmentId);
  }

  /**
   * Load user from repository
   * 
   * @param userId - User ID
   * @returns User entity
   * @throws NotFoundError if user not found
   * @private
   */
  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError(
        'USER_NOT_FOUND',
        'User not found'
      );
    }
    
    return user;
  }

  /**
   * Load assignment from repository
   * 
   * @param assignmentId - Assignment ID
   * @returns Assignment entity
   * @throws NotFoundError if assignment not found
   * @private
   */
  private async loadAssignment(assignmentId: string): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findById(assignmentId);
    
    if (!assignment) {
      throw new NotFoundError(
        'RESOURCE_NOT_FOUND',
        'Assignment not found'
      );
    }
    
    return assignment;
  }

  /**
   * Load course from repository
   * 
   * @param courseId - Course ID
   * @returns Course entity
   * @throws NotFoundError if course not found
   * @private
   */
  private async loadCourse(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new NotFoundError(
        'RESOURCE_NOT_FOUND',
        'Course not found'
      );
    }
    
    return course;
  }
}
