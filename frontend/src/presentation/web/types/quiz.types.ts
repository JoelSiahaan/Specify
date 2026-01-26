/**
 * Quiz Types
 * 
 * TypeScript types and interfaces for quiz-related data.
 * These types are used throughout the frontend application.
 * 
 * Requirements:
 * - 11.1: Quiz creation with title, description, due date, and time limit
 * - 11.4: Questions (MCQ and Essay)
 * - 12.1: Display quiz info before starting
 */

export enum QuizSubmissionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
}

/**
 * Question interface for quiz questions
 */
export interface Question {
  type: 'MCQ' | 'ESSAY';
  questionText: string;
  options?: string[];        // Required for MCQ, undefined for Essay
  correctAnswer?: number;    // Required for MCQ (0-based index), undefined for Essay
}

/**
 * Quiz interface for quiz data
 */
export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;           // ISO 8601 date string
  timeLimit: number;         // in minutes
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Quiz List interface for simplified quiz display
 */
export interface QuizListItem {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;           // ISO 8601 date string
  timeLimit: number;         // in minutes
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  // Submission status (only for students)
  hasSubmission?: boolean;   // Whether student has submitted
  submissionId?: string;     // Submission ID if submitted
  isGraded?: boolean;        // Whether submission is graded
  grade?: number;            // Grade if graded (0-100)
  feedback?: string;         // Feedback if graded
  hasStarted?: boolean;      // Whether student has started but not submitted (for Resume button)
}

/**
 * Quiz Preview interface for students before starting
 */
export interface QuizPreview {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;           // ISO 8601 date string
  timeLimit: number;         // in minutes
  questionCount: number;
  isPastDueDate: boolean;
}

/**
 * Answer interface for quiz answers
 */
export interface Answer {
  questionIndex: number;
  answer: string | number;   // string for essay, number for MCQ (option index)
}

/**
 * Quiz Submission interface
 */
export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  answers: Answer[];
  startedAt: string | null;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  status: QuizSubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Quiz Attempt interface for active quiz taking
 */
export interface QuizAttempt {
  quizId: string;
  submissionId: string;
  title: string;
  description: string;
  timeLimit: number;         // in minutes
  questions: QuizQuestion[];
  startedAt: string;
  remainingTimeSeconds: number;
  currentAnswers: Answer[];
  timeExpired?: boolean;     // Flag to indicate quiz was auto-submitted due to time expiration
}

/**
 * Quiz Question interface for quiz taking (without correct answer)
 */
export interface QuizQuestion {
  questionIndex: number;
  type: 'MCQ' | 'ESSAY';
  questionText: string;
  options?: string[];        // Only for MCQ questions
}

/**
 * Create Quiz Request interface
 */
export interface CreateQuizRequest {
  title: string;
  description: string;
  dueDate: string;           // ISO 8601 date string
  timeLimit: number;         // in minutes
  questions: Question[];
}

/**
 * Update Quiz Request interface
 */
export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  dueDate?: string;          // ISO 8601 date string
  timeLimit?: number;        // in minutes
  questions?: Question[];
}

/**
 * Submit Quiz Request interface
 */
export interface SubmitQuizRequest {
  answers: Answer[];
}

/**
 * Auto-save Quiz Request interface
 */
export interface AutoSaveQuizRequest {
  answers: Answer[];
}

/**
 * Grade Quiz Submission Request interface
 */
export interface GradeQuizSubmissionRequest {
  questionPoints: number[];  // Array of points per question (0-100 each)
  feedback?: string;
}

/**
 * Quiz Submission List Item interface
 */
export interface QuizSubmissionListItem {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: QuizSubmissionStatus;
  startedAt: string | null;
  submittedAt: string | null;
  grade: number | null;
  createdAt: string;
  updatedAt: string;
}
