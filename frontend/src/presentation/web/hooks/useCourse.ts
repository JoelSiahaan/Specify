/**
 * useCourse Hook
 * 
 * Custom hook for managing course data fetching and state.
 * Uses CourseContext if available, otherwise fetches directly.
 */

import { useState, useEffect, useCallback } from 'react';
import { useCourseContext } from '../contexts';
import { courseService } from '../services';
import type { Course, ApiError } from '../types';

interface UseCourseResult {
  course: Course | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a single course by ID
 * Uses CourseContext for shared state management
 * 
 * @param courseId - The course ID to fetch
 * @returns Course data, loading state, error, and refetch function
 */
export function useCourse(courseId: string | undefined): UseCourseResult {
  const context = useCourseContext();
  const [localCourse, setLocalCourse] = useState<Course | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  // Fetch function for local state (when context not available)
  const fetchLocalCourse = useCallback(async () => {
    if (!courseId) {
      setLocalLoading(false);
      return;
    }

    try {
      setLocalLoading(true);
      setLocalError(null);
      const data = await courseService.getCourseById(courseId);
      setLocalCourse(data);
    } catch (err) {
      const apiError = err as ApiError;
      setLocalError(apiError.message || 'Failed to load course');
      setLocalCourse(null);
    } finally {
      setLocalLoading(false);
    }
  }, [courseId]);

  // Effect for fetching course - only depends on courseId
  useEffect(() => {
    if (!courseId) {
      setLocalLoading(false);
      return;
    }
    
    if (context) {
      // Use context's fetchCourse
      context.fetchCourse(courseId);
    } else {
      // Fallback to local fetch
      fetchLocalCourse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]); // Only re-fetch when courseId changes

  // Return context data if available, otherwise local data
  if (context) {
    return {
      course: context.currentCourse,
      loading: context.loading,
      error: context.error,
      refetch: () => context.fetchCourse(courseId || ''),
    };
  }

  return {
    course: localCourse,
    loading: localLoading,
    error: localError,
    refetch: fetchLocalCourse,
  };
}

interface UseCourseListResult {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch list of courses
 * Uses CourseContext for shared state management
 * 
 * @param includeArchived - Whether to include archived courses
 * @returns Courses list, loading state, error, and refetch function
 */
export function useCourseList(includeArchived: boolean = false): UseCourseListResult {
  const context = useCourseContext();
  const [localCourses, setLocalCourses] = useState<Course[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const fetchLocalCourses = useCallback(async () => {
    try {
      setLocalLoading(true);
      setLocalError(null);

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
        setLocalCourses(allCourses);
      } else {
        // Fetch only active courses
        const response = await courseService.listCourses();
        setLocalCourses(response.data || []);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setLocalError(apiError.message || 'Failed to load courses');
      setLocalCourses([]);
    } finally {
      setLocalLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    if (context) {
      // Use context's fetchCourses
      context.fetchCourses(includeArchived);
    } else {
      // Fallback to local fetch
      fetchLocalCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived]); // Only re-fetch when includeArchived changes

  // Return context data if available, otherwise local data
  if (context) {
    return {
      courses: context.courses,
      loading: context.loading,
      error: context.error,
      refetch: () => context.fetchCourses(includeArchived),
    };
  }

  return {
    courses: localCourses,
    loading: localLoading,
    error: localError,
    refetch: fetchLocalCourses,
  };
}
