/**
 * GradeSubmission Component Tests
 * 
 * Tests for the GradeSubmission component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { GradeSubmission } from '../GradeSubmission';
import * as gradingService from '../../../services/gradingService';
import { SubmissionStatus } from '../../../types/common.types';
import type { Submission } from '../../../types';

// Mock the grading service
vi.mock('../../../services/gradingService', () => ({
  getSubmissionById: vi.fn(),
  gradeSubmission: vi.fn(),
  updateGrade: vi.fn(),
}));

describe('GradeSubmission', () => {
  const mockSubmission: Submission = {
    id: 'submission-1',
    assignmentId: 'assignment-1',
    studentId: 'student-1',
    submittedAt: '2025-01-13T10:00:00Z',
    status: SubmissionStatus.SUBMITTED,
    isLate: false,
    textContent: 'This is my submission',
    version: 1,
    createdAt: '2025-01-13T10:00:00Z',
    updatedAt: '2025-01-13T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (gradingService.getSubmissionById as any).mockResolvedValue(mockSubmission);
  });

  it('should render loading state initially', () => {
    render(<GradeSubmission submissionId="submission-1" />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display submission content after loading', async () => {
    render(<GradeSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Grade Submission')).toBeInTheDocument();
    });
    
    expect(screen.getByText('This is my submission')).toBeInTheDocument();
  });

  it('should display grade input and feedback editor', async () => {
    render(<GradeSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Grade \(0-100\)/i)).toBeInTheDocument();
    });
    
    expect(screen.getByPlaceholderText(/Provide feedback/i)).toBeInTheDocument();
  });

  it('should validate grade input', async () => {
    render(<GradeSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Grade \(0-100\)/i)).toBeInTheDocument();
    });
    
    const gradeInput = screen.getByLabelText(/Grade \(0-100\)/i);
    const submitButton = screen.getByRole('button', { name: /Save Grade/i });
    
    // Test invalid grade (negative)
    fireEvent.change(gradeInput, { target: { value: '-10' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Grade must be between 0 and 100/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Clear the error by changing to a valid value
    fireEvent.change(gradeInput, { target: { value: '50' } });
    
    // Test invalid grade (over 100)
    fireEvent.change(gradeInput, { target: { value: '150' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Grade must be between 0 and 100/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should submit grade successfully', async () => {
    const mockGradedSubmission = {
      ...mockSubmission,
      grade: 85,
      feedback: 'Good work!',
      status: SubmissionStatus.GRADED,
    };
    
    (gradingService.gradeSubmission as any).mockResolvedValue(mockGradedSubmission);
    
    const onSuccess = vi.fn();
    render(<GradeSubmission submissionId="submission-1" onSuccess={onSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Grade \(0-100\)/i)).toBeInTheDocument();
    });
    
    const gradeInput = screen.getByLabelText(/Grade \(0-100\)/i);
    const feedbackInput = screen.getByPlaceholderText(/Provide feedback/i);
    const submitButton = screen.getByRole('button', { name: /Save Grade/i });
    
    fireEvent.change(gradeInput, { target: { value: '85' } });
    fireEvent.change(feedbackInput, { target: { value: 'Good work!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(gradingService.gradeSubmission).toHaveBeenCalledWith('submission-1', {
        grade: 85,
        feedback: 'Good work!',
        version: 1,
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Submission graded successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle version conflict error', async () => {
    const error = new Error('409: CONCURRENT_MODIFICATION');
    (gradingService.gradeSubmission as any).mockRejectedValue(error);
    
    render(<GradeSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Grade \(0-100\)/i)).toBeInTheDocument();
    });
    
    const gradeInput = screen.getByLabelText(/Grade \(0-100\)/i);
    const submitButton = screen.getByRole('button', { name: /Save Grade/i });
    
    fireEvent.change(gradeInput, { target: { value: '85' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/modified by another teacher/i)).toBeInTheDocument();
    });
  });

  it('should pre-fill form for already graded submission', async () => {
    const gradedSubmission: Submission = {
      ...mockSubmission,
      grade: 90,
      feedback: 'Excellent work!',
      status: SubmissionStatus.GRADED,
      gradedAt: '2025-01-14T10:00:00Z',
    };
    
    (gradingService.getSubmissionById as any).mockResolvedValue(gradedSubmission);
    
    render(<GradeSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Grade \(0-100\)/i)).toBeInTheDocument();
    });
    
    const gradeInput = screen.getByLabelText(/Grade \(0-100\)/i) as HTMLInputElement;
    const feedbackInput = screen.getByPlaceholderText(/Provide feedback/i) as HTMLTextAreaElement;
    
    expect(gradeInput.value).toBe('90');
    expect(feedbackInput.value).toBe('Excellent work!');
    expect(screen.getByText('Graded')).toBeInTheDocument();
  });

  it('should display late submission indicator', async () => {
    const lateSubmission: Submission = {
      ...mockSubmission,
      isLate: true,
    };
    
    (gradingService.getSubmissionById as any).mockResolvedValue(lateSubmission);
    
    render(<GradeSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Late Submission/i)).toBeInTheDocument();
    });
  });

  it('should display file submission with download link', async () => {
    const fileSubmission: Submission = {
      ...mockSubmission,
      filePath: '/uploads/file.pdf',
      fileName: 'assignment.pdf',
      textContent: undefined,
    };
    
    (gradingService.getSubmissionById as any).mockResolvedValue(fileSubmission);
    
    render(<GradeSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('assignment.pdf')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<GradeSubmission submissionId="submission-1" onCancel={onCancel} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });
});
