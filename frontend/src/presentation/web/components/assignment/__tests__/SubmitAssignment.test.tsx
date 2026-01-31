/**
 * SubmitAssignment Component Tests
 * 
 * Tests for the SubmitAssignment component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmitAssignment } from '../SubmitAssignment';
import * as assignmentService from '../../../services/assignmentService';
import { SubmissionType, SubmissionStatus } from '../../../types/common.types';
import type { Assignment, Submission } from '../../../types';

// Mock the assignment service
vi.mock('../../../services/assignmentService');

describe('SubmitAssignment', () => {
  const mockAssignment: Assignment = {
    id: 'assignment-1',
    title: 'Test Assignment',
    description: '<p>Test description</p>',
    courseId: 'course-1',
    dueDate: '2025-12-31T23:59:00Z',
    submissionType: SubmissionType.FILE,
    allowedFileTypes: ['.pdf', '.docx'],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockSubmission: Submission = {
    id: 'submission-1',
    assignmentId: 'assignment-1',
    studentId: 'student-1',
    submittedAt: '2025-01-13T10:30:00Z',
    status: SubmissionStatus.SUBMITTED,
    isLate: false,
    filePath: 'uploads/file.pdf',
    fileName: 'file.pdf',
    createdAt: '2025-01-13T10:30:00Z',
    updatedAt: '2025-01-13T10:30:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(assignmentService.getAssignmentById).mockImplementation(() => new Promise(() => {}));

    render(<SubmitAssignment assignmentId="assignment-1" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render assignment details after loading', async () => {
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment);

    render(<SubmitAssignment assignmentId="assignment-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    });

    expect(screen.getByText(/Test description/)).toBeInTheDocument();
    // Check for submission type in the info section
    expect(screen.getByText(/Submission Type:/)).toBeInTheDocument();
    // "File Upload" appears in multiple places (info section and label), so use getAllByText
    const fileUploadElements = screen.getAllByText(/File Upload/);
    expect(fileUploadElements.length).toBeGreaterThan(0);
  });

  it('should show file upload for FILE submission type', async () => {
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment);

    render(<SubmitAssignment assignmentId="assignment-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    });

    expect(screen.getByText(/Drop files here or click to browse/)).toBeInTheDocument();
  });

  it('should show text editor for TEXT submission type', async () => {
    const textAssignment = {
      ...mockAssignment,
      submissionType: SubmissionType.TEXT,
    };
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(textAssignment);

    render(<SubmitAssignment assignmentId="assignment-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Text editor')).toBeInTheDocument();
  });

  it('should show both file upload and text editor for BOTH submission type', async () => {
    const bothAssignment = {
      ...mockAssignment,
      submissionType: SubmissionType.BOTH,
    };
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(bothAssignment);

    render(<SubmitAssignment assignmentId="assignment-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    });

    expect(screen.getByText(/Drop files here or click to browse/)).toBeInTheDocument();
    expect(screen.getByLabelText('Text editor')).toBeInTheDocument();
  });

  it('should show late submission warning when past due date', async () => {
    const lateAssignment = {
      ...mockAssignment,
      dueDate: '2020-01-01T23:59:00Z', // Past date
    };
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(lateAssignment);

    render(<SubmitAssignment assignmentId="assignment-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    });

    expect(screen.getByText('Late Submission Warning')).toBeInTheDocument();
    expect(screen.getByText(/The due date has passed/)).toBeInTheDocument();
  });

  it('should validate file upload for FILE submission type', async () => {
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment);

    render(<SubmitAssignment assignmentId="assignment-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    });

    // Try to submit without file
    const submitButton = screen.getByRole('button', { name: /Submit Assignment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please select a file to upload/)).toBeInTheDocument();
    });
  });

  it('should validate text content for TEXT submission type', async () => {
    const textAssignment = {
      ...mockAssignment,
      submissionType: SubmissionType.TEXT,
    };
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(textAssignment);

    render(<SubmitAssignment assignmentId="assignment-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    });

    // Try to submit without text
    const submitButton = screen.getByRole('button', { name: /Submit Assignment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter your submission text/)).toBeInTheDocument();
    });
  });

  it('should submit assignment successfully with file', async () => {
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment);
    vi.mocked(assignmentService.submitAssignment).mockResolvedValue(mockSubmission);

    const onSubmitSuccess = vi.fn();

    render(<SubmitAssignment assignmentId="assignment-1" onSubmitSuccess={onSubmitSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    });

    // Create a mock file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    // Find file input and upload file
    const fileInput = screen.getByLabelText('File upload input') as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    // Submit
    const submitButton = screen.getByRole('button', { name: /Submit Assignment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(vi.mocked(assignmentService.submitAssignment)).toHaveBeenCalledWith('assignment-1', {
        submissionType: SubmissionType.FILE,
        file: expect.any(File),
        textContent: undefined,
      });
    });

    expect(onSubmitSuccess).toHaveBeenCalledWith(mockSubmission);
  });

  it('should handle closed assignment error', async () => {
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment);
    vi.mocked(assignmentService.submitAssignment).mockRejectedValue(new Error('ASSIGNMENT_CLOSED'));

    render(<SubmitAssignment assignmentId="assignment-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    });

    // Create a mock file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    // Find file input and upload file
    const fileInput = screen.getByLabelText('File upload input') as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    // Submit
    const submitButton = screen.getByRole('button', { name: /Submit Assignment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/This assignment is closed/)).toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment);

    const onCancel = vi.fn();

    render(<SubmitAssignment assignmentId="assignment-1" onCancel={onCancel} />);

    await waitFor(() => {
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('should render error message when assignment fetch fails', async () => {
    vi.mocked(assignmentService.getAssignmentById).mockRejectedValue(new Error('Failed to load assignment'));

    render(<SubmitAssignment assignmentId="assignment-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load assignment/)).toBeInTheDocument();
    });
  });
});
