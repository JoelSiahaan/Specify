/**
 * Get Course By ID Use Case
 * 
 * Retrieves a single course by ID with teacher name and enrollment count.
 * 
 * Requirements:
 * - 5.10: Teachers view all their created courses
 * - 6.1: Students can browse and search active courses
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import { PrismaEnrollmentRepository } from '../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository.js';
import { CourseListDTO } from '../../dtos/CourseDTO.js';
import { CourseMapper } from '../../mappers/CourseMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class GetCourseByIdUseCase {
  constructor(
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(PrismaEnrollmentRepository) private enrollmentRepository: IEnrollmentRepository
  ) {}

  /**
   * Execute get course by ID
   * 
   * @param courseId - Course ID
   * @returns CourseListDTO with teacher name and enrollment count
   * @throws ApplicationError if course not found
   */
  async execute(courseId: string): Promise<CourseListDTO> {
    // Load course
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Course not found',
        404
      );
    }

    // Load teacher
    const teacher = await this.userRepository.findById(course.getTeacherId());
    const teacherName = teacher ? teacher.getName() : undefined;

    // Load enrollment count
    const enrollments = await this.enrollmentRepository.findByCourse(courseId);
    const enrollmentCount = enrollments.length;

    // Convert to DTO with teacher name and enrollment count
    return CourseMapper.toListDTO(course, teacherName, enrollmentCount);
  }
}
