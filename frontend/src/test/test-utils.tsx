/**
 * Test Utilities
 * 
 * Custom render functions and utilities for testing React components.
 * 
 * Key Features:
 * - Custom render with Router context
 * - Mock data for common entities
 * - Async testing helpers
 * - Validation attribute removal helper
 * - User event setup helper
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
 * @deprecated Use waitFor from @testing-library/react instead
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Helper to wait for element with custom timeout
 * 
 * @example
 * const element = await waitForElement(() => screen.getByText('Loaded'), 5000);
 */
export async function waitForElement<T>(
  callback: () => T,
  timeout = 3000
): Promise<T> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      return callback();
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  throw new Error(`Element not found within ${timeout}ms`);
}

/**
 * Helper to remove HTML5 validation attributes for testing custom validation
 * 
 * @example
 * const input = screen.getByLabelText(/email/i);
 * removeValidationAttributes(input);
 */
export function removeValidationAttributes(element: HTMLElement) {
  element.removeAttribute('required');
  element.removeAttribute('pattern');
  element.removeAttribute('min');
  element.removeAttribute('max');
  element.removeAttribute('minlength');
  element.removeAttribute('maxlength');
}

/**
 * Helper to setup user event with common options
 * 
 * @example
 * const user = setupUser();
 * await user.type(input, 'text');
 */
export function setupUser() {
  return userEvent.setup({
    // Disable delay for faster tests
    delay: null,
  });
}

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
