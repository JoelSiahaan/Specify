/**
 * Course List Component
 * 
 * Displays searchable list of courses with enrollment functionality.
 * Shows course details (name, teacher, description).
 * Indicates enrollment status.
 * Allows students to enroll using course code.
 * 
 * Requirements:
 * - 6.1: Display only active courses with name, teacher, and description
 * - 6.2: NOT include archived courses in search results
 * - 6.3: Provide search box to filter active courses by name
 * - 6.4: Indicate which courses the student is already enrolled in
 * - 6.5: Enroll using valid course code for active course
 * - 6.6: Reject enrollment for archived course
 * - 6.7: Reject enrollment for invalid course code
 * - 6.8: Prevent duplicate enrollment
 */

import React, { useEffect, useState } from 'react';
import { searchCourses, enrollInCourse } from '../../services/courseService';

/**
 * Course search result with enrollment status
 */
interface CourseSearchResult {
  id: string;
  name: string;
  description: string | null;
  courseCode: string;
  status: string;
  teacherId: string;
  teacherName?: string;
  isEnrolled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<CourseSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollCourseCode, setEnrollCourseCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  // Fetch courses on mount and when search query changes
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use searchCourses service
        const response = await searchCourses(searchQuery.trim() || undefined);
        setCourses(response.data);
      } catch (err: any) {
        console.error('Failed to fetch courses:', err);
        setError(err.response?.data?.message || 'Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchCourses();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle enrollment
  const handleEnroll = async () => {
    if (!enrollCourseCode.trim()) {
      setEnrollError('Please enter a course code');
      return;
    }

    try {
      setEnrolling(true);
      setEnrollError(null);
      
      await enrollInCourse(enrollCourseCode.trim());
      
      // Show success message
      setEnrollSuccess(true);
      setEnrollCourseCode('');
      
      // Refresh course list to update enrollment status
      const response = await searchCourses(searchQuery.trim() || undefined);
      setCourses(response.data);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setEnrollModalOpen(false);
        setEnrollSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to enroll:', err);
      const errorCode = err.response?.data?.code;
      const errorMessage = err.response?.data?.message;
      
      // Map error codes to user-friendly messages
      if (errorCode === 'DUPLICATE_ENROLLMENT') {
        setEnrollError('You are already enrolled in this course.');
      } else if (errorCode === 'RESOURCE_NOT_FOUND') {
        setEnrollError('Invalid course code. Please check and try again.');
      } else if (errorCode === 'RESOURCE_ARCHIVED') {
        setEnrollError('This course is archived and no longer accepting enrollments.');
      } else {
        setEnrollError(errorMessage || 'Failed to enroll. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setEnrollModalOpen(false);
    setEnrollCourseCode('');
    setEnrollError(null);
    setEnrollSuccess(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Browse Courses
        </h1>
        <p className="text-gray-600">
          Search for courses and enroll using a course code
        </p>
      </div>

      {/* Search and Enroll Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search Box */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search courses by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        {/* Enroll Button */}
        <button
          onClick={() => setEnrollModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded transition-colors duration-150 whitespace-nowrap"
        >
          Enroll with Code
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
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Courses Found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery.trim()
                ? `No courses match "${searchQuery}". Try a different search term.`
                : 'No courses are currently available.'}
            </p>
          </div>
        </div>
      )}

      {/* Course List */}
      {!loading && !error && courses.length > 0 && (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Course Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {course.name}
                    </h3>
                    {course.isEnrolled && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        <span>✓</span>
                        <span>Enrolled</span>
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Course Code: <span className="font-medium">{course.courseCode}</span>
                  </p>
                  
                  {course.description && (
                    <p className="text-gray-700 mb-3">
                      {course.description}
                    </p>
                  )}
                  
                  {course.teacherName && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span>👤</span>
                      <span>Instructor: {course.teacherName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enroll Modal */}
      {enrollModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Enroll in Course
            </h3>
            
            {enrollSuccess ? (
              <div className="border-l-4 border-green-500 bg-green-50 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <h4 className="font-semibold text-green-900">Success!</h4>
                    <p className="text-sm text-green-700">
                      You have been enrolled in the course.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Enter the course code provided by your instructor to enroll.
                </p>
                
                <div className="mb-4">
                  <label className="block font-medium text-gray-800 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ABC123"
                    value={enrollCourseCode}
                    onChange={(e) => setEnrollCourseCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full h-10 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
                    disabled={enrolling}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Course codes are 6 characters (letters and numbers)
                  </p>
                </div>
                
                {enrollError && (
                  <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-red-500 text-xl">⚠</span>
                      <div>
                        <h4 className="font-semibold text-red-900">Error</h4>
                        <p className="text-sm text-red-700">{enrollError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCloseModal}
                    disabled={enrolling}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || !enrollCourseCode.trim()}
                    className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;
