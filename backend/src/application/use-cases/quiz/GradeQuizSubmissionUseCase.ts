/**
 * Grade Quiz Submission Use Case
 * 
 * Handles grading of quiz submissions with teacher authorization validation,
 * manual point assignment per question, and warning for inconsistent totals.
 * 
 * Requirements:
 * - 13.7: Mark the submission as graded
 * - 13.8: Allow teachers to manually assign points per question
 * - 13.9: Display warning if sum of assigned points does not equal 100
 * - 13.3: Validate grade is between 0 and 100
 * - 13.4: Store grade with submission
 * - 13.5: Allow teachers to edit grades after saving
 * - 13.6: Allow teachers to add text feedback
 */

import { injectable, inject } from 'tsyringe';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository';
import type { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { Course } from '../../../domain/entities/Course';
import { Quiz } from '../../../domain/entities/Quiz';
import { QuizSubmission } from '../../../domain/entities/QuizSubmission';
import { QuizSubmissionDTO } from '../../dtos/QuizSubmissionDTO';
import { QuizSubmissionMapper } from '../../mappers/QuizSubmissionMapper';
import { ApplicationError, NotFoundError, ForbiddenError } from '../../errors/ApplicationErrors';

/**
 * DTO for grading quiz submission with per-question points
 * 
 * Requirements:
 * - 13.8: Allow teachers to manually assign points per question
 */
export interface GradeQuizSubmissionDTO {
  questionPoints: number[];  // Points assigned per question (array index = question index)
  feedback?: string;         // Optional feedback
}

/**
 * Response DTO with grading warning
 * 
 * Requirements:
 * - 13.9: Display warning if sum of assigned points does not equal 100
 */
export interface GradeQuizSubmissionResponseDTO {
  submission: QuizSubmissionDTO;
  warning?: string;  // Warning message if points don't sum to 100
}

@injectable()
export class GradeQuizSubmissionUseCase {
  constructor(
    @inject('IQuizRepository') private quizRepository: IQuizRepository,
    @inject('IQuizSubmissionRepository') private submissionRepository: IQuizSubmissionRepository,
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute quiz submission grading
   * 
   * Requirements:
   * - 13.7: Mark submission as graded
   * - 13.8: Manually assign points per question
   * - 13.9: Warn if total points ≠ 100 (guiderail, not blocking)
   * - 13.3: Validate grade is between 0 and 100
   * - 13.4: Store grade with submission
   * - 13.5: Support grade updates
   * - 13.6: Store feedback
   * 
   * @param dto - GradeQuizSubmissionDTO with per-question points and feedback
   * @param submissionId - ID of the submission being graded
   * @param userId - ID of the teacher grading the submission
   * @returns GradeQuizSubmissionResponseDTO with graded submission and optional warning
   * @throws NotFoundError if user, submission, quiz, or course not found
   * @throws ForbiddenError if user is not authorized
   * @throws ApplicationError if validation fails
   */
  async execute(
    dto: GradeQuizSubmissionDTO,
    submissionId: string,
    userId: string
  ): Promise<GradeQuizSubmissionResponseDTO> {
    // Load entities
    const user = await this.loadUser(userId);
    const submission = await this.loadSubmission(submissionId);
    const quiz = await this.loadQuiz(submission.getQuizId());
    const course = await this.loadCourse(quiz.getCourseId());

    // Validate teacher authorization
    this.validateTeacherAuthorization(user, course);

    // Validate question points array
    this.validateQuestionPoints(dto.questionPoints, quiz);

    // Calculate total grade from question points (Requirement 13.8)
    const totalGrade = this.calculateTotalGrade(dto.questionPoints);

    // Validate total grade is within range (Requirement 13.3)
    this.validateGrade(totalGrade);

    // Check if points sum to 100 and generate warning if not (Requirement 13.9)
    const warning = this.checkPointsSum(dto.questionPoints);

    // Grade the submission (Requirement 13.4, 13.5, 13.6, 13.7)
    if (submission.isGraded()) {
      // Update existing grade (Requirement 13.5)
      submission.updateGrade(totalGrade, dto.feedback);
    } else {
      // Assign new grade (Requirement 13.4, 13.7)
      submission.setGrade(totalGrade, dto.feedback);
    }

    // Save graded submission
    const gradedSubmission = await this.submissionRepository.update(submission);

    // Return graded submission with warning (if any)
    return {
      submission: QuizSubmissionMapper.toDTO(gradedSubmission),
      warning
    };
  }

  /**
   * Load user from repository
   * 
   * @param userId - User ID
   * @returns User entity
   * @throws NotFoundError if user not found
   * @private
   */
  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError(
        'USER_NOT_FOUND',
        'User not found'
      );
    }
    
    return user;
  }

  /**
   * Load submission from repository
   * 
   * @param submissionId - Submission ID
   * @returns QuizSubmission entity
   * @throws NotFoundError if submission not found
   * @private
   */
  private async loadSubmission(submissionId: string): Promise<QuizSubmission> {
    const submission = await this.submissionRepository.findById(submissionId);
    
    if (!submission) {
      throw new NotFoundError(
        'RESOURCE_NOT_FOUND',
        'Submission not found'
      );
    }
    
    return submission;
  }

  /**
   * Load quiz from repository
   * 
   * @param quizId - Quiz ID
   * @returns Quiz entity
   * @throws NotFoundError if quiz not found
   * @private
   */
  private async loadQuiz(quizId: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findById(quizId);
    
    if (!quiz) {
      throw new NotFoundError(
        'RESOURCE_NOT_FOUND',
        'Quiz not found'
      );
    }
    
    return quiz;
  }

  /**
   * Load course from repository
   * 
   * @param courseId - Course ID
   * @returns Course entity
   * @throws NotFoundError if course not found
   * @private
   */
  private async loadCourse(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new NotFoundError(
        'RESOURCE_NOT_FOUND',
        'Course not found'
      );
    }
    
    return course;
  }

  /**
   * Validate teacher authorization
   * 
   * Requirements:
   * - 13.1: Only teachers can grade submissions
   * - 2.2: Teacher must be the course owner
   * 
   * @param user - User entity
   * @param course - Course entity
   * @throws ForbiddenError if user is not authorized
   * @private
   */
  private validateTeacherAuthorization(user: User, course: Course): void {
    if (!this.authPolicy.canGradeSubmissions(user, course)) {
      throw new ForbiddenError(
        'NOT_OWNER',
        'You do not have permission to grade submissions in this course'
      );
    }
  }

  /**
   * Validate question points array
   * 
   * Requirements:
   * - 13.8: Validate points array matches quiz questions
   * 
   * @param questionPoints - Array of points per question
   * @param quiz - Quiz entity
   * @throws ApplicationError if validation fails
   * @private
   */
  private validateQuestionPoints(questionPoints: number[], quiz: Quiz): void {
    if (!Array.isArray(questionPoints)) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Question points must be an array',
        400
      );
    }

    const questionCount = quiz.getQuestions().length;
    
    if (questionPoints.length !== questionCount) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        `Question points array must have ${questionCount} elements (one per question)`,
        400
      );
    }

    // Validate each point value is a non-negative number
    questionPoints.forEach((points, index) => {
      if (typeof points !== 'number' || isNaN(points)) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          `Question ${index + 1}: Points must be a valid number`,
          400
        );
      }

      if (points < 0) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          `Question ${index + 1}: Points cannot be negative`,
          400
        );
      }
    });
  }

  /**
   * Calculate total grade from question points
   * 
   * Requirements:
   * - 13.8: Calculate total score based on manually assigned points per question
   * 
   * @param questionPoints - Array of points per question
   * @returns Total grade (sum of all question points)
   * @private
   */
  private calculateTotalGrade(questionPoints: number[]): number {
    return questionPoints.reduce((sum, points) => sum + points, 0);
  }

  /**
   * Validate total grade value
   * 
   * Requirements:
   * - 13.3: Validate grade is between 0 and 100
   * 
   * @param grade - Total grade value
   * @throws ApplicationError if grade is invalid
   * @private
   */
  private validateGrade(grade: number): void {
    if (grade < 0 || grade > 100) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Total grade must be between 0 and 100',
        400
      );
    }
  }

  /**
   * Check if question points sum to 100 and generate warning
   * 
   * Requirements:
   * - 13.9: Display warning if sum of assigned points does not equal 100
   * 
   * Note: This is a guiderail, not a blocking validation.
   * Teachers can still save grades that don't sum to 100.
   * 
   * @param questionPoints - Array of points per question
   * @returns Warning message if points don't sum to 100, undefined otherwise
   * @private
   */
  private checkPointsSum(questionPoints: number[]): string | undefined {
    const total = this.calculateTotalGrade(questionPoints);
    
    if (total !== 100) {
      return `Warning: The total points (${total}) do not equal 100. Please verify the point distribution.`;
    }
    
    return undefined;
  }
}
