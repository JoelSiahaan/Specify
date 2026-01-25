/**
 * SubmitAssignment Component
 * 
 * Student interface for submitting assignments with file upload and/or text submission.
 * 
 * Features:
 * - File upload with progress indicator
 * - Rich text editor for text submissions
 * - Display submission status
 * - Show late submission warning
 * - Handle closed assignment errors
 * - Support for FILE, TEXT, or BOTH submission types
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.12
 */

import React, { useState, useEffect } from 'react';
import { getAssignmentById, submitAssignment, getMySubmission } from '../../services/assignmentService';
import { formatDueDate, isPastDate } from '../../utils/dateFormatter';
import { Button, ErrorMessage, Spinner, FileUpload, RichTextEditor } from '../shared';
import type { Assignment, Submission } from '../../types';
import { SubmissionType, SubmissionStatus } from '../../types/common.types';

interface SubmitAssignmentProps {
  assignmentId: string;
  onSubmitSuccess?: (submission: Submission) => void;
  onCancel?: () => void;
}

export const SubmitAssignment: React.FC<SubmitAssignmentProps> = ({
  assignmentId,
  onSubmitSuccess,
  onCancel,
}) => {
  // Assignment data
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Existing submission data
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);

  // Submission data
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{
    file?: string;
    text?: string;
  }>({});

  /**
   * Fetch assignment details and existing submission
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch assignment details
        const assignmentData = await getAssignmentById(assignmentId);
        setAssignment(assignmentData);
        
        // Fetch existing submission (if any)
        const submission = await getMySubmission(assignmentId);
        setExistingSubmission(submission);
        
        // Pre-fill text content if exists
        if (submission?.textContent) {
          setTextContent(submission.textContent);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId]);

  /**
   * Check if assignment is late
   */
  const isLate = assignment ? isPastDate(assignment.dueDate) : false;

  /**
   * Check if submission is graded
   */
  const isGraded = existingSubmission?.status === SubmissionStatus.GRADED;

  /**
   * Check if can submit/resubmit
   */
  const canSubmit = !isGraded;

  /**
   * Validate submission before submit
   */
  const validateSubmission = (): boolean => {
    const errors: { file?: string; text?: string } = {};

    if (!assignment) return false;

    // Validate based on submission type
    if (assignment.submissionType === SubmissionType.FILE) {
      if (!selectedFile) {
        errors.file = 'Please select a file to upload';
      }
    } else if (assignment.submissionType === SubmissionType.TEXT) {
      if (!textContent.trim()) {
        errors.text = 'Please enter your submission text';
      }
    } else if (assignment.submissionType === SubmissionType.BOTH) {
      if (!selectedFile && !textContent.trim()) {
        errors.file = 'Please provide either a file or text submission';
        errors.text = 'Please provide either a file or text submission';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle submit assignment
   */
  const handleSubmit = async () => {
    if (!assignment) return;

    // Validate submission
    if (!validateSubmission()) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      // Prepare submission data
      const submissionData = {
        submissionType: assignment.submissionType,
        file: selectedFile || undefined,
        textContent: textContent.trim() || undefined,
      };

      // Submit assignment
      const submission = await submitAssignment(assignmentId, submissionData);

      // Notify parent component
      onSubmitSuccess?.(submission);
    } catch (err) {
      // Handle specific error codes
      if (err instanceof Error) {
        const errorMessage = err.message;
        
        // Check for closed assignment error
        if (errorMessage.includes('ASSIGNMENT_CLOSED') || errorMessage.includes('closed')) {
          setSubmitError('This assignment is closed and no longer accepts submissions.');
        } else if (errorMessage.includes('INVALID_FILE_TYPE')) {
          setSubmitError('Invalid file type. Please upload a supported file format.');
        } else if (errorMessage.includes('INVALID_FILE_SIZE')) {
          setSubmitError('File size exceeds the maximum limit of 10MB.');
        } else {
          setSubmitError(errorMessage);
        }
      } else {
        setSubmitError('Failed to submit assignment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setValidationErrors((prev) => ({ ...prev, file: undefined }));
  };

  /**
   * Handle text content change
   */
  const handleTextChange = (value: string) => {
    setTextContent(value);
    setValidationErrors((prev) => ({ ...prev, text: undefined }));
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error || !assignment) {
    return <ErrorMessage message={error || 'Assignment not found'} />;
  }

  /**
   * Determine if file upload is required/allowed
   */
  const showFileUpload =
    assignment.submissionType === SubmissionType.FILE ||
    assignment.submissionType === SubmissionType.BOTH;

  /**
   * Determine if text editor is required/allowed
   */
  const showTextEditor =
    assignment.submissionType === SubmissionType.TEXT ||
    assignment.submissionType === SubmissionType.BOTH;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Assignment Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{assignment.title}</h2>
        
        {/* Due date with late warning */}
        <div className="flex items-center gap-2 mb-4">
          <p className={`text-sm ${isLate ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
            Due: {formatDueDate(assignment.dueDate)}
          </p>
          {isLate && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
              <span>⚠</span>
              <span>Late Submission</span>
            </span>
          )}
        </div>

        {/* Existing submission info */}
        {existingSubmission && (
          <div className={`border-l-4 p-4 mb-4 ${
            isGraded ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'
          }`}>
            <div className="flex items-start gap-3">
              <span className={`text-xl ${isGraded ? 'text-green-500' : 'text-blue-500'}`}>
                {isGraded ? '✓' : 'ℹ'}
              </span>
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${
                  isGraded ? 'text-green-900' : 'text-blue-900'
                }`}>
                  {isGraded ? 'Already Graded' : 'Previous Submission'}
                </h4>
                <p className={`text-sm ${isGraded ? 'text-green-700' : 'text-blue-700'}`}>
                  Submitted: {formatDueDate(existingSubmission.submittedAt)}
                  {existingSubmission.isLate && ' (Late)'}
                </p>
                {existingSubmission.fileName && (
                  <p className={`text-sm mt-1 ${isGraded ? 'text-green-700' : 'text-blue-700'}`}>
                    File: {existingSubmission.fileName}
                  </p>
                )}
                {isGraded && existingSubmission.grade !== undefined && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-green-900">
                      Grade: {existingSubmission.grade}/100
                    </p>
                    {existingSubmission.feedback && (
                      <p className="text-sm text-green-700 mt-1">
                        Feedback: {existingSubmission.feedback}
                      </p>
                    )}
                  </div>
                )}
                {!isGraded && (
                  <p className={`text-sm mt-2 ${isGraded ? 'text-green-700' : 'text-blue-700'}`}>
                    You can resubmit until grading starts.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Late submission warning */}
        {isLate && !existingSubmission && (
          <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 text-xl" aria-hidden="true">⚠</span>
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">Late Submission Warning</h4>
                <p className="text-sm text-yellow-700">
                  The due date has passed. Your submission will be marked as late. You can still submit
                  until grading starts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assignment description */}
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
        </div>

        {/* Submission type info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Submission Type:</span>{' '}
            {assignment.submissionType === SubmissionType.FILE && 'File Upload'}
            {assignment.submissionType === SubmissionType.TEXT && 'Text Submission'}
            {assignment.submissionType === SubmissionType.BOTH && 'File Upload and/or Text Submission'}
          </p>
          {assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Allowed File Types:</span>{' '}
              {assignment.allowedFileTypes.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Submission Form */}
      {canSubmit && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {existingSubmission ? 'Resubmit Assignment' : 'Your Submission'}
          </h3>

          {/* Submit error */}
          {submitError && <ErrorMessage message={submitError} className="mb-4" />}

          {/* File Upload Section */}
          {showFileUpload && (
            <div className="mb-6">
              <label className="block font-medium text-gray-800 mb-2">
                {assignment.submissionType === SubmissionType.BOTH ? 'File Upload (Optional)' : 'File Upload'}
              </label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept={assignment.allowedFileTypes?.join(',') || '.pdf,.docx,.jpg,.jpeg,.png'}
                helperText={
                  assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0
                    ? `${assignment.allowedFileTypes.join(', ')} (max 10MB)`
                    : 'PDF, DOCX, or images (max 10MB)'
                }
                disabled={submitting}
              />
              {validationErrors.file && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.file}</p>
              )}
            </div>
          )}

          {/* Text Editor Section */}
          {showTextEditor && (
            <div className="mb-6">
              <label className="block font-medium text-gray-800 mb-2">
                {assignment.submissionType === SubmissionType.BOTH ? 'Text Submission (Optional)' : 'Text Submission'}
              </label>
              <RichTextEditor
                value={textContent}
                onChange={handleTextChange}
                placeholder="Enter your submission text here..."
                maxLength={5000}
                disabled={submitting}
                error={validationErrors.text}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            {onCancel && (
              <Button variant="secondary" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : existingSubmission ? 'Resubmit Assignment' : 'Submit Assignment'}
            </Button>
          </div>
        </div>
      )}

      {/* Graded message - cannot resubmit */}
      {!canSubmit && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block">✅</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Assignment Graded</h3>
            <p className="text-gray-600">
              This assignment has been graded. You cannot resubmit.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitAssignment;
