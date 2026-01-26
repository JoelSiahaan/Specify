/**
 * Export Data Transfer Objects (DTOs)
 * 
 * DTOs for grade export functionality.
 * These objects are used for generating CSV exports.
 * 
 * Requirements:
 * - 18.4: Structured data transfer between layers
 * - 15.1: Generate CSV file with all student grades
 * - 15.2: Include student name, email, assignment/quiz name, grade, submission date
 * - 15.3: Include average grade per student
 * - 15.4: Allow teachers to download exported file
 * - 15.5: Include both graded and ungraded items (showing "Not Submitted" or "Pending")
 */

/**
 * Grade Export Row DTO
 * Represents a single row in the grade export CSV
 */
export interface GradeExportRowDTO {
  studentName: string;
  studentEmail: string;
  itemType: 'Assignment' | 'Quiz';
  itemName: string;
  grade: string;  // Number or "Not Submitted" or "Pending"
  submissionDate: string;  // ISO date string or empty
  status: string;  // "Graded", "Submitted", "Not Submitted", "Late"
}

/**
 * Student Grade Summary DTO
 * Contains summary information for a student's grades
 */
export interface StudentGradeSummaryDTO {
  studentId: string;
  studentName: string;
  studentEmail: string;
  averageGrade?: number;  // undefined if no graded items
  totalGradedItems: number;
  totalItems: number;
}

/**
 * Grade Export DTO
 * Contains all data needed for CSV export
 */
export interface GradeExportDTO {
  courseId: string;
  courseName: string;
  exportDate: Date;
  rows: GradeExportRowDTO[];
  studentSummaries: StudentGradeSummaryDTO[];
}

