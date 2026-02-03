/**
 * EnrollStudentUseCase
 * 
 * Use case for enrolling a student in a course using a course code.
 * Validates student role, course existence, course status, and prevents duplicate enrollment.
 * 
 * Requirements:
 * - 6.5: Enroll student in active course using course code
 * - 6.6: Reject enrollment for archived courses
 * - 6.7: Reject enrollment with invalid course code
 * - 6.8: Prevent duplicate enrollment
 * 
 * Business Rules:
 * - Only students can enroll in courses
 * - Course must exist and be active
 * - Student cannot enroll in same course twice
 * - Course code must be valid
 */

import { inject, injectable } from 'tsyringe';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import { CreateEnrollmentDTO, EnrollmentDTO } from '../../dtos/EnrollmentDTO.js';
import { EnrollmentMapper } from '../../mappers/EnrollmentMapper.js';
import { 
  UnauthorizedError, 
  ForbiddenError, 
  NotFoundError, 
  ConflictError 
} from '../../errors/ApplicationErrors.js';

@injectable()
export class EnrollStudentUseCase {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('ICourseRepository') private readonly courseRepository: ICourseRepository,
    @inject('IEnrollmentRepository') private readonly enrollmentRepository: IEnrollmentRepository
  ) {}

  /**
   * Execute the enroll student use case
   * 
   * Requirements:
   * - 6.5: Enroll student in active course
   * - 6.6: Reject enrollment for archived courses
   * - 6.7: Reject enrollment with invalid course code
   * - 6.8: Prevent duplicate enrollment
   * 
   * @param dto - Create enrollment DTO with course code
   * @param userId - ID of the user enrolling (from JWT token)
   * @returns Promise resolving to EnrollmentDTO
   * @throws UnauthorizedError if user not found
   * @throws ForbiddenError if user is not a student
   * @throws NotFoundError if course code is invalid
   * @throws ConflictError if course is archived or student already enrolled
   */
  async execute(dto: CreateEnrollmentDTO, userId: string): Promise<EnrollmentDTO> {
    // 1. Load user and validate student role
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('AUTH_REQUIRED', 'User not found');
    }

    // Requirement 6.5: Validate student role
    if (!user.isStudent()) {
      throw new ForbiddenError('FORBIDDEN_ROLE', 'Only students can enroll in courses');
    }

    // 2. Validate course code exists
    const course = await this.courseRepository.findByCode(dto.courseCode);
    
    // Requirement 6.7: Reject enrollment with invalid course code
    if (!course) {
      throw new NotFoundError('COURSE_NOT_FOUND', 'Invalid course code');
    }

    // 3. Validate course is active
    // Requirement 6.6: Reject enrollment for archived courses
    if (!course.isActive()) {
      throw new ConflictError('COURSE_ARCHIVED', 'Cannot enroll in archived course');
    }

    // 4. Check for duplicate enrollment
    const existingEnrollment = await this.enrollmentRepository.findByStudentAndCourse(
      userId,
      course.getId()
    );

    // Requirement 6.8: Prevent duplicate enrollment
    if (existingEnrollment) {
      throw new ConflictError('DUPLICATE_ENROLLMENT', 'Student is already enrolled in this course');
    }

    // 5. Create enrollment entity
    const enrollment = EnrollmentMapper.toDomain(course.getId(), userId);

    // 6. Save to repository
    const savedEnrollment = await this.enrollmentRepository.save(enrollment);

    // 7. Return enrollment DTO
    return EnrollmentMapper.toDTO(savedEnrollment);
  }
}
