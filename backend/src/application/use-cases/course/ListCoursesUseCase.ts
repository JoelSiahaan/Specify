/**
 * List Courses Use Case
 * 
 * Handles course listing with role-based filtering.
 * Teachers see their own courses, students see all active courses.
 * 
 * Requirements:
 * - 5.10: Teachers view all their created courses (active and archived separately)
 * - 6.1: Students view only active courses
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { User, Role } from '../../../domain/entities/User';
import { CourseStatus } from '../../../domain/entities/Course';
import { CourseListDTO } from '../../dtos/CourseDTO';
import { CourseMapper } from '../../mappers/CourseMapper';
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
}

@injectable()
export class ListCoursesUseCase {
  constructor(
    @inject('ICourseRepository') private courseRepository: ICourseRepository
  ) {}

  /**
   * Execute course listing
   * 
   * Business Rules:
   * - Teachers: See only their own courses (filtered by teacherId)
   * - Students: See all active courses (for enrollment/browsing)
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
      
      // Apply status filter if provided
      if (filter?.status) {
        courses = courses.filter(course => course.getStatus() === filter.status);
      }
    } else {
      // Requirement 6.1: Students see all active courses
      // Students can only see active courses (for browsing/enrollment)
      const statusFilter = filter?.status || CourseStatus.ACTIVE;
      
      // If student requests archived courses, return empty array
      // (students should not see archived courses in discovery)
      if (statusFilter === CourseStatus.ARCHIVED) {
        return [];
      }
      
      courses = await this.courseRepository.findAll(statusFilter);
    }

    // Convert to DTOs
    // Note: Teacher name and enrollment count will be added in future iterations
    // when User and Enrollment repositories are available
    return courses.map(course => this.toCourseListDTO(course));
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
    // Note: In a real implementation, we would inject IUserRepository
    // For now, we create a mock user for role check
    // This will be properly implemented when IUserRepository is available in DI
    const { IUserRepository } = await import('../../../domain/repositories/IUserRepository');
    const { container } = await import('tsyringe');
    
    try {
      const userRepository = container.resolve<typeof IUserRepository>('IUserRepository' as any);
      const user = await (userRepository as any).findById(userId);
      
      if (!user) {
        throw new ApplicationError(
          'AUTH_REQUIRED',
          'User not found',
          401
        );
      }
      
      return user;
    } catch (error) {
      throw new ApplicationError(
        'AUTH_REQUIRED',
        'User not found',
        401
      );
    }
  }

  /**
   * Convert Course entity to CourseListDTO
   * 
   * @param course - Course entity
   * @returns CourseListDTO
   * @private
   */
  private toCourseListDTO(course: any): CourseListDTO {
    return {
      id: course.getId(),
      name: course.getName(),
      description: course.getDescription(),
      courseCode: course.getCourseCode(),
      status: course.getStatus(),
      teacherId: course.getTeacherId(),
      createdAt: course.getCreatedAt(),
      updatedAt: course.getUpdatedAt(),
      // These will be populated in future iterations:
      // teacherName: undefined,
      // enrollmentCount: undefined
    };
  }
}
