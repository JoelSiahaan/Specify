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
  STUDENT_QUIZ_TAKE: '/student/courses/:courseId/quizzes/:quizId/take',
  STUDENT_QUIZ_RESULTS: '/student/courses/:courseId/quizzes/:quizId/results',
  STUDENT_MATERIALS: '/student/courses/:courseId/materials',
  STUDENT_GRADES: '/student/courses/:courseId/grades',
  
  // Teacher routes
  TEACHER_DASHBOARD: '/teacher/dashboard',
  TEACHER_COURSE_DETAILS: '/teacher/courses/:courseId',
  TEACHER_MANAGE_COURSE: '/teacher/courses/:courseId/manage',
  TEACHER_CREATE_COURSE: '/teacher/courses/new',
  TEACHER_EDIT_COURSE: '/teacher/courses/:courseId/edit',
  TEACHER_ASSIGNMENTS: '/teacher/courses/:courseId/assignments',
  TEACHER_QUIZZES: '/teacher/courses/:courseId/quizzes',
  TEACHER_QUIZ_SUBMISSIONS: '/teacher/courses/:courseId/quizzes/:quizId/submissions',
  TEACHER_QUIZ_SUBMISSION_DETAILS: '/teacher/courses/:courseId/quizzes/:quizId/submissions/:submissionId',
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

/**
 * Helper function to get course details route based on user role
 */
export const COURSE_DETAILS = (courseId: string) => {
  // Will be determined by current user context in the app
  return `/courses/${courseId}`;
};

/**
 * Helper function to get materials route based on user role
 */
export const MATERIALS = (courseId: string, role?: 'STUDENT' | 'TEACHER') => {
  if (role === 'TEACHER') {
    return buildRoute(ROUTES.TEACHER_MATERIALS, { courseId });
  }
  return buildRoute(ROUTES.STUDENT_MATERIALS, { courseId });
};

/**
 * Helper function to get quizzes route based on user role
 */
export const QUIZZES = (courseId: string, role?: 'STUDENT' | 'TEACHER') => {
  if (role === 'TEACHER') {
    return buildRoute(ROUTES.TEACHER_QUIZZES, { courseId });
  }
  return buildRoute(ROUTES.STUDENT_QUIZZES, { courseId });
};

/**
 * Helper function to get assignments route based on user role
 */
export const ASSIGNMENTS = (courseId: string, role?: 'STUDENT' | 'TEACHER') => {
  if (role === 'TEACHER') {
    return buildRoute(ROUTES.TEACHER_ASSIGNMENTS, { courseId });
  }
  return buildRoute(ROUTES.STUDENT_ASSIGNMENTS, { courseId });
};
