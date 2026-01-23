/**
 * Student Dashboard Component
 * 
 * Displays enrolled courses with teacher names.
 * Provides links to access each course.
 * Handles empty state (no enrolled courses).
 * 
 * Requirements:
 * - 3.1: Student dashboard with enrolled courses
 * - 3.2: Display course names and teacher names
 * - 3.3: Provide links to access each course
 * - 3.4: Handle empty state (no enrolled courses)
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks';
import { listCourses } from '../services';
import { CourseCard } from '../components/course';
import { buildRoute, ROUTES } from '../constants';
import { useNavigate } from 'react-router-dom';
import type { Course } from '../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        // For students, fetch only enrolled courses for the dashboard
        // enrolledOnly=true ensures backend filters by enrollment
        console.log('[StudentDashboard] Fetching courses with enrolledOnly=true');
        const response = await listCourses({ status: 'ACTIVE', enrolledOnly: true });
        console.log('[StudentDashboard] Received courses:', response.data.length);
        setCourses(response.data);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* My Courses Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">My Courses</h2>
          <button 
            onClick={() => navigate(ROUTES.STUDENT_COURSES)}
            className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-150"
          >
            Browse Courses
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading courses...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-xl">⚠</span>
              <div>
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && courses.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">📚</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Enrolled Courses
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't enrolled in any courses yet. Browse available courses to get started!
              </p>
              <button 
                onClick={() => navigate(ROUTES.STUDENT_COURSES)}
                className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-150"
              >
                Browse Courses
              </button>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                linkTo={buildRoute(ROUTES.STUDENT_COURSE_DETAILS, { courseId: course.id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
