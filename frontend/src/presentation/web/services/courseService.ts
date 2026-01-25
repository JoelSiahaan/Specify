/**
 * Course Service
 * 
 * API calls for course management.
 */

import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type {
  Course,
  CreateCourseRequest,
  CreateCourseResponse,
  UpdateCourseRequest,
  ListCoursesResponse,
  CourseQueryFilters,
  EnrollmentWithStudent,
  ListEnrollmentsResponse,
} from '../types';

/**
 * List all courses (filtered by role and status)
 */
export const listCourses = async (filters?: CourseQueryFilters): Promise<ListCoursesResponse> => {
  const params = new URLSearchParams();
  if (filters?.status) {
    params.append('status', filters.status);
  }
  if (filters?.enrolledOnly !== undefined) {
    params.append('enrolledOnly', filters.enrolledOnly.toString());
  }
  
  const url = params.toString()
    ? `${API_ENDPOINTS.COURSES.LIST}?${params.toString()}`
    : API_ENDPOINTS.COURSES.LIST;
  
  return await api.get<ListCoursesResponse>(url);
};

/**
 * List archived courses (teacher only)
 */
export const listArchivedCourses = async (): Promise<ListCoursesResponse> => {
  // Use query parameter instead of separate endpoint
  const params = new URLSearchParams();
  params.append('status', 'ARCHIVED');
  
  const url = `${API_ENDPOINTS.COURSES.LIST}?${params.toString()}`;
  return await api.get<ListCoursesResponse>(url);
};

/**
 * Get course details by ID
 */
export const getCourseById = async (id: string): Promise<Course> => {
  return await api.get<Course>(API_ENDPOINTS.COURSES.DETAILS(id));
};

/**
 * Create new course (teacher only)
 */
export const createCourse = async (data: CreateCourseRequest): Promise<CreateCourseResponse> => {
  return await api.post<CreateCourseResponse>(API_ENDPOINTS.COURSES.CREATE, data);
};

/**
 * Update course (teacher only)
 */
export const updateCourse = async (id: string, data: UpdateCourseRequest): Promise<Course> => {
  return await api.put<Course>(API_ENDPOINTS.COURSES.UPDATE(id), data);
};

/**
 * Archive course (teacher only)
 */
export const archiveCourse = async (id: string): Promise<Course> => {
  return await api.post<Course>(API_ENDPOINTS.COURSES.ARCHIVE(id));
};

/**
 * Delete course (teacher only)
 */
export const deleteCourse = async (id: string): Promise<void> => {
  return await api.delete<void>(API_ENDPOINTS.COURSES.DELETE(id));
};

/**
 * Enroll in course (student only)
 */
export const enrollInCourse = async (courseCode: string): Promise<void> => {
  return await api.post<void>(API_ENDPOINTS.COURSES.ENROLL, { courseCode });
};

/**
 * Search courses (student only)
 * Returns courses with enrollment status
 */
export const searchCourses = async (query?: string): Promise<ListCoursesResponse> => {
  const url = query 
    ? `${API_ENDPOINTS.COURSES.LIST}/search?query=${encodeURIComponent(query)}`
    : `${API_ENDPOINTS.COURSES.LIST}/search`;
  
  return await api.get<ListCoursesResponse>(url);
};

/**
 * Get course enrollments with student details (teacher only)
 */
export const getCourseEnrollments = async (courseId: string): Promise<ListEnrollmentsResponse> => {
  return await api.get<ListEnrollmentsResponse>(API_ENDPOINTS.COURSES.ENROLLMENTS(courseId));
};
