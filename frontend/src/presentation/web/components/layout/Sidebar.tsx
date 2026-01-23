/**
 * Sidebar Component
 * 
 * Moodle-inspired left sidebar navigation (240px fixed width).
 * Two types: 'dashboard' (shows course list) and 'course' (shows course navigation).
 * 
 * Features:
 * - Dashboard type: Shows active/archived course lists
 * - Course type: Shows course navigation links
 * - Responsive: Hidden on mobile (< 1024px), show hamburger menu
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService } from '../../services';
import { useAuth } from '../../hooks';
import { ROUTES } from '../../constants';
import type { Course } from '../../types';

interface SidebarProps {
  type: 'dashboard' | 'course';
  courseId?: string;
  courseName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ type, courseId, courseName }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for dashboard sidebar
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [archivedCourses, setArchivedCourses] = useState<Course[]>([]);
  const [showActive, setShowActive] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Determine dashboard route based on user role
  const dashboardRoute = user?.role === 'STUDENT' ? ROUTES.STUDENT_DASHBOARD : ROUTES.TEACHER_DASHBOARD;

  /**
   * Fetch courses for dashboard sidebar
   */
  useEffect(() => {
    if (type === 'dashboard') {
      fetchCourses();
    }
  }, [type]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [activeResponse, archivedResponse] = await Promise.all([
        courseService.listCourses(),
        courseService.listArchivedCourses()
      ]);
      setActiveCourses(activeResponse.data || []);
      setArchivedCourses(archivedResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle scroll to section (for course sidebar)
   */
  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  /**
   * Render Dashboard Sidebar
   */
  if (type === 'dashboard') {
    return (
      <aside className="hidden lg:block w-60 bg-white border-r border-gray-200 min-h-screen">
        <div className="p-4">
          {/* Dashboard Link */}
          <Link
            to={ROUTES.TEACHER_DASHBOARD}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <span>🏠</span>
            <span className="font-medium">Dashboard</span>
          </Link>

          {/* My Courses Section */}
          <div className="mt-4">
            <div className="px-3 py-2 text-sm font-semibold text-gray-600 uppercase">
              My Courses
            </div>

            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
            ) : (
              <>
                {/* Active Courses */}
                <div className="mt-2">
                  <button
                    onClick={() => setShowActive(!showActive)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    <span className="text-xs">{showActive ? '▼' : '▶'}</span>
                    <span className="font-medium text-sm">Active</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {activeCourses.length}
                    </span>
                  </button>
                  {showActive && (
                    <div className="ml-4 mt-1 space-y-1">
                      {activeCourses.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500">No active courses</div>
                      ) : (
                        activeCourses.map((course) => (
                          <Link
                            key={course.id}
                            to={ROUTES.TEACHER_COURSE_DETAILS.replace(':courseId', course.id)}
                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors truncate"
                            title={course.name}
                          >
                            {course.name}
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Archived Courses */}
                <div className="mt-2">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    <span className="text-xs">{showArchived ? '▼' : '▶'}</span>
                    <span className="font-medium text-sm">Archived</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {archivedCourses.length}
                    </span>
                  </button>
                  {showArchived && (
                    <div className="ml-4 mt-1 space-y-1">
                      {archivedCourses.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500">No archived courses</div>
                      ) : (
                        archivedCourses.map((course) => (
                          <Link
                            key={course.id}
                            to={ROUTES.TEACHER_COURSE_DETAILS.replace(':courseId', course.id)}
                            className="block px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded transition-colors truncate"
                            title={course.name}
                          >
                            {course.name}
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    );
  }

  /**
   * Render Course Sidebar
   */
  return (
    <aside className="hidden lg:block w-60 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        {/* Course Name Header */}
        <div className="px-3 py-2 mb-4">
          <h2 className="font-semibold text-gray-900 text-sm truncate" title={courseName}>
            {courseName}
          </h2>
        </div>

        {/* Course Navigation */}
        <nav className="space-y-1">
          {/* Overview */}
          <button
            onClick={() => scrollToSection('top')}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors text-left"
          >
            <span>▶</span>
            <span className="text-sm">Overview</span>
          </button>

          {/* Materials */}
          <button
            onClick={() => scrollToSection('materials-section')}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors text-left"
          >
            <span>▶</span>
            <span className="text-sm">Materials</span>
          </button>

          {/* Assignments (Coming Soon) */}
          <button
            disabled
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 cursor-not-allowed rounded text-left"
            title="Coming Soon"
          >
            <span>▶</span>
            <span className="text-sm">Assignments</span>
            <span className="ml-auto text-xs">Soon</span>
          </button>

          {/* Quizzes (Coming Soon) */}
          <button
            disabled
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 cursor-not-allowed rounded text-left"
            title="Coming Soon"
          >
            <span>▶</span>
            <span className="text-sm">Quizzes</span>
            <span className="ml-auto text-xs">Soon</span>
          </button>

          {/* Grades (Coming Soon) */}
          <button
            disabled
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 cursor-not-allowed rounded text-left"
            title="Coming Soon"
          >
            <span>▶</span>
            <span className="text-sm">Grades</span>
            <span className="ml-auto text-xs">Soon</span>
          </button>
        </nav>

        {/* Back to Dashboard Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate(dashboardRoute)}
            className="w-full px-3 py-2 text-sm text-primary hover:bg-primary-lighter rounded transition-colors font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
