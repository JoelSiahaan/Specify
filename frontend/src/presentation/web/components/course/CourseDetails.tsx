/**
 * CourseDetails Component
 * 
 * Display course information (overview page).
 * Shows course name, description, and enrolled students list.
 * Materials, Quizzes, and Assignments are now in separate pages.
 * 
 * Requirements:
 * - 5.10: View course details
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Spinner, ErrorMessage } from '../shared';
import { CourseLayout, Breadcrumb } from '../layout';
import { UpdateCourse } from './UpdateCourse';
import { courseService } from '../../services';
import { ROUTES } from '../../constants';
import { useAuth } from '../../hooks';
import type { Course, ApiError, EnrollmentWithStudent } from '../../types';

export const CourseDetails: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [enrollments, setEnrollments] = useState<EnrollmentWithStudent[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Determine dashboard route based on user role
  const dashboardRoute = user?.role === 'STUDENT' ? ROUTES.STUDENT_DASHBOARD : ROUTES.TEACHER_DASHBOARD;

  // Check if user is teacher
  const isTeacher = user?.role === 'TEACHER';

  /**
   * Fetch course details on mount
   */
  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  /**
   * Fetch enrollments when course is loaded
   */
  useEffect(() => {
    if (course && courseId) {
      fetchEnrollments();
    }
  }, [course, courseId]);

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
   * Fetch enrollments from API
   */
  const fetchEnrollments = async () => {
    if (!courseId) return;

    try {
      setLoadingEnrollments(true);
      const response = await courseService.getCourseEnrollments(courseId);
      setEnrollments(response.data || []);
    } catch (err) {
      console.error('Failed to load enrollments:', err);
      // Don't show error to user, just log it
    } finally {
      setLoadingEnrollments(false);
    }
  };

  /**
   * Handle update success
   */
  const handleUpdateSuccess = (updatedCourse: Course) => {
    setCourse(updatedCourse);
    setIsEditing(false);
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
            { label: 'Home', path: dashboardRoute },
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
            {isTeacher && course.status === 'ACTIVE' && (
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
              >
                Edit Course
              </Button>
            )}
          </div>

          {/* Course Description */}
          {course.description && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
            </div>
          )}

          {/* Course Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600 mb-1">Teacher</p>
              <p className="text-gray-900 font-medium">{course.teacherName || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Enrolled Students</p>
              <p className="text-gray-900 font-medium">{course.enrollmentCount || 0} students</p>
            </div>
          </div>
        </div>

        {/* Enrolled Students Section (All Users) */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {isTeacher ? 'Enrolled Students' : 'Classmates'}
          </h2>
          
          {loadingEnrollments ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : course.enrollmentCount === 0 ? (
            <div className="text-center py-8">
              <span className="text-5xl mb-4 block">👥</span>
              <p className="text-gray-600">No students enrolled yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrolled Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.studentName || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {enrollment.studentEmail || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CourseLayout>
  );
};

export default CourseDetails;
