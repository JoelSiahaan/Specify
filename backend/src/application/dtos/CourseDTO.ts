/**
 * Course Data Transfer Objects (DTOs)
 * 
 * DTOs for transferring course data between application layers.
 * These objects are used for API requests and responses.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 */

import { CourseStatus } from '../../domain/entities/Course';

/**
 * Course DTO for API responses
 * Contains all course information for display
 */
export interface CourseDTO {
  id: string;
  name: string;
  description: string;
  courseCode: string;
  status: CourseStatus;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Course DTO for course creation
 * Only requires name and description (courseCode is generated)
 */
export interface CreateCourseDTO {
  name: string;
  description: string;
}

/**
 * Update Course DTO for course updates
 * Allows updating name and description only
 */
export interface UpdateCourseDTO {
  name?: string;
  description?: string;
}

/**
 * Course List DTO for listing courses
 * Includes additional information like teacher name and enrollment count
 */
export interface CourseListDTO {
  id: string;
  name: string;
  description: string;
  courseCode: string;
  status: CourseStatus;
  teacherId: string;
  teacherName?: string;
  enrollmentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
