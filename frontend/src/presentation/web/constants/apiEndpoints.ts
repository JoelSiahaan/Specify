/**
 * API Endpoint URLs
 * 
 * Centralized API endpoint definitions.
 * Use these constants for all API calls.
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  
  // Courses
  COURSES: {
    LIST: '/api/courses',
    ARCHIVED: '/api/courses/archived',
    CREATE: '/api/courses',
    DETAILS: (id: string) => `/api/courses/${id}`,
    UPDATE: (id: string) => `/api/courses/${id}`,
    DELETE: (id: string) => `/api/courses/${id}`,
    ARCHIVE: (id: string) => `/api/courses/${id}/archive`,
    ENROLL: '/api/courses/enroll',
    UNENROLL_BULK: (id: string) => `/api/courses/${id}/unenroll-bulk`,
    ENROLLMENTS: (id: string) => `/api/courses/${id}/enrollments`,
  },
  
  // Materials
  MATERIALS: {
    LIST: (courseId: string) => `/api/courses/${courseId}/materials`,
    CREATE: (courseId: string) => `/api/courses/${courseId}/materials`,
    DETAILS: (id: string) => `/api/materials/${id}`,
    UPDATE: (id: string) => `/api/materials/${id}`,
    DELETE: (id: string) => `/api/materials/${id}`,
    DOWNLOAD: (id: string) => `/api/materials/${id}/download`,
  },
  
  // Assignments
  ASSIGNMENTS: {
    LIST: (courseId: string) => `/api/courses/${courseId}/assignments`,
    CREATE: (courseId: string) => `/api/courses/${courseId}/assignments`,
    DETAILS: (id: string) => `/api/assignments/${id}`,
    UPDATE: (id: string) => `/api/assignments/${id}`,
    DELETE: (id: string) => `/api/assignments/${id}`,
    SUBMISSIONS: (id: string) => `/api/assignments/${id}/submissions`,
    SUBMIT: (id: string) => `/api/assignments/${id}/submit`,
    MY_SUBMISSION: (id: string) => `/api/assignments/${id}/my-submission`,
  },
  
  // Quizzes
  QUIZZES: {
    LIST: (courseId: string) => `/api/courses/${courseId}/quizzes`,
    CREATE: (courseId: string) => `/api/courses/${courseId}/quizzes`,
    DETAILS: (id: string) => `/api/quizzes/${id}`,
    UPDATE: (id: string) => `/api/quizzes/${id}`,
    DELETE: (id: string) => `/api/quizzes/${id}`,
    START: (id: string) => `/api/quizzes/${id}/start`,
    AUTOSAVE: (id: string) => `/api/quizzes/${id}/autosave`,
    SUBMIT: (id: string) => `/api/quizzes/${id}/submit`,
    SUBMISSIONS: (id: string) => `/api/quizzes/${id}/submissions`,
  },
  
  // Grading
  GRADING: {
    SUBMISSION_DETAILS: (id: string) => `/api/assignment-submissions/${id}`,
    GRADE: (id: string) => `/api/assignment-submissions/${id}/grade`,
    UPDATE_GRADE: (id: string) => `/api/assignment-submissions/${id}/grade`,
    QUIZ_SUBMISSION_DETAILS: (id: string) => `/api/quiz-submissions/${id}`,
    GRADE_QUIZ: (id: string) => `/api/quiz-submissions/${id}/grade`,
    EXPORT_GRADES: (courseId: string) => `/api/courses/${courseId}/grades/export`,
    STUDENT_PROGRESS: (courseId: string) => `/api/courses/${courseId}/progress`,
  },
} as const;
