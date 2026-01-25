/**
 * IQuizRepository Interface (Port)
 * 
 * Repository interface for Quiz entity data access.
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

import { Quiz } from '../entities/Quiz';

export interface IQuizRepository {
  /**
   * Save a quiz entity (create or update)
   * 
   * Requirements:
   * - 11.1: Store quiz with title, description, due date, and time limit
   * - 11.4: Store MCQ and essay questions
   * 
   * @param quiz - Quiz entity to save
   * @returns Promise resolving to saved Quiz entity
   * @throws Error if save operation fails
   */
  save(quiz: Quiz): Promise<Quiz>;

  /**
   * Find a quiz by ID
   * 
   * Requirements:
   * - 12.1: Display quiz info before starting
   * - 11.14: View all quizzes for a course
   * 
   * @param id - Quiz ID (UUID)
   * @returns Promise resolving to Quiz entity or null if not found
   */
  findById(id: string): Promise<Quiz | null>;

  /**
   * Find all quizzes for a course
   * 
   * Requirements:
   * - 11.14: View all quizzes for a course
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Quiz entities
   */
  findByCourseId(courseId: string): Promise<Quiz[]>;

  /**
   * Update a quiz entity
   * 
   * Requirements:
   * - 11.12: Edit quizzes before due date and before any submissions
   * 
   * @param quiz - Quiz entity to update
   * @returns Promise resolving to updated Quiz entity
   * @throws Error if quiz not found or update operation fails
   */
  update(quiz: Quiz): Promise<Quiz>;

  /**
   * Delete a quiz by ID
   * 
   * Requirements:
   * - 11.13: Delete entire quizzes at any time
   * 
   * Note: Cascade deletion of quiz submissions is handled by database constraints
   * 
   * @param id - Quiz ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if quiz not found or delete operation fails
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all quizzes for a course
   * 
   * Requirements:
   * - 5.7: Cascade delete when course is deleted
   * 
   * Note: Cascade deletion of quiz submissions is handled by database constraints
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to number of deleted quizzes
   */
  deleteByCourseId(courseId: string): Promise<number>;

  /**
   * Check if a quiz has any submissions
   * 
   * Requirements:
   * - 11.10: Prevent editing or deleting questions when quiz has submissions
   * 
   * @param quizId - Quiz ID (UUID)
   * @returns Promise resolving to true if quiz has submissions, false otherwise
   */
  hasSubmissions(quizId: string): Promise<boolean>;
}
