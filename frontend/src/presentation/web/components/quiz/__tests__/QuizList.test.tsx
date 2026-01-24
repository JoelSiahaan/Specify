/**
 * QuizList Component Tests
 * 
 * Tests for QuizList component functionality including:
 * - Rendering quiz list
 * - Loading and error states
 * - Empty state
 * - Teacher actions (edit, delete, view submissions)
 * - Student actions (take quiz)
 * - Overdue quiz handling
 * - Time remaining display
 * - Archived course restrictions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizList } from '../QuizList';
import { quizService } from '../../../services';
import { useAuth } from '../../../hooks';
import { UserRole } from '../../../types';
import type { QuizListItem } from '../../../types';

// Mock services and hooks
vi.mock('../../../services', () => ({
  quizService: {
    listQuizzes: vi.fn(),
    deleteQuiz: vi.fn(),
  },
}));

vi.mock('../../../hooks', () => ({
  useAuth: vi.fn(),
}));

// Mock UpdateQuiz component
vi.mock('../UpdateQuiz', () => ({
  UpdateQuiz: ({ onSuccess, onCancel }: any) => (
    <div data-testid="update-quiz-modal">
      <button onClick={() => onSuccess({ 
        id: 'quiz-1', 
        courseId: 'course-1',
        title: 'Updated Quiz',
        description: 'Updated description',
        dueDate: '2025-02-01T10:00:00Z',
        timeLimit: 60,
        questions: [],
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      })}>
        Update Success
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('QuizList', () => {
  const mockTeacher = {
    id: 'teacher-1',
    email: 'teacher@example.com',
    name: 'Teacher User',
    role: UserRole.TEACHER,
  };

  const mockStudent = {
    id: 'student-1',
    email: 'student@example.com',
    name: 'Student User',
    role: UserRole.STUDENT,
  };

  const mockQuizzes: QuizListItem[] = [
    {
      id: 'quiz-1',
      courseId: 'course-1',
      title: 'Midterm Exam',
      description: 'Comprehensive midterm examination',
      dueDate: '2099-12-31T23:59:59Z', // Far future date
      timeLimit: 120,
      questionCount: 10,
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z',
    },
    {
      id: 'quiz-2',
      courseId: 'course-1',
      title: 'Final Exam',
      description: 'Final examination',
      dueDate: '2020-01-01T10:00:00Z', // Past date (overdue)
      timeLimit: 180,
      questionCount: 15,
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    window.location.href = '';
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching quizzes', () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockImplementation(() => new Promise(() => {}));

      render(<QuizList courseId="course-1" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockRejectedValue({
        message: 'Failed to load quizzes',
      });

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load quizzes')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockRejectedValue({
        message: 'Network error',
      });

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry fetching quizzes when retry button clicked', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any)
        .mockRejectedValueOnce({ message: 'Network error' })
        .mockResolvedValueOnce(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no quizzes', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue([]);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('No Quizzes')).toBeInTheDocument();
        expect(screen.getByText("This course doesn't have any quizzes yet.")).toBeInTheDocument();
      });
    });
  });

  describe('Quiz List Display', () => {
    it('should display list of quizzes', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
        expect(screen.getByText('Final Exam')).toBeInTheDocument();
      });
    });

    it('should display quiz details', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Comprehensive midterm examination')).toBeInTheDocument();
        expect(screen.getByText('120 minutes')).toBeInTheDocument();
        expect(screen.getByText('10 questions')).toBeInTheDocument();
      });
    });

    it('should highlight overdue quizzes', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        const overdueQuiz = screen.getByText('Final Exam').closest('div.border-red-500');
        expect(overdueQuiz).toBeInTheDocument();
      });
    });

    it('should show overdue badge for past due quizzes', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Overdue')).toBeInTheDocument();
      });
    });
  });

  describe('Teacher Actions', () => {
    it('should show teacher action buttons', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getAllByText('Submissions')).toHaveLength(2);
        expect(screen.getAllByText('Edit')).toHaveLength(2);
        expect(screen.getAllByText('Delete')).toHaveLength(2);
      });
    });

    it('should navigate to submissions page when submissions button clicked', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getAllByText('Submissions')[0]).toBeInTheDocument();
      });

      const submissionsButton = screen.getAllByText('Submissions')[0];
      await userEvent.click(submissionsButton);

      expect(window.location.href).toBe('/courses/course-1/quizzes/quiz-1/submissions');
    });

    it('should open edit modal when edit button clicked', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getAllByText('Edit')[0]).toBeInTheDocument();
      });

      const editButton = screen.getAllByText('Edit')[0];
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('update-quiz-modal')).toBeInTheDocument();
      });
    });

    it('should update quiz in list when edit succeeds', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getAllByText('Edit')[0]).toBeInTheDocument();
      });

      const editButton = screen.getAllByText('Edit')[0];
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('update-quiz-modal')).toBeInTheDocument();
      });

      const updateSuccessButton = screen.getByText('Update Success');
      await userEvent.click(updateSuccessButton);

      await waitFor(() => {
        expect(screen.getByText('Updated Quiz')).toBeInTheDocument();
        expect(screen.queryByTestId('update-quiz-modal')).not.toBeInTheDocument();
      });
    });

    it('should close edit modal when cancel clicked', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getAllByText('Edit')[0]).toBeInTheDocument();
      });

      const editButton = screen.getAllByText('Edit')[0];
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('update-quiz-modal')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('update-quiz-modal')).not.toBeInTheDocument();
      });
    });

    it('should show confirmation dialog when delete button clicked', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);
      (quizService.deleteQuiz as any).mockResolvedValue(undefined);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getAllByText('Delete')[0]).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByText('Delete')[0];
      await userEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this quiz? This action cannot be undone.'
      );
    });

    it('should delete quiz when confirmed', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);
      (quizService.deleteQuiz as any).mockResolvedValue(undefined);
      mockConfirm.mockReturnValue(true);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getAllByText('Delete')[0]).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByText('Delete')[0];
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(quizService.deleteQuiz).toHaveBeenCalledWith('quiz-1');
      });

      await waitFor(() => {
        expect(screen.queryByText('Midterm Exam')).not.toBeInTheDocument();
      });
    });

    it('should not delete quiz when cancelled', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);
      mockConfirm.mockReturnValue(false);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getAllByText('Delete')[0]).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByText('Delete')[0];
      await userEvent.click(deleteButton);

      expect(quizService.deleteQuiz).not.toHaveBeenCalled();
      expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
    });

    it('should show error message when delete fails', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);
      (quizService.deleteQuiz as any).mockRejectedValue({
        message: 'Failed to delete quiz',
      });
      mockConfirm.mockReturnValue(true);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getAllByText('Delete')[0]).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByText('Delete')[0];
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete quiz')).toBeInTheDocument();
      });
    });

    it('should hide edit and delete buttons for archived courses', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" courseStatus="ARCHIVED" />);

      await waitFor(() => {
        expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
      });

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      expect(screen.getAllByText('Submissions')).toHaveLength(2);
    });
  });

  describe('Student Actions', () => {
    it('should show take quiz button for students', async () => {
      (useAuth as any).mockReturnValue({ user: mockStudent });
      (quizService.listQuizzes as any).mockResolvedValue([mockQuizzes[0]]); // Only future quiz

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Take Quiz')).toBeInTheDocument();
      });
    });

    it('should navigate to quiz taking page when take quiz clicked', async () => {
      (useAuth as any).mockReturnValue({ user: mockStudent });
      (quizService.listQuizzes as any).mockResolvedValue([mockQuizzes[0]]);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Take Quiz')).toBeInTheDocument();
      });

      const takeQuizButton = screen.getByText('Take Quiz');
      await userEvent.click(takeQuizButton);

      expect(window.location.href).toBe('/courses/course-1/quizzes/quiz-1/take');
    });

    it('should not show take quiz button for overdue quizzes', async () => {
      (useAuth as any).mockReturnValue({ user: mockStudent });
      (quizService.listQuizzes as any).mockResolvedValue([mockQuizzes[1]]); // Only overdue quiz

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Final Exam')).toBeInTheDocument();
      });

      expect(screen.queryByText('Take Quiz')).not.toBeInTheDocument();
    });

    it('should not show take quiz button for archived courses', async () => {
      (useAuth as any).mockReturnValue({ user: mockStudent });
      (quizService.listQuizzes as any).mockResolvedValue([mockQuizzes[0]]);

      render(<QuizList courseId="course-1" courseStatus="ARCHIVED" />);

      await waitFor(() => {
        expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
      });

      expect(screen.queryByText('Take Quiz')).not.toBeInTheDocument();
    });

    it('should not show teacher action buttons for students', async () => {
      (useAuth as any).mockReturnValue({ user: mockStudent });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
      });

      expect(screen.queryByText('Submissions')).not.toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Time Remaining Display', () => {
    it('should show time remaining for upcoming quizzes', async () => {
      (useAuth as any).mockReturnValue({ user: mockTeacher });
      (quizService.listQuizzes as any).mockResolvedValue(mockQuizzes);

      render(<QuizList courseId="course-1" />);

      await waitFor(() => {
        // Should show time remaining (days, hours, or minutes)
        const timeRemainingElements = screen.getAllByText(/remaining/i);
        expect(timeRemainingElements.length).toBeGreaterThan(0);
      });
    });
  });
});
