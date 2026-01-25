/**
 * List Submissions Use Case
 * 
 * Lists all submissions for an assignment (teacher only).
 * 
 * Requirements:
 * - 11.1: Teachers can view all submissions for their assignments
 * - 11.2: Display submission status (not submitted, submitted, graded)
 * - 11.3: Display student information
 * - 11.4: Display submission date and late status
 */

import { inject, injectable } from 'tsyringe';
import type { IAssignmentSubmissionRepository } from '../../../domain/repositories/IAssignmentSubmissionRepository';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { AssignmentSubmissionMapper } from '../../mappers/AssignmentSubmissionMapper';
import { ForbiddenError, NotFoundError } from '../../errors/ApplicationErrors';
import type { AssignmentSubmissionDTO } from '../../dtos';

/**
 * List Submissions Response
 */
export interface ListSubmissionsResponse {
  data: AssignmentSubmissionDTO[];
}

/**
 * List Submissions Use Case
 * 
 * Business Rules:
 * - Only teachers can list submissions
 * - Teacher must own the course
 * - Returns all submissions for the assignment (including not submitted)
 */
@injectable()
export class ListSubmissionsUseCase {
  constructor(
    @inject('IAssignmentSubmissionRepository')
    private readonly submissionRepository: IAssignmentSubmissionRepository,
    @inject('IAssignmentRepository')
    private readonly assignmentRepository: IAssignmentRepository,
    @inject('ICourseRepository')
    private readonly courseRepository: ICourseRepository,
    @inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @inject('IAuthorizationPolicy')
    private readonly authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute use case
   * 
   * @param assignmentId - Assignment ID
   * @param userId - User ID (teacher)
   * @returns List of submissions
   * @throws NotFoundError if assignment not found
   * @throws ForbiddenError if user is not authorized
   */
  async execute(assignmentId: string, userId: string): Promise<ListSubmissionsResponse> {
    // Load user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ForbiddenError('FORBIDDEN_RESOURCE');
    }

    // Load assignment
    const assignment = await this.assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundError('RESOURCE_NOT_FOUND');
    }

    // Load course
    const course = await this.courseRepository.findById(assignment.getCourseId());
    if (!course) {
      throw new NotFoundError('RESOURCE_NOT_FOUND');
    }

    // Check authorization (teacher must own the course)
    if (!this.authPolicy.canGradeSubmissions(user, course)) {
      throw new ForbiddenError('NOT_OWNER');
    }

    // Get all submissions for the assignment
    const submissions = await this.submissionRepository.findByAssignmentId(assignmentId);

    // Map to DTOs
    const submissionDTOs = submissions.map(submission => 
      AssignmentSubmissionMapper.toDTO(submission)
    );

    return {
      data: submissionDTOs
    };
  }
}
