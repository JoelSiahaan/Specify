/**
 * Update Grade Use Case (Assignment)
 * 
 * Handles updating grades for assignment submissions with teacher authorization validation,
 * optimistic locking for concurrent grading prevention, and grade validation.
 * 
 * Requirements:
 * - 13.5: Allow teachers to edit grades after saving
 * - 13.6: Update grade and feedback
 * - 21.5: Handle concurrent user requests without data corruption (optimistic locking)
 */

import { injectable, inject } from 'tsyringe';
import type { IAssignmentSubmissionRepository } from '../../../domain/repositories/IAssignmentSubmissionRepository';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { Course } from '../../../domain/entities/Course';
import { Assignment } from '../../../domain/entities/Assignment';
import { AssignmentSubmission } from '../../../domain/entities/AssignmentSubmission';
import { GradeAssignmentSubmissionDTO, AssignmentSubmissionDTO } from '../../dtos/AssignmentDTO';
import { AssignmentSubmissionMapper } from '../../mappers/AssignmentSubmissionMapper';
import { ApplicationError, NotFoundError, ForbiddenError } from '../../errors/ApplicationErrors';

@injectable()
export class UpdateGradeUseCase {
  constructor(
    @inject('IAssignmentSubmissionRepository') private submissionRepository: IAssignmentSubmissionRepository,
    @inject('IAssignmentRepository') private assignmentRepository: IAssignmentRepository,
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute grade update for assignment submission
   * 
   * Requirements:
   * - 13.5: Allow teachers to edit grades after saving
   * - 13.6: Update grade and feedback
   * - 21.5: Optimistic locking for concurrent grading prevention
   * 
   * @param dto - GradeAssignmentSubmissionDTO with updated grade and feedback
   * @param submissionId - ID of the submission being updated
   * @param userId - ID of the teacher updating the grade
   * @returns AssignmentSubmissionDTO of the updated submission
   * @throws NotFoundError if user, submission, assignment, or course not found
   * @throws ForbiddenError if user is not authorized
   * @throws ApplicationError if validation fails or version conflict
   */
  async execute(
    dto: GradeAssignmentSubmissionDTO,
    submissionId: string,
    userId: string
  ): Promise<AssignmentSubmissionDTO> {
    // Load entities
    const user = await this.loadUser(userId);
    const submission = await this.loadSubmission(submissionId);
    const assignment = await this.loadAssignment(submission.getAssignmentId());
    const course = await this.loadCourse(assignment.getCourseId());

    // Validate teacher authorization (Requirement 13.5)
    this.validateTeacherAuthorization(user, course);

    // Validate submission is already graded (Requirement 13.5)
    if (!submission.isGraded()) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Cannot update grade for submission that has not been graded yet',
        400
      );
    }

    // Validate grade value (Requirement 13.6)
    this.validateGrade(dto.grade);

    // Update the grade with optimistic locking (Requirement 13.6, 21.5)
    try {
      submission.updateGrade(dto.grade, dto.feedback, dto.version);

      // Save updated submission
      const updatedSubmission = await this.submissionRepository.update(submission);

      // Return updated submission DTO
      return AssignmentSubmissionMapper.toDTO(updatedSubmission);
    } catch (error) {
      // Handle optimistic locking conflict (Requirement 21.5)
      if (error instanceof Error && error.message.includes('modified by another user')) {
        throw new ApplicationError(
          'CONCURRENT_MODIFICATION',
          'This submission has been modified by another user. Please refresh and try again.',
          409
        );
      }
      throw error;
    }
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
   * Validate teacher authorization
   * 
   * Requirements:
   * - 13.5: Only teachers can update grades
   * - 2.2: Teacher must be the course owner
   * 
   * @param user - User entity
   * @param course - Course entity
   * @throws ForbiddenError if user is not authorized
   * @private
   */
  private validateTeacherAuthorization(user: User, course: Course): void {
    if (!this.authPolicy.canGradeSubmissions(user, course)) {
      throw new ForbiddenError(
        'NOT_OWNER',
        'You do not have permission to update grades in this course'
      );
    }
  }

  /**
   * Validate grade value
   * 
   * Requirements:
   * - 13.3: Validate grade is between 0 and 100
   * 
   * @param grade - Grade value
   * @throws ApplicationError if grade is invalid
   * @private
   */
  private validateGrade(grade: number): void {
    if (typeof grade !== 'number' || isNaN(grade)) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Grade must be a valid number',
        400
      );
    }

    if (grade < 0 || grade > 100) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Grade must be between 0 and 100',
        400
      );
    }
  }
}
