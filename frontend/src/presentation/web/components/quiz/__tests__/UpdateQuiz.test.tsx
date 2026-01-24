/**
 * UpdateQuiz Component Tests
 * 
 * Tests for the UpdateQuiz component.
 * 
 * Requirements:
 * - 11.6: Update quiz (before due date and no submissions)
 * - 11.7: Edit quizzes only before due date and before any submissions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter as render } from '../../../../../test/test-utils';
import { UpdateQuiz } from '../UpdateQuiz';
import * as quizService from '../../../services/quizService';
import { Quiz, QuestionType } from '../../../types';

// Mock quiz service
vi.mock('../../../services/quizService', () => ({
  getQuizById: vi.fn(),
  updateQuiz: vi.fn(),
}));

describe('UpdateQuiz Component', () => {
  const mockQuiz: Quiz = {
    id: 'quiz-1',
    courseId: 'course-1',
    title: 'Midterm Exam',
    description: 'Comprehensive midterm exam',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    timeLimit: 120,
    questions: [
      {
        type: QuestionType.MCQ,
        questionText: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
      },
      {
        type: QuestionType.ESSAY,
        questionText: 'Explain the concept of recursion.',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(quizService, 'getQuizById').mockResolvedValue(mockQuiz);
  });

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      vi.spyOn(quizService, 'getQuizById').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<UpdateQuiz quizId="quiz-1" />);
      
      expect(screen.getByText(/loading quiz/i)).toBeInTheDocument();
    });
  });

  describe('Quiz Data Loading', () => {
    it('should load and display quiz data', async () => {
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      expect(screen.getByDisplayValue('Comprehensive midterm exam')).toBeInTheDocument();
      expect(screen.getByDisplayValue('120')).toBeInTheDocument();
      expect(screen.getByText(/what is 2\+2/i)).toBeInTheDocument();
      expect(screen.getByText(/explain the concept of recursion/i)).toBeInTheDocument();
    });

    it('should handle quiz not found error', async () => {
      vi.spyOn(quizService, 'getQuizById').mockRejectedValue({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Quiz not found',
      });
      
      render(<UpdateQuiz quizId="quiz-1" onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText(/quiz not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Editing Restrictions', () => {
    it('should allow editing when quiz is before due date', async () => {
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByLabelText(/quiz title/i);
      expect(titleInput).not.toBeDisabled();
    });

    it('should disable editing when quiz is past due date', async () => {
      const pastDueQuiz = {
        ...mockQuiz,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      };
      vi.spyOn(quizService, 'getQuizById').mockResolvedValue(pastDueQuiz);
      
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/editing restricted/i)).toBeInTheDocument();
      });
      
      expect(screen.getByText(/due date has passed/i)).toBeInTheDocument();
      
      const titleInput = screen.getByLabelText(/quiz title/i);
      expect(titleInput).toBeDisabled();
    });
  });

  describe('Quiz Update', () => {
    it('should update quiz successfully', async () => {
      const updatedQuiz = { ...mockQuiz, title: 'Updated Midterm Exam' };
      vi.spyOn(quizService, 'updateQuiz').mockResolvedValue(updatedQuiz);
      
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" onSuccess={mockOnSuccess} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByLabelText(/quiz title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Midterm Exam');
      
      const submitButton = screen.getByRole('button', { name: /update quiz/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(quizService.updateQuiz).toHaveBeenCalledWith('quiz-1', expect.objectContaining({
          title: 'Updated Midterm Exam',
        }));
      });
      
      expect(mockOnSuccess).toHaveBeenCalledWith(updatedQuiz);
    });

    it('should show error when quiz has submissions', async () => {
      vi.spyOn(quizService, 'updateQuiz').mockRejectedValue({
        code: 'QUIZ_HAS_SUBMISSIONS',
        message: 'This quiz cannot be edited because students have already submitted answers.',
      });
      
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByRole('button', { name: /update quiz/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        // Check for warning banner (not error message)
        expect(screen.getByText(/editing restricted/i)).toBeInTheDocument();
        expect(screen.getByText(/students have already submitted answers/i)).toBeInTheDocument();
      });
    });

    it('should show error when quiz is past due date on server', async () => {
      vi.spyOn(quizService, 'updateQuiz').mockRejectedValue({
        code: 'QUIZ_PAST_DUE_DATE',
        message: 'This quiz cannot be edited because the due date has passed.',
      });
      
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByRole('button', { name: /update quiz/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        // Check for warning banner (not error message)
        expect(screen.getByText(/editing restricted/i)).toBeInTheDocument();
        expect(screen.getByText(/due date has passed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required title', async () => {
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByLabelText(/quiz title/i);
      await user.clear(titleInput);
      
      const submitButton = screen.getByRole('button', { name: /update quiz/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should validate required description', async () => {
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.clear(descriptionInput);
      
      const submitButton = screen.getByRole('button', { name: /update quiz/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      });
    });

    it('should validate time limit', async () => {
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const timeLimitInput = screen.getByLabelText(/time limit/i);
      await user.clear(timeLimitInput);
      await user.type(timeLimitInput, '0');
      
      const submitButton = screen.getByRole('button', { name: /update quiz/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/time limit must be a positive number/i)).toBeInTheDocument();
      });
    });
  });

  describe('Question Management', () => {
    it('should allow adding new questions', async () => {
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const addQuestionButton = screen.getByRole('button', { name: /\+ add question/i });
      await user.click(addQuestionButton);
      
      // Check for the heading specifically
      expect(screen.getByRole('heading', { name: /add question/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/question type/i)).toBeInTheDocument();
    });

    it('should allow removing existing questions', async () => {
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons.length).toBeGreaterThan(0);
      
      const firstRemoveButton = removeButtons[0];
      if (firstRemoveButton) {
        await user.click(firstRemoveButton);
        
        // Question should be removed
        await waitFor(() => {
          const remainingRemoveButtons = screen.getAllByRole('button', { name: /remove/i });
          expect(remainingRemoveButtons.length).toBe(removeButtons.length - 1);
        });
      }
    });

    it('should not show add/remove buttons when editing is disabled', async () => {
      const pastDueQuiz = {
        ...mockQuiz,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };
      vi.spyOn(quizService, 'getQuizById').mockResolvedValue(pastDueQuiz);
      
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/editing restricted/i)).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /\+ add question/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on update failure', async () => {
      vi.spyOn(quizService, 'updateQuiz').mockRejectedValue({
        message: 'Failed to update quiz',
      });
      
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByRole('button', { name: /update quiz/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to update quiz/i)).toBeInTheDocument();
      });
    });

    it('should handle server validation errors', async () => {
      vi.spyOn(quizService, 'updateQuiz').mockRejectedValue({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: {
          title: 'Title is too short',
          timeLimit: 'Time limit is invalid',
        },
      });
      
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByRole('button', { name: /update quiz/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/title is too short/i)).toBeInTheDocument();
        expect(screen.getByText(/time limit is invalid/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State During Update', () => {
    it('should display loading state during update', async () => {
      vi.spyOn(quizService, 'updateQuiz').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockQuiz), 100))
      );
      
      const user = userEvent.setup();
      render(<UpdateQuiz quizId="quiz-1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Midterm Exam')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByRole('button', { name: /update quiz/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/updating quiz/i)).toBeInTheDocument();
      });
    });
  });
});
