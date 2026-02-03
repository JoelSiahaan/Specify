/**
 * QuizSubmission Data Transfer Objects (DTOs)
 * 
 * DTOs for transferring quiz submission data between application layers.
 * These objects are used for API requests and responses.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 * - 12.2: Start quiz and countdown timer
 * - 12.5: Accept submission before time limit
 */

import { QuizSubmissionStatus } from '../../domain/entities/QuizSubmission.js';

/**
 * Answer DTO for quiz answers
 * Supports both MCQ (number) and Essay (string) answers
 */
export interface AnswerDTO {
  questionIndex: number;
  answer: string | number;   // string for essay, number for MCQ (option index)
}

/**
 * QuizSubmission DTO for API responses
 * Contains all submission information for display
 */
export interface QuizSubmissionDTO {
  id: string;
  quizId: string;
  studentId: string;
  answers: AnswerDTO[];
  startedAt: Date | null;
  submittedAt: Date | null;
  grade: number | null;
  feedback: string | null;
  status: QuizSubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Start Quiz DTO for starting a quiz attempt
 * No additional data needed, just the action
 * 
 * Requirements:
 * - 12.2: Start quiz and countdown timer
 */
export interface StartQuizDTO {
  // Empty - starting quiz doesn't require additional data
  // Quiz ID comes from URL parameter
}

/**
 * Submit Quiz DTO for submitting quiz answers
 * Contains all answers for the quiz
 * 
 * Requirements:
 * - 12.5: Accept submission before time limit
 */
export interface SubmitQuizDTO {
  answers: AnswerDTO[];
}

/**
 * Auto-save Quiz DTO for auto-saving answers during quiz
 * Used for periodic auto-save while quiz is in progress
 */
export interface AutoSaveQuizDTO {
  answers: AnswerDTO[];
}

/**
 * Quiz Attempt DTO for active quiz taking
 * Contains quiz details and current submission state
 * 
 * Requirements:
 * - 12.2: Display all questions and start countdown timer
 * - 12.3: Display remaining time
 */
export interface QuizAttemptDTO {
  quizId: string;
  submissionId: string;
  title: string;
  description: string;
  timeLimit: number;         // in minutes
  questions: QuizQuestionDTO[];
  startedAt: Date;
  remainingTimeSeconds: number;
  currentAnswers: AnswerDTO[];
  timeExpired?: boolean;     // Flag to indicate quiz was auto-submitted due to time expiration
}

/**
 * Quiz Question DTO for quiz taking
 * Contains question without revealing correct answer
 */
export interface QuizQuestionDTO {
  questionIndex: number;
  type: 'MCQ' | 'ESSAY';
  questionText: string;
  options?: string[];        // Only for MCQ questions
}

/**
 * Grade Quiz Submission DTO for grading
 * Contains grade and optional feedback
 * 
 * Requirements:
 * - 13.3: Validate grade is between 0 and 100
 * - 13.6: Allow teachers to add text feedback
 */
export interface GradeQuizSubmissionDTO {
  grade: number;             // 0-100
  feedback?: string;
}

/**
 * Quiz Submission List DTO for listing submissions
 * Simplified version for teacher grading view
 * 
 * Requirements:
 * - 14.1: Display all student submissions
 * - 14.2: Show submission status
 */
export interface QuizSubmissionListDTO {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: QuizSubmissionStatus;
  startedAt: Date | null;
  submittedAt: Date | null;
  grade: number | null;
  createdAt: Date;
  updatedAt: Date;
}
