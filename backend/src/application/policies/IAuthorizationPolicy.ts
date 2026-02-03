/**
 * Authorization Policy Interface
 * 
 * Defines authorization methods for access control decisions.
 * Policies are pure functions that receive data from Use Cases and return boolean decisions.
 * 
 * Design Principles:
 * - Pure functions: (user, resource, context) => boolean
 * - No repository dependencies (data provided by Use Cases)
 * - Stateless (no internal state)
 * - Testable (easy to unit test without mocks)
 * 
 * Requirements:
 * - 2.1: Role-based access control (Student vs Teacher)
 * - 2.2: Resource-based access control (ownership)
 * - 2.3: Enrollment-based access control
 * - 2.4: Authorization enforcement on all protected routes
 */

import { User } from '../../domain/entities/User.js';
import { Course } from '../../domain/entities/Course.js';

/**
 * Context for authorization decisions
 * Provides additional information needed for access control
 */
export interface AuthorizationContext {
  /**
   * Whether the user is enrolled in the course
   */
  isEnrolled?: boolean;

  /**
   * Whether the resource is owned by the user
   */
  isOwner?: boolean;

  /**
   * Additional context data
   */
  [key: string]: any;
}

/**
 * Authorization Policy Interface
 * 
 * Defines methods for making authorization decisions.
 * All methods are pure functions that return boolean decisions.
 */
export interface IAuthorizationPolicy {
  /**
   * Check if user can access course details
   * 
   * Rules:
   * - Students: Must be enrolled in the course
   * - Teachers: Must be the course owner
   * 
   * @param user - User attempting access
   * @param course - Course being accessed
   * @param context - Authorization context (enrollment status)
   * @returns true if authorized, false otherwise
   */
  canAccessCourse(user: User, course: Course, context: AuthorizationContext): boolean;

  /**
   * Check if user can modify course (update name, description)
   * 
   * Rules:
   * - Only teachers can modify courses
   * - Teacher must be the course owner
   * - Course must be active (not archived)
   * 
   * @param user - User attempting modification
   * @param course - Course being modified
   * @returns true if authorized, false otherwise
   */
  canModifyCourse(user: User, course: Course): boolean;

  /**
   * Check if user can archive course
   * 
   * Rules:
   * - Only teachers can archive courses
   * - Teacher must be the course owner
   * - Course must be active (not already archived)
   * 
   * @param user - User attempting to archive
   * @param course - Course being archived
   * @returns true if authorized, false otherwise
   */
  canArchiveCourse(user: User, course: Course): boolean;

  /**
   * Check if user can delete course
   * 
   * Rules:
   * - Only teachers can delete courses
   * - Teacher must be the course owner
   * - Course must be archived (not active)
   * 
   * @param user - User attempting deletion
   * @param course - Course being deleted
   * @returns true if authorized, false otherwise
   */
  canDeleteCourse(user: User, course: Course): boolean;

  /**
   * Check if user can create course
   * 
   * Rules:
   * - Only teachers can create courses
   * 
   * @param user - User attempting to create course
   * @returns true if authorized, false otherwise
   */
  canCreateCourse(user: User): boolean;

  /**
   * Check if user can enroll in course
   * 
   * Rules:
   * - Only students can enroll in courses
   * - Course must be active (not archived)
   * - Student must not already be enrolled
   * 
   * @param user - User attempting to enroll
   * @param course - Course being enrolled in
   * @param context - Authorization context (enrollment status)
   * @returns true if authorized, false otherwise
   */
  canEnrollInCourse(user: User, course: Course, context: AuthorizationContext): boolean;

  /**
   * Check if user can view course materials
   * 
   * Rules:
   * - Students: Must be enrolled in the course
   * - Teachers: Must be the course owner
   * 
   * @param user - User attempting to view materials
   * @param course - Course containing materials
   * @param context - Authorization context (enrollment status)
   * @returns true if authorized, false otherwise
   */
  canViewMaterials(user: User, course: Course, context: AuthorizationContext): boolean;

  /**
   * Check if user can manage materials (create, update, delete)
   * 
   * Rules:
   * - Only teachers can manage materials
   * - Teacher must be the course owner
   * 
   * @param user - User attempting to manage materials
   * @param course - Course containing materials
   * @returns true if authorized, false otherwise
   */
  canManageMaterials(user: User, course: Course): boolean;

  /**
   * Check if user can view assignments
   * 
   * Rules:
   * - Students: Must be enrolled in the course
   * - Teachers: Must be the course owner
   * 
   * @param user - User attempting to view assignments
   * @param course - Course containing assignments
   * @param context - Authorization context (enrollment status)
   * @returns true if authorized, false otherwise
   */
  canViewAssignments(user: User, course: Course, context: AuthorizationContext): boolean;

  /**
   * Check if user can manage assignments (create, update, delete)
   * 
   * Rules:
   * - Only teachers can manage assignments
   * - Teacher must be the course owner
   * 
   * @param user - User attempting to manage assignments
   * @param course - Course containing assignments
   * @returns true if authorized, false otherwise
   */
  canManageAssignments(user: User, course: Course): boolean;

  /**
   * Check if user can submit assignment
   * 
   * Rules:
   * - Only students can submit assignments
   * - Student must be enrolled in the course
   * 
   * @param user - User attempting to submit
   * @param course - Course containing assignment
   * @param context - Authorization context (enrollment status)
   * @returns true if authorized, false otherwise
   */
  canSubmitAssignment(user: User, course: Course, context: AuthorizationContext): boolean;

  /**
   * Check if user can grade submissions
   * 
   * Rules:
   * - Only teachers can grade submissions
   * - Teacher must be the course owner
   * 
   * @param user - User attempting to grade
   * @param course - Course containing submissions
   * @returns true if authorized, false otherwise
   */
  canGradeSubmissions(user: User, course: Course): boolean;

  /**
   * Check if user can view own submission
   * 
   * Rules:
   * - Students can view their own submissions
   * - Teachers can view all submissions in their courses
   * 
   * @param user - User attempting to view submission
   * @param submissionOwnerId - ID of the submission owner
   * @param course - Course containing submission
   * @returns true if authorized, false otherwise
   */
  canViewSubmission(user: User, submissionOwnerId: string, course: Course): boolean;

  /**
   * Check if user can export grades
   * 
   * Rules:
   * - Only teachers can export grades
   * - Teacher must be the course owner
   * 
   * @param user - User attempting to export grades
   * @param course - Course to export grades from
   * @returns true if authorized, false otherwise
   */
  canExportGrades(user: User, course: Course): boolean;

  /**
   * Check if user can view course progress
   * 
   * Rules:
   * - Students can view their own progress
   * - Teachers can view all student progress in their courses
   * 
   * @param user - User attempting to view progress
   * @param course - Course to view progress for
   * @param context - Authorization context (enrollment status)
   * @returns true if authorized, false otherwise
   */
  canViewProgress(user: User, course: Course, context: AuthorizationContext): boolean;
}
