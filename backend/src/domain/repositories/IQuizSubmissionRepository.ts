/**
 * IQuizSubmissionRepository Interface (Port)
 * 
 * Repository interface for QuizSubmission entity data access.
 * This is a Port in Clean Architecture - defines the contract for data access
 * without specifying implementation details.
 * 
 * Requirements:
 * - 17.1: Data persistence abstraction
 * - 17.2: Repository pattern for data access
 * - 17.3: Domain layer independence from infrastructure
 * 
 * Implementation:
 * - Infrastructure layer provides concrete implementation (Adapter)
 * - Domain layer depends only on this interface (Dependency Inversion)
 */

import { QuizSubmission } from '../entities/QuizSubmission.js';

export interface IQuizSubmissionRepository {
  /**
   * Save a quiz submission entity (create or update)
   * 
   * Requirements:
   * - 12.2: Start quiz and create submission record
   * - 12.5: Accept submission before time limit
   * - 12.4: Auto-submit when time expires
   * 
   * @param submission - QuizSubmission entity to save
   * @returns Promise resolving to saved QuizSubmission entity
   * @throws Error if save operation fails
   */
  save(submission: QuizSubmission): Promise<QuizSubmission>;

  /**
   * Find a quiz submission by ID
   * 
   * Requirements:
   * - 14.1: Display submission details for grading
   * 
   * @param id - QuizSubmission ID (UUID)
   * @returns Promise resolving to QuizSubmission entity or null if not found
   */
  findById(id: string): Promise<QuizSubmission | null>;

  /**
   * Find a quiz submission by quiz ID and student ID
   * 
   * Requirements:
   * - 12.7: Prevent multiple submissions (check if submission exists)
   * - 12.2: Check if student has already started quiz
   * 
   * @param quizId - Quiz ID (UUID)
   * @param studentId - Student ID (UUID)
   * @returns Promise resolving to QuizSubmission entity or null if not found
   */
  findByQuizAndStudent(quizId: string, studentId: string): Promise<QuizSubmission | null>;

  /**
   * Find all quiz submissions for a quiz
   * 
   * Requirements:
   * - 14.1: Display all student submissions for grading
   * 
   * @param quizId - Quiz ID (UUID)
   * @returns Promise resolving to array of QuizSubmission entities
   */
  findByQuizId(quizId: string): Promise<QuizSubmission[]>;

  /**
   * Find all quiz submissions for a student in a course
   * 
   * Requirements:
   * - 16.1: Display all quizzes with status for student progress
   * 
   * @param studentId - Student ID (UUID)
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of QuizSubmission entities
   */
  findByStudentAndCourse(studentId: string, courseId: string): Promise<QuizSubmission[]>;

  /**
   * Update a quiz submission entity
   * 
   * Requirements:
   * - 12.5: Update answers during quiz (auto-save)
   * - 13.4: Save grade with submission
   * - 13.5: Edit grades after saving
   * 
   * Note: Uses optimistic locking with version field to prevent concurrent updates
   * 
   * @param submission - QuizSubmission entity to update
   * @returns Promise resolving to updated QuizSubmission entity
   * @throws Error if submission not found, version mismatch, or update operation fails
   */
  update(submission: QuizSubmission): Promise<QuizSubmission>;

  /**
   * Delete a quiz submission by ID
   * 
   * Note: Quiz submissions are typically not deleted individually.
   * They are cascade deleted when the quiz or course is deleted.
   * 
   * @param id - QuizSubmission ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if submission not found or delete operation fails
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all quiz submissions for a quiz
   * 
   * Requirements:
   * - 11.13: Cascade delete when quiz is deleted
   * 
   * @param quizId - Quiz ID (UUID)
   * @returns Promise resolving to number of deleted submissions
   */
  deleteByQuizId(quizId: string): Promise<number>;

  /**
   * Delete all quiz submissions for a course
   * 
   * Requirements:
   * - 5.7: Cascade delete when course is deleted
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to number of deleted submissions
   */
  deleteByCourseId(courseId: string): Promise<number>;

  /**
   * Count quiz submissions for a quiz
   * 
   * Requirements:
   * - 11.10: Check if quiz has submissions (for edit validation)
   * 
   * @param quizId - Quiz ID (UUID)
   * @returns Promise resolving to number of submissions
   */
  countByQuizId(quizId: string): Promise<number>;
}
