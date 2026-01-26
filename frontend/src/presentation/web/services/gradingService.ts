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
