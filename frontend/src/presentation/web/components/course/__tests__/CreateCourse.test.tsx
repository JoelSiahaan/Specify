/**
 * CreateCourse Component Tests
 * 
 * Tests for the CreateCourse component including:
 * - Rendering
 * - Form validation
 * - Form submission
 * - Success state with course code display
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../../../test/test-utils';
import { CreateCourse } from '../CreateCourse';
import * as courseService from '../../../services/courseService';

// Mock courseService
vi.mock('../../../services/courseService', () => ({
  courseService: {
    createCourse: vi.fn(),
  },
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

describe('CreateCourse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render create course form with all fields', () => {
      renderWithRouter(<CreateCourse />);
      
      // Check header
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
      
      // Check form fields
      expect(screen.getByLabelText(/course name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/course description/i)).toBeInTheDocument();
      
      // Check helper text
      expect(screen.getByText(/A unique course code will be automatically generated/i)).toBeInTheDocument();
      
      // Check buttons
      expect(screen.getByRole('button', { name: /create course/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render with correct input types', () => {
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const descriptionInput = screen.getByLabelText(/course description/i);
      
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(descriptionInput.tagName).toBe('TEXTAREA');
    });

    it('should show character count for description', () => {
      renderWithRouter(<CreateCourse />);
      
      expect(screen.getByText('0/5000 characters')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateCourse />);
      
      const submitButton = screen.getByRole('button', { name: /create course/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Course name is required')).toBeInTheDocument();
        expect(screen.getByText('Course description is required')).toBeInTheDocument();
      });
      
      expect(courseService.courseService.createCourse).not.toHaveBeenCalled();
    });

    it('should validate name length', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const descriptionInput = screen.getByLabelText(/course description/i);
      const submitButton = screen.getByRole('button', { name: /create course/i });
      
      // Enter name exceeding 200 characters
      const longName = 'a'.repeat(201);
      await user.type(nameInput, longName);
      await user.type(descriptionInput, 'Valid description');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Course name must not exceed 200 characters')).toBeInTheDocument();
      });
      
      expect(courseService.courseService.createCourse).not.toHaveBeenCalled();
    });

    it('should validate description length', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const descriptionInput = screen.getByLabelText(/course description/i);
      const submitButton = screen.getByRole('button', { name: /create course/i });
      
      // Enter description exceeding 5000 characters
      const longDescription = 'a'.repeat(5001);
      await user.type(nameInput, 'Valid Course Name');
      await user.type(descriptionInput, longDescription);
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Course description must not exceed 5000 characters')).toBeInTheDocument();
      });
      
      expect(courseService.courseService.createCourse).not.toHaveBeenCalled();
    });

    it('should clear field error when user types', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const submitButton = screen.getByRole('button', { name: /create course/i });
      
      // Trigger validation error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText('Course name is required')).toBeInTheDocument();
      });
      
      // Type in name field
      await user.type(nameInput, 'Test Course');
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Course name is required')).not.toBeInTheDocument();
      });
    });

    it('should update character count as user types', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateCourse />);
      
      const descriptionInput = screen.getByLabelText(/course description/i);
      
      await user.type(descriptionInput, 'Test description');
      
      expect(screen.getByText('16/5000 characters')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call createCourse with correct data on valid submission', async () => {
      const user = userEvent.setup();
      const mockCourse = {
        id: 'course-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: 'ACTIVE' as const,
        teacherId: 'teacher-123',
        createdAt: '2025-01-13T10:30:00Z',
        updatedAt: '2025-01-13T10:30:00Z',
      };
      
      vi.mocked(courseService.courseService.createCourse).mockResolvedValue(mockCourse);
      
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const descriptionInput = screen.getByLabelText(/course description/i);
      const submitButton = screen.getByRole('button', { name: /create course/i });
      
      await user.type(nameInput, 'Introduction to Programming');
      await user.type(descriptionInput, 'Learn programming basics');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(courseService.courseService.createCourse).toHaveBeenCalledWith({
          name: 'Introduction to Programming',
          description: 'Learn programming basics',
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock slow API call
      vi.mocked(courseService.courseService.createCourse).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const descriptionInput = screen.getByLabelText(/course description/i);
      const submitButton = screen.getByRole('button', { name: /create course/i });
      
      await user.type(nameInput, 'Test Course');
      await user.type(descriptionInput, 'Test description');
      await user.click(submitButton);
      
      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('Creating Course...')).toBeInTheDocument();
      });
      
      // Inputs should be disabled
      expect(nameInput).toBeDisabled();
      expect(descriptionInput).toBeDisabled();
      
      // Submit button should be disabled
      expect(submitButton).toBeDisabled();
    });

    it('should display success message with course code after creation', async () => {
      const user = userEvent.setup();
      const mockCourse = {
        id: 'course-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: 'ACTIVE' as const,
        teacherId: 'teacher-123',
        createdAt: '2025-01-13T10:30:00Z',
        updatedAt: '2025-01-13T10:30:00Z',
      };
      
      vi.mocked(courseService.courseService.createCourse).mockResolvedValue(mockCourse);
      
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const descriptionInput = screen.getByLabelText(/course description/i);
      const submitButton = screen.getByRole('button', { name: /create course/i });
      
      await user.type(nameInput, 'Introduction to Programming');
      await user.type(descriptionInput, 'Learn programming basics');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Course Created Successfully!')).toBeInTheDocument();
        expect(screen.getByText('ABC123')).toBeInTheDocument();
        expect(screen.getByText(/Share this code with students to enroll/i)).toBeInTheDocument();
      });
    });

    it('should reset form after successful creation', async () => {
      const user = userEvent.setup();
      const mockCourse = {
        id: 'course-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: 'ACTIVE' as const,
        teacherId: 'teacher-123',
        createdAt: '2025-01-13T10:30:00Z',
        updatedAt: '2025-01-13T10:30:00Z',
      };
      
      vi.mocked(courseService.courseService.createCourse).mockResolvedValue(mockCourse);
      
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const descriptionInput = screen.getByLabelText(/course description/i);
      const submitButton = screen.getByRole('button', { name: /create course/i });
      
      await user.type(nameInput, 'Introduction to Programming');
      await user.type(descriptionInput, 'Learn programming basics');
      await user.click(submitButton);
      
      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('Course Created Successfully!')).toBeInTheDocument();
      });
      
      // Click "Create Another Course"
      const createAnotherButton = screen.getByRole('button', { name: /create another course/i });
      await user.click(createAnotherButton);
      
      // Form should be visible again with empty fields
      await waitFor(() => {
        expect(screen.getByLabelText(/course name/i)).toHaveValue('');
        expect(screen.getByLabelText(/course description/i)).toHaveValue('');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display generic error message on API failure', async () => {
      const user = userEvent.setup();
      
      vi.mocked(courseService.courseService.createCourse).mockRejectedValue({
        code: 'INTERNAL_ERROR',
        message: 'Failed to create course',
      });
      
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const descriptionInput = screen.getByLabelText(/course description/i);
      const submitButton = screen.getByRole('button', { name: /create course/i });
      
      await user.type(nameInput, 'Test Course');
      await user.type(descriptionInput, 'Test description');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create course')).toBeInTheDocument();
      });
    });

    it('should handle validation errors from API', async () => {
      const user = userEvent.setup();
      
      vi.mocked(courseService.courseService.createCourse).mockRejectedValue({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: {
          name: 'Course name already exists',
        },
      });
      
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const descriptionInput = screen.getByLabelText(/course description/i);
      const submitButton = screen.getByRole('button', { name: /create course/i });
      
      await user.type(nameInput, 'Existing Course');
      await user.type(descriptionInput, 'Test description');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Course name already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateCourse />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should navigate to course details after successful creation', async () => {
      const user = userEvent.setup();
      const mockCourse = {
        id: 'course-123',
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: 'ACTIVE' as const,
        teacherId: 'teacher-123',
        createdAt: '2025-01-13T10:30:00Z',
        updatedAt: '2025-01-13T10:30:00Z',
      };
      
      vi.mocked(courseService.courseService.createCourse).mockResolvedValue(mockCourse);
      
      renderWithRouter(<CreateCourse />);
      
      const nameInput = screen.getByLabelText(/course name/i);
      const descriptionInput = screen.getByLabelText(/course description/i);
      const submitButton = screen.getByRole('button', { name: /create course/i });
      
      await user.type(nameInput, 'Introduction to Programming');
      await user.type(descriptionInput, 'Learn programming basics');
      await user.click(submitButton);
      
      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('Course Created Successfully!')).toBeInTheDocument();
      });
      
      // Click "View Course"
      const viewCourseButton = screen.getByRole('button', { name: /view course/i });
      await user.click(viewCourseButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/courses/course-123');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithRouter(<CreateCourse />);
      
      expect(screen.getByLabelText(/course name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/course description/i)).toBeInTheDocument();
    });

    it('should have required attributes on inputs', () => {
      renderWithRouter(<CreateCourse />);
      
      expect(screen.getByLabelText(/course name/i)).toBeRequired();
      expect(screen.getByLabelText(/course description/i)).toBeRequired();
    });

    it('should have proper button types', () => {
      renderWithRouter(<CreateCourse />);
      
      const submitButton = screen.getByRole('button', { name: /create course/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(cancelButton).toHaveAttribute('type', 'button');
    });
  });
});
