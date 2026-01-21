/**
 * CreateCourse Component
 * 
 * Form for creating a new course.
 * Teacher-only component.
 * 
 * Requirements:
 * - 5.1: Create courses with auto-generated unique course codes
 * - 5.9: Course name validation
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, ErrorMessage, Spinner } from '../shared';
import { courseService } from '../../services';
import { ROUTES } from '../../constants';
import type { CreateCourseRequest, Course, ApiError } from '../../types';

/**
 * CreateCourse component
 */
export const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<CreateCourseRequest>({
    name: '',
    description: '',
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [createdCourse, setCreatedCourse] = useState<Course | null>(null);

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Course name is required';
    } else if (formData.name.length > 200) {
      errors.name = 'Course name must not exceed 200 characters';
    }
    
    if (formData.description && formData.description.trim()) {
      if (formData.description.length > 5000) {
        errors.description = 'Course description must not exceed 5000 characters';
      }
    } else if (!formData.description || !formData.description.trim()) {
      errors.description = 'Course description is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setValidationErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Create course
      const course = await courseService.createCourse(formData);
      
      // Show success with course code
      setCreatedCourse(course);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
      });
    } catch (err) {
      const apiError = err as ApiError;
      
      // Handle validation errors from server
      if (apiError.code === 'VALIDATION_FAILED' && apiError.details) {
        setValidationErrors(apiError.details);
      } else {
        setError(apiError.message || 'Failed to create course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle navigation to course details
   */
  const handleViewCourse = () => {
    if (createdCourse) {
      navigate(ROUTES.TEACHER_COURSE_DETAILS.replace(':courseId', createdCourse.id));
    }
  };

  /**
   * Handle creating another course
   */
  const handleCreateAnother = () => {
    setCreatedCourse(null);
  };

  /**
   * Handle back to dashboard
   */
  const handleBackToDashboard = () => {
    navigate(ROUTES.TEACHER_DASHBOARD);
  };

  // Show success message after course creation
  if (createdCourse) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="text-center mb-6">
            <span className="text-5xl mb-4 block">🎉</span>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Course Created Successfully!
            </h2>
            <p className="text-gray-600 mb-4">
              Your course "{createdCourse.name}" has been created.
            </p>
          </div>

          {/* Course Code Display */}
          <div className="bg-blue-50 border-2 border-primary rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2 text-center">
              Course Code
            </p>
            <p className="text-4xl font-bold text-primary text-center tracking-wider">
              {createdCourse.courseCode}
            </p>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Share this code with students to enroll
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button variant="primary" onClick={handleViewCourse}>
              View Course
            </Button>
            <Button variant="secondary" onClick={handleCreateAnother}>
              Create Another Course
            </Button>
            <Button variant="secondary" onClick={handleBackToDashboard}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show create course form
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Create New Course
        </h2>

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Create Course Form */}
        <form onSubmit={handleSubmit}>
          {/* Course Name */}
          <Input
            label="Course Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Introduction to Programming"
            error={validationErrors.name}
            required
            disabled={loading}
            maxLength={200}
          />

          {/* Course Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block font-medium text-gray-800 mb-2">
              Course Description
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Describe what students will learn in this course..."
              required
              disabled={loading}
              rows={6}
              maxLength={5000}
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
              {(formData.description || '').length}/5000 characters
            </p>
          </div>

          {/* Helper Text */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> A unique course code will be automatically generated 
              after you create the course. Students will use this code to enroll.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Creating Course...
                </span>
              ) : (
                'Create Course'
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
