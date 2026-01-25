/**
 * ISubmissionRepository Interface (Port)
 * 
 * Repository interface for Submission entity data access.
 * This is a Port in Clean Architecture - defines the contract for data access
 * without specifying implementation details.
 * 
 * Requirements:
 * - 17.1: Data persistence abstraction
 * - 17.2: Repository pattern for data access
 * - 17.3: Domain layer independence from infrastructure
 * - 21.5: Handle concurrent user requests without data corruption (optimistic locking)
 * 
 * Implementation:
 * - Infrastructure layer provides concrete implementation (Adapter)
 * - Domain layer depends only on this interface (Dependency Inversion)
 */

import { Submission } from '../entities/Submission';

export interface ISubmissionRepository {
  /**
   * Save a submission entity (create or update)
   * 
   * Requirements:
   * - 10.6: Record submission timestamp
   * - 21.5: Optimistic locking for concurrent grading prevention
   * 
   * @param submission - Submission entity to save
   * @returns Promise resolving to saved Submission entity
   * @throws Error if save operation fails or version conflict (optimistic locking)
   */
  save(submission: Submission): Promise<Submission>;

  /**
   * Find a submission by ID
   * 
   * @param id - Submission ID (UUID)
   * @returns Promise resolving to Submission entity or null if not found
   */
  findById(id: string): Promise<Submission | null>;

  /**
   * Find a submission by assignment ID and student ID
   * 
   * Requirements:
   * - 10.12: Allow students to view their own submissions
   * 
   * @param assignmentId - Assignment ID (UUID)
   * @param studentId - Student ID (UUID)
   * @returns Promise resolving to Submission entity or null if not found
   */
  findByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<Submission | null>;

  /**
   * Find all submissions for an assignment
   * 
   * Requirements:
   * - 14.1: Display all student submissions for an assignment
   * - 14.2: Show submission status (not submitted, submitted, graded, late)
   * 
   * @param assignmentId - Assignment ID (UUID)
   * @returns Promise resolving to array of Submission entities
   */
  findByAssignmentId(assignmentId: string): Promise<Submission[]>;

  /**
   * Find all submissions by student ID
   * 
   * Requirements:
   * - 16.1: Display all assignments and quizzes with their status for a student
   * 
   * @param studentId - Student ID (UUID)
   * @returns Promise resolving to array of Submission entities
   */
  findByStudentId(studentId: string): Promise<Submission[]>;

  /**
   * Find all submissions for a course (across all assignments)
   * 
   * Requirements:
   * - 15.1: Generate CSV file with all student grades for a course
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Submission entities
   */
  findByCourseId(courseId: string): Promise<Submission[]>;

  /**
   * Update a submission entity with optimistic locking
   * 
   * Requirements:
   * - 13.5: Allow teachers to edit grades after saving
   * - 21.5: Optimistic locking for concurrent grading prevention
   * 
   * @param submission - Submission entity to update
   * @returns Promise resolving to updated Submission entity
   * @throws Error if submission not found, update operation fails, or version conflict
   */
  update(submission: Submission): Promise<Submission>;

  /**
   * Delete a submission by ID
   * 
   * @param id - Submission ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if submission not found or delete operation fails
   */
  delete(id: string): Promise<void>;

  /**
   * Count submissions for an assignment by status
   * 
   * Requirements:
   * - 14.5: Separate ungraded and graded submissions
   * 
   * @param assignmentId - Assignment ID (UUID)
   * @returns Promise resolving to object with counts by status
   */
  countByAssignmentIdAndStatus(assignmentId: string): Promise<{
    notSubmitted: number;
    submitted: number;
    graded: number;
  }>;

  /**
   * Find all graded submissions for a student in a course
   * 
   * Requirements:
   * - 16.7: Calculate and display average grade for the course
   * 
   * @param studentId - Student ID (UUID)
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of graded Submission entities
   */
  findGradedByStudentAndCourse(studentId: string, courseId: string): Promise<Submission[]>;
}
