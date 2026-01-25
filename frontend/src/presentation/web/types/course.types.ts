/**
 * Course Types
 * 
 * Types related to courses and course management.
 */

import { CourseStatus } from './common.types';

/**
 * Course entity
 */
export interface Course {
  id: string;
  name: string;
  description: string | null;
  courseCode: string;
  status: CourseStatus;
  teacherId: string;
  teacherName?: string;
  enrollmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create course request
 */
export interface CreateCourseRequest {
  name: string;
  description?: string;
}

/**
 * Create course response
 */
export interface CreateCourseResponse {
  id: string;
  name: string;
  description: string | null;
  courseCode: string;
  status: CourseStatus;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update course request
 */
export interface UpdateCourseRequest {
  name?: string;
  description?: string;
}

/**
 * List courses response
 */
export interface ListCoursesResponse {
  data: Course[];
}

/**
 * Course query filters
 */
export interface CourseQueryFilters {
  status?: CourseStatus;
  enrolledOnly?: boolean;
}
