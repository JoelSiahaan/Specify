/**
 * UpdateCourse Component
 * 
 * Form for updating course details (name and description).
 * Only allows updates for active courses.
 * 
 * Requirements:
 * - 5.3: Update course details (active courses only)
 * - 5.9: Course name validation (max 200 characters)
 */

import { useState, useEffect } from 'react';
import { getCourseById, updateCourse } from '../../services/courseService';
import { Spinner } from '../shared/Spinner';
import type { Course, UpdateCourseRequest } from '../../types';

interface UpdateCourseProps {
  courseId: string;
  onSuccess?: (course: Course) => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  general?: string;
}

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

export const UpdateCourse: React.FC<UpdateCourseProps> = ({
  courseId,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);
  const [updatedCourse, setUpdatedCourse] = useState<Course | null>(null);

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const data = await getCourseById(courseId);
        setCourse(data);
        setFormData({
          name: data.name,
          description: data.description || '',
        });
      } catch (error) {
        setErrors({
          general: error instanceof Error ? error.message : 'Failed to load course',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required';
    } else if (formData.name.length > MAX_NAME_LENGTH) {
      newErrors.name = `Course name must be ${MAX_NAME_LENGTH} characters or less`;
    }

    // Validate description
    if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const updateData: UpdateCourseRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };

      const updated = await updateCourse(courseId, updateData);
      setUpdatedCourse(updated);
      setSuccess(true);

      if (onSuccess) {
        onSuccess(updated);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: 'Failed to update course. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
        <span className="ml-3 text-gray-600">Loading course...</span>
      </div>
    );
  }

  // Error loading course
  if (!course) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl">⚠</span>
          <div>
            <h4 className="font-semibold text-red-900">Error Loading Course</h4>
            <p className="text-sm text-red-700">{errors.general || 'Course not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if course is archived
  if (course.status === 'ARCHIVED') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <div className="flex items-start gap-3">
          <span className="text-yellow-500 text-xl">⚠</span>
          <div>
            <h4 className="font-semibold text-yellow-900">Cannot Update Archived Course</h4>
            <p className="text-sm text-yellow-700">
              This course is archived and cannot be updated. Please unarchive it first if you need to make changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success && updatedCourse) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="text-center">
          <span className="text-5xl mb-4 block">✅</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Course Updated Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your course "{updatedCourse.name}" has been updated.
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  name: updatedCourse.name,
                  description: updatedCourse.description || '',
                });
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition-colors duration-150"
            >
              Edit Again
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-150"
              >
                Back to Course
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Update Course</h2>

      {errors.general && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠</span>
            <div>
              <h4 className="font-semibold text-red-900">Error</h4>
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Course Name */}
        <div>
          <label htmlFor="name" className="block font-medium text-gray-800 mb-2">
            Course Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full h-10 border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } rounded px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.name ? 'focus:ring-red-500' : 'focus:ring-primary'
            } focus:border-transparent`}
            placeholder="Enter course name"
            maxLength={MAX_NAME_LENGTH}
            disabled={submitting}
          />
          <div className="flex justify-between mt-1">
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            <p className="text-sm text-gray-500 ml-auto">
              {formData.name.length}/{MAX_NAME_LENGTH}
            </p>
          </div>
        </div>

        {/* Course Description */}
        <div>
          <label htmlFor="description" className="block font-medium text-gray-800 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className={`w-full border ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            } rounded px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.description ? 'focus:ring-red-500' : 'focus:ring-primary'
            } focus:border-transparent`}
            placeholder="Enter course description (optional)"
            rows={5}
            maxLength={MAX_DESCRIPTION_LENGTH}
            disabled={submitting}
          />
          <div className="flex justify-between mt-1">
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            <p className="text-sm text-gray-500 ml-auto">
              {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Spinner />}
            {submitting ? 'Updating...' : 'Update Course'}
          </button>
        </div>
      </form>
    </div>
  );
};
