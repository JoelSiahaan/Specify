/**
 * List Assignments Use Case
 * 
 * Handles assignment listing with enrollment or ownership validation.
 * Students can view assignments if enrolled in the course (with submission status).
 * Teachers can view assignments if they own the course.
 * 
 * Requirements:
 * - 9.11: Allow teachers to view all assignments for a course
 * - 9.12: Calculate and display time remaining until due date
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IAssignmentRepository } from '../../../domain/repositories/IAssignmentRepository.js';
import { PrismaAssignmentRepository } from '../../../infrastructure/persistence/repositories/PrismaAssignmentRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import { PrismaEnrollmentRepository } from '../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository.js';
import type { IAssignmentSubmissionRepository } from '../../../domain/repositories/IAssignmentSubmissionRepository.js';
import { PrismaAssignmentSubmissionRepository } from '../../../infrastructure/persistence/repositories/PrismaAssignmentSubmissionRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { AuthorizationPolicy } from '../../policies/AuthorizationPolicy.js';
import { User } from '../../../domain/entities/User.js';
import { Course } from '../../../domain/entities/Course.js';
import { AssignmentListDTO } from '../../dtos/AssignmentDTO.js';
import { AssignmentMapper } from '../../mappers/AssignmentMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';
import { AssignmentSubmissionStatus } from '../../../domain/entities/AssignmentSubmission.js';

@injectable()
export class ListAssignmentsUseCase {
  constructor(
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(PrismaAssignmentRepository) private assignmentRepository: IAssignmentRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(PrismaEnrollmentRepository) private enrollmentRepository: IEnrollmentRepository,
    @inject(PrismaAssignmentSubmissionRepository) private assignmentSubmissionRepository: IAssignmentSubmissionRepository,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute assignment listing
   * 
   * Business Rules:
   * - Students: Can view assignments if enrolled in the course (with submission status)
   * - Teachers: Can view assignments if they own the course
   * - Assignments are returned in creation order (oldest first)
   * - For students, include submission status, grade, and late flag
   * 
   * @param courseId - ID of the course
   * @param userId - ID of the user requesting the list
   * @returns Array of AssignmentListDTO
   * @throws ApplicationError if user not found
   * @throws ApplicationError if course not found
   * @throws ApplicationError if user not authorized to view assignments
   */
  async execute(courseId: string, userId: string): Promise<AssignmentListDTO[]> {
    try {
      // Load user and course for authorization
      const user = await this.loadUser(userId);
      const course = await this.loadCourse(courseId);

      // Check enrollment status for authorization context
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse(userId, courseId);
      const isEnrolled = enrollment !== null;
      
      // Validate enrollment or ownership (Requirements 9.11)
      // Students must be enrolled, teachers must own the course
      if (!this.authPolicy.canViewAssignments(user, course, { isEnrolled })) {
        throw new ApplicationError(
          'FORBIDDEN_RESOURCE',
          'You do not have permission to view assignments for this course',
          403
        );
      }

      // Get all assignments for the course
      const assignments = await this.assignmentRepository.findByCourseId(courseId);

      // For students, get submission status for each assignment
      if (user.getRole() === 'STUDENT') {
        return await this.buildStudentAssignmentList(assignments, userId);
      }

      // For teachers, return assignments without submission status
      return AssignmentMapper.toListDTOList(assignments);
    } catch (error) {
      // Log error for debugging
      console.error('[ListAssignmentsUseCase] Error:', error);
      throw error;
    }
  }

  /**
   * Build assignment list for student with submission status
   * 
   * @param assignments - Array of Assignment entities
   * @param studentId - ID of the student
   * @returns Array of AssignmentListDTO with submission status
   * @private
   */
  private async buildStudentAssignmentList(
    assignments: any[],
    studentId: string
  ): Promise<AssignmentListDTO[]> {
    try {
      // Get all submissions for this student
      const submissions = await this.assignmentSubmissionRepository.findByStudentId(studentId);
      
      // Create maps for quick lookup
      const submissionStatusMap = new Map<string, AssignmentSubmissionStatus>();
      const gradeMap = new Map<string, number>();
      const feedbackMap = new Map<string, string>();
      const lateMap = new Map<string, boolean>();
      
      submissions.forEach(submission => {
        const assignmentId = submission.getAssignmentId();
        submissionStatusMap.set(assignmentId, submission.getStatus());
        
        const grade = submission.getGrade();
        if (grade !== null && grade !== undefined) {
          gradeMap.set(assignmentId, grade);
        }
        
        const feedback = submission.getFeedback();
        if (feedback !== null && feedback !== undefined) {
          feedbackMap.set(assignmentId, feedback);
        }
        
        lateMap.set(assignmentId, submission.getIsLate());
      });

      // Convert to DTOs with submission status
      return AssignmentMapper.toListDTOList(
        assignments,
        submissionStatusMap,
        gradeMap,
        feedbackMap,
        lateMap
      );
    } catch (error) {
      console.error('[ListAssignmentsUseCase] Error in buildStudentAssignmentList:', error);
      throw error;
    }
  }

  /**
   * Load user from repository
   * 
   * @param userId - User ID
   * @returns User entity
   * @throws ApplicationError if user not found
   * @private
   */
  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError(
        'AUTH_REQUIRED',
        'User not found',
        401
      );
    }
    
    return user;
  }

  /**
   * Load course from repository
   * 
   * @param courseId - Course ID
   * @returns Course entity
   * @throws ApplicationError if course not found
   * @private
   */
  private async loadCourse(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Course not found',
        404
      );
    }
    
    return course;
  }
}
