/**
 * useQuizzes Custom Hooks
 * 
 * Encapsulates all quiz-related data fetching logic.
 * Provides reusable hooks for quiz operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { quizService } from '../services';
import type { Quiz, QuizListItem, QuizSubmission, ApiError } from '../types';

// ============================================================================
// useQuizzes - Fetch quizzes list for a course
// ============================================================================

interface UseQuizzesResult {
  quizzes: QuizListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuizzes(courseId: string | undefined): UseQuizzesResult {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await quizService.listQuizzes(courseId);
      setQuizzes(data || []);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load quizzes');
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  return { quizzes, loading, error, refetch: fetchQuizzes };
}

// ============================================================================
// useQuiz - Fetch single quiz by ID
// ============================================================================

interface UseQuizResult {
  quiz: Quiz | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuiz(quizId: string | undefined): UseQuizResult {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = useCallback(async () => {
    if (!quizId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await quizService.getQuiz(quizId);
      setQuiz(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load quiz');
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  return { quiz, loading, error, refetch: fetchQuiz };
}

// ============================================================================
// useDeleteQuiz - Delete quiz
// ============================================================================

interface UseDeleteQuizResult {
  deleteQuiz: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useDeleteQuiz(): UseDeleteQuizResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteQuiz = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await quizService.deleteQuiz(id);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete quiz');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteQuiz, loading, error };
}

// ============================================================================
// useMyQuizSubmission - Fetch student's own quiz submission
// ============================================================================

interface UseMyQuizSubmissionResult {
  submission: QuizSubmission | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMyQuizSubmission(quizId: string | undefined): UseMyQuizSubmissionResult {
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmission = useCallback(async () => {
    if (!quizId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await quizService.getMySubmission(quizId);
      setSubmission(data);
    } catch (err) {
      const apiError = err as ApiError;
      // If 404, student hasn't submitted yet
      if (err instanceof Error && err.message.includes('404')) {
        setSubmission(null);
        setError(null);
      } else {
        setError(apiError.message || 'Failed to load submission');
        setSubmission(null);
      }
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  return { submission, loading, error, refetch: fetchSubmission };
}
