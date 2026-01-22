/**
 * CourseList Component Tests
 * 
 * Tests the course search and enrollment functionality.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CourseList } from '../CourseList';
import * as courseService from '../../../services/courseService';

// Mock the services
vi.mock('../../../services/courseService');

const mockSearchCourses = vi.mocked(courseService.searchCourses);
const mockEnrollInCourse = vi.mocked(courseService.enrollInCourse);

describe('CourseList', () => {
  const mockCourses = [
    {
      id: 'course-1',
      name: 'Introduction to Programming',
      description: 'Learn programming basics',
      courseCode: 'ABC123',
      status: 'ACTIVE',
      teacherId: 'teacher-1',
      teacherName: 'John Doe',
      isEnrolled: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'course-2',
      name: 'Advanced Algorithms',
      description: 'Master algorithms',
      courseCode: 'DEF456',
      status: 'ACTIVE',
      teacherId: 'teacher-2',
      teacherName: 'Jane Smith',
      isEnrolled: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchCourses.mockResolvedValue({ data: mockCourses });
  });

  describe('Course Display', () => {
    it('should display list of courses', async () => {
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
        expect(screen.getByText('Advanced Algorithms')).toBeInTheDocument();
      });
    });

    it('should show course details', async () => {
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Learn programming basics')).toBeInTheDocument();
        expect(screen.getByText('Master algorithms')).toBeInTheDocument();
        expect(screen.getByText(/ABC123/)).toBeInTheDocument();
        expect(screen.getByText(/DEF456/)).toBeInTheDocument();
      });
    });

    it('should indicate enrolled courses', async () => {
      render(<CourseList />);

      await waitFor(() => {
        const enrolledBadges = screen.getAllByText('Enrolled');
        expect(enrolledBadges).toHaveLength(1);
      });
    });

    it('should show loading state initially', () => {
      render(<CourseList />);
      expect(screen.getByText('Loading courses...')).toBeInTheDocument();
    });

    it('should show empty state when no courses found', async () => {
      mockSearchCourses.mockResolvedValue({ data: [] });
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('No Courses Found')).toBeInTheDocument();
      });
    });

    it('should show error state on API failure', async () => {
      mockSearchCourses.mockRejectedValue(new Error('Network error'));
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load courses/)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter courses by search query', async () => {
      const user = userEvent.setup();
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search courses by name...');
      await user.type(searchInput, 'Programming');

      await waitFor(() => {
        expect(mockSearchCourses).toHaveBeenCalledWith('Programming');
      });
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search courses by name...');
      
      // Type multiple characters quickly
      await user.type(searchInput, 'Pro');

      // Should only call API once after debounce
      await waitFor(() => {
        const searchCalls = mockSearchCourses.mock.calls.filter(call => 
          call[0] === 'Pro'
        );
        expect(searchCalls.length).toBe(1);
      }, { timeout: 500 });
    });

    it('should show empty state with search query message', async () => {
      const user = userEvent.setup();
      mockSearchCourses.mockResolvedValue({ data: [] });
      render(<CourseList />);

      const searchInput = screen.getByPlaceholderText('Search courses by name...');
      await user.type(searchInput, 'Nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/No courses match "Nonexistent"/)).toBeInTheDocument();
      });
    });
  });

  describe('Enrollment Functionality', () => {
    it('should open enrollment modal when clicking "Enroll with Code"', async () => {
      const user = userEvent.setup();
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      const enrollButton = screen.getByText('Enroll with Code');
      await user.click(enrollButton);

      expect(screen.getByText('Enroll in Course')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., ABC123')).toBeInTheDocument();
    });

    it('should enroll successfully with valid course code', async () => {
      const user = userEvent.setup();
      mockEnrollInCourse.mockResolvedValue();
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      // Open modal
      const enrollButton = screen.getByText('Enroll with Code');
      await user.click(enrollButton);

      // Enter course code
      const codeInput = screen.getByPlaceholderText('e.g., ABC123');
      await user.type(codeInput, 'ABC123');

      // Click enroll
      const submitButton = screen.getByRole('button', { name: 'Enroll' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockEnrollInCourse).toHaveBeenCalledWith('ABC123');
        expect(screen.getByText('Success!')).toBeInTheDocument();
      });
    });

    it('should show error for duplicate enrollment', async () => {
      const user = userEvent.setup();
      mockEnrollInCourse.mockRejectedValue({
        response: {
          data: {
            code: 'DUPLICATE_ENROLLMENT',
            message: 'Already enrolled',
          },
        },
      });
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      // Open modal and enroll
      const enrollButton = screen.getByText('Enroll with Code');
      await user.click(enrollButton);

      const codeInput = screen.getByPlaceholderText('e.g., ABC123');
      await user.type(codeInput, 'ABC123');

      const submitButton = screen.getByRole('button', { name: 'Enroll' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/already enrolled/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid course code', async () => {
      const user = userEvent.setup();
      mockEnrollInCourse.mockRejectedValue({
        response: {
          data: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Course not found',
          },
        },
      });
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      // Open modal and enroll
      const enrollButton = screen.getByText('Enroll with Code');
      await user.click(enrollButton);

      const codeInput = screen.getByPlaceholderText('e.g., ABC123');
      await user.type(codeInput, 'INVALID');

      const submitButton = screen.getByRole('button', { name: 'Enroll' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid course code/i)).toBeInTheDocument();
      });
    });

    it('should show error for archived course', async () => {
      const user = userEvent.setup();
      mockEnrollInCourse.mockRejectedValue({
        response: {
          data: {
            code: 'RESOURCE_ARCHIVED',
            message: 'Course is archived',
          },
        },
      });
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      // Open modal and enroll
      const enrollButton = screen.getByText('Enroll with Code');
      await user.click(enrollButton);

      const codeInput = screen.getByPlaceholderText('e.g., ABC123');
      await user.type(codeInput, 'OLD123');

      const submitButton = screen.getByRole('button', { name: 'Enroll' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/archived and no longer accepting enrollments/i)).toBeInTheDocument();
      });
    });

    it('should close modal on cancel', async () => {
      const user = userEvent.setup();
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      // Open modal
      const enrollButton = screen.getByText('Enroll with Code');
      await user.click(enrollButton);

      expect(screen.getByText('Enroll in Course')).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Enroll in Course')).not.toBeInTheDocument();
      });
    });

    it('should convert course code to uppercase', async () => {
      const user = userEvent.setup();
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      // Open modal
      const enrollButton = screen.getByText('Enroll with Code');
      await user.click(enrollButton);

      // Type lowercase
      const codeInput = screen.getByPlaceholderText('e.g., ABC123') as HTMLInputElement;
      await user.type(codeInput, 'abc123');

      expect(codeInput.value).toBe('ABC123');
    });

    it('should disable enroll button when code is empty', async () => {
      const user = userEvent.setup();
      render(<CourseList />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      });

      // Open modal
      const enrollButton = screen.getByText('Enroll with Code');
      await user.click(enrollButton);

      const submitButton = screen.getByRole('button', { name: 'Enroll' });
      expect(submitButton).toBeDisabled();
    });
  });
});
