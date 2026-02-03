/**
 * Authorization Policy Implementation
 * 
 * Implements authorization logic for access control decisions.
 * All methods are pure functions that receive data from Use Cases and return boolean decisions.
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

import { injectable } from 'tsyringe';
import { IAuthorizationPolicy, AuthorizationContext } from './IAuthorizationPolicy.js';
import { User } from '../../domain/entities/User.js';
import { Course } from '../../domain/entities/Course.js';

@injectable()
export class AuthorizationPolicy implements IAuthorizationPolicy {
  /**
   * Check if user can access course details
   * 
   * Rules:
   * - Students: Must be enrolled in the course
   * - Teachers: Must be the course owner
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership), 2.3 (enrollment)
   */
  canAccessCourse(user: User, course: Course, context: AuthorizationContext): boolean {
    // Requirement 2.1: Role-based check
    if (user.isTeacher()) {
      // Requirement 2.2: Teachers can only access their own courses
      return course.getTeacherId() === user.getId();
    }

    if (user.isStudent()) {
      // Requirement 2.3: Students must be enrolled
      return context.isEnrolled === true;
    }

    return false;
  }

  /**
   * Check if user can modify course (update name, description)
   * 
   * Rules:
   * - Only teachers can modify courses
   * - Teacher must be the course owner
   * - Course must be active (not archived)
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership)
   */
  canModifyCourse(user: User, course: Course): boolean {
    // Requirement 2.1: Only teachers can modify courses
    if (!user.isTeacher()) {
      return false;
    }

    // Requirement 2.2: Teacher must be the course owner
    if (course.getTeacherId() !== user.getId()) {
      return false;
    }

    // Course must be active (not archived)
    if (!course.isActive()) {
      return false;
    }

    return true;
  }

  /**
   * Check if user can archive course
   * 
   * Rules:
   * - Only teachers can archive courses
   * - Teacher must be the course owner
   * - Course must be active (not already archived)
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership)
   */
  canArchiveCourse(user: User, course: Course): boolean {
    // Requirement 2.1: Only teachers can archive courses
    if (!user.isTeacher()) {
      return false;
    }

    // Requirement 2.2: Teacher must be the course owner
    if (course.getTeacherId() !== user.getId()) {
      return false;
    }

    // Course must be active (not already archived)
    if (!course.isActive()) {
      return false;
    }

    return true;
  }

  /**
   * Check if user can delete course
   * 
   * Rules:
   * - Only teachers can delete courses
   * - Teacher must be the course owner
   * 
   * Note: Business logic (course must be archived) is checked in the use case,
   * not in the authorization policy.
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership)
   */
  canDeleteCourse(user: User, course: Course): boolean {
    // Requirement 2.1: Only teachers can delete courses
    if (!user.isTeacher()) {
      return false;
    }

    // Requirement 2.2: Teacher must be the course owner
    if (course.getTeacherId() !== user.getId()) {
      return false;
    }

    return true;
  }

  /**
   * Check if user can create course
   * 
   * Rules:
   * - Only teachers can create courses
   * 
   * Requirements: 2.1 (role-based)
   */
  canCreateCourse(user: User): boolean {
    // Requirement 2.1: Only teachers can create courses
    return user.isTeacher();
  }

  /**
   * Check if user can enroll in course
   * 
   * Rules:
   * - Only students can enroll in courses
   * - Course must be active (not archived)
   * - Student must not already be enrolled
   * 
   * Requirements: 2.1 (role-based), 2.3 (enrollment)
   */
  canEnrollInCourse(user: User, course: Course, context: AuthorizationContext): boolean {
    // Requirement 2.1: Only students can enroll
    if (!user.isStudent()) {
      return false;
    }

    // Course must be active
    if (!course.isActive()) {
      return false;
    }

    // Requirement 2.3: Student must not already be enrolled
    if (context.isEnrolled === true) {
      return false;
    }

    return true;
  }

  /**
   * Check if user can view course materials
   * 
   * Rules:
   * - Students: Must be enrolled in the course
   * - Teachers: Must be the course owner
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership), 2.3 (enrollment)
   */
  canViewMaterials(user: User, course: Course, context: AuthorizationContext): boolean {
    // Requirement 2.1: Role-based check
    if (user.isTeacher()) {
      // Requirement 2.2: Teachers can only view materials in their own courses
      return course.getTeacherId() === user.getId();
    }

    if (user.isStudent()) {
      // Requirement 2.3: Students must be enrolled
      return context.isEnrolled === true;
    }

    return false;
  }

  /**
   * Check if user can manage materials (create, update, delete)
   * 
   * Rules:
   * - Only teachers can manage materials
   * - Teacher must be the course owner
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership)
   */
  canManageMaterials(user: User, course: Course): boolean {
    // Requirement 2.1: Only teachers can manage materials
    if (!user.isTeacher()) {
      return false;
    }

    // Requirement 2.2: Teacher must be the course owner
    return course.getTeacherId() === user.getId();
  }

  /**
   * Check if user can view assignments
   * 
   * Rules:
   * - Students: Must be enrolled in the course
   * - Teachers: Must be the course owner
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership), 2.3 (enrollment)
   */
  canViewAssignments(user: User, course: Course, context: AuthorizationContext): boolean {
    // Requirement 2.1: Role-based check
    if (user.isTeacher()) {
      // Requirement 2.2: Teachers can only view assignments in their own courses
      return course.getTeacherId() === user.getId();
    }

    if (user.isStudent()) {
      // Requirement 2.3: Students must be enrolled
      return context.isEnrolled === true;
    }

    return false;
  }

  /**
   * Check if user can manage assignments (create, update, delete)
   * 
   * Rules:
   * - Only teachers can manage assignments
   * - Teacher must be the course owner
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership)
   */
  canManageAssignments(user: User, course: Course): boolean {
    // Requirement 2.1: Only teachers can manage assignments
    if (!user.isTeacher()) {
      return false;
    }

    // Requirement 2.2: Teacher must be the course owner
    return course.getTeacherId() === user.getId();
  }

  /**
   * Check if user can submit assignment
   * 
   * Rules:
   * - Only students can submit assignments
   * - Student must be enrolled in the course
   * 
   * Requirements: 2.1 (role-based), 2.3 (enrollment)
   */
  canSubmitAssignment(user: User, _course: Course, context: AuthorizationContext): boolean {
    // Requirement 2.1: Only students can submit assignments
    if (!user.isStudent()) {
      return false;
    }

    // Requirement 2.3: Student must be enrolled
    return context.isEnrolled === true;
  }

  /**
   * Check if user can grade submissions
   * 
   * Rules:
   * - Only teachers can grade submissions
   * - Teacher must be the course owner
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership)
   */
  canGradeSubmissions(user: User, course: Course): boolean {
    // Requirement 2.1: Only teachers can grade submissions
    if (!user.isTeacher()) {
      return false;
    }

    // Requirement 2.2: Teacher must be the course owner
    return course.getTeacherId() === user.getId();
  }

  /**
   * Check if user can view own submission
   * 
   * Rules:
   * - Students can view their own submissions
   * - Teachers can view all submissions in their courses
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership)
   */
  canViewSubmission(user: User, submissionOwnerId: string, course: Course): boolean {
    // Requirement 2.1: Role-based check
    if (user.isTeacher()) {
      // Requirement 2.2: Teachers can view all submissions in their courses
      return course.getTeacherId() === user.getId();
    }

    if (user.isStudent()) {
      // Students can only view their own submissions
      return submissionOwnerId === user.getId();
    }

    return false;
  }

  /**
   * Check if user can export grades
   * 
   * Rules:
   * - Only teachers can export grades
   * - Teacher must be the course owner
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership)
   */
  canExportGrades(user: User, course: Course): boolean {
    // Requirement 2.1: Only teachers can export grades
    if (!user.isTeacher()) {
      return false;
    }

    // Requirement 2.2: Teacher must be the course owner
    return course.getTeacherId() === user.getId();
  }

  /**
   * Check if user can view course progress
   * 
   * Rules:
   * - Students can view their own progress
   * - Teachers can view all student progress in their courses
   * 
   * Requirements: 2.1 (role-based), 2.2 (ownership), 2.3 (enrollment)
   */
  canViewProgress(user: User, course: Course, context: AuthorizationContext): boolean {
    // Requirement 2.1: Role-based check
    if (user.isTeacher()) {
      // Requirement 2.2: Teachers can view all progress in their courses
      return course.getTeacherId() === user.getId();
    }

    if (user.isStudent()) {
      // Requirement 2.3: Students must be enrolled to view their progress
      return context.isEnrolled === true;
    }

    return false;
  }
}
