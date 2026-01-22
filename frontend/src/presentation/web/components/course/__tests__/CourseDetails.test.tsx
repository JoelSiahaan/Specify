/**
 * CourseDetails Component Tests
 * 
 * Tests for the CourseDetails component.
 * 
 * Requirements:
 * - 5.10: View course details
 * 
 * Note: Management actions (Edit, Archive, Delete) are tested in ManageCourse component tests.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CourseDetails } from '../CourseDetails';
import * as courseServiceModule from '../../../services/courseService';
import { AuthContext } from '../../../contexts/AuthContext';
import type { User, Course } from '../../../types';
import { UserRole, CourseStatus } from '../../../types';

// Mock services
vi.mock('../../../services/courseService');

// Mock useParams and useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ courseId: 'course-123' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock data
const mockTeacher: User = {
  id: 'teacher-123',
  email: 'teacher@example.com',
  name: 'John Teacher',
  role: UserRole.TEACHER,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockActiveCourse: Course = {
  id: 'course-123',
  name: 'Introduction to Programming',
  description: 'Learn programming basics',
  courseCode: 'ABC123',
  status: CourseStatus.ACTIVE,
  teacherId: 'teacher-123',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockArchivedCourse: Course = {
  ...mockActiveCourse,
  status: CourseStatus.ARCHIVED,
};

// Helper to render with auth context
const renderWithAuth = (user: User | null = mockTeacher) => {
  const mockAuthContext = {
    user,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    error: null,
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    clearError: vi.fn(),
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <CourseDetails />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('CourseDetails Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading and Display', () => {
    it('should display loading spinner while fetching course', () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithAuth();

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display course details after loading', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockActiveCourse);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      expect(screen.getByText('Course Code: ABC123')).toBeInTheDocument();
      expect(screen.getByText('Learn programming basics')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('should display error message when course fetch fails', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockRejectedValue({
        message: 'Failed to load course',
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Failed to load course')).toBeInTheDocument();
      });
    });

    it('should display archived course status', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockArchivedCourse);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      expect(screen.getByText('ARCHIVED')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have Back to Dashboard button', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockActiveCourse);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });
    });
  });
});
