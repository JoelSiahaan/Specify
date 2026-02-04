/**
 * GradeQuizSubmission Component Tests
 * 
 * Tests for the GradeQuizSubmission component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { GradeQuizSubmission } from '../GradeQuizSubmission';
import * as quizService from '../../../services/quizService';
import { QuizSubmissionStatus } from '../../../types/quiz.types';
import type { QuizSubmission, Quiz } from '../../../types';

// Mock the quiz service
vi.mock('../../../services/quizService', () => ({
  getQuizSubmission: vi.fn(),
  getQuiz: vi.fn(),
  gradeQuizSubmission: vi.fn(),
  updateQuizGrade: vi.fn(),
}));

describe('GradeQuizSubmission', () => {
  const mockQuiz: Quiz = {
    id: 'quiz-1',
    courseId: 'course-1',
    title: 'Midterm Exam',
    description: 'Comprehensive exam covering chapters 1-5',
    dueDate: '2025-02-01T10:00:00Z',
    timeLimit: 60,
    questions: [
      {
        type: 'MCQ',
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
      },
      {
        type: 'ESSAY',
        questionText: 'Explain the concept of recursion.',
      },
    ],
    createdAt: '2025-01-13T10:00:00Z',
    updatedAt: '2025-01-13T10:00:00Z',
  };

  const mockSubmission: QuizSubmission = {
    id: 'submission-1',
    quizId: 'quiz-1',
    studentId: 'student-1',
    answers: [
      { questionIndex: 0, answer: 1 },
      { questionIndex: 1, answer: 'Recursion is when a function calls itself...' },
    ],
    startedAt: '2025-01-13T10:00:00Z',
    submittedAt: '2025-01-13T10:30:00Z',
    grade: null,
    feedback: null,
    status: QuizSubmissionStatus.SUBMITTED,
    createdAt: '2025-01-13T10:00:00Z',
    updatedAt: '2025-01-13T10:30:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (quizService.getQuizSubmission as any).mockResolvedValue(mockSubmission);
    (quizService.getQuiz as any).mockResolvedValue(mockQuiz);
  });

  it('should render loading state initially', () => {
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display quiz title and questions after loading', async () => {
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    // Use findBy* queries which wait for elements to appear
    expect(await screen.findByText('Grade Quiz Submission')).toBeInTheDocument();
    expect(await screen.findByText('Midterm Exam')).toBeInTheDocument();
    expect(await screen.findByText('What is 2 + 2?')).toBeInTheDocument();
    expect(await screen.findByText('Explain the concept of recursion.')).toBeInTheDocument();
  });

  it('should display MCQ options with student answer highlighted', async () => {
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    // Use findBy* to wait for question to appear
    expect(await screen.findByText('What is 2 + 2?')).toBeInTheDocument();
    
    // Check that options are displayed
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(await screen.findByText('4')).toBeInTheDocument();
    
    // Check that student answer is marked
    expect(await screen.findByText(/Student's Answer/i)).toBeInTheDocument();
  });

  it('should display essay answer', async () => {
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    // Use findBy* to wait for question to appear
    expect(await screen.findByText('Explain the concept of recursion.')).toBeInTheDocument();
    expect(await screen.findByText(/Recursion is when a function calls itself/i)).toBeInTheDocument();
  });

  it('should display points input for each question', async () => {
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    // Use findBy* to wait for inputs to appear
    expect(await screen.findByLabelText(/Points for Question 1/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Points for Question 2/i)).toBeInTheDocument();
  });

  it('should calculate total points correctly', async () => {
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Points for Question 1/i)).toBeInTheDocument();
    });
    
    const question1Input = screen.getByLabelText(/Points for Question 1/i);
    const question2Input = screen.getByLabelText(/Points for Question 2/i);
    
    fireEvent.change(question1Input, { target: { value: '40' } });
    fireEvent.change(question2Input, { target: { value: '60' } });
    
    await waitFor(() => {
      expect(screen.getByText('100.00')).toBeInTheDocument();
    });
  });

  it('should show warning when total points do not equal 100 for multiple MCQ', async () => {
    // Create a quiz with multiple MCQ questions (no essay)
    const allMCQQuiz: Quiz = {
      ...mockQuiz,
      questions: [
        {
          type: 'MCQ',
          questionText: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
        },
        {
          type: 'MCQ',
          questionText: 'What is 3 + 3?',
          options: ['5', '6', '7', '8'],
          correctAnswer: 1,
        },
      ],
    };
    
    (quizService.getQuiz as any).mockResolvedValue(allMCQQuiz);
    
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    // Wait for inputs to appear
    expect(await screen.findByLabelText(/Points for Question 1/i)).toBeInTheDocument();
    
    const question1Input = screen.getByLabelText(/Points for Question 1/i);
    const question2Input = screen.getByLabelText(/Points for Question 2/i);
    
    // Enter points that don't sum to 100
    fireEvent.change(question1Input, { target: { value: '30' } });
    fireEvent.change(question2Input, { target: { value: '50' } });
    
    // For multiple MCQ, should show error that total must equal 100
    await waitFor(() => {
      expect(screen.getByText(/Total points must equal 100 for multiple choice quizzes/i)).toBeInTheDocument();
    });
  });

  it('should validate points input', async () => {
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Points for Question 1/i)).toBeInTheDocument();
    });
    
    const question1Input = screen.getByLabelText(/Points for Question 1/i);
    const submitButton = screen.getByRole('button', { name: /Save Grade/i });
    
    // Test negative points
    fireEvent.change(question1Input, { target: { value: '-10' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Cannot be negative/i)).toBeInTheDocument();
    });
  });

  it('should submit grade successfully', async () => {
    const mockGradedSubmission = {
      ...mockSubmission,
      grade: 100,
      feedback: 'Excellent work!',
      status: QuizSubmissionStatus.GRADED,
    };
    
    (quizService.gradeQuizSubmission as any).mockResolvedValue(mockGradedSubmission);
    
    const onSuccess = vi.fn();
    render(<GradeQuizSubmission submissionId="submission-1" onSuccess={onSuccess} />);
    
    // Wait for inputs to appear
    expect(await screen.findByLabelText(/Points for Question 1/i)).toBeInTheDocument();
    
    const question1Input = screen.getByLabelText(/Points for Question 1/i);
    const question2Input = screen.getByLabelText(/Points for Question 2/i);
    const feedbackInput = screen.getByPlaceholderText(/Provide overall feedback/i);
    const submitButton = screen.getByRole('button', { name: /Save Grade/i });
    
    fireEvent.change(question1Input, { target: { value: '50' } });
    fireEvent.change(question2Input, { target: { value: '50' } });
    fireEvent.change(feedbackInput, { target: { value: 'Excellent work!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(quizService.gradeQuizSubmission).toHaveBeenCalledWith('submission-1', {
        questionGrades: [
          { questionIndex: 0, points: 50 },
          { questionIndex: 1, points: 50 }
        ],
        generalFeedback: 'Excellent work!',
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Quiz graded successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle update grade for already graded submission', async () => {
    const gradedSubmission: QuizSubmission = {
      ...mockSubmission,
      grade: 90,
      feedback: 'Good work!',
      status: QuizSubmissionStatus.GRADED,
    };
    
    (quizService.getQuizSubmission as any).mockResolvedValue(gradedSubmission);
    (quizService.updateQuizGrade as any).mockResolvedValue({
      ...gradedSubmission,
      grade: 95,
      feedback: 'Excellent work!',
    });
    
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Graded')).toBeInTheDocument();
    });
    
    const question1Input = screen.getByLabelText(/Points for Question 1/i);
    const question2Input = screen.getByLabelText(/Points for Question 2/i);
    const submitButton = screen.getByRole('button', { name: /Update Grade/i });
    
    fireEvent.change(question1Input, { target: { value: '45' } });
    fireEvent.change(question2Input, { target: { value: '50' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(quizService.updateQuizGrade).toHaveBeenCalled();
    });
  });

  it('should display feedback editor', async () => {
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Provide overall feedback/i)).toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<GradeQuizSubmission submissionId="submission-1" onCancel={onCancel} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('should display grading rules info', async () => {
    render(<GradeQuizSubmission submissionId="submission-1" />);
    
    // Wait for the grading rules section to appear
    expect(await screen.findByText(/Grading Rules:/i)).toBeInTheDocument();
    expect(await screen.findByText(/All questions require manual point assignment/i)).toBeInTheDocument();
  });
});
