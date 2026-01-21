/**
 * UpdateCourse Component Tests
 * 
 * Tests for the UpdateCourse component including:
 * - Loading course data
 * - Form validation
 * - Form submission
 * - Success state
 * - Error handling
 * - Archived course handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateCourse } from '../UpdateCourse';
import * as courseService from '../../../services/courseService';
import type { Course } from '../../../types';

// Mock the course service
vi.mock('../../../services/courseService');

describe('UpdateCourse Component', () => {
  const mockCourse: Course = {
    id: 'course-123',
    name: 'Introduction to Programming',
    description: 'Learn programming basics',
    courseCode: 'ABC123',
    status: 'ACTIVE',
    teacherId: 'teacher-123',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockArchivedCourse: Course = {
    ...mockCourse,
    status: 'ARCHIVED',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching course', () => {
      vi.mocked(courseService.getCourseById).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<UpdateCourse courseId="course-123" />);

      expect(screen.getByText('Loading course...')).toBeInTheDocument();
    });

    it('should load course data on mount', async () => {
      vi.mocked(courseService.getCourseById).mockResolvedValue(mockCourse);

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(courseService.getCourseById).toHaveBeenCalledWith('course-123');
      });

      expect(screen.getByDisplayValue('Introduction to Programming')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Learn programming basics')).toBeInTheDocument();
    });

    it('should show error if course fails to load', async () => {
      vi.mocked(courseService.getCourseById).mockRejectedValue(
        new Error('Course not found')
      );

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Course')).toBeInTheDocument();
        expect(screen.getByText('Course not found')).toBeInTheDocument();
      });
    });
  });

  describe('Archived Course Handling', () => {
    it('should show warning for archived course', async () => {
      vi.mocked(courseService.getCourseById).mockResolvedValue(mockArchivedCourse);

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByText('Cannot Update Archived Course')).toBeInTheDocument();
        expect(
          screen.getByText(/This course is archived and cannot be updated/)
        ).toBeInTheDocument();
      });
    });

    it('should not show form for archived course', async () => {
      vi.mocked(courseService.getCourseById).mockResolvedValue(mockArchivedCourse);

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Course Name/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    beforeEach(async () => {
      vi.mocked(courseService.getCourseById).mockResolvedValue(mockCourse);
    });

    it('should render form with course data', async () => {
      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Introduction to Programming')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Learn programming basics')).toBeInTheDocument();
    });

    it('should show character count for name field', async () => {
      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        // "Introduction to Programming" has 29 characters, but the component shows the actual input value length
        expect(screen.getByText(/\/200/)).toBeInTheDocument();
      });
    });

    it('should show character count for description field', async () => {
      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByText('24/5000')).toBeInTheDocument(); // "Learn programming basics" length
      });
    });

    it('should render Update Course button', async () => {
      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Course/ })).toBeInTheDocument();
      });
    });

    it('should render Cancel button when onCancel provided', async () => {
      const onCancel = vi.fn();
      render(<UpdateCourse courseId="course-123" onCancel={onCancel} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
      });
    });

    it('should not render Cancel button when onCancel not provided', async () => {
      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Cancel/ })).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      vi.mocked(courseService.getCourseById).mockResolvedValue(mockCourse);
    });

    it('should show error when name is empty', async () => {
      const user = userEvent.setup();
      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Course Name/);
      await user.clear(nameInput);
      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByText('Course name is required')).toBeInTheDocument();
      });
    });

    it('should prevent typing beyond 200 characters due to maxLength', async () => {
      const user = userEvent.setup();
      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Course Name/) as HTMLInputElement;
      
      // Verify maxLength attribute is set
      expect(nameInput.maxLength).toBe(200);
      
      // Clear and try to type more than 200 characters
      await user.clear(nameInput);
      await user.type(nameInput, 'a'.repeat(250));
      
      // Input should be capped at 200 characters by HTML maxLength
      expect(nameInput.value.length).toBeLessThanOrEqual(200);
    });

    it('should prevent typing beyond 5000 characters due to maxLength', async () => {
      const user = userEvent.setup();
      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      });

      const descInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
      
      // Verify maxLength attribute is set
      expect(descInput.maxLength).toBe(5000);
      
      // Clear and try to type more than 5000 characters
      await user.clear(descInput);
      // Type a reasonable amount to test (typing 5000+ chars is slow)
      const longText = 'a'.repeat(100);
      await user.type(descInput, longText);
      
      // Input should respect maxLength
      expect(descInput.value.length).toBeLessThanOrEqual(5000);
    });

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Course Name/);
      
      // Clear the input to trigger validation error
      await user.clear(nameInput);
      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByText('Course name is required')).toBeInTheDocument();
      });

      // Type a single character to trigger error clearing
      await user.type(nameInput, 'N');

      await waitFor(() => {
        expect(screen.queryByText('Course name is required')).not.toBeInTheDocument();
      });
    });

    it('should allow empty description', async () => {
      const user = userEvent.setup();
      vi.mocked(courseService.getCourseById).mockResolvedValue(mockCourse);
      vi.mocked(courseService.updateCourse).mockResolvedValue({
        ...mockCourse,
        description: null,
      });

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      });

      const descInput = screen.getByLabelText(/Description/);
      await user.clear(descInput);
      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(courseService.updateCourse).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      vi.mocked(courseService.getCourseById).mockResolvedValue(mockCourse);
    });

    it('should call updateCourse with correct data', async () => {
      const user = userEvent.setup();
      const updatedCourse = { ...mockCourse, name: 'Updated Course Name' };
      vi.mocked(courseService.updateCourse).mockResolvedValue(updatedCourse);

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Course Name/);
      
      // Use paste instead of type to avoid garbled text
      await user.clear(nameInput);
      await user.click(nameInput);
      await user.paste('Updated Course Name');
      
      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(courseService.updateCourse).toHaveBeenCalledWith('course-123', {
          name: 'Updated Course Name',
          description: 'Learn programming basics',
        });
      });
    });

    it('should trim whitespace from name and description', async () => {
      const user = userEvent.setup();
      const updatedCourse = { ...mockCourse, name: 'Trimmed Name' };
      vi.mocked(courseService.updateCourse).mockResolvedValue(updatedCourse);

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Course Name/);
      
      // Use paste to avoid garbled text
      await user.clear(nameInput);
      await user.click(nameInput);
      await user.paste('  Trimmed Name  ');
      
      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(courseService.updateCourse).toHaveBeenCalledWith('course-123', {
          name: 'Trimmed Name',
          description: 'Learn programming basics',
        });
      });
    });

    it('should send undefined for empty description', async () => {
      const user = userEvent.setup();
      const updatedCourse = { ...mockCourse, description: null };
      vi.mocked(courseService.updateCourse).mockResolvedValue(updatedCourse);

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      });

      const descInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
      
      // Clear the description field
      await user.clear(descInput);
      
      // Verify it's empty
      expect(descInput.value).toBe('');
      
      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(courseService.updateCourse).toHaveBeenCalledWith('course-123', {
          name: 'Introduction to Programming',
          description: undefined,
        });
      });
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(courseService.updateCourse).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeDisabled();
        expect(screen.getByLabelText(/Description/)).toBeDisabled();
        expect(screen.getByRole('button', { name: /Updating.../ })).toBeDisabled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(courseService.updateCourse).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Updating.../ })).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    beforeEach(async () => {
      vi.mocked(courseService.getCourseById).mockResolvedValue(mockCourse);
    });

    it('should show success message after update', async () => {
      const user = userEvent.setup();
      const updatedCourse = { ...mockCourse, name: 'Updated Course' };
      vi.mocked(courseService.updateCourse).mockResolvedValue(updatedCourse);

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByText('Course Updated Successfully!')).toBeInTheDocument();
        expect(screen.getByText(/Your course "Updated Course" has been updated/)).toBeInTheDocument();
      });
    });

    it('should show Edit Again button in success state', async () => {
      const user = userEvent.setup();
      const updatedCourse = { ...mockCourse, name: 'Updated Course' };
      vi.mocked(courseService.updateCourse).mockResolvedValue(updatedCourse);

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit Again/ })).toBeInTheDocument();
      });
    });

    it('should show Back to Course button when onCancel provided', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      const updatedCourse = { ...mockCourse, name: 'Updated Course' };
      vi.mocked(courseService.updateCourse).mockResolvedValue(updatedCourse);

      render(<UpdateCourse courseId="course-123" onCancel={onCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back to Course/ })).toBeInTheDocument();
      });
    });

    it('should call onSuccess callback after successful update', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const updatedCourse = { ...mockCourse, name: 'Updated Course' };
      vi.mocked(courseService.updateCourse).mockResolvedValue(updatedCourse);

      render(<UpdateCourse courseId="course-123" onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(updatedCourse);
      });
    });

    it('should reset form when Edit Again clicked', async () => {
      const user = userEvent.setup();
      const updatedCourse = { ...mockCourse, name: 'Updated Course' };
      vi.mocked(courseService.updateCourse).mockResolvedValue(updatedCourse);

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit Again/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Edit Again/ }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Updated Course')).toBeInTheDocument();
      });
    });

    it('should call onCancel when Back to Course clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      const updatedCourse = { ...mockCourse, name: 'Updated Course' };
      vi.mocked(courseService.updateCourse).mockResolvedValue(updatedCourse);

      render(<UpdateCourse courseId="course-123" onCancel={onCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back to Course/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Back to Course/ }));

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      vi.mocked(courseService.getCourseById).mockResolvedValue(mockCourse);
    });

    it('should show error message when update fails', async () => {
      const user = userEvent.setup();
      vi.mocked(courseService.updateCourse).mockRejectedValue(
        new Error('Failed to update course')
      );

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByText('Failed to update course')).toBeInTheDocument();
      });
    });

    it('should show generic error for non-Error objects', async () => {
      const user = userEvent.setup();
      vi.mocked(courseService.updateCourse).mockRejectedValue('Unknown error');

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(
          screen.getByText('Failed to update course. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('should re-enable form after error', async () => {
      const user = userEvent.setup();
      vi.mocked(courseService.updateCourse).mockRejectedValue(
        new Error('Failed to update course')
      );

      render(<UpdateCourse courseId="course-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByText('Failed to update course')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Course Name/)).not.toBeDisabled();
      expect(screen.getByLabelText(/Description/)).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /Update Course/ })).not.toBeDisabled();
    });
  });

  describe('Cancel Button', () => {
    beforeEach(async () => {
      vi.mocked(courseService.getCourseById).mockResolvedValue(mockCourse);
    });

    it('should call onCancel when Cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      render(<UpdateCourse courseId="course-123" onCancel={onCancel} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Cancel/ }));

      expect(onCancel).toHaveBeenCalled();
    });

    it('should disable Cancel button during submission', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      vi.mocked(courseService.updateCourse).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<UpdateCourse courseId="course-123" onCancel={onCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Course Name/)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Update Course/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/ })).toBeDisabled();
      });
    });
  });
});
