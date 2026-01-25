/**
 * Start Quiz Use Case
 * 
 * Handles starting a quiz attempt with student enrollment validation,
 * due date validation, and prevention of multiple attempts.
 * 
 * Requirements:
 * - 12.1: Display quiz info before starting
 * - 12.2: Start quiz and countdown timer
 * - 12.3: Display remaining time
 * - 12.9: Prevent multiple submissions
 */

import { injectable, inject } from 'tsyringe';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository';
import type { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy';
import { User } from '../../../domain/entities/User';
import { Course } from '../../../domain/entities/Course';
import { Quiz } from '../../../domain/entities/Quiz';
import { QuizSubmission, QuizSubmissionStatus } from '../../../domain/entities/QuizSubmission';
import { QuizAttemptDTO } from '../../dtos/QuizSubmissionDTO';
import { QuizSubmissionMapper } from '../../mappers/QuizSubmissionMapper';
import { ApplicationError } from '../../errors/ApplicationErrors';

@injectable()
export class StartQuizUseCase {
  constructor(
    @inject('IQuizRepository') private quizRepository: IQuizRepository,
    @inject('IQuizSubmissionRepository') private quizSubmissionRepository: IQuizSubmissionRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ICourseRepository') private courseRepository: ICourseRepository,
    @inject('IEnrollmentRepository') private enrollmentRepository: IEnrollmentRepository,
    @inject('IAuthorizationPolicy') private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute quiz start
   * 
   * Requirements:
   * - 12.1: Display quiz info before starting
   * - 12.2: Start quiz and countdown timer
   * - 12.3: Display remaining time
   * - 12.9: Prevent multiple submissions
   * 
   * @param quizId - ID of the quiz to start
   * @param userId - ID of the user starting the quiz
   * @returns QuizAttemptDTO with quiz details and timer information
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if quiz is past due date
   * @throws ApplicationError if user has already started/submitted quiz
   */
  async execute(quizId: string, userId: string): Promise<QuizAttemptDTO> {
    // Load user, quiz, and course to check authorization
    const user = await this.loadUser(userId);
    const quiz = await this.loadQuiz(quizId);
    const course = await this.loadCourse(quiz.getCourseId());

    // Check if student is enrolled in the course
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      userId,
      course.getId()
    );
    const isEnrolled = enrollment !== null;

    // Validate student enrollment and authorization
    if (!this.authPolicy.canSubmitAssignment(user, course, { isEnrolled })) {
      throw new ApplicationError(
        'NOT_ENROLLED',
        'You must be enrolled in the course to start this quiz',
        403
      );
    }

    // Requirement 12.6: Prevent access after due date
    if (quiz.isPastDueDate()) {
      throw new ApplicationError(
        'RESOURCE_CLOSED',
        'Cannot start quiz after due date',
        400
      );
    }

    // Requirement 12.9: Check for existing submission
    const existingSubmission = await this.quizSubmissionRepository.findByQuizAndStudent(
      quizId,
      userId
    );

    // If submission already exists
    if (existingSubmission) {
      // If already submitted, prevent re-entry (Requirement 12.7: prevent multiple submissions)
      if (
        existingSubmission.getStatus() === QuizSubmissionStatus.SUBMITTED ||
        existingSubmission.getStatus() === QuizSubmissionStatus.GRADED
      ) {
        throw new ApplicationError(
          'QUIZ_ALREADY_SUBMITTED',
          'You have already submitted this quiz',
          409
        );
      }

      // Check if time has expired on resume (Edge Case: Time expired during absence)
      if (existingSubmission.isTimeExpired(quiz.getTimeLimit())) {
        // Auto-submit the quiz with current answers
        existingSubmission.autoSubmit(quiz.getTimeLimit());
        const savedSubmission = await this.quizSubmissionRepository.save(existingSubmission);
        
        // Return special DTO indicating quiz was auto-submitted due to time expiration
        // Frontend will detect this and redirect to results page
        const attemptDTO = QuizSubmissionMapper.toAttemptDTO(savedSubmission, quiz);
        attemptDTO.timeExpired = true; // Flag to indicate auto-submit happened
        return attemptDTO;
      }

      // If started but not submitted, allow resume (Design: Browser Crash Recovery)
      // Return existing submission to resume quiz with saved answers
      return QuizSubmissionMapper.toAttemptDTO(existingSubmission, quiz);
    }

    // Create new quiz submission
    const submission = QuizSubmission.create(quizId, userId);

    // Start the quiz (sets startedAt timestamp and status to IN_PROGRESS)
    submission.start(quiz.getDueDate());

    // Save submission to repository
    const savedSubmission = await this.quizSubmissionRepository.save(submission);

    // Return quiz attempt DTO with questions (without correct answers for MCQ)
    return QuizSubmissionMapper.toAttemptDTO(savedSubmission, quiz);
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
   * Load quiz from repository
   * 
   * @param quizId - Quiz ID
   * @returns Quiz entity
   * @throws ApplicationError if quiz not found
   * @private
   */
  private async loadQuiz(quizId: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findById(quizId);
    
    if (!quiz) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Quiz not found',
        404
      );
    }
    
    return quiz;
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
