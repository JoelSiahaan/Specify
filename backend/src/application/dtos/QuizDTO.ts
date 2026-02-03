/**
 * Quiz Data Transfer Objects (DTOs)
 * 
 * DTOs for transferring quiz data between application layers.
 * These objects are used for API requests and responses.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 * - 11.1: Quiz creation with title, description, due date, and time limit
 * - 11.4: Questions (MCQ and Essay)
 */

import { QuestionType } from '../../domain/entities/Quiz.js';

/**
 * Question DTO for API requests and responses
 * Supports both MCQ and Essay question types
 */
export interface QuestionDTO {
  type: QuestionType;
  questionText: string;
  options?: string[];        // Required for MCQ, undefined for Essay
  correctAnswer?: number;    // Required for MCQ (0-based index), undefined for Essay
}

/**
 * Quiz DTO for API responses
 * Contains all quiz information for display
 */
export interface QuizDTO {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  timeLimit: number;         // in minutes
  questions: QuestionDTO[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Quiz DTO for quiz creation
 * Requires all quiz fields including questions
 */
export interface CreateQuizDTO {
  title: string;
  description: string;
  dueDate: Date;
  timeLimit: number;         // in minutes
  questions: QuestionDTO[];
}

/**
 * Update Quiz DTO for quiz updates
 * Allows updating any quiz field
 * Note: Updates only allowed before due date and before any submissions
 */
export interface UpdateQuizDTO {
  title?: string;
  description?: string;
  dueDate?: Date;
  timeLimit?: number;        // in minutes
  questions?: QuestionDTO[];
}

/**
 * Quiz List DTO for listing quizzes
 * Simplified version for list views
 */
export interface QuizListDTO {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  timeLimit: number;         // in minutes
  questionCount: number;     // Number of questions
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Quiz Preview DTO for students before starting
 * Shows quiz information without revealing questions
 * 
 * Requirements:
 * - 12.1: Display quiz info before starting
 */
export interface QuizPreviewDTO {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  timeLimit: number;         // in minutes
  questionCount: number;     // Number of questions
  isPastDueDate: boolean;    // Whether quiz is past due date
}
