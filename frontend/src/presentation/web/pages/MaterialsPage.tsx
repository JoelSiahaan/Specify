/**
 * MaterialsPage Component
 * 
 * Page for displaying and managing course materials.
 * Separated from course overview for better navigation structure.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, ErrorMessage } from '../components/shared';
import { CourseLayout, Breadcrumb } from '../components/layout';
import { MaterialList, CreateMaterial } from '../components/material';
import { courseService } from '../services';
import { ROUTES, buildRoute } from '../constants';
import { useAuth } from '../hooks';
import type { Course, ApiError } from '../types';

export const MaterialsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [refreshMaterials, setRefreshMaterials] = useState(0);

  // Determine dashboard route based on user role
  const dashboardRoute = user?.role === 'STUDENT' ? ROUTES.STUDENT_DASHBOARD : ROUTES.TEACHER_DASHBOARD;

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
   * Handle create material success
   */
  const handleCreateMaterialSuccess = () => {
    setShowCreateMaterial(false);
    setRefreshMaterials(prev => prev + 1);
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
          onClick={() => navigate(dashboardRoute)}
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
            onClick={() => navigate(dashboardRoute)}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CourseLayout courseId={courseId!} courseName={course.name}>
      <div className="p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', path: dashboardRoute },
            { 
              label: course.name, 
              path: user?.role === 'TEACHER' 
                ? buildRoute(ROUTES.TEACHER_COURSE_DETAILS, { courseId: courseId! })
                : buildRoute(ROUTES.STUDENT_COURSE_DETAILS, { courseId: courseId! })
            },
            { label: 'Materials' }
          ]}
        />

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Materials Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-gray-900">Materials</h1>
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
            key={refreshMaterials}
          />
        </div>
      </div>
    </CourseLayout>
  );
};

export default MaterialsPage;
