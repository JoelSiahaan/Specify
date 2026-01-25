/**
 * Assignment Data Transfer Objects (DTOs)
 * 
 * DTOs for transferring assignment and submission data between application layers.
 * These objects are used for API requests and responses.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 */

import { SubmissionType } from '../../domain/entities/Assignment';
import { SubmissionStatus } from '../../domain/entities/Submission';

/**
 * Assignment DTO for API responses
 * Contains all assignment information for display
 */
export interface AssignmentDTO {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  submissionType: SubmissionType;
  acceptedFileFormats: string[];
  gradingStarted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Assignment DTO for assignment creation
 * Requires all essential fields for creating an assignment
 */
export interface CreateAssignmentDTO {
  title: string;
  description: string;
  dueDate: Date;
  submissionType: SubmissionType;
  acceptedFileFormats?: string[];
}

/**
 * Update Assignment DTO for assignment updates
 * Allows updating title, description, and due date
 */
export interface UpdateAssignmentDTO {
  title?: string;
  description?: string;
  dueDate?: Date;
}

/**
 * Assignment List DTO for listing assignments
 * Includes additional information like submission status for students
 */
export interface AssignmentListDTO {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  submissionType: SubmissionType;
  gradingStarted: boolean;
  isPastDue: boolean;
  submissionStatus?: SubmissionStatus;  // For student view
  grade?: number;                        // For student view (if graded)
  isLate?: boolean;                      // For student view (if submitted)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Submission DTO for API responses
 * Contains all submission information for display
 */
export interface SubmissionDTO {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  filePath?: string;
  fileName?: string;
  grade?: number;
  feedback?: string;
  isLate: boolean;
  status: SubmissionStatus;
  version: number;
  submittedAt?: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Submission DTO for submission creation
 * Used when student submits an assignment
 */
export interface CreateSubmissionDTO {
  content?: string;
  filePath?: string;
  fileName?: string;
}

/**
 * Grade Submission DTO for grading
 * Used when teacher grades a submission
 */
export interface GradeSubmissionDTO {
  grade: number;
  feedback?: string;
  version?: number;  // For optimistic locking
}

/**
 * Submission List DTO for listing submissions
 * Includes student information for teacher view
 */
export interface SubmissionListDTO {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  content?: string;
  filePath?: string;
  fileName?: string;
  grade?: number;
  feedback?: string;
  isLate: boolean;
  status: SubmissionStatus;
  submittedAt?: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
