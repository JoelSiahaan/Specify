/**
 * Test Utilities
 * 
 * Custom render functions and utilities for testing React components.
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  });
}

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'STUDENT' as const,
};

/**
 * Mock teacher data for testing
 */
export const mockTeacher = {
  id: 'test-teacher-id',
  email: 'teacher@example.com',
  name: 'Test Teacher',
  role: 'TEACHER' as const,
};

/**
 * Mock course data for testing
 */
export const mockCourse = {
  id: 'test-course-id',
  name: 'Test Course',
  description: 'Test course description',
  courseCode: 'TEST123',
  status: 'ACTIVE' as const,
  teacherId: 'test-teacher-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Mock assignment data for testing
 */
export const mockAssignment = {
  id: 'test-assignment-id',
  title: 'Test Assignment',
  description: 'Test assignment description',
  dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  courseId: 'test-course-id',
  submissionType: 'BOTH' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Create mock API response
 */
export function createMockResponse<T>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
}

/**
 * Create mock API error
 */
export function createMockError(code: string, message: string, status = 400) {
  const error: any = new Error(message);
  error.response = {
    data: { code, message },
    status,
    statusText: 'Bad Request',
    headers: {},
    config: {} as any,
  };
  return error;
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
