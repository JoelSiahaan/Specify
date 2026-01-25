/**
 * Services Index
 * 
 * Re-export all services for easy importing.
 */

export { api, default as apiClient } from './api';
export { authService, default as auth } from './authService';
export * as courseService from './courseService';
export * as materialService from './materialService';
export * as quizService from './quizService';
export * as assignmentService from './assignmentService';

// Re-export individual course service functions for convenience
export {
  listCourses,
  listArchivedCourses,
  getCourseById,
  createCourse,
  updateCourse,
  archiveCourse,
  deleteCourse,
  enrollInCourse,
  searchCourses,
} from './courseService';
