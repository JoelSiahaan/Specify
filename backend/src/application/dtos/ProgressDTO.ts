/**
 * Progress Data Transfer Objects (DTOs)
 * 
 * DTOs for transferring student progress data between application layers.
 * These objects are used for API requests and responses.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 * - 14.1: Display all assignments and quizzes with status
 * - 14.2: Show "Not Submitted" for items without submissions
 * - 14.3: Show "Submitted" for items awaiting grading
 * - 14.4: Show "Graded" with grade and feedback
 * - 14.5: Highlight overdue items not submitted
 * - 16.6: Indicate late submissions
 * - 16.7: Calculate and display average grade
 */

import { AssignmentSubmissionStatus } from '../../domain/entities/AssignmentSubmission';
import { SubmissionType } from '../../domain/entities/Assignment';

/**
 * Assignment Progress Item DTO
 * Contains assignment information with submission status for student progress view
 */
export interface AssignmentProgressItemDTO {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  submissionType: SubmissionType;
  status: AssignmentSubmissionStatus;
  grade?: number;
  feedback?: string;
  isLate: boolean;
  isOverdue: boolean;
  submittedAt?: Date;
  gradedAt?: Date;
}

/**
 * Quiz Progress Item DTO
 * Contains quiz information with submission status for student progress view
 */
export interface QuizProgressItemDTO {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  timeLimit: number;
  questionCount: number;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED';
  grade?: number;
  feedback?: string;
  isOverdue: boolean;
  submittedAt?: Date;
  gradedAt?: Date;
}

/**
 * Student Progress DTO
 * Contains all progress information for a student in a course
 * 
 * Requirements:
 * - 16.1: Display all assignments and quizzes with status
 * - 16.7: Calculate and display average grade
 * - 16.8: Display appropriate message when no items are graded
 */
export interface StudentProgressDTO {
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  assignments: AssignmentProgressItemDTO[];
  quizzes: QuizProgressItemDTO[];
  averageGrade: number | null;  // null if no graded items
  totalGradedItems: number;
  totalItems: number;
}

