/**
 * Quiz Service
 * 
 * API calls for quiz management.
 * 
 * Requirements:
 * - 11.1: Create quiz with title, description, due date, and time limit
 * - 11.6: Update quiz (before due date and no submissions)
 * - 11.8: Delete quiz
 * - 11.9: List quizzes
 * - 12.2: Start quiz
 * - 12.4: Auto-save answers
 * - 12.5: Submit quiz
 */

import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type {
  Quiz,
  QuizListItem,
  QuizPreview,
  QuizAttempt,
  QuizSubmission,
  QuizSubmissionListItem,
  CreateQuizRequest,
  UpdateQuizRequest,
  SubmitQuizRequest,
  AutoSaveQuizRequest,
  GradeQuizSubmissionRequest,
} from '../types';

/**
 * List all quizzes for a course
 */
export const listQuizzes = async (courseId: string): Promise<QuizListItem[]> => {
  const response = await api.get<{ data: QuizListItem[] }>(API_ENDPOINTS.QUIZZES.LIST(courseId));
  return response.data || response;
};

/**
 * Get quiz details by ID
 */
export const getQuiz = async (id: string): Promise<Quiz> => {
  return await api.get<Quiz>(API_ENDPOINTS.QUIZZES.DETAILS(id));
};

/**
 * Get quiz details by ID (alias for backward compatibility)
 */
export const getQuizById = async (id: string): Promise<Quiz> => {
  return getQuiz(id);
};

/**
 * Create new quiz (teacher only)
 */
export const createQuiz = async (
  courseId: string,
  data: CreateQuizRequest
): Promise<Quiz> => {
  return await api.post<Quiz>(API_ENDPOINTS.QUIZZES.CREATE(courseId), data);
};

/**
 * Update quiz (teacher only)
 */
export const updateQuiz = async (
  id: string,
  data: UpdateQuizRequest
): Promise<Quiz> => {
  return await api.put<Quiz>(API_ENDPOINTS.QUIZZES.UPDATE(id), data);
};

/**
 * Delete quiz (teacher only)
 */
export const deleteQuiz = async (id: string): Promise<void> => {
  return await api.delete<void>(API_ENDPOINTS.QUIZZES.DELETE(id));
};

/**
 * Get quiz preview (for students before starting)
 */
export const getQuizPreview = async (id: string): Promise<QuizPreview> => {
  return await api.get<QuizPreview>(`${API_ENDPOINTS.QUIZZES.DETAILS(id)}/preview`);
};

/**
 * Start quiz (student)
 */
export const startQuiz = async (id: string): Promise<QuizAttempt> => {
  return await api.post<QuizAttempt>(API_ENDPOINTS.QUIZZES.START(id));
};

/**
 * Auto-save quiz answers (student)
 */
export const autoSaveQuizAnswers = async (
  id: string,
  data: AutoSaveQuizRequest
): Promise<void> => {
  return await api.post<void>(API_ENDPOINTS.QUIZZES.AUTOSAVE(id), data);
};

/**
 * Submit quiz (student)
 */
export const submitQuiz = async (
  id: string,
  data: SubmitQuizRequest
): Promise<QuizSubmission> => {
  return await api.post<QuizSubmission>(API_ENDPOINTS.QUIZZES.SUBMIT(id), data);
};

/**
 * List quiz submissions (teacher)
 */
export const listQuizSubmissions = async (
  id: string
): Promise<QuizSubmissionListItem[]> => {
  const response = await api.get<{ data: QuizSubmissionListItem[] }>(
    API_ENDPOINTS.QUIZZES.SUBMISSIONS(id)
  );
  return response.data || response;
};

/**
 * Get quiz submission details
 */
export const getQuizSubmission = async (
  submissionId: string
): Promise<QuizSubmission> => {
  return await api.get<QuizSubmission>(API_ENDPOINTS.GRADING.QUIZ_SUBMISSION_DETAILS(submissionId));
};

/**
 * Get my quiz submission (student)
 */
export const getMySubmission = async (quizId: string): Promise<QuizSubmission> => {
  return await api.get<QuizSubmission>(`${API_ENDPOINTS.QUIZZES.DETAILS(quizId)}/my-submission`);
};

/**
 * Grade quiz submission (teacher)
 */
export const gradeQuizSubmission = async (
  submissionId: string,
  data: GradeQuizSubmissionRequest
): Promise<QuizSubmission> => {
  return await api.post<QuizSubmission>(
    API_ENDPOINTS.GRADING.GRADE_QUIZ(submissionId),
    data
  );
};

/**
 * Update quiz grade (teacher)
 * 
 * NOTE: This function is currently not implemented in the backend.
 * Quiz grades can only be set once using gradeQuizSubmission().
 * If grade updates are needed, use gradeQuizSubmission() again.
 * 
 * TODO: Implement PUT /api/quiz-submissions/:id/grade endpoint in backend
 * if quiz grade updates are required.
 */
export const updateQuizGrade = async (
  submissionId: string,
  data: GradeQuizSubmissionRequest
): Promise<QuizSubmission> => {
  // For now, use the same POST endpoint as gradeQuizSubmission
  // This will overwrite the existing grade
  return await api.post<QuizSubmission>(
    API_ENDPOINTS.GRADING.GRADE_QUIZ(submissionId),
    data
  );
};

export default {
  listQuizzes,
  getQuiz,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizPreview,
  startQuiz,
  autoSaveQuizAnswers,
  submitQuiz,
  listQuizSubmissions,
  getQuizSubmission,
  getMySubmission,
  gradeQuizSubmission,
  updateQuizGrade,
};
