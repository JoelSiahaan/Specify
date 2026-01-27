/**
 * List Courses Use Case
 * 
 * Handles course listing with role-based filtering.
 * Teachers see their own courses, students see enrolled courses or all active courses.
 * 
 * Requirements:
 * - 5.10: Teachers view all their created courses (active and archived separately)
 * - 3.1: Students view enrolled courses on dashboard
 * - 6.1: Students view all active courses for browsing/enrollment
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository';
import { User, Role } from '../../../domain/entities/User';
import { CourseStatus } from '../../../domain/entities/Course';
import { CourseListDTO } from '../../dtos/CourseDTO';
import { ApplicationError } from '../../errors/ApplicationErrors';

/**
 * Filter options for listing courses
 */
export interface ListCoursesFilter {
  /**
   * Filter by course status (ACTIVE or ARCHIVED)
   * If not provided, returns all courses (based on role)
   */
  status?: CourseStatus;
  
  /**
   * For students: whether to show only enrolled courses
   * - true: Show only enrolled courses (for dashboard)
   * - false/undefined: Show all active courses (for browsing/enrollment)
   */
  enrolledOnly?: boolean;
}

@injectable()
export class ListCoursesUseCase {
  constructor(
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IEnrollmentRepository') private enrollmentRepository: IEnrollmentRepository
  ) {}

  /**
   * Execute course listing
   * 
   * Business Rules:
   * - Teachers: See only their own courses (filtered by teacherId)
   * - Students (enrolledOnly=true): See only enrolled courses (for dashboard)
   * - Students (enrolledOnly=false): See all active courses (for browsing/enrollment)
   * - Status filter: Optional filter by ACTIVE or ARCHIVED
   * 
   * @param userId - ID of the user requesting the list
   * @param filter - Optional filter options
   * @returns Array of CourseListDTO
   * @throws ApplicationError if user not found
   */
  async execute(userId: string, filter?: ListCoursesFilter): Promise<CourseListDTO[]> {
    // Load user to determine role
    const user = await this.loadUser(userId);

    // Get courses based on user role
    let courses;
    
    if (user.getRole() === Role.TEACHER) {
      // Requirement 5.10: Teachers see their own courses
      courses = await this.courseRepository.findByTeacherId(userId);
      
      // Default to ACTIVE if no filter provided (for backward compatibility)
      // Teachers must explicitly request ARCHIVED or ALL
      const statusFilter = filter?.status || CourseStatus.ACTIVE;
      courses = courses.filter(course => course.getStatus() === statusFilter);
    } else {
      // Student role
      const statusFilter = filter?.status || CourseStatus.ACTIVE;
      
      // If student requests archived courses, return empty array
      // (students should not see archived courses in discovery)
      if (statusFilter === CourseStatus.ARCHIVED) {
        return [];
      }
      
      if (filter?.enrolledOnly) {
        // Requirement 3.1: Students see only enrolled courses (for dashboard)
        const enrollments = await this.enrollmentRepository.findByStudentId(userId);
        const enrolledCourseIds = enrollments.map(e => e.getCourseId());
        
        if (enrolledCourseIds.length === 0) {
          return [];
        }
        
        // Get all enrolled courses
        const allCourses = await Promise.all(
          enrolledCourseIds.map(id => this.courseRepository.findById(id))
        );
        
        // Filter out null values and apply status filter
        courses = allCourses
          .filter(course => course !== null)
          .filter(course => course!.getStatus() === statusFilter);
      } else {
        // Requirement 6.1: Students see all active courses (for browsing/enrollment)
        courses = await this.courseRepository.findAll(statusFilter);
      }
    }

    // Convert to DTOs with enrollment count and teacher name
    return Promise.all(courses.map(course => this.toCourseListDTO(course)));
  }

  /**
   * Load user from repository
   * 
   * @param userId - User ID
   * @returns User entity
   * @throws ApplicationError if user not found
   * @private
   */
  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError(
        'AUTH_REQUIRED',
        'User not found',
        401
      );
    }
    
    return user;
  }

  /**
   * Convert Course entity to CourseListDTO
   * 
   * @param course - Course entity
   * @returns CourseListDTO with enrollment count
   * @private
   */
  private async toCourseListDTO(course: any): Promise<CourseListDTO> {
    // Get enrollment count for this course
    const enrollments = await this.enrollmentRepository.findByCourse(course.getId());
    const enrollmentCount = enrollments.length;
    
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
      enrollmentCount,
      createdAt: course.getCreatedAt(),
      updatedAt: course.getUpdatedAt(),
    };
  }
}
