/**
 * useSubmissions Custom Hooks
 * 
 * Encapsulates all submission-related data fetching logic.
 * Provides reusable hooks for submission operations (grading).
 */

import { useState, useEffect, useCallback } from 'react';
import { assignmentService } from '../services';
import type { Submission, ApiError } from '../types';

// ============================================================================
// useSubmissions - Fetch submissions list for an assignment (teacher)
// ============================================================================

interface UseSubmissionsResult {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubmissions(assignmentId: string | undefined): UseSubmissionsResult {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await assignmentService.listSubmissions(assignmentId);
      setSubmissions(response.data || []);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { submissions, loading, error, refetch: fetchSubmissions };
}

// ============================================================================
// useSubmission - Fetch single submission by ID (for grading)
// ============================================================================

interface UseSubmissionResult {
  submission: Submission | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubmission(submissionId: string | undefined): UseSubmissionResult {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmission = useCallback(async () => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Note: We would need a getSubmissionById service method
      // For now, this is a placeholder
      // const data = await assignmentService.getSubmissionById(submissionId);
      // setSubmission(data);
      
      // Temporary: fetch from list and find by ID
      // This should be replaced with proper API endpoint
      throw new Error('getSubmissionById not implemented yet');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load submission');
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  return { submission, loading, error, refetch: fetchSubmission };
}
