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
  createdAt: string;
  updatedAt: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  enrollmentCount?: number;
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
}

/**
 * Course with teacher details
 */
export interface CourseWithTeacher extends Course {
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  enrollmentCount?: number;
}
