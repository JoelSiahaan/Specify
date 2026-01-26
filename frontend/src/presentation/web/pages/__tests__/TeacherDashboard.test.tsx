/**
 * TeacherDashboard Component Tests
 * 
 * Tests for the TeacherDashboard component including:
 * - Rendering
 * - Course list display
 * - Tab filtering
 * - Empty state
 * - Error handling
 * - Navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../../test/test-utils';
import { TeacherDashboard } from '../dashboard/TeacherDashboard';
import * as authHooks from '../../hooks/useAuth';
import * as courseService from '../../services/courseService';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock courseService
vi.mock('../../services/courseService', () => ({
  listCourses: vi.fn(),
  listArchivedCourses: vi.fn(),
}));

// Mock layout components
vi.mock('../../components/layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('TeacherDashboard', () => {
  const mockUser = {
    id: 'teacher-123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'TEACHER' as const,
  };

  const mockCourses = [
    {
      id: 'course-1',
      name: 'Introduction to Programming',
      description: 'Learn programming basics',
      courseCode: 'ABC123',
      status: 'ACTIVE' as const,
      teacherId: 'teacher-123',
      teacherName: 'John Doe',
      enrollmentCount: 25,
      createdAt: '2025-01-13T10:30:00Z',
      updatedAt: '2025-01-13T10:30:00Z',
    },
    {
      id: 'course-2',
      name: 'Advanced Algorithms',
      description: 'Advanced algorithm concepts',
      courseCode: 'DEF456',
      status: 'ACTIVE' as const,
      teacherId: 'teacher-123',
      teacherName: 'John Doe',
      enrollmentCount: 18,
      createdAt: '2025-01-13T10:30:00Z',
      updatedAt: '2025-01-13T10:30:00Z',
    },
  ];

  const mockArchivedCourses = [
    {
      id: 'course-3',
      name: 'Old Course',
      description: 'Archived course',
      courseCode: 'GHI789',
      status: 'ARCHIVED' as const,
      teacherId: 'teacher-123',
      teacherName: 'John Doe',
      enrollmentCount: 30,
      createdAt: '2025-01-13T10:30:00Z',
      updatedAt: '2025-01-13T10:30:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    vi.mocked(authHooks.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      clearError: vi.fn(),
    });

    // Default course service mocks
    vi.mocked(courseService.listCourses).mockResolvedValue({
      data: mockCourses,
    });
    vi.mocked(courseService.listArchivedCourses).mockResolvedValue({
      data: mockArchivedCourses,
    });
  });

  describe('Rendering', () => {
    it('should render welcome message with user name', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
      });
    });

    it('should render current date', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      await waitFor(() => {
        expect(screen.getByText(today)).toBeInTheDocument();
      });
    });

    it('should render My Courses section', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('My Courses')).toBeInTheDocument();
      });
    });

    it('should render Create New Course button', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new course/i })).toBeInTheDocument();
      });
    });

    it('should render tab filters', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^active$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^archived$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
      });
    });
  });

  describe('Course List Display', () => {
    it('should display active courses by default', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
        expect(screen.getByText('Advanced Algorithms')).toBeInTheDocument();
      });
    });

    it('should display course codes', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
        expect(screen.getByText('DEF456')).toBeInTheDocument();
      });
    });

    it('should display enrollment counts', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('25 students')).toBeInTheDocument();
        expect(screen.getByText('18 students')).toBeInTheDocument();
      });
    });

    it('should display course status badges', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        const statusBadges = screen.getAllByText('ACTIVE');
        expect(statusBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display action buttons for each course', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        const manageButtons = screen.getAllByRole('button', { name: /manage/i });
        const gradeButtons = screen.getAllByRole('button', { name: /grade/i });
        const viewButtons = screen.getAllByRole('button', { name: /view/i });
        
        expect(manageButtons.length).toBe(2);
        expect(gradeButtons.length).toBe(2);
        expect(viewButtons.length).toBe(2);
      });
    });
  });

  describe('Tab Filtering', () => {
    it('should show active courses when Active tab is selected', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });
      
      // Active tab should be selected by default
      const activeTab = screen.getByRole('button', { name: /^active$/i });
      expect(activeTab).toHaveClass('text-primary');
    });

    it('should show archived courses when Archived tab is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TeacherDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });
      
      // Click Archived tab
      const archivedTab = screen.getByRole('button', { name: /^archived$/i });
      await user.click(archivedTab);
      
      await waitFor(() => {
        expect(screen.getByText('Old Course')).toBeInTheDocument();
        expect(screen.queryByText('Introduction to Programming')).not.toBeInTheDocument();
      });
    });

    it('should show all courses when All tab is clicked', async () => {
      const user = userEvent.setup();
      
      // Don't mock - let it use the default mocks which already have both active and archived
      
      renderWithRouter(<TeacherDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });
      
      // Click All tab
      const allTab = screen.getByRole('button', { name: /^all$/i });
      await user.click(allTab);
      
      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
        expect(screen.getByText('Old Course')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no courses exist', async () => {
      vi.mocked(courseService.listCourses).mockResolvedValue({
        data: [],
      });
      
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('No Courses Yet')).toBeInTheDocument();
        expect(screen.getByText('Create your first course to get started.')).toBeInTheDocument();
      });
    });

    it('should show Create Course button in empty state', async () => {
      vi.mocked(courseService.listCourses).mockResolvedValue({
        data: [],
      });
      
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        const createButtons = screen.getAllByRole('button', { name: /create course/i });
        expect(createButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching courses', async () => {
      vi.mocked(courseService.listCourses).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      
      renderWithRouter(<TeacherDashboard />);
      
      // Should show spinner immediately
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(courseService.listCourses).mockRejectedValue({
        message: 'Failed to load courses',
      });
      
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load courses')).toBeInTheDocument();
      });
    });

    it('should display generic error when no message provided', async () => {
      vi.mocked(courseService.listCourses).mockRejectedValue({});
      
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load courses')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to create course page when Create New Course button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new course/i })).toBeInTheDocument();
      });
      
      const createButton = screen.getByRole('button', { name: /create new course/i });
      await user.click(createButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/teacher/courses/new');
    });

    it('should navigate to course details when Manage button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });
      
      const manageButtons = screen.getAllByRole('button', { name: /manage/i });
      await user.click(manageButtons[0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/teacher/courses/course-1/manage');
    });

    it('should navigate to grading page when Grade button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });
      
      const gradeButtons = screen.getAllByRole('button', { name: /grade/i });
      await user.click(gradeButtons[0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/teacher/courses/course-1/grading');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        const h2 = screen.getByRole('heading', { level: 2 });
        
        expect(h1).toBeInTheDocument();
        expect(h2).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', async () => {
      renderWithRouter(<TeacherDashboard />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });
});
