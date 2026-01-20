/**
 * Frontend Route Paths
 * 
 * Centralized route definitions for the application.
 * Use these constants instead of hardcoded strings.
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Student routes
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_COURSES: '/student/courses',
  STUDENT_COURSE_DETAILS: '/student/courses/:courseId',
  STUDENT_ASSIGNMENTS: '/student/courses/:courseId/assignments',
  STUDENT_QUIZZES: '/student/courses/:courseId/quizzes',
  STUDENT_MATERIALS: '/student/courses/:courseId/materials',
  STUDENT_GRADES: '/student/courses/:courseId/grades',
  
  // Teacher routes
  TEACHER_DASHBOARD: '/teacher/dashboard',
  TEACHER_COURSES: '/teacher/courses',
  TEACHER_COURSE_DETAILS: '/teacher/courses/:courseId',
  TEACHER_CREATE_COURSE: '/teacher/courses/new',
  TEACHER_EDIT_COURSE: '/teacher/courses/:courseId/edit',
  TEACHER_ASSIGNMENTS: '/teacher/courses/:courseId/assignments',
  TEACHER_QUIZZES: '/teacher/courses/:courseId/quizzes',
  TEACHER_MATERIALS: '/teacher/courses/:courseId/materials',
  TEACHER_GRADING: '/teacher/courses/:courseId/grading',
  
  // Error routes
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403',
} as const;

/**
 * Helper function to build route with parameters
 * @example buildRoute(ROUTES.STUDENT_COURSE_DETAILS, { courseId: '123' })
 */
export function buildRoute(route: string, params: Record<string, string>): string {
  let path = route;
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value);
  });
  return path;
}
