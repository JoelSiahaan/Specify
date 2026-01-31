/**
 * AssignmentList Component Tests
 * 
 * Tests for the AssignmentList component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssignmentList } from '../AssignmentList';
import { SubmissionType, SubmissionStatus } from '../../../types/common.types';

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
      status: SubmissionStatus.NOT_SUBMITTED,
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
      status: SubmissionStatus.NOT_SUBMITTED,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display assignments when provided', () => {
    render(<AssignmentList assignments={mockAssignments} />);

    expect(screen.getByText('Assignment 1: Variables')).toBeInTheDocument();
    expect(screen.getByText('Assignment 2: Functions')).toBeInTheDocument();
  });

  it('should display "Not Submitted" status for assignments without submissions', () => {
    render(<AssignmentList assignments={[mockAssignments[0]]} />);

    expect(screen.getByText('Not Submitted')).toBeInTheDocument();
  });

  it('should highlight overdue assignments', () => {
    render(<AssignmentList assignments={[mockAssignments[1]]} />);

    const overdueText = screen.getByText(/Overdue/i);
    expect(overdueText).toBeInTheDocument();
    expect(overdueText).toHaveClass('text-red-600');
  });

  it('should display time remaining for upcoming assignments', () => {
    render(<AssignmentList assignments={[mockAssignments[0]]} />);

    // Check for time remaining text (actual format is "X days remaining")
    expect(screen.getByText(/\d+ days remaining/i)).toBeInTheDocument();
  });

  it('should display empty state when no assignments exist', () => {
    render(<AssignmentList assignments={[]} />);

    expect(screen.getByText('No Assignments')).toBeInTheDocument();
    expect(
      screen.getByText("This course doesn't have any assignments yet.")
    ).toBeInTheDocument();
  });

  it('should call onAssignmentClick when assignment is clicked', () => {
    const mockOnClick = vi.fn();
    
    render(<AssignmentList assignments={[mockAssignments[0]]} onAssignmentClick={mockOnClick} />);

    expect(screen.getByText('Assignment 1: Variables')).toBeInTheDocument();

    const assignmentCard = screen.getByText('Assignment 1: Variables').closest('div');
    assignmentCard?.click();

    expect(mockOnClick).toHaveBeenCalledWith('assignment-1');
  });

  it('should format due dates correctly', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);

    const assignmentDueTomorrow = {
      ...mockAssignments[0],
      dueDate: tomorrow.toISOString(),
    };

    render(<AssignmentList assignments={[assignmentDueTomorrow]} />);

    expect(screen.getByText(/Tomorrow at/i)).toBeInTheDocument();
  });
});
