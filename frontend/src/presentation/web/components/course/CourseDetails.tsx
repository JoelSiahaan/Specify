/**
 * CourseDetails Component
 * 
 * Display course information with archive/delete actions for teachers.
 * Handles course lifecycle: Active → Archived → Deleted
 * 
 * Requirements:
 * - 5.4: Archive courses (auto-closes assignments/quizzes, prevents new enrollments)
 * - 5.6: Delete archived courses only (cascade deletes all related data)
 * - 5.7: Require archiving before deletion
 * - 5.10: View course details
 */
// 
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Spinner, ErrorMessage } from '../shared';
import { UpdateCourse } from './UpdateCourse';
import { courseService } from '../../services';
import { ROUTES } from '../../constants';
import { useAuth } from '../../hooks';
import type { Course, ApiError } from '../../types';

export const CourseDetails: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState<'archive' | 'delete' | null>(null);
  
  // Confirmation dialogs
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
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getCourseById(courseId);
      setCourse(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle archive course
   */
  const handleArchive = async () => {
    if (!courseId || !course) return;

    try {
      setActionLoading('archive');
      setError(null);
      
      const archivedCourse = await courseService.archiveCourse(courseId);
      setCourse(archivedCourse);
      setShowArchiveConfirm(false);
      
      // Show success message (could use toast notification)
      alert('Course archived successfully. All assignments and quizzes have been closed.');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to archive course');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handle delete course
   */
  const handleDelete = async () => {
    if (!courseId || !course) return;

    try {
      setActionLoading('delete');
      setError(null);
      
      await courseService.deleteCourse(courseId);
      
      // Navigate back to dashboard after successful deletion
      navigate(ROUTES.TEACHER_DASHBOARD);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete course');
      setActionLoading(null);
    }
  };

  /**
   * Handle update success
   */
  const handleUpdateSuccess = (updatedCourse: Course) => {
    setCourse(updatedCourse);
    setIsEditing(false);
  };

  /**
   * Check if user is the course owner
   */
  const isOwner = user?.id === course?.teacherId;

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
      <div className="max-w-4xl mx-auto p-6">
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

  // Course not found
  if (!course) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <span className="text-5xl mb-4 block">📚</span>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show edit form
  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <UpdateCourse
          courseId={course.id}
          onSuccess={handleUpdateSuccess}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  // Show course details
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Course Header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">{course.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">Course Code: {course.courseCode}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  course.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {course.status}
              </span>
            </div>
          </div>
        </div>

        {/* Course Description */}
        {course.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Future: Materials, Assignments, Quizzes tabs will be added here */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <p className="text-gray-600 text-center">
          Materials, Assignments, and Quizzes will be displayed here in future tasks.
        </p>
      </div>
    </div>
  );
};

export default CourseDetails;
