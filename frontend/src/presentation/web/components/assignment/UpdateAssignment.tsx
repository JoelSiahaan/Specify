/**
 * UpdateAssignment Component
 * 
 * Form for updating an existing assignment.
 * Teacher-only component.
 * 
 * Requirements:
 * - 9.8: Prevent editing after due date
 * - 9.9: Allow editing before due date
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Spinner } from '../shared/Spinner';
import * as assignmentService from '../../services/assignmentService';
import { 
  SUBMISSION_TYPE_LABELS, 
  SubmissionType, 
  Assignment, 
  ApiError 
} from '../../types';

interface UpdateAssignmentProps {
  assignmentId: string;
  onSuccess?: (assignment: Assignment) => void;
  onCancel?: () => void;
}

export const UpdateAssignment: React.FC<UpdateAssignmentProps> = ({
  assignmentId,
  onSuccess,
  onCancel,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submissionType, setSubmissionType] = useState<SubmissionType>(SubmissionType.FILE);
  const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>(['pdf', 'docx']);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isPastDueDate, setIsPastDueDate] = useState(false);

  /**
   * Load assignment data on mount
   */
  useEffect(() => {
    const loadAssignment = async () => {
      try {
        setLoadingAssignment(true);
        const assignment = await assignmentService.getAssignmentById(assignmentId);
        
        // Populate form with existing data
        setTitle(assignment.title);
        setDescription(assignment.description);
        setDueDate(formatDateForInput(assignment.dueDate));
        setSubmissionType(assignment.submissionType);
        setAllowedFileTypes(assignment.allowedFileTypes || ['pdf', 'docx']);
        
        // Check if past due date (Requirement 9.8)
        const dueDateObj = new Date(assignment.dueDate);
        const now = new Date();
        setIsPastDueDate(dueDateObj <= now);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to load assignment. Please try again.');
      } finally {
        setLoadingAssignment(false);
      }
    };
    
    loadAssignment();
  }, [assignmentId]);

  /**
   * Handle submission type change
   */
  const handleSubmissionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as SubmissionType;
    setSubmissionType(newType);
    
    // Reset file types if not FILE or BOTH
    if (newType === SubmissionType.TEXT) {
      setAllowedFileTypes([]);
    } else if (newType === SubmissionType.FILE || newType === SubmissionType.BOTH) {
      setAllowedFileTypes(['pdf', 'docx']);
    }
  };

  /**
   * Handle file type checkbox change
   */
  const handleFileTypeChange = (fileType: string, checked: boolean) => {
    if (checked) {
      setAllowedFileTypes([...allowedFileTypes, fileType]);
    } else {
      setAllowedFileTypes(allowedFileTypes.filter(type => type !== fileType));
    }
  };

  /**
   * Format date for datetime-local input
   * Converts ISO string to YYYY-MM-DDTHH:mm format
   */
  const formatDateForInput = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  /**
   * Convert datetime-local input to ISO string (UTC)
   */
  const convertToISOString = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return '';
    // datetime-local input gives us local time, convert to UTC
    const date = new Date(dateTimeLocal);
    return date.toISOString();
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Title validation
    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }
    
    // Description validation
    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.length > 10000) {
      errors.description = 'Description must not exceed 10,000 characters';
    }
    
    // Due date validation
    if (!dueDate) {
      errors.dueDate = 'Due date is required';
    } else {
      const dueDateObj = new Date(dueDate);
      const now = new Date();
      
      if (dueDateObj <= now) {
        errors.dueDate = 'Due date must be in the future';
      }
    }
    
    // File types validation (if FILE or BOTH)
    if (
      (submissionType === SubmissionType.FILE || submissionType === SubmissionType.BOTH) &&
      allowedFileTypes.length === 0
    ) {
      errors.allowedFileTypes = 'Please select at least one allowed file type';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Clear validation errors before proceeding
    setValidationErrors({});
    setLoading(true);
    
    try {
      // Convert due date to ISO string (UTC)
      const dueDateISO = convertToISOString(dueDate);
      
      // Update assignment
      const assignment = await assignmentService.updateAssignment(assignmentId, {
        title,
        description,
        dueDate: dueDateISO,
        submissionType,
        allowedFileTypes: 
          submissionType === SubmissionType.TEXT 
            ? undefined 
            : allowedFileTypes,
      });
      
      // Success callback
      if (onSuccess) {
        onSuccess(assignment);
      }
    } catch (err) {
      const apiError = err as ApiError;
      
      // Handle validation errors from server
      if (apiError.code === 'VALIDATION_FAILED' && apiError.details) {
        setValidationErrors(apiError.details);
      } else if (apiError.code === 'ASSIGNMENT_PAST_DUE') {
        // Requirement 9.8: Cannot edit after due date
        setError('Cannot edit assignment after the due date has passed.');
        setIsPastDueDate(true);
      } else {
        setError(apiError.message || 'Failed to update assignment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get minimum datetime for input (current time)
   */
  const getMinDateTime = (): string => {
    const now = new Date();
    return formatDateForInput(now.toISOString());
  };

  // Show loading spinner while fetching assignment
  if (loadingAssignment) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // Show error if past due date (Requirement 9.8)
  if (isPastDueDate) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Update Assignment
        </h2>
        <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠</span>
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Cannot Edit Assignment</h4>
              <p className="text-sm text-red-700">
                This assignment cannot be edited because the due date has passed. 
                Assignments can only be edited before their due date.
              </p>
            </div>
          </div>
        </div>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Update Assignment
      </h2>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Update Assignment Form */}
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <Input
          label="Title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Assignment 1: Variables"
          error={validationErrors.title}
          required
          disabled={loading}
          maxLength={200}
        />

        {/* Description (Textarea - will use RichTextEditor when library is installed) */}
        <div className="mb-4">
          <label htmlFor="description" className="block font-medium text-gray-800 mb-2">
            Description
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter assignment description and instructions..."
            required
            disabled={loading}
            rows={8}
            maxLength={10000}
            className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent ${
              validationErrors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-primary'
            } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
          {validationErrors.description && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.description}</p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            {description.length}/10,000 characters
          </p>
        </div>

        {/* Due Date (Timezone-aware) */}
        <div className="mb-4">
          <label htmlFor="dueDate" className="block font-medium text-gray-800 mb-2">
            Due Date
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="datetime-local"
            id="dueDate"
            name="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={getMinDateTime()}
            required
            disabled={loading}
            className={`w-full h-10 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent ${
              validationErrors.dueDate
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-primary'
            } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
          {validationErrors.dueDate && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.dueDate}</p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Select date and time in your local timezone
          </p>
        </div>

        {/* Submission Type */}
        <div className="mb-4">
          <label htmlFor="submissionType" className="block font-medium text-gray-800 mb-2">
            Submission Type
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="submissionType"
            value={submissionType}
            onChange={handleSubmissionTypeChange}
            disabled={loading}
            className="w-full h-10 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value={SubmissionType.FILE}>{SUBMISSION_TYPE_LABELS.FILE}</option>
            <option value={SubmissionType.TEXT}>{SUBMISSION_TYPE_LABELS.TEXT}</option>
            <option value={SubmissionType.BOTH}>{SUBMISSION_TYPE_LABELS.BOTH}</option>
          </select>
          <p className="text-sm text-gray-600 mt-1">
            Choose how students will submit their work
          </p>
        </div>

        {/* Allowed File Types (if FILE or BOTH) */}
        {(submissionType === SubmissionType.FILE || submissionType === SubmissionType.BOTH) && (
          <div className="mb-4">
            <label className="block font-medium text-gray-800 mb-2">
              Allowed File Types
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowedFileTypes.includes('pdf')}
                  onChange={(e) => handleFileTypeChange('pdf', e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700">PDF (.pdf)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowedFileTypes.includes('docx')}
                  onChange={(e) => handleFileTypeChange('docx', e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700">Word Document (.docx)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowedFileTypes.includes('jpg')}
                  onChange={(e) => handleFileTypeChange('jpg', e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700">JPEG Image (.jpg, .jpeg)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowedFileTypes.includes('png')}
                  onChange={(e) => handleFileTypeChange('png', e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700">PNG Image (.png)</span>
              </label>
            </div>
            {validationErrors.allowedFileTypes && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.allowedFileTypes}</p>
            )}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Updating...
              </span>
            ) : (
              'Update Assignment'
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UpdateAssignment;
