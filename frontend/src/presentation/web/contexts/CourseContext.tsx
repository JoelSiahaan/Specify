/**
 * Course Context
 * 
 * Provides course state management across the application.
 * Similar to AuthContext but for course data.
 */

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { courseService } from '../services';
import type { Course, ApiError } from '../types';

interface CourseContextState {
  currentCourse: Course | null;
  courses: Course[];
  loading: boolean;
  error: string | null;
  fetchCourse: (courseId: string) => Promise<void>;
  fetchCourses: (includeArchived?: boolean) => Promise<void>;
  clearCurrentCourse: () => void;
  clearError: () => void;
}

const CourseContext = createContext<CourseContextState | undefined>(undefined);

interface CourseProviderProps {
  children: ReactNode;
}

export function CourseProvider({ children }: CourseProviderProps) {
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch a single course by ID
   */
  const fetchCourse = useCallback(async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getCourseById(courseId);
      setCurrentCourse(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load course');
      setCurrentCourse(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch list of courses
   * @param includeArchived - Whether to include archived courses
   */
  const fetchCourses = useCallback(async (includeArchived: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      if (includeArchived) {
        // Fetch both active and archived courses
        const [activeResponse, archivedResponse] = await Promise.all([
          courseService.listCourses(),
          courseService.listArchivedCourses()
        ]);

        const allCourses = [
          ...(activeResponse.data || []),
          ...(archivedResponse.data || [])
        ];
        setCourses(allCourses);
      } else {
        // Fetch only active courses
        const response = await courseService.listCourses();
        setCourses(response.data || []);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear current course
   */
  const clearCurrentCourse = useCallback(() => {
    setCurrentCourse(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: CourseContextState = useMemo(() => ({
    currentCourse,
    courses,
    loading,
    error,
    fetchCourse,
    fetchCourses,
    clearCurrentCourse,
    clearError,
  }), [currentCourse, courses, loading, error, fetchCourse, fetchCourses, clearCurrentCourse, clearError]);

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
}

/**
 * Hook to use course context
 */
export function useCourseContext() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourseContext must be used within a CourseProvider');
  }
  return context;
}
