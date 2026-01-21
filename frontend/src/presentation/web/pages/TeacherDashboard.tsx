/**
 * Teacher Dashboard Component
 * 
 * Dashboard for teachers showing created courses with enrollment counts.
 * Follows Moodle-inspired design with two-column layout.
 * 
 * Requirements:
 * - 4.1: Teacher dashboard
 * - 4.2: Display created courses with enrollment counts
 * - 4.3: Create course button
 * - 4.4: Links to manage each course
 * - 4.5: Empty state handling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Spinner, ErrorMessage } from '../components/shared';
import { useAuth } from '../hooks';
import { courseService } from '../services';
import { ROUTES } from '../constants';
import type { Course, CourseWithTeacher } from '../types';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [courses, setCourses] = useState<CourseWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'all'>('active');

  /**
   * Fetch courses on mount, when tab changes, or when navigating back to dashboard
   * The location dependency ensures courses refresh when navigating back from CreateCourse
   */
  useEffect(() => {
    fetchCourses();
  }, [activeTab, location.key]);

  /**
   * Fetch courses from API
   */
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      let fetchedCourses: Course[] = [];
      
      if (activeTab === 'archived') {
        // Fetch only archived courses
        const response = await courseService.listArchivedCourses();
        fetchedCourses = response.data || [];
      } else if (activeTab === 'all') {
        // Fetch all courses (active + archived)
        // Make two API calls and combine the results
        const [activeResponse, archivedResponse] = await Promise.all([
          courseService.listCourses(),
          courseService.listArchivedCourses()
        ]);
        
        const activeCourses = activeResponse.data || [];
        const archivedCourses = archivedResponse.data || [];
        fetchedCourses = [...activeCourses, ...archivedCourses];
      } else {
        // Fetch only active courses (default)
        const response = await courseService.listCourses();
        fetchedCourses = response.data || [];
      }
      
      console.log('Fetched courses:', fetchedCourses); // Debug log
      console.log('Active tab:', activeTab); // Debug log
      
      setCourses(fetchedCourses);
    } catch (err: any) {
      console.error('Error fetching courses:', err); // Debug log
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle create course button click
   */
  const handleCreateCourse = () => {
    navigate(ROUTES.TEACHER_CREATE_COURSE);
  };

  /**
   * Handle manage course button click (Edit, Archive, Delete)
   */
  const handleManageCourse = (courseId: string) => {
    navigate(ROUTES.TEACHER_MANAGE_COURSE.replace(':courseId', courseId));
  };

  /**
   * Handle view course button click (View course info, materials, assignments, etc)
   */
  const handleViewCourse = (courseId: string) => {
    navigate(ROUTES.TEACHER_COURSE_DETAILS.replace(':courseId', courseId));
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <div className="text-center py-16">
      <span className="text-6xl mb-4 block">📚</span>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Yet</h3>
      <p className="text-gray-600 mb-6">Create your first course to get started.</p>
      <Button variant="primary" onClick={handleCreateCourse}>
        Create Course
      </Button>
    </div>
  );

  /**
   * Render course list item
   */
  const renderCourseItem = (course: CourseWithTeacher) => (
    <div
      key={course.id}
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
    >
      {/* Course Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{course.name}</h3>
          <p className="text-sm text-gray-600">{course.courseCode}</p>
        </div>
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

      {/* Course Description */}
      {course.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
      )}

      {/* Course Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <span>👥</span>
          <span>{course.enrollmentCount ?? 0} students</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleManageCourse(course.id)}
          className="flex-1"
        >
          Manage
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleViewCourse(course.id)}
          className="flex-1"
        >
          View
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(ROUTES.TEACHER_GRADING.replace(':courseId', course.id))}
          className="flex-1"
        >
          Grade
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* My Courses Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">My Courses</h2>
          <Button variant="primary" onClick={handleCreateCourse}>
            + Create New Course
          </Button>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'active'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'archived'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Archived
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
        </div>

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {/* Course List */}
        {!loading && !error && (
          <>
            {courses.length === 0 ? (
              renderEmptyState()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(renderCourseItem)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
