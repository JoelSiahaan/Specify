/**
 * Assignment Types
 * 
 * TypeScript types for assignment-related data structures.
 * 
 * Note: SubmissionType and SubmissionStatus enums are defined in common.types.ts
 */

import type { SubmissionType, SubmissionStatus } from './common.types';

/**
 * Assignment entity
 */
export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
  submissionType: SubmissionType;
  acceptedFileFormats?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Create assignment request
 */
export interface CreateAssignmentRequest {
  title: string;
  description: string;
  dueDate: string;
  submissionType: SubmissionType;
  acceptedFileFormats?: string[];
}

/**
 * Update assignment request
 */
export interface UpdateAssignmentRequest {
  title: string;
  description: string;
  dueDate: string;
  submissionType: SubmissionType;
  acceptedFileFormats?: string[];
}

/**
 * List assignments response
 */
export interface ListAssignmentsResponse {
  data: Assignment[];
}

/**
 * Submission entity
 */
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  status: SubmissionStatus;
  isLate: boolean;
  filePath?: string;
  fileName?: string;
  textContent?: string;
  grade?: number;
  feedback?: string;
  version: number;  // For optimistic locking
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Submit assignment request
 */
export interface SubmitAssignmentRequest {
  submissionType: SubmissionType;
  file?: File;
  textContent?: string;
}

/**
 * List submissions response
 */
export interface ListSubmissionsResponse {
  data: Submission[];
}

/**
 * Assignment Submission List DTO (Teacher View)
 * Includes student information for teacher view
 */
export interface AssignmentSubmissionListDTO {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  textContent?: string;
  filePath?: string;
  fileName?: string;
  grade?: number;
  feedback?: string;
  isLate: boolean;
  status: SubmissionStatus;
  submittedAt?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Submission type labels
 */
export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  FILE: 'File Upload',
  TEXT: 'Text Submission',
  BOTH: 'File Upload and Text',
};

/**
 * Submission status labels
 */
export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  NOT_SUBMITTED: 'Not Submitted',
  SUBMITTED: 'Submitted',
  GRADED: 'Graded',
};

/**
 * Submission status colors
 */
export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  NOT_SUBMITTED: 'text-gray-600',
  SUBMITTED: 'text-blue-600',
  GRADED: 'text-green-600',
};
