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
import { CourseLayout, Breadcrumb } from '../layout';
import { UpdateCourse } from './UpdateCourse';
import { MaterialList, CreateMaterial } from '../material';
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
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [refreshMaterials, setRefreshMaterials] = useState(0);

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
   * Handle update success
   */
  const handleUpdateSuccess = (updatedCourse: Course) => {
    setCourse(updatedCourse);
    setIsEditing(false);
  };

  /**
   * Handle create material success
   */
  const handleCreateMaterialSuccess = () => {
    setShowCreateMaterial(false);
    setRefreshMaterials(prev => prev + 1); // Trigger MaterialList refresh
  };

  /**
   * Check if user is teacher
   */
  const isTeacher = user?.role === 'TEACHER';

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
      <CourseLayout courseId={courseId!} courseName={course?.name || 'Course'}>
        <div className="p-6">
          <UpdateCourse
            courseId={course!.id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </CourseLayout>
    );
  }

  // Show course details
  return (
    <CourseLayout courseId={courseId!} courseName={course.name}>
      <div className="p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: ROUTES.TEACHER_DASHBOARD },
            { label: 'My Courses', href: ROUTES.TEACHER_DASHBOARD },
            { label: course.name }
          ]}
        />

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

        {/* Materials Section */}
        <div id="materials-section" className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Materials</h2>
            {isTeacher && !showCreateMaterial && course.status === 'ACTIVE' && (
              <Button
                variant="primary"
                onClick={() => setShowCreateMaterial(true)}
              >
                + Add Material
              </Button>
            )}
          </div>

          {/* Archived Course Notice */}
          {course.status === 'ARCHIVED' && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                📦 This course is archived and read-only. Materials cannot be added, edited, or deleted.
              </p>
            </div>
          )}

          {/* Create Material Modal */}
          {showCreateMaterial && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <CreateMaterial
                  courseId={courseId!}
                  onSuccess={handleCreateMaterialSuccess}
                  onCancel={() => setShowCreateMaterial(false)}
                />
              </div>
            </div>
          )}

          {/* Material List */}
          <MaterialList
            courseId={courseId!}
            courseStatus={course.status}
            key={refreshMaterials} // Force re-render when material created
          />
        </div>
      </div>
    </CourseLayout>
  );
};

export default CourseDetails;
