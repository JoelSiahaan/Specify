/**
 * IAssignmentRepository Interface (Port)
 * 
 * Repository interface for Assignment entity data access.
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

import { Assignment } from '../entities/Assignment.js';

export interface IAssignmentRepository {
  /**
   * Save an assignment entity (create or update)
   * 
   * @param assignment - Assignment entity to save
   * @returns Promise resolving to saved Assignment entity
   * @throws Error if save operation fails
   */
  save(assignment: Assignment): Promise<Assignment>;

  /**
   * Find an assignment by ID
   * 
   * @param id - Assignment ID (UUID)
   * @returns Promise resolving to Assignment entity or null if not found
   */
  findById(id: string): Promise<Assignment | null>;

  /**
   * Find all assignments by course ID
   * 
   * Requirements:
   * - 9.11: Allow teachers to view all assignments for a course
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Assignment entities
   */
  findByCourseId(courseId: string): Promise<Assignment[]>;

  /**
   * Update an assignment entity
   * 
   * Requirements:
   * - 9.8: Prevent editing after due date
   * - 9.9: Allow editing before due date
   * 
   * @param assignment - Assignment entity to update
   * @returns Promise resolving to updated Assignment entity
   * @throws Error if assignment not found or update operation fails
   */
  update(assignment: Assignment): Promise<Assignment>;

  /**
   * Delete an assignment by ID
   * 
   * Requirements:
   * - 9.10: Allow teachers to delete assignments at any time
   * 
   * @param id - Assignment ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if assignment not found or delete operation fails
   */
  delete(id: string): Promise<void>;

  /**
   * Find all assignments for a course with submission counts
   * 
   * Requirements:
   * - 14.1: Display all student submissions for an assignment
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Assignment entities with submission metadata
   */
  findByCourseIdWithSubmissionCounts(courseId: string): Promise<Assignment[]>;

  /**
   * Close all assignments for a course (set gradingStarted = true)
   * 
   * Requirements:
   * - 5.5: When course is archived, automatically close all assignments
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if operation fails
   */
  closeAllByCourseId(courseId: string): Promise<void>;
}
