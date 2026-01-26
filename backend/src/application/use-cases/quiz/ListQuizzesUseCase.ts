/**
 * List Quizzes Use Case
 * 
 * Handles quiz listing with enrollment or ownership validation.
 * Students can view quizzes if enrolled in the course.
 * Teachers can view quizzes if they own the course.
 * Returns quizzes with submission status for students.
 * 
 * Requirements:
 * - 11.14: View all quizzes for a course
 */

import { injectable, inject } from 'tsyringe';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository';
import type { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User, Role } from '../../../domain/entities/User';
import { QuizSubmissionStatus } from '../../../domain/entities/QuizSubmission';
import { QuizListDTO } from '../../dtos/QuizDTO';
import { QuizMapper } from '../../mappers/QuizMapper';
import { ApplicationError } from '../../errors/ApplicationErrors';

/**
 * Quiz list item with submission status
 * Extends QuizListDTO with submission information for students
 */
export interface QuizWithSubmissionDTO extends QuizListDTO {
  /**
   * Whether the student has submitted this quiz
   * Only populated for students
   */
  hasSubmission?: boolean;
  
  /**
   * Submission ID if student has submitted
   * Only populated for students
   */
  submissionId?: string;
  
  /**
   * Whether the submission has been graded
   * Only populated for students who have submitted
   */
  isGraded?: boolean;
  
  /**
   * Grade if submission has been graded
   * Only populated for students with graded submissions
   */
  grade?: number;
  
  /**
   * Feedback if submission has been graded
   * Only populated for students with graded submissions
   */
  feedback?: string;
  
  /**
   * Whether the student has started but not submitted
   * Only populated for students with in-progress submissions
   */
  hasStarted?: boolean;
}

@injectable()
export class ListQuizzesUseCase {
  constructor(
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IQuizRepository') private quizRepository: IQuizRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IEnrollmentRepository') private enrollmentRepository: IEnrollmentRepository,
    @inject('IQuizSubmissionRepository') private quizSubmissionRepository: IQuizSubmissionRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute quiz listing
   * 
   * Business Rules:
   * - Students: Can view quizzes if enrolled in the course
   * - Teachers: Can view quizzes if they own the course
   * - Students see submission status (submitted, graded, grade)
   * - Teachers see all quizzes without submission status
   * - Quizzes are returned in creation order (oldest first)
   * 
   * @param courseId - ID of the course
   * @param userId - ID of the user requesting the list
   * @returns Array of QuizWithSubmissionDTO
   * @throws ApplicationError if user not found
   * @throws ApplicationError if course not found
   * @throws ApplicationError if user not authorized to view quizzes
   */
  async execute(courseId: string, userId: string): Promise<QuizWithSubmissionDTO[]> {
    // Load user and course for authorization
    const user = await this.loadUser(userId);
    const course = await this.loadCourse(courseId);

    // Check enrollment status for authorization context
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(userId, courseId);
    const isEnrolled = enrollment !== null;
    
    // Validate enrollment or ownership (Requirement 11.14)
    // Students must be enrolled, teachers must own the course
    if (!this.authPolicy.canViewAssignments(user, course, { isEnrolled })) {
      throw new ApplicationError(
        'FORBIDDEN_RESOURCE',
        'You do not have permission to view quizzes for this course',
        403
      );
    }

    // Get all quizzes for the course
    const quizzes = await this.quizRepository.findByCourseId(courseId);

    // Convert to DTOs
    const quizListDTOs = quizzes.map(quiz => QuizMapper.toListDTO(quiz));

    // If student, add submission status
    if (user.getRole() === Role.STUDENT) {
      return this.addSubmissionStatus(quizListDTOs, userId);
    }

    // Teachers see quizzes without submission status
    return quizListDTOs;
  }

  /**
   * Add submission status to quiz list for students
   * 
   * @param quizzes - Array of QuizListDTO
   * @param studentId - Student ID
   * @returns Array of QuizWithSubmissionDTO with submission status
   * @private
   */
  private async addSubmissionStatus(
    quizzes: QuizListDTO[],
    studentId: string
  ): Promise<QuizWithSubmissionDTO[]> {
    return Promise.all(
      quizzes.map(async (quiz) => {
        // Check if student has submitted this quiz
        const submission = await this.quizSubmissionRepository.findByQuizAndStudent(
          quiz.id,
          studentId
        );

        if (!submission) {
          // No submission yet
          return {
            ...quiz,
            hasSubmission: false,
            hasStarted: false
          };
        }

        // Check submission status
        const status = submission.getStatus();
        
        // If in progress (started but not submitted)
        if (status === QuizSubmissionStatus.IN_PROGRESS) {
          return {
            ...quiz,
            hasSubmission: false,
            hasStarted: true,
            submissionId: submission.getId()
          };
        }

        // If submitted or graded
        return {
          ...quiz,
          hasSubmission: true,
          hasStarted: false,
          submissionId: submission.getId(),
          isGraded: submission.isGraded(),
          grade: submission.getGrade() ?? undefined,
          feedback: submission.getFeedback() ?? undefined
        };
      })
    );
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
  private async loadCourse(courseId: string) {
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
