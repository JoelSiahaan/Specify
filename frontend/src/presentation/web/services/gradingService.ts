/**
 * Grading Service
 * 
 * API calls for grading-related operations.
 */

import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type { Submission } from '../types';

/**
 * Grade submission request
 */
export interface GradeSubmissionRequest {
  grade: number;
  feedback?: string;
  version?: number;  // For optimistic locking
}

/**
 * Get submission details by ID
 */
export const getSubmissionById = async (id: string): Promise<Submission> => {
  return await api.get<Submission>(API_ENDPOINTS.GRADING.SUBMISSION_DETAILS(id));
};

/**
 * Grade a submission (teacher only)
 */
export const gradeSubmission = async (
  submissionId: string,
  data: GradeSubmissionRequest
): Promise<Submission> => {
  return await api.post<Submission>(API_ENDPOINTS.GRADING.GRADE(submissionId), data);
};

/**
 * Update submission grade (teacher only)
 */
export const updateGrade = async (
  submissionId: string,
  data: GradeSubmissionRequest
): Promise<Submission> => {
  return await api.put<Submission>(API_ENDPOINTS.GRADING.UPDATE_GRADE(submissionId), data);
};

/**
 * Student Progress Item
 */
export interface ProgressItem {
  id: string;
  type: 'ASSIGNMENT' | 'QUIZ';
  title: string;
  dueDate: string;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED';
  isLate?: boolean;
  isOverdue?: boolean;
  grade?: number;
  feedback?: string;
  submittedAt?: string;
}

/**
 * Student Progress Response (from backend)
 */
export interface StudentProgressResponse {
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  assignments: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    submissionType: string;
    status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED';
    grade?: number;
    feedback?: string;
    isLate: boolean;
    isOverdue: boolean;
    submittedAt?: string;
    gradedAt?: string;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    timeLimit: number;
    questionCount: number;
    status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED';
    grade?: number;
    feedback?: string;
    isOverdue: boolean;
    submittedAt?: string;
    gradedAt?: string;
  }>;
  averageGrade?: number;
  totalGradedItems: number;
  totalItems: number;
}

/**
 * Transformed progress response for frontend
 */
export interface TransformedProgressResponse {
  items: ProgressItem[];
  averageGrade: number | null;
}

/**
 * Get student progress for a course
 */
export const getStudentProgress = async (courseId: string): Promise<TransformedProgressResponse> => {
  const response = await api.get<StudentProgressResponse>(API_ENDPOINTS.GRADING.STUDENT_PROGRESS(courseId));
  
  // Transform backend response to frontend format
  const items: ProgressItem[] = [
    // Map assignments
    ...response.assignments.map(assignment => ({
      id: assignment.id,
      type: 'ASSIGNMENT' as const,
      title: assignment.title,
      dueDate: assignment.dueDate,
      status: assignment.status,
      isLate: assignment.isLate,
      isOverdue: assignment.isOverdue,
      grade: assignment.grade,
      feedback: assignment.feedback,
      submittedAt: assignment.submittedAt,
    })),
    // Map quizzes
    ...response.quizzes.map(quiz => ({
      id: quiz.id,
      type: 'QUIZ' as const,
      title: quiz.title,
      dueDate: quiz.dueDate,
      status: quiz.status,
      isLate: false, // Quizzes don't have late submissions
      isOverdue: quiz.isOverdue,
      grade: quiz.grade,
      feedback: quiz.feedback,
      submittedAt: quiz.submittedAt,
    })),
  ];
  
  return {
    items,
    averageGrade: response.averageGrade ?? null,
  };
};

/**
 * Export grades for a course (teacher only)
 */
export const exportGrades = async (courseId: string): Promise<Blob> => {
  const response = await fetch(API_ENDPOINTS.GRADING.EXPORT_GRADES(courseId), {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to export grades');
  }
  
  return await response.blob();
};
