/**
 * CourseDetails Component Tests
 * 
 * Tests for the CourseDetails component.
 * 
 * Requirements:
 * - 5.4: Archive courses
 * - 5.6: Delete archived courses only
 * - 5.7: Require archiving before deletion
 * - 5.10: View course details
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  });

  describe('Active Course Actions', () => {
    it('should show Edit and Archive buttons for active course', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockActiveCourse);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Edit Course')).toBeInTheDocument();
      });

      expect(screen.getByText('Archive Course')).toBeInTheDocument();
      expect(screen.queryByText('Delete Course')).not.toBeInTheDocument();
    });

    it('should show edit form when Edit button is clicked', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockActiveCourse);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Edit Course')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit Course');
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Update Course' })).toBeInTheDocument();
      });
    });

    it('should show archive confirmation dialog when Archive button is clicked', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockActiveCourse);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Archive Course')).toBeInTheDocument();
      });

      const archiveButton = screen.getByText('Archive Course');
      await userEvent.click(archiveButton);

      await waitFor(() => {
        expect(screen.getByText('Archive Course?')).toBeInTheDocument();
      });

      expect(screen.getByText(/Close all assignments and quizzes/i)).toBeInTheDocument();
      expect(screen.getByText(/Prevent new enrollments/i)).toBeInTheDocument();
    });

    it('should archive course when confirmed', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockActiveCourse);
      vi.spyOn(courseServiceModule, 'archiveCourse').mockResolvedValue(mockArchivedCourse);

      // Mock window.alert
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Archive Course')).toBeInTheDocument();
      });

      // Click Archive button
      const archiveButton = screen.getByText('Archive Course');
      await userEvent.click(archiveButton);

      // Confirm in dialog
      await waitFor(() => {
        expect(screen.getByText('Archive Course?')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByText('Archive Course');
      const confirmButton = confirmButtons[confirmButtons.length - 1]; // Get the one in the dialog
      expect(confirmButton).toBeDefined();
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(courseServiceModule.archiveCourse).toHaveBeenCalledWith('course-123');
      });

      expect(alertMock).toHaveBeenCalledWith(
        'Course archived successfully. All assignments and quizzes have been closed.'
      );

      alertMock.mockRestore();
    });
  });

  describe('Archived Course Actions', () => {
    it('should show Delete button for archived course', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockArchivedCourse);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Delete Course')).toBeInTheDocument();
      });

      expect(screen.queryByText('Edit Course')).not.toBeInTheDocument();
      expect(screen.queryByText('Archive Course')).not.toBeInTheDocument();
    });

    it('should show delete confirmation dialog when Delete button is clicked', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockArchivedCourse);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Delete Course')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete Course');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Course?')).toBeInTheDocument();
      });

      expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
    });

    it('should delete course and navigate to dashboard when confirmed', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockArchivedCourse);
      vi.spyOn(courseServiceModule, 'deleteCourse').mockResolvedValue(undefined);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Delete Course')).toBeInTheDocument();
      });

      // Click Delete button
      const deleteButton = screen.getByText('Delete Course');
      await userEvent.click(deleteButton);

      // Confirm in dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Course?')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByText('Delete Course');
      const confirmButton = confirmButtons[confirmButtons.length - 1]; // Get the one in the dialog
      expect(confirmButton).toBeDefined();
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(courseServiceModule.deleteCourse).toHaveBeenCalledWith('course-123');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard');
    });
  });

  describe('Authorization', () => {
    it('should not show action buttons for non-owner', async () => {
      const otherTeacher: User = {
        ...mockTeacher,
        id: 'other-teacher-123',
      };

      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockActiveCourse);

      renderWithAuth(otherTeacher);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      expect(screen.queryByText('Edit Course')).not.toBeInTheDocument();
      expect(screen.queryByText('Archive Course')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete Course')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when archive fails', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockActiveCourse);
      vi.spyOn(courseServiceModule, 'archiveCourse').mockRejectedValue({
        message: 'Failed to archive course',
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Archive Course')).toBeInTheDocument();
      });

      // Click Archive button
      const archiveButton = screen.getByText('Archive Course');
      await userEvent.click(archiveButton);

      // Confirm in dialog
      await waitFor(() => {
        expect(screen.getByText('Archive Course?')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByText('Archive Course');
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      expect(confirmButton).toBeDefined();
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to archive course')).toBeInTheDocument();
      });
    });

    it('should display error message when delete fails', async () => {
      vi.spyOn(courseServiceModule, 'getCourseById').mockResolvedValue(mockArchivedCourse);
      vi.spyOn(courseServiceModule, 'deleteCourse').mockRejectedValue({
        message: 'Failed to delete course',
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByText('Delete Course')).toBeInTheDocument();
      });

      // Click Delete button
      const deleteButton = screen.getByText('Delete Course');
      await userEvent.click(deleteButton);

      // Confirm in dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Course?')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByText('Delete Course');
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      expect(confirmButton).toBeDefined();
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete course')).toBeInTheDocument();
      });
    });
  });
});
