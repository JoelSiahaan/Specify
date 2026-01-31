/**
 * Test Wrappers
 * 
 * Enhanced test utilities with Router and Auth context support.
 * Created to fix 102 frontend test failures.
 */

import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import { AuthContext } from '../presentation/web/contexts/AuthContext';
import type { User } from '../presentation/web/types';
import { UserRole } from '../presentation/web/types';

/**
 * Mock user data for testing
 */
export const mockStudent: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.STUDENT,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

/**
 * Mock teacher data for testing
 */
export const mockTeacher: User = {
  id: 'test-teacher-id',
  email: 'teacher@example.com',
  name: 'Test Teacher',
  role: UserRole.TEACHER,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

/**
 * Mock auth context value
 */
const mockAuthContextValue = {
  user: mockStudent,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  getCurrentUser: async () => {},
  clearError: () => {},
};

/**
 * Router wrapper component
 * Wraps children with BrowserRouter
 */
export function RouterWrapper({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

/**
 * Auth wrapper component
 * Wraps children with AuthContext.Provider
 */
export function AuthWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={mockAuthContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * All providers wrapper component
 * Wraps children with both Router and Auth contexts
 */
export function AllProvidersWrapper({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContextValue}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

/**
 * Render with Router context
 * Use for components that need React Router (Link, useNavigate, etc.)
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: RouterWrapper, ...options });
}

/**
 * Render with Auth context
 * Use for components that need authentication (useAuth hook)
 */
export function renderWithAuth(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AuthWrapper, ...options });
}

/**
 * Render with all providers (Router + Auth)
 * Use for components that need both Router and Auth contexts
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProvidersWrapper, ...options });
}

/**
 * Render with custom auth user
 * Use when you need to test with a specific user (e.g., teacher)
 */
export function renderWithCustomAuth(
  ui: ReactElement,
  user: User | null,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const customAuthValue = {
    ...mockAuthContextValue,
    user,
  };

  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        <AuthContext.Provider value={customAuthValue}>
          {children}
        </AuthContext.Provider>
      </BrowserRouter>
    ),
    ...options,
  });
}
