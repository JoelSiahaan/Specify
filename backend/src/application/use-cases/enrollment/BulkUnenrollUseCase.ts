/**
 * BulkUnenrollUseCase
 * 
 * Use case for bulk unenrolling all students from an archived course.
 * Validates teacher ownership and course archived status before removing all enrollments.
 * 
 * Requirements:
 * - 5.8: Bulk unenroll feature for archived courses
 * 
 * Business Rules:
 * - Only teachers can bulk unenroll students
 * - Teacher must be the course owner
 * - Course must be archived (not active)
 * - Removes all enrollments for the course
 */

import { inject, injectable } from 'tsyringe';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { 
  UnauthorizedError, 
  ForbiddenError, 
  NotFoundError,
  ConflictError
} from '../../errors/ApplicationErrors.js';

/**
 * Response DTO for bulk unenroll operation
 */
export interface BulkUnenrollResponseDTO {
  success: boolean;
  message: string;
  courseId: string;
  unenrolledCount: number;
}

@injectable()
export class BulkUnenrollUseCase {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('ICourseRepository') private readonly courseRepository: ICourseRepository,
    @inject('IEnrollmentRepository') private readonly enrollmentRepository: IEnrollmentRepository,
    @inject('IAuthorizationPolicy') private readonly authorizationPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute the bulk unenroll use case
   * 
   * Requirements:
   * - 5.8: Bulk unenroll students from archived courses
   * 
   * @param courseId - ID of the course to unenroll students from
   * @param userId - ID of the user performing the action (from JWT token)
   * @returns Promise resolving to BulkUnenrollResponseDTO
   * @throws UnauthorizedError if user not found
   * @throws ForbiddenError if user is not the course owner
   * @throws NotFoundError if course not found
   * @throws ConflictError if course is not archived
   */
  async execute(courseId: string, userId: string): Promise<BulkUnenrollResponseDTO> {
    // 1. Load user and validate exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('AUTH_REQUIRED', 'User not found');
    }

    // 2. Load course and validate exists
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('RESOURCE_NOT_FOUND', 'Course not found');
    }

    // 3. Check authorization - teacher must be course owner
    // Requirement 5.8: Only course owner can bulk unenroll
    if (!this.authorizationPolicy.canDeleteCourse(user, course)) {
      throw new ForbiddenError('NOT_OWNER', 'You do not have permission to unenroll students from this course');
    }

    // 4. Validate course is archived
    // Requirement 5.8: Can only bulk unenroll from archived courses
    if (!course.isArchived()) {
      throw new ConflictError('COURSE_ACTIVE', 'Can only bulk unenroll students from archived courses');
    }

    // 5. Get enrollment count before deletion (for response)
    const enrollments = await this.enrollmentRepository.findByCourse(courseId);
    const enrollmentCount = enrollments.length;

    // 6. Remove all enrollments
    await this.enrollmentRepository.deleteAllByCourse(courseId);

    // 7. Return success response
    return {
      success: true,
      message: `Successfully unenrolled ${enrollmentCount} student(s) from course`,
      courseId: courseId,
      unenrolledCount: enrollmentCount
    };
  }
}
