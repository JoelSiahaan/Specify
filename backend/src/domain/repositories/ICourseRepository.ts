/**
 * ICourseRepository Interface (Port)
 * 
 * Repository interface for Course entity data access.
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

import { Course } from '../entities/Course';

export interface ICourseRepository {
  /**
   * Save a course entity (create or update)
   * 
   * @param course - Course entity to save
   * @returns Promise resolving to saved Course entity
   * @throws Error if save operation fails
   */
  save(course: Course): Promise<Course>;

  /**
   * Find a course by ID
   * 
   * @param id - Course ID (UUID)
   * @returns Promise resolving to Course entity or null if not found
   */
  findById(id: string): Promise<Course | null>;

  /**
   * Find all courses by teacher ID
   * 
   * @param teacherId - Teacher ID (UUID)
   * @returns Promise resolving to array of Course entities
   */
  findByTeacherId(teacherId: string): Promise<Course[]>;

  /**
   * Find a course by course code
   * 
   * @param code - Course code (6-character alphanumeric)
   * @returns Promise resolving to Course entity or null if not found
   */
  findByCode(code: string): Promise<Course | null>;

  /**
   * Update a course entity
   * 
   * @param course - Course entity to update
   * @returns Promise resolving to updated Course entity
   * @throws Error if course not found or update operation fails
   */
  update(course: Course): Promise<Course>;

  /**
   * Delete a course by ID
   * 
   * Requirements:
   * - 5.6: Only archived courses can be deleted
   * - 5.7: Cascade delete all related data (materials, assignments, quizzes, submissions, enrollments)
   * 
   * @param id - Course ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if course not found or delete operation fails
   */
  delete(id: string): Promise<void>;

  /**
   * Find all courses (optionally filtered by status)
   * 
   * Requirements:
   * - 5.10: Allow teachers to view all their created courses
   * - 6.1: Students view active courses
   * 
   * @param status - Optional status filter (ACTIVE or ARCHIVED)
   * @returns Promise resolving to array of Course entities
   */
  findAll(status?: string): Promise<Course[]>;
}
