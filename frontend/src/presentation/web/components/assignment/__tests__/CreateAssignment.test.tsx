/**
 * CreateAssignment Component Tests
 * 
 * Tests for the CreateAssignment component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateAssignment } from '../CreateAssignment';
import * as assignmentService from '../../../services/assignmentService';
import { SubmissionType } from '../../../types';

// Mock assignment service
vi.mock('../../../services/assignmentService');

describe('CreateAssignment Component', () => {
  const mockCourseId = 'course-123';
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form with all required fields', () => {
    render(
      <CreateAssignment
        courseId={mockCourseId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Check for form elements
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/submission type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create assignment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should show validation error when title is empty', async () => {
    render(
      <CreateAssignment
        courseId={mockCourseId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill other required fields but not title
    const descriptionInput = screen.getByLabelText(/description/i);
    const dueDateInput = screen.getByLabelText(/due date/i);

    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().slice(0, 16);
    fireEvent.change(dueDateInput, { target: { value: futureDate } });

    // Submit form without title
    const submitButton = screen.getByRole('button', { name: /create assignment/i });
    fireEvent.click(submitButton);

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('should show validation error when description is empty', async () => {
    render(
      <CreateAssignment
        courseId={mockCourseId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill title and due date but not description
    const titleInput = screen.getByLabelText(/title/i);
    const dueDateInput = screen.getByLabelText(/due date/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
    
    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().slice(0, 16);
    fireEvent.change(dueDateInput, { target: { value: futureDate } });

    // Submit form without description
    const submitButton = screen.getByRole('button', { name: /create assignment/i });
    fireEvent.click(submitButton);

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });
  });

  it('should show validation error when due date is in the past', async () => {
    render(
      <CreateAssignment
        courseId={mockCourseId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill form with past due date
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const dueDateInput = screen.getByLabelText(/due date/i);

    fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    // Set due date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    fireEvent.change(dueDateInput, { target: { value: pastDate } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create assignment/i });
    fireEvent.click(submitButton);

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/due date must be in the future/i)).toBeInTheDocument();
    });
  });

  it('should show file type checkboxes when submission type is FILE', () => {
    render(
      <CreateAssignment
        courseId={mockCourseId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // File type checkboxes should be visible by default (FILE is default)
    expect(screen.getByLabelText(/pdf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/word document/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/jpeg image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/png image/i)).toBeInTheDocument();
  });

  it('should hide file type checkboxes when submission type is TEXT', () => {
    render(
      <CreateAssignment
        courseId={mockCourseId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Change submission type to TEXT
    const submissionTypeSelect = screen.getByLabelText(/submission type/i);
    fireEvent.change(submissionTypeSelect, { target: { value: SubmissionType.TEXT } });

    // File type checkboxes should not be visible
    expect(screen.queryByLabelText(/pdf/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/word document/i)).not.toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <CreateAssignment
        courseId={mockCourseId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should successfully create assignment with valid data', async () => {
    const mockAssignment = {
      id: 'assignment-123',
      title: 'Test Assignment',
      description: 'Test description',
      courseId: mockCourseId,
      dueDate: '2025-12-31T23:59:00Z',
      submissionType: SubmissionType.FILE,
      allowedFileTypes: ['pdf', 'docx'],
      createdAt: '2025-01-13T10:00:00Z',
      updatedAt: '2025-01-13T10:00:00Z',
    };

    vi.mocked(assignmentService.createAssignment).mockResolvedValue(mockAssignment);

    render(
      <CreateAssignment
        courseId={mockCourseId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill form with valid data
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const dueDateInput = screen.getByLabelText(/due date/i);

    fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    fireEvent.change(dueDateInput, { target: { value: futureDate } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create assignment/i });
    fireEvent.click(submitButton);

    // Wait for success
    await waitFor(() => {
      expect(assignmentService.createAssignment).toHaveBeenCalledWith(
        mockCourseId,
        expect.objectContaining({
          title: 'Test Assignment',
          description: 'Test description',
          submissionType: SubmissionType.FILE,
          acceptedFileFormats: ['pdf', 'docx'],
        })
      );
      expect(mockOnSuccess).toHaveBeenCalledWith(mockAssignment);
    });
  });

  it('should display error message when API call fails', async () => {
    const errorMessage = 'Failed to create assignment';
    vi.mocked(assignmentService.createAssignment).mockRejectedValue({
      code: 'INTERNAL_ERROR',
      message: errorMessage,
    });

    render(
      <CreateAssignment
        courseId={mockCourseId}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill form with valid data
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const dueDateInput = screen.getByLabelText(/due date/i);

    fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().slice(0, 16);
    fireEvent.change(dueDateInput, { target: { value: futureDate } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create assignment/i });
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
