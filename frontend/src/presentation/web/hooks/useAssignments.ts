/**
 * useAssignments Custom Hooks
 * 
 * Encapsulates all assignment-related data fetching logic.
 * Provides reusable hooks for assignment operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { assignmentService } from '../services';
import type { Assignment, Submission, ApiError } from '../types';

// ============================================================================
// useAssignments - Fetch assignments list for a course
// ============================================================================

interface UseAssignmentsResult {
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAssignments(courseId: string | undefined): UseAssignmentsResult {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await assignmentService.listAssignments(courseId);
      setAssignments(response.data || []);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return { assignments, loading, error, refetch: fetchAssignments };
}

// ============================================================================
// useAssignment - Fetch single assignment by ID
// ============================================================================

interface UseAssignmentResult {
  assignment: Assignment | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAssignment(assignmentId: string | undefined): UseAssignmentResult {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await assignmentService.getAssignmentById(assignmentId);
      setAssignment(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load assignment');
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  return { assignment, loading, error, refetch: fetchAssignment };
}

// ============================================================================
// useDeleteAssignment - Delete assignment
// ============================================================================

interface UseDeleteAssignmentResult {
  deleteAssignment: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useDeleteAssignment(): UseDeleteAssignmentResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAssignment = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await assignmentService.deleteAssignment(id);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete assignment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteAssignment, loading, error };
}

// ============================================================================
// useMySubmission - Fetch student's own submission
// ============================================================================

interface UseMySubmissionResult {
  submission: Submission | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMySubmission(assignmentId: string | undefined): UseMySubmissionResult {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmission = useCallback(async () => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await assignmentService.getMySubmission(assignmentId);
      setSubmission(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load submission');
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  return { submission, loading, error, refetch: fetchSubmission };
}
