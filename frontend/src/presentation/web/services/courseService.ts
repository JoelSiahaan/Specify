/**
 * Course Service
 * 
 * API calls for course operations.
 */

import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type { 
  Course,
  CourseWithTeacher,
  CreateCourseRequest,
  UpdateCourseRequest,
  EnrollCourseRequest
} from '../types';

/**
 * Course service
 */
export const courseService = {
  /**
   * List all courses (filtered by role)
   */
  listCourses: async (): Promise<{ data: CourseWithTeacher[] }> => {
    return api.get<{ data: CourseWithTeacher[] }>(API_ENDPOINTS.COURSES.LIST);
  },

  /**
   * List archived courses (teacher only)
   */
  listArchivedCourses: async (): Promise<{ data: CourseWithTeacher[] }> => {
    return api.get<{ data: CourseWithTeacher[] }>(API_ENDPOINTS.COURSES.ARCHIVED);
  },

  /**
   * Create new course (teacher only)
   */
  createCourse: async (data: CreateCourseRequest): Promise<Course> => {
    return api.post<Course>(API_ENDPOINTS.COURSES.CREATE, data);
  },

  /**
   * Get course details
   */
  getCourse: async (id: string): Promise<Course> => {
    return api.get<Course>(API_ENDPOINTS.COURSES.DETAILS(id));
  },

  /**
   * Update course (teacher only)
   */
  updateCourse: async (id: string, data: UpdateCourseRequest): Promise<Course> => {
    return api.put<Course>(API_ENDPOINTS.COURSES.UPDATE(id), data);
  },

  /**
   * Delete course (teacher only)
   */
  deleteCourse: async (id: string): Promise<void> => {
    return api.delete<void>(API_ENDPOINTS.COURSES.DELETE(id));
  },

  /**
   * Archive course (teacher only)
   */
  archiveCourse: async (id: string): Promise<Course> => {
    return api.post<Course>(API_ENDPOINTS.COURSES.ARCHIVE(id));
  },

  /**
   * Enroll in course (student only)
   */
  enrollInCourse: async (data: EnrollCourseRequest): Promise<void> => {
    return api.post<void>(API_ENDPOINTS.COURSES.ENROLL, data);
  },
};

export default courseService;
