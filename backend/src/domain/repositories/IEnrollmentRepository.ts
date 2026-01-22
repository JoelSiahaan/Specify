/**
 * IEnrollmentRepository Interface (Port)
 * 
 * Repository interface for Enrollment entity data access.
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

import { Enrollment } from '../entities/Enrollment';

export interface IEnrollmentRepository {
  /**
   * Save an enrollment entity (create or update)
   * 
   * Requirements:
   * - 6.5: Enroll student in course
   * 
   * @param enrollment - Enrollment entity to save
   * @returns Promise resolving to saved Enrollment entity
   * @throws Error if save operation fails
   */
  save(enrollment: Enrollment): Promise<Enrollment>;

  /**
   * Find an enrollment by student ID and course ID
   * 
   * Requirements:
   * - 6.8: Prevent duplicate enrollment (check if enrollment exists)
   * 
   * Used to check if a student is already enrolled in a course.
   * 
   * @param studentId - Student ID (UUID)
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to Enrollment entity or null if not found
   */
  findByStudentAndCourse(studentId: string, courseId: string): Promise<Enrollment | null>;

  /**
   * Find all enrollments for a course
   * 
   * Requirements:
   * - 5.10: View enrollment counts for courses
   * - 5.8: Bulk unenroll students from archived courses
   * 
   * Used to get all students enrolled in a course.
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to array of Enrollment entities
   */
  findByCourse(courseId: string): Promise<Enrollment[]>;

  /**
   * Find all enrollments for a student
   * 
   * Requirements:
   * - 3.1: Students view enrolled courses on dashboard
   * 
   * Used to get all courses a student is enrolled in.
   * 
   * @param studentId - Student ID (UUID)
   * @returns Promise resolving to array of Enrollment entities
   */
  findByStudentId(studentId: string): Promise<Enrollment[]>;

  /**
   * Delete all enrollments for a course
   * 
   * Requirements:
   * - 5.7: Cascade delete enrollments when course is deleted
   * - 5.8: Bulk unenroll students from archived courses
   * 
   * Used when deleting a course or bulk unenrolling students.
   * 
   * @param courseId - Course ID (UUID)
   * @returns Promise resolving to void
   * @throws Error if delete operation fails
   */
  deleteAllByCourse(courseId: string): Promise<void>;
}
