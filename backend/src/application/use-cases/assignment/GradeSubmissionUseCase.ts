/**
 * Grade Submission Use Case (Assignment)
 * 
 * Handles grading of assignment submissions with teacher authorization validation,
 * optimistic locking for concurrent grading prevention, grade validation,
 * and automatic assignment locking on first grade.
 * 
 * Requirements:
 * - 13.1: Starting to grade closes assignment to prevent further submissions
 * - 13.2: Display all submitted content (files, text, or quiz answers)
 * - 13.3: Validate grade is between 0 and 100
 * - 13.4: Store grade with submission
 * - 13.5: Allow teachers to edit grades after saving
 * - 21.5: Handle concurrent user requests without data corruption (optimistic locking)
 */

import { injectable, inject } from 'tsyringe';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository';
import type { IAssignmentSubmissionRepository } from '../../../domain/repositories/IAssignmentSubmissionRepository';
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
export class GradeSubmissionUseCase {
  constructor(
    @inject('IAssignmentRepository') private assignmentRepository: IAssignmentRepository,
    @inject('IAssignmentSubmissionRepository') private submissionRepository: IAssignmentSubmissionRepository,
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute assignment submission grading
   * 
   * Requirements:
   * - 13.1: Lock assignment on first grade
   * - 13.2: Validate submission exists
   * - 13.3: Validate grade is between 0 and 100
   * - 13.4: Store grade with submission
   * - 13.5: Support grade updates
   * - 21.5: Optimistic locking for concurrent grading prevention
   * 
   * @param dto - GradeAssignmentSubmissionDTO with grade and feedback
   * @param submissionId - ID of the submission being graded
   * @param userId - ID of the teacher grading the submission
   * @returns AssignmentSubmissionDTO of the graded submission
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

    // Validate teacher authorization (Requirement 13.1)
    this.validateTeacherAuthorization(user, course);

    // Validate course is not archived (Requirement 5.11 - read-only access)
    if (course.isArchived()) {
      throw new ApplicationError(
        'RESOURCE_ARCHIVED',
        'Cannot grade submissions in archived course. Archived courses are read-only.',
        400
      );
    }

    // Validate grade value (Requirement 13.3)
    this.validateGrade(dto.grade);

    // Lock assignment on first grade (Requirement 13.1)
    // This must happen before grading to prevent race conditions
    if (!assignment.hasGradingStarted()) {
      assignment.startGrading();
      await this.assignmentRepository.update(assignment);
    }

    // Grade the submission with optimistic locking (Requirement 13.4, 21.5)
    try {
      if (submission.isGraded()) {
        // Update existing grade (Requirement 13.5)
        submission.updateGrade(dto.grade, dto.feedback, dto.version);
      } else {
        // Assign new grade (Requirement 13.4)
        submission.assignGrade(dto.grade, dto.feedback, dto.version);
      }

      // Save graded submission
      const gradedSubmission = await this.submissionRepository.update(submission);

      // Return graded submission DTO
      return AssignmentSubmissionMapper.toDTO(gradedSubmission);
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
   * - 13.1: Only teachers can grade submissions
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
        'You do not have permission to grade submissions in this course'
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
