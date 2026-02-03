/**
 * Get My Submission Use Case
 * 
 * Retrieves a student's submission for a specific assignment.
 * Returns null if no submission exists yet.
 * 
 * Requirements:
 * - 10.12: Allow students to view their own submissions
 */

import { injectable, inject } from 'tsyringe';
import type { IAssignmentSubmissionRepository } from '../../../domain/repositories/IAssignmentSubmissionRepository.js';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { User } from '../../../domain/entities/User.js';
import { Course } from '../../../domain/entities/Course.js';
import { Assignment } from '../../../domain/entities/Assignment.js';
import { AssignmentSubmissionDTO } from '../../dtos/AssignmentDTO.js';
import { AssignmentSubmissionMapper } from '../../mappers/AssignmentSubmissionMapper.js';
import { NotFoundError, ForbiddenError } from '../../errors/ApplicationErrors.js';

@injectable()
export class GetMySubmissionUseCase {
  constructor(
    @inject('IAssignmentSubmissionRepository') private submissionRepository: IAssignmentSubmissionRepository,
    @inject('IAssignmentRepository') private assignmentRepository: IAssignmentRepository,
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IEnrollmentRepository') private enrollmentRepository: IEnrollmentRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute get my submission
   * 
   * Requirements:
   * - 10.12: Students can view their own submissions
   * 
   * @param assignmentId - ID of the assignment
   * @param userId - ID of the student
   * @returns AssignmentSubmissionDTO or null if no submission exists
   * @throws NotFoundError if user, assignment, or course not found
   * @throws ForbiddenError if user is not enrolled in the course
   */
  async execute(assignmentId: string, userId: string): Promise<AssignmentSubmissionDTO | null> {
    // Load entities
    const user = await this.loadUser(userId);
    const assignment = await this.loadAssignment(assignmentId);
    const course = await this.loadCourse(assignment.getCourseId());

    // Validate enrollment
    await this.validateEnrollment(user, course);

    // Find submission
    const submission = await this.submissionRepository.findByAssignmentAndStudent(
      assignmentId,
      userId
    );

    // Return null if no submission exists
    if (!submission) {
      return null;
    }

    // Return submission DTO
    return AssignmentSubmissionMapper.toDTO(submission);
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

  /**
   * Validate student enrollment in course
   * 
   * @param user - User entity
   * @param course - Course entity
   * @throws ForbiddenError if user is not enrolled
   * @private
   */
  private async validateEnrollment(user: User, course: Course): Promise<void> {
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      user.getId(),
      course.getId()
    );

    const context = { isEnrolled: enrollment !== null };

    if (!this.authPolicy.canSubmitAssignment(user, course, context)) {
      throw new ForbiddenError(
        'NOT_ENROLLED',
        'You must be enrolled in this course to view submissions'
      );
    }
  }
}
