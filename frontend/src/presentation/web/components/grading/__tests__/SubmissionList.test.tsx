/**
 * SubmissionList Component Tests
 * 
 * Tests for the SubmissionList component (teacher view).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubmissionList } from '../SubmissionList';
import { SubmissionStatus } from '../../../types/common.types';
import type { AssignmentSubmissionListDTO } from '../../../types/assignment.types';

describe('SubmissionList', () => {
  const mockSubmissions: AssignmentSubmissionListDTO[] = [
    {
      id: 'submission-1',
      assignmentId: 'assignment-1',
      studentId: 'student-1',
      studentName: 'John Doe',
      studentEmail: 'john@example.com',
      status: SubmissionStatus.SUBMITTED,
      isLate: false,
      submittedAt: new Date('2025-01-13T10:30:00Z').toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'submission-2',
      assignmentId: 'assignment-1',
      studentId: 'student-2',
      studentName: 'Jane Smith',
      studentEmail: 'jane@example.com',
      status: SubmissionStatus.GRADED,
      isLate: false,
      grade: 85,
      submittedAt: new Date('2025-01-12T14:20:00Z').toISOString(),
      gradedAt: new Date('2025-01-13T09:00:00Z').toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'submission-3',
      assignmentId: 'assignment-1',
      studentId: 'student-3',
      studentName: 'Bob Lee',
      studentEmail: 'bob@example.com',
      status: SubmissionStatus.NOT_SUBMITTED,
      isLate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'submission-4',
      assignmentId: 'assignment-1',
      studentId: 'student-4',
      studentName: 'Alice Johnson',
      studentEmail: 'alice@example.com',
      status: SubmissionStatus.SUBMITTED,
      isLate: true,
      submittedAt: new Date('2025-01-14T10:30:00Z').toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display all submissions by default', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Lee')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('should display correct status counts in filter tabs', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    expect(screen.getByText('All (4)')).toBeInTheDocument();
    expect(screen.getByText('Not Submitted (1)')).toBeInTheDocument();
    expect(screen.getByText('Submitted (2)')).toBeInTheDocument();
    expect(screen.getByText('Graded (1)')).toBeInTheDocument();
  });

  it('should filter submissions by "Not Submitted" status', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    const notSubmittedTab = screen.getByText('Not Submitted (1)');
    fireEvent.click(notSubmittedTab);

    expect(screen.getByText('Bob Lee')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('should filter submissions by "Submitted" status', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    const submittedTab = screen.getByText('Submitted (2)');
    fireEvent.click(submittedTab);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Lee')).not.toBeInTheDocument();
  });

  it('should filter submissions by "Graded" status', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    const gradedTab = screen.getByText('Graded (1)');
    fireEvent.click(gradedTab);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Lee')).not.toBeInTheDocument();
  });

  it('should display late submission indicator', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    expect(screen.getByText('Late Submission')).toBeInTheDocument();
  });

  it('should display grade for graded submissions', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
  });

  it('should display "Grade" button for submitted but ungraded submissions', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    const gradeButtons = screen.getAllByText('Grade');
    expect(gradeButtons.length).toBeGreaterThan(0);
  });

  it('should display "View Grade" button for graded submissions', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    expect(screen.getByText('View Grade')).toBeInTheDocument();
  });

  it('should not display grade button for not submitted submissions', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    const notSubmittedTab = screen.getByText('Not Submitted (1)');
    fireEvent.click(notSubmittedTab);

    expect(screen.queryByText('Grade')).not.toBeInTheDocument();
    expect(screen.queryByText('View Grade')).not.toBeInTheDocument();
  });

  it('should call onGradeClick when grade button is clicked', () => {
    const mockOnGradeClick = vi.fn();
    render(<SubmissionList submissions={mockSubmissions} onGradeClick={mockOnGradeClick} />);

    const gradeButton = screen.getAllByText('Grade')[0];
    fireEvent.click(gradeButton);

    expect(mockOnGradeClick).toHaveBeenCalledWith('submission-1');
  });

  it('should display empty state when no submissions exist', () => {
    render(<SubmissionList submissions={[]} />);

    expect(screen.getByText('No Submissions Yet')).toBeInTheDocument();
    expect(screen.getByText("Students haven't submitted any work yet.")).toBeInTheDocument();
  });

  it('should display empty state for filtered category with no results', () => {
    const onlyNotSubmitted: AssignmentSubmissionListDTO[] = [mockSubmissions[2]];
    render(<SubmissionList submissions={onlyNotSubmitted} />);

    const submittedTab = screen.getByText('Submitted (0)');
    fireEvent.click(submittedTab);

    expect(screen.getByText('No submissions in this category.')).toBeInTheDocument();
  });

  it('should display student email addresses', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('should display submission timestamps for submitted work', () => {
    render(<SubmissionList submissions={mockSubmissions} />);

    // Use getAllByText since there are multiple submissions with timestamps
    const timestamps = screen.getAllByText(/Submitted:/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('should handle missing student name gracefully', () => {
    const submissionWithoutName: AssignmentSubmissionListDTO[] = [
      {
        ...mockSubmissions[0],
        studentName: undefined,
      },
    ];

    render(<SubmissionList submissions={submissionWithoutName} />);

    expect(screen.getByText('Unknown Student')).toBeInTheDocument();
  });
});
