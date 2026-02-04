/**
 * Get Assignment By ID Use Case
 * 
 * Retrieves a single assignment by ID with authorization check.
 * 
 * Requirements:
 * - 9.11: Allow teachers to view all assignments for a course
 */

import { injectable, inject } from 'tsyringe';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository.js';
import { PrismaAssignmentRepository } from '../../../infrastructure/persistence/repositories/PrismaAssignmentRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import { PrismaEnrollmentRepository } from '../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { AuthorizationPolicy } from '../../policies/AuthorizationPolicy.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { AssignmentDTO } from '../../dtos/AssignmentDTO.js';
import { AssignmentMapper } from '../../mappers/AssignmentMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class GetAssignmentByIdUseCase {
  constructor(
    @inject(PrismaAssignmentRepository) private assignmentRepository: IAssignmentRepository,
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(PrismaEnrollmentRepository) private enrollmentRepository: IEnrollmentRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute get assignment by ID
   * 
   * @param assignmentId - Assignment ID
   * @param userId - ID of the user requesting the assignment
   * @returns AssignmentDTO
   * @throws ApplicationError if assignment not found
   * @throws ApplicationError if user not authorized
   */
  async execute(assignmentId: string, userId: string): Promise<AssignmentDTO> {
    // Load assignment
    const assignment = await this.assignmentRepository.findById(assignmentId);
    
    if (!assignment) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Assignment not found',
        404
      );
    }

    // Load course to check authorization
    const course = await this.courseRepository.findById(assignment.getCourseId());
    
    if (!course) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Course not found',
        404
      );
    }

    // Load user
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError(
        'AUTH_REQUIRED',
        'User not found',
        401
      );
    }

    // Check authorization: teacher owns course OR student is enrolled
    const isTeacher = this.authPolicy.canAccessCourse(user, course, { isEnrolled: false });
    
    if (!isTeacher) {
      // Check if student is enrolled
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
        userId,
        assignment.getCourseId()
      );
      
      if (!enrollment) {
        throw new ApplicationError(
          'NOT_ENROLLED',
          'You must be enrolled in this course to view assignments',
          403
        );
      }
    }

    // Convert to DTO
    return AssignmentMapper.toDTO(assignment);
  }
}
