/**
 * Create Quiz Use Case
 * 
 * Handles quiz creation with teacher ownership validation, due date validation,
 * time limit validation, and question validation.
 * 
 * Requirements:
 * - 11.1: Create quiz with title, description, due date, and time limit
 * - 11.2: Due date must be in the future
 * - 11.3: Time limit must be positive integer
 * - 11.4: Questions (MCQ and Essay)
 * - 11.5: At least one question required
 */

import { injectable, inject } from 'tsyringe';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository.js';
import { PrismaQuizRepository } from '../../../infrastructure/persistence/repositories/PrismaQuizRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { AuthorizationPolicy } from '../../policies/AuthorizationPolicy.js';
import { User } from '../../../domain/entities/User.js';
import { Course } from '../../../domain/entities/Course.js';
import { CreateQuizDTO, QuizDTO } from '../../dtos/QuizDTO.js';
import { QuizMapper } from '../../mappers/QuizMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class CreateQuizUseCase {
  constructor(
    @inject(PrismaQuizRepository) private quizRepository: IQuizRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute quiz creation
   * 
   * @param dto - CreateQuizDTO with quiz data
   * @param courseId - ID of the course
   * @param userId - ID of the user creating the quiz
   * @returns QuizDTO of the created quiz
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if validation fails
   */
  async execute(dto: CreateQuizDTO, courseId: string, userId: string): Promise<QuizDTO> {
    // Load user and course to check authorization
    const user = await this.loadUser(userId);
    const course = await this.loadCourse(courseId);

    // Validate teacher ownership (Requirement 11.1)
    if (!this.authPolicy.canManageAssignments(user, course)) {
      throw new ApplicationError(
        'NOT_OWNER',
        'Only the course owner can create quizzes',
        403
      );
    }

    // Validate required fields
    this.validateRequiredFields(dto);

    // Validate due date is in the future (Requirement 11.2)
    this.validateDueDate(dto.dueDate);

    // Validate time limit is positive (Requirement 11.3)
    this.validateTimeLimit(dto.timeLimit);

    // Validate questions (Requirements 11.4, 11.5)
    this.validateQuestions(dto.questions);

    // Create quiz entity (domain validation will run)
    const quiz = QuizMapper.toDomain(dto, courseId);

    // Save quiz to repository
    const savedQuiz = await this.quizRepository.save(quiz);

    // Return quiz DTO
    return QuizMapper.toDTO(savedQuiz);
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

  /**
   * Validate required fields
   * 
   * @param dto - CreateQuizDTO
   * @throws ApplicationError if required fields are missing
   * @private
   */
  private validateRequiredFields(dto: CreateQuizDTO): void {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Quiz title is required',
        400
      );
    }

    if (!dto.description || dto.description.trim().length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Quiz description is required',
        400
      );
    }

    if (!dto.dueDate) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Quiz due date is required',
        400
      );
    }

    if (dto.timeLimit === undefined || dto.timeLimit === null) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Quiz time limit is required',
        400
      );
    }

    if (!dto.questions || dto.questions.length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Quiz must have at least one question',
        400
      );
    }
  }

  /**
   * Validate due date is in the future
   * 
   * Requirement 11.2: Due date must be in the future
   * 
   * @param dueDate - Due date to validate
   * @throws ApplicationError if due date is in the past
   * @private
   */
  private validateDueDate(dueDate: Date): void {
    if (dueDate <= new Date()) {
      throw new ApplicationError(
        'INVALID_DATE',
        'Quiz due date must be in the future',
        400
      );
    }
  }

  /**
   * Validate time limit is positive
   * 
   * Requirement 11.3: Time limit must be positive integer
   * 
   * @param timeLimit - Time limit to validate
   * @throws ApplicationError if time limit is invalid
   * @private
   */
  private validateTimeLimit(timeLimit: number): void {
    if (!Number.isInteger(timeLimit) || timeLimit <= 0) {
      throw new ApplicationError(
        'INVALID_RANGE',
        'Quiz time limit must be a positive integer (in minutes)',
        400
      );
    }
  }

  /**
   * Validate questions
   * 
   * Requirements:
   * - 11.4: MCQ must have at least 2 options
   * - 11.4: MCQ must have valid correctAnswer index
   * - 11.5: At least one question required
   * 
   * @param questions - Questions to validate
   * @throws ApplicationError if questions are invalid
   * @private
   */
  private validateQuestions(questions: any[]): void {
    if (!questions || questions.length === 0) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Quiz must have at least one question',
        400
      );
    }

    questions.forEach((question, index) => {
      // Validate question text
      if (!question.questionText || question.questionText.trim().length === 0) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          `Question ${index + 1}: Question text is required`,
          400
        );
      }

      // Validate MCQ questions
      if (question.type === 'MCQ') {
        // Requirement 11.4: MCQ must have at least 2 options
        if (!question.options || question.options.length < 2) {
          throw new ApplicationError(
            'VALIDATION_FAILED',
            `Question ${index + 1}: MCQ must have at least 2 options`,
            400
          );
        }

        // Requirement 11.4: MCQ must have valid correctAnswer index
        if (
          question.correctAnswer === undefined ||
          question.correctAnswer === null ||
          !Number.isInteger(question.correctAnswer) ||
          question.correctAnswer < 0 ||
          question.correctAnswer >= question.options.length
        ) {
          throw new ApplicationError(
            'VALIDATION_FAILED',
            `Question ${index + 1}: MCQ must have a valid correctAnswer index (0-${question.options.length - 1})`,
            400
          );
        }

        // Validate each option is not empty
        question.options.forEach((option: string, optionIndex: number) => {
          if (!option || option.trim().length === 0) {
            throw new ApplicationError(
              'VALIDATION_FAILED',
              `Question ${index + 1}, Option ${optionIndex + 1}: Option text is required`,
              400
            );
          }
        });
      }
    });
  }
}
