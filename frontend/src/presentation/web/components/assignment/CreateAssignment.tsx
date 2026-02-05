/**
 * CreateAssignment Component
 * 
 * Form for creating a new assignment with rich text description.
 * Teacher-only component.
 * 
 * Requirements:
 * - 9.1: Create assignments with title, description, and due date
 * - 9.2: Set due date in the past validation
 */

import React, { useState } from 'react';
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

interface CreateAssignmentProps {
  courseId: string;
  onSuccess?: (assignment: Assignment) => void;
  onCancel?: () => void;
}

export const CreateAssignment: React.FC<CreateAssignmentProps> = ({
  courseId,
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
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
      
      // Create assignment
      const assignment = await assignmentService.createAssignment(courseId, {
        title,
        description,
        dueDate: dueDateISO,
        submissionType,
        // Only include acceptedFileFormats if submission type is FILE or BOTH
        ...(submissionType !== SubmissionType.TEXT && {
          acceptedFileFormats: allowedFileTypes
        })
      });
      
      // Success callback
      if (onSuccess) {
        onSuccess(assignment);
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setSubmissionType(SubmissionType.FILE);
      setAllowedFileTypes(['pdf', 'docx']);
    } catch (err) {
      const apiError = err as ApiError;
      
      // Handle validation errors from server
      if (apiError.code === 'VALIDATION_FAILED' && apiError.details) {
        setValidationErrors(apiError.details);
      } else {
        setError(apiError.message || 'Failed to create assignment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Create New Assignment
      </h2>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Create Assignment Form */}
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
                Creating...
              </span>
            ) : (
              'Create Assignment'
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

export default CreateAssignment;
