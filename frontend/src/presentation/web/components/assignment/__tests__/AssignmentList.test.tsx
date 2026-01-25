/**
 * AssignmentList Component Tests
 * 
 * Tests for the AssignmentList component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AssignmentList } from '../AssignmentList';
import * as assignmentService from '../../../services/assignmentService';
import { SubmissionType } from '../../../types/common.types';

// Mock the assignment service
vi.mock('../../../services/assignmentService');

describe('AssignmentList', () => {
  const mockCourseId = 'course-123';
  const mockAssignments = [
    {
      id: 'assignment-1',
      title: 'Assignment 1: Variables',
      description: 'Learn about variables',
      courseId: mockCourseId,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      submissionType: SubmissionType.FILE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'assignment-2',
      title: 'Assignment 2: Functions',
      description: 'Learn about functions',
      courseId: mockCourseId,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago (overdue)
      submissionType: SubmissionType.TEXT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading spinner while fetching assignments', () => {
    vi.mocked(assignmentService.listAssignments).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AssignmentList courseId={mockCourseId} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display assignments after successful fetch', async () => {
    vi.mocked(assignmentService.listAssignments).mockResolvedValue({
      data: mockAssignments,
    });

    render(<AssignmentList courseId={mockCourseId} />);

    await waitFor(() => {
      expect(screen.getByText('Assignment 1: Variables')).toBeInTheDocument();
      expect(screen.getByText('Assignment 2: Functions')).toBeInTheDocument();
    });
  });

  it('should display "Not Submitted" status for assignments without submissions', async () => {
    vi.mocked(assignmentService.listAssignments).mockResolvedValue({
      data: [mockAssignments[0]],
    });

    render(<AssignmentList courseId={mockCourseId} />);

    await waitFor(() => {
      expect(screen.getByText('Not Submitted')).toBeInTheDocument();
    });
  });

  it('should highlight overdue assignments', async () => {
    vi.mocked(assignmentService.listAssignments).mockResolvedValue({
      data: [mockAssignments[1]], // Overdue assignment
    });

    render(<AssignmentList courseId={mockCourseId} />);

    await waitFor(() => {
      const overdueText = screen.getByText(/Overdue/i);
      expect(overdueText).toBeInTheDocument();
      expect(overdueText).toHaveClass('text-red-600');
    });
  });

  it('should display time remaining for upcoming assignments', async () => {
    vi.mocked(assignmentService.listAssignments).mockResolvedValue({
      data: [mockAssignments[0]], // Assignment due in 7 days
    });

    render(<AssignmentList courseId={mockCourseId} />);

    await waitFor(() => {
      expect(screen.getByText(/days remaining/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no assignments exist', async () => {
    vi.mocked(assignmentService.listAssignments).mockResolvedValue({
      data: [],
    });

    render(<AssignmentList courseId={mockCourseId} />);

    await waitFor(() => {
      expect(screen.getByText('No Assignments')).toBeInTheDocument();
      expect(
        screen.getByText("This course doesn't have any assignments yet.")
      ).toBeInTheDocument();
    });
  });

  it('should display error message when fetch fails', async () => {
    const errorMessage = 'Failed to load assignments';
    vi.mocked(assignmentService.listAssignments).mockRejectedValue(
      new Error(errorMessage)
    );

    render(<AssignmentList courseId={mockCourseId} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should call onAssignmentClick when assignment is clicked', async () => {
    const mockOnClick = vi.fn();
    vi.mocked(assignmentService.listAssignments).mockResolvedValue({
      data: [mockAssignments[0]],
    });

    render(<AssignmentList courseId={mockCourseId} onAssignmentClick={mockOnClick} />);

    await waitFor(() => {
      expect(screen.getByText('Assignment 1: Variables')).toBeInTheDocument();
    });

    const assignmentCard = screen.getByText('Assignment 1: Variables').closest('div');
    assignmentCard?.click();

    expect(mockOnClick).toHaveBeenCalledWith('assignment-1');
  });

  it('should format due dates correctly', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);

    const assignmentDueTomorrow = {
      ...mockAssignments[0],
      dueDate: tomorrow.toISOString(),
    };

    vi.mocked(assignmentService.listAssignments).mockResolvedValue({
      data: [assignmentDueTomorrow],
    });

    render(<AssignmentList courseId={mockCourseId} />);

    await waitFor(() => {
      expect(screen.getByText(/Tomorrow at/i)).toBeInTheDocument();
    });
  });
});
