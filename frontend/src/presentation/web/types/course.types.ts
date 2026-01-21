/**
 * Course Types
 * 
 * TypeScript types for course-related data.
 */

import { CourseStatus } from './common.types';

/**
 * Course interface
 */
export interface Course {
  id: string;
  name: string;
  description: string;
  courseCode: string;
  status: CourseStatus;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Course with teacher info
 */
export interface CourseWithTeacher extends Course {
  teacherName?: string;
  enrollmentCount?: number;
}

/**
 * Create course request
 */
export interface CreateCourseRequest {
  name: string;
  description: string;
}

/**
 * Update course request
 */
export interface UpdateCourseRequest {
  name?: string;
  description?: string;
}

/**
 * Enroll in course request
 */
export interface EnrollCourseRequest {
  courseCode: string;
}
