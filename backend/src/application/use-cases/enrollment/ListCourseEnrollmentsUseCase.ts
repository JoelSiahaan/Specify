/**
 * List Course Enrollments Use Case
 * 
 * Lists all enrollments for a course with student details.
 * Used by teachers to view enrolled students.
 * 
 * Requirements:
 * - 5.10: View enrollment counts and student list for courses
 */

import { inject, injectable } from 'tsyringe';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import { PrismaEnrollmentRepository } from '../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { AuthorizationPolicy } from '../../policies/AuthorizationPolicy.js';
import { EnrollmentWithStudentDTO } from '../../dtos/EnrollmentDTO.js';
import { EnrollmentMapper } from '../../mappers/EnrollmentMapper.js';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../../errors/ApplicationErrors.js';

@injectable()
export class ListCourseEnrollmentsUseCase {
  constructor(
    @inject(PrismaEnrollmentRepository) private enrollmentRepository: IEnrollmentRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute use case
   * 
   * @param courseId - Course ID to get enrollments for
   * @param userId - User ID making the request
   * @returns Array of EnrollmentWithStudentDTO
   * @throws UnauthorizedError if user not found
   * @throws NotFoundError if course not found
   * @throws ForbiddenError if user is not the course owner or not enrolled
   */
  async execute(courseId: string, userId: string): Promise<EnrollmentWithStudentDTO[]> {
    // Load user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }

    // Load course
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('RESOURCE_NOT_FOUND');
    }

    // Check authorization
    // Teachers: Must be course owner
    // Students: Must be enrolled in the course
    if (user.isTeacher()) {
      // Teachers can only view enrollments in their own courses
      if (!this.authPolicy.canAccessCourse(user, course, { isEnrolled: undefined })) {
        throw new ForbiddenError('NOT_OWNER');
      }
    } else if (user.isStudent()) {
      // Students must be enrolled to view classmates
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse(userId, courseId);
      if (!enrollment) {
        throw new ForbiddenError('NOT_ENROLLED');
      }
    } else {
      // Unknown role
      throw new ForbiddenError('FORBIDDEN_ROLE');
    }

    // Get all enrollments for the course
    const enrollments = await this.enrollmentRepository.findByCourse(courseId);

    // If no enrollments, return empty array
    if (enrollments.length === 0) {
      return [];
    }

    // Get student IDs
    const studentIds = enrollments.map(e => e.getStudentId());

    // Load all students
    const students = await Promise.all(
      studentIds.map(id => this.userRepository.findById(id))
    );

    // Create maps for student names and emails
    const studentNames = new Map<string, string>();
    const studentEmails = new Map<string, string>();

    students.forEach(student => {
      if (student) {
        studentNames.set(student.getId(), student.getName());
        studentEmails.set(student.getId(), student.getEmail());
      }
    });

    // Convert to DTOs with student details
    return EnrollmentMapper.toWithStudentDTOList(
      enrollments,
      studentNames,
      studentEmails
    );
  }
}
