/**
 * StudentDashboard Component Tests
 * 
 * Tests for the StudentDashboard component including:
 * - Rendering
 * - Course list display
 * - Empty state
 * - Error handling
 * - Navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../../../test/test-utils';
import { StudentDashboard } from '../dashboard/StudentDashboard';
import * as authHooks from '../../hooks/useAuth';
import * as courseService from '../../services/courseService';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock courseService
vi.mock('../../services/courseService', () => ({
  listCourses: vi.fn(),
}));

describe('StudentDashboard', () => {
  const mockUser = {
    id: 'student-123',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'STUDENT' as const,
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
      createdAt: '2025-01-13T10:30:00Z',
      updatedAt: '2025-01-13T10:30:00Z',
    },
    {
      id: 'course-2',
      name: 'Advanced Algorithms',
      description: 'Advanced algorithm concepts',
      courseCode: 'DEF456',
      status: 'ACTIVE' as const,
      teacherId: 'teacher-456',
      teacherName: 'Alice Johnson',
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

    // Default course service mock
    vi.mocked(courseService.listCourses).mockResolvedValue({
      data: mockCourses,
    });
  });

  describe('Rendering', () => {
    it('should render welcome message with user name', async () => {
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome back, Jane Smith!')).toBeInTheDocument();
      });
    });

    it('should render current date', async () => {
      renderWithRouter(<StudentDashboard />);
      
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
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('My Courses')).toBeInTheDocument();
      });
    });
  });

  describe('Course List Display', () => {
    it('should display enrolled courses', async () => {
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
        expect(screen.getByText('Advanced Algorithms')).toBeInTheDocument();
      });
    });

    it('should display course codes', async () => {
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
        expect(screen.getByText('DEF456')).toBeInTheDocument();
      });
    });

    it('should display teacher names', async () => {
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });

    it('should display course status badges', async () => {
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        const statusBadges = screen.getAllByText('ACTIVE');
        expect(statusBadges.length).toBe(2);
      });
    });

    it('should render courses as clickable links', async () => {
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        const courseLinks = screen.getAllByRole('link');
        expect(courseLinks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no courses exist', async () => {
      vi.mocked(courseService.listCourses).mockResolvedValue({
        data: [],
      });
      
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('No Enrolled Courses')).toBeInTheDocument();
        expect(screen.getByText("You haven't enrolled in any courses yet. Browse available courses to get started!")).toBeInTheDocument();
      });
    });

    it('should show Browse Courses button in empty state', async () => {
      vi.mocked(courseService.listCourses).mockResolvedValue({
        data: [],
      });
      
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /browse courses/i })).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching courses', async () => {
      vi.mocked(courseService.listCourses).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      
      renderWithRouter(<StudentDashboard />);
      
      // Should show loading text
      expect(screen.getByText('Loading courses...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(courseService.listCourses).mockRejectedValue({
        message: 'Network error',
      });
      
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load courses. Please try again later.')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        const h2 = screen.getByRole('heading', { level: 2 });
        
        expect(h1).toBeInTheDocument();
        expect(h2).toBeInTheDocument();
      });
    });

    it('should have accessible links', async () => {
      renderWithRouter(<StudentDashboard />);
      
      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
      });
    });
  });
});
