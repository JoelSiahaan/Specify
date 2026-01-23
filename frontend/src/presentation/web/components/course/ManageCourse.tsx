/**
 * ManageCourse Component
 * 
 * Administrative actions for course management.
 * Shows only action buttons (Edit, Archive, Delete) without detailed course info.
 * 
 * Requirements:
 * - 5.2: Edit courses (active only)
 * - 5.4: Archive courses (active only)
 * - 5.6: Delete courses (archived only)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, ErrorMessage } from '../shared';
import { courseService } from '../../services';
import { ROUTES } from '../../constants';
import type { Course, ApiError } from '../../types';

export const ManageCourse: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Fetch course details on mount
   */
  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  /**
   * Fetch course from API
   */
  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getCourseById(courseId!);
      setCourse(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle edit course
   */
  const handleEdit = () => {
    navigate(ROUTES.TEACHER_EDIT_COURSE.replace(':courseId', courseId!));
  };

  /**
   * Handle archive course
   */
  const handleArchive = async () => {
    try {
      setActionLoading(true);
      await courseService.archiveCourse(courseId!);
      setShowArchiveConfirm(false);
      navigate(ROUTES.TEACHER_DASHBOARD);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to archive course');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle delete course
   */
  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await courseService.deleteCourse(courseId!);
      setShowDeleteConfirm(false);
      navigate(ROUTES.TEACHER_DASHBOARD);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete course');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error && !course) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <ErrorMessage message={error} />
        <Button
          variant="secondary"
          onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}
          className="mt-4"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const isActive = course.status === 'ACTIVE';
  const isArchived = course.status === 'ARCHIVED';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Manage Course
          </h2>
          <p className="text-gray-600">
            {course.name} ({course.courseCode})
          </p>
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {course.status}
          </span>
        </div>

        {/* Course Info - Timestamps */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="font-medium text-gray-900">
              {new Date(course.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="font-medium text-gray-900">
              {new Date(course.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Edit Button (always available) */}
          <Button
            variant="primary"
            onClick={handleEdit}
            disabled={actionLoading}
            className="w-full"
          >
            Edit Course
          </Button>

          {/* Archive Button (active courses only) */}
          {isActive && (
            <Button
              variant="secondary"
              onClick={() => setShowArchiveConfirm(true)}
              disabled={actionLoading}
              className="w-full"
            >
              Archive Course
            </Button>
          )}

          {/* Delete Button (archived courses only) */}
          {isArchived && (
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={actionLoading}
              className="w-full"
            >
              Delete Course
            </Button>
          )}

        </div>
      </div>

      {/* Archive Confirmation Dialog */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Archive Course?
            </h3>
            <p className="text-gray-600 mb-6">
              Archiving this course will close all assignments and quizzes, and prevent new enrollments. 
              Students will still be able to view their grades and materials.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowArchiveConfirm(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleArchive}
                disabled={actionLoading}
              >
                {actionLoading ? 'Archiving...' : 'Archive Course'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl">⚠️</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Delete Course?
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to delete "{course.name}"? 
                  This action cannot be undone and will delete all materials, assignments, and submissions.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Course'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourse;
