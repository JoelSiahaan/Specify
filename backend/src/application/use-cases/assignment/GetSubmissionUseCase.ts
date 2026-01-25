/**
 * Get Submission Use Case
 * 
 * Retrieves a submission by ID with authorization validation.
 * Students can view their own submissions, teachers can view all submissions in their courses.
 * 
 * Requirements:
 * - 10.12: Allow students to view their own submissions
 */

import { injectable, inject } from 'tsyringe';
import type { IAssignmentSubmissionRepository } from '../../../domain/repositories/IAssignmentSubmissionRepository';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { Course } from '../../../domain/entities/Course';
import { AssignmentSubmission } from '../../../domain/entities/AssignmentSubmission';
import { Assignment } from '../../../domain/entities/Assignment';
import { AssignmentSubmissionDTO } from '../../dtos/AssignmentDTO';
import { AssignmentSubmissionMapper } from '../../mappers/AssignmentSubmissionMapper';
import { NotFoundError, ForbiddenError } from '../../errors/ApplicationErrors';

@injectable()
export class GetSubmissionUseCase {
  constructor(
    @inject('IAssignmentSubmissionRepository') private submissionRepository: IAssignmentSubmissionRepository,
    @inject('IAssignmentRepository') private assignmentRepository: IAssignmentRepository,
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute get submission
   * 
   * Requirements:
   * - 10.12: Students can view their own submissions
   * - Teachers can view all submissions in their courses
   * 
   * @param submissionId - ID of the submission to retrieve
   * @param userId - ID of the user requesting the submission
   * @returns AssignmentSubmissionDTO of the requested submission
   * @throws NotFoundError if user, submission, assignment, or course not found
   * @throws ForbiddenError if user is not authorized to view the submission
   */
  async execute(submissionId: string, userId: string): Promise<AssignmentSubmissionDTO> {
    // Load entities
    const user = await this.loadUser(userId);
    const submission = await this.loadSubmission(submissionId);
    const assignment = await this.loadAssignment(submission.getAssignmentId());
    const course = await this.loadCourse(assignment.getCourseId());

    // Validate authorization (Requirement 10.12)
    this.validateAuthorization(user, submission, course);

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
   * Load submission from repository
   * 
   * @param submissionId - Submission ID
   * @returns AssignmentSubmission entity
   * @throws NotFoundError if submission not found
   * @private
   */
  private async loadSubmission(submissionId: string): Promise<AssignmentSubmission> {
    const submission = await this.submissionRepository.findById(submissionId);
    
    if (!submission) {
      throw new NotFoundError(
        'RESOURCE_NOT_FOUND',
        'Submission not found'
      );
    }
    
    return submission;
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
   * Validate user authorization to view submission
   * 
   * Requirements:
   * - 10.12: Students can view their own submissions
   * - Teachers can view all submissions in their courses
   * 
   * Authorization Rules:
   * - Students: Can only view their own submissions
   * - Teachers: Can view all submissions in courses they own
   * 
   * @param user - User entity
   * @param submission - AssignmentSubmission entity
   * @param course - Course entity
   * @throws ForbiddenError if user is not authorized
   * @private
   */
  private validateAuthorization(user: User, submission: AssignmentSubmission, course: Course): void {
    if (!this.authPolicy.canViewSubmission(user, submission.getStudentId(), course)) {
      throw new ForbiddenError(
        'FORBIDDEN_RESOURCE',
        'You do not have permission to view this submission'
      );
    }
  }
}
