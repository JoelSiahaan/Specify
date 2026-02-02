/**
 * GradeSubmission Component (Teacher View)
 * 
 * Displays submission content and provides grading interface for teachers.
 * Includes grade input (0-100), rich text feedback editor, and optimistic locking support.
 * 
 * Features:
 * - Display submission content (file or text)
 * - Grade input with validation (0-100)
 * - Rich text editor for feedback
 * - Optimistic locking error handling
 * - Concurrent grading warning
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 21.5
 */

import React, { useState, useEffect } from 'react';
import { RichTextEditor } from '../shared/RichTextEditor';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Spinner } from '../shared/Spinner';
import { formatDueDate } from '../../utils/dateFormatter';
import { getSubmissionById, gradeSubmission, updateGrade } from '../../services/gradingService';
import type { Submission } from '../../types';
import { SubmissionStatus } from '../../types/common.types';

interface GradeSubmissionProps {
  submissionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const GradeSubmission: React.FC<GradeSubmissionProps> = ({
  submissionId,
  onSuccess,
  onCancel,
}) => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [gradeError, setGradeError] = useState<string | null>(null);
  
  // Optimistic locking
  const [versionConflict, setVersionConflict] = useState(false);

  // Load submission details
  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSubmissionById(submissionId);
      setSubmission(data);
      
      // Pre-fill form if already graded
      if (data.grade !== undefined && data.grade !== null) {
        setGrade(data.grade.toString());
      }
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const validateGrade = (value: string): boolean => {
    setGradeError(null);
    
    if (!value.trim()) {
      setGradeError('Grade is required');
      return false;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setGradeError('Grade must be a number');
      return false;
    }
    
    if (numValue < 0 || numValue > 100) {
      setGradeError('Grade must be between 0 and 100');
      return false;
    }
    
    return true;
  };

  const handleGradeChange = (value: string) => {
    setGrade(value);
    setGradeError(null);
    setVersionConflict(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateGrade(grade)) {
      return;
    }
    
    if (!submission) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      setVersionConflict(false);
      
      const gradeData = {
        grade: parseFloat(grade),
        feedback: feedback.trim() || undefined,
        version: submission.version,  // Include version for optimistic locking
      };
      
      // Use appropriate endpoint based on whether submission is already graded
      const isAlreadyGraded = submission.status === SubmissionStatus.GRADED;
      const updatedSubmission = isAlreadyGraded
        ? await updateGrade(submissionId, gradeData)
        : await gradeSubmission(submissionId, gradeData);
      
      setSubmission(updatedSubmission);
      setSuccessMessage(
        isAlreadyGraded
          ? 'Grade updated successfully'
          : 'Submission graded successfully. Assignment is now closed for new submissions.'
      );
      
      // Call success callback after short delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save grade';
      
      // Check for version conflict (optimistic locking)
      if (errorMessage.includes('409') || errorMessage.includes('CONCURRENT_MODIFICATION')) {
        setVersionConflict(true);
        setError(
          'This submission was modified by another teacher. Please refresh and try again.'
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl">⚠</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl">⚠</span>
          <p className="text-sm text-red-700">Submission not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMessage && (
        <div className="border-l-4 border-green-500 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-green-500 text-xl">✓</span>
            <div className="flex-1">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠</span>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Version conflict warning */}
      {versionConflict && (
        <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="font-semibold mb-1 text-yellow-900">Concurrent Modification Detected</h4>
              <p className="text-sm text-yellow-800">
                Another teacher may be grading this submission. Please refresh the page to see the
                latest changes before continuing.
              </p>
              <button
                onClick={loadSubmission}
                className="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-900 underline"
              >
                Refresh Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Grade Submission</h2>
          {submission.status === SubmissionStatus.GRADED && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              <span>✓</span>
              <span>Graded</span>
            </span>
          )}
        </div>

        {/* Submission metadata */}
        <div className="space-y-2 text-sm text-gray-600">
          {submission.submittedAt && (
            <p>
              <span className="font-medium">Submitted:</span>{' '}
              {formatDueDate(submission.submittedAt.toString())}
            </p>
          )}
          {submission.isLate && (
            <p className="text-yellow-600 font-medium">
              <span>⚠</span> Late Submission
            </p>
          )}
          {submission.status === SubmissionStatus.GRADED && submission.gradedAt && (
            <p>
              <span className="font-medium">Graded:</span>{' '}
              {formatDueDate(submission.gradedAt.toString())}
            </p>
          )}
        </div>
      </div>

      {/* Submission Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Content</h3>

        {/* File submission */}
        {submission.filePath && submission.fileName && (
          <div className="mb-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-3xl">📄</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{submission.fileName}</p>
                <p className="text-sm text-gray-600">Uploaded file</p>
              </div>
              <a
                href={`/api/materials/${submission.id}/download`}
                download
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded transition-colors duration-150"
              >
                Download
              </a>
            </div>
          </div>
        )}

        {/* Text submission */}
        {submission.textContent && (
          <div className="mb-4">
            <label className="block font-medium text-gray-800 mb-2">Text Submission:</label>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg whitespace-pre-wrap">
              {submission.textContent}
            </div>
          </div>
        )}

        {/* No content */}
        {!submission.filePath && !submission.textContent && (
          <p className="text-gray-600 italic">No submission content available</p>
        )}
      </div>

      {/* Grading Form */}
      <form onSubmit={handleSubmit} noValidate className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade and Feedback</h3>

        {/* Grade input */}
        <div className="mb-6">
          <Input
            label="Grade (0-100)"
            name="grade"
            type="number"
            value={grade}
            onChange={(e) => handleGradeChange(e.target.value)}
            placeholder="Enter grade (0-100)"
            min="0"
            max="100"
            error={gradeError || undefined}
            required
            disabled={saving}
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter a grade between 0 and 100. Decimals are allowed.
          </p>
        </div>

        {/* Feedback editor */}
        <div className="mb-6">
          <label className="block font-medium text-gray-800 mb-2">
            Feedback <span className="text-gray-500 font-normal">(Optional)</span>
          </label>
          <RichTextEditor
            value={feedback}
            onChange={setFeedback}
            placeholder="Provide feedback to the student..."
            maxLength={5000}
            disabled={saving}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={saving || !!gradeError}
          >
            {saving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : submission.status === SubmissionStatus.GRADED ? (
              'Update Grade'
            ) : (
              'Save Grade'
            )}
          </Button>
        </div>

        {/* First-time grading warning */}
        {submission.status !== SubmissionStatus.GRADED && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <p>
                  Grading this submission will automatically close the assignment to prevent
                  further submissions from other students.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default GradeSubmission;
