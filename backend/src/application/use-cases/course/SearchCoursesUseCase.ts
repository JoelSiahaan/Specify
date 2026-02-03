/**
 * Search Courses Use Case
 * 
 * Handles course search functionality for students.
 * Filters active courses by name and indicates enrollment status.
 * 
 * Requirements:
 * - 6.1: Display only active courses with name, teacher, and description
 * - 6.2: NOT include archived courses in search results
 * - 6.3: Provide search box to filter active courses by name
 * - 6.4: Indicate which courses the student is already enrolled in
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { CourseStatus } from '../../../domain/entities/Course.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

/**
 * Course search result DTO
 * Includes enrollment status for the requesting student
 */
export interface CourseSearchResultDTO {
  id: string;
  name: string;
  description: string;
  courseCode: string;
  status: CourseStatus;
  teacherId: string;
  teacherName?: string;
  isEnrolled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Search filter options
 */
export interface SearchCoursesFilter {
  /**
   * Search query to filter courses by name (case-insensitive)
   */
  query?: string;
}

@injectable()
export class SearchCoursesUseCase {
  constructor(
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IEnrollmentRepository') private enrollmentRepository: IEnrollmentRepository,
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  /**
   * Execute course search
   * 
   * Business Rules:
   * - Only active courses are searchable (Requirement 6.1, 6.2)
   * - Filter by course name if query provided (Requirement 6.3)
   * - Indicate enrollment status for each course (Requirement 6.4)
   * 
   * @param userId - ID of the student searching for courses
   * @param filter - Optional search filter
   * @returns Array of CourseSearchResultDTO with enrollment status
   * @throws ApplicationError if user not found
   */
  async execute(
    userId: string,
    filter?: SearchCoursesFilter
  ): Promise<CourseSearchResultDTO[]> {
    // Verify user exists
    await this.verifyUser(userId);

    // Get all active courses (Requirement 6.1, 6.2)
    const courses = await this.courseRepository.findAll(CourseStatus.ACTIVE);

    // Filter by name if query provided (Requirement 6.3)
    let filteredCourses = courses;
    if (filter?.query && filter.query.trim().length > 0) {
      const queryLower = filter.query.toLowerCase().trim();
      filteredCourses = courses.filter(course =>
        course.getName().toLowerCase().includes(queryLower)
      );
    }

    // Get student's enrollments to determine enrollment status (Requirement 6.4)
    const enrollmentStatuses = await this.getEnrollmentStatuses(
      userId,
      filteredCourses.map(c => c.getId())
    );

    // Convert to DTOs with enrollment status and teacher name
    return Promise.all(
      filteredCourses.map(async (course) => {
        // Get teacher information
        const teacher = await this.userRepository.findById(course.getTeacherId());
        const teacherName = teacher ? teacher.getName() : undefined;
        
        return {
          id: course.getId(),
          name: course.getName(),
          description: course.getDescription(),
          courseCode: course.getCourseCode(),
          status: course.getStatus(),
          teacherId: course.getTeacherId(),
          teacherName,
          isEnrolled: enrollmentStatuses.get(course.getId()) || false,
          createdAt: course.getCreatedAt(),
          updatedAt: course.getUpdatedAt()
        };
      })
    );
  }

  /**
   * Verify user exists
   * 
   * @param userId - User ID
   * @throws ApplicationError if user not found
   * @private
   */
  private async verifyUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError(
        'AUTH_REQUIRED',
        'User not found',
        401
      );
    }
  }

  /**
   * Get enrollment statuses for multiple courses
   * 
   * Checks which courses the student is enrolled in.
   * 
   * @param studentId - Student ID
   * @param courseIds - Array of course IDs to check
   * @returns Map of courseId -> isEnrolled
   * @private
   */
  private async getEnrollmentStatuses(
    studentId: string,
    courseIds: string[]
  ): Promise<Map<string, boolean>> {
    const statusMap = new Map<string, boolean>();

    // Check enrollment for each course
    await Promise.all(
      courseIds.map(async (courseId) => {
        const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
          studentId,
          courseId
        );
        statusMap.set(courseId, enrollment !== null);
      })
    );

    return statusMap;
  }
}
