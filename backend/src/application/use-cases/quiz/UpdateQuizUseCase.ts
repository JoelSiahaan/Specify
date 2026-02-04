/**
 * Update Quiz Use Case
 * 
 * Handles quiz updates with teacher ownership validation and edit restrictions.
 * Quizzes can only be edited before due date and before any submissions exist.
 * 
 * Requirements:
 * - 11.6: Editing only allowed before due date
 * - 11.7: Editing only allowed before any submissions
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
import { UpdateQuizDTO, QuizDTO } from '../../dtos/QuizDTO.js';
import { QuizMapper } from '../../mappers/QuizMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class UpdateQuizUseCase {
  constructor(
    @inject(PrismaQuizRepository) private quizRepository: IQuizRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute quiz update
   * 
   * @param quizId - ID of the quiz to update
   * @param dto - UpdateQuizDTO with updated quiz data
   * @param userId - ID of the user updating the quiz
   * @returns QuizDTO of the updated quiz
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if quiz not found
   * @throws ApplicationError if quiz cannot be edited (past due date or has submissions)
   * @throws ApplicationError if validation fails
   */
  async execute(quizId: string, dto: UpdateQuizDTO, userId: string): Promise<QuizDTO> {
    // Load user to check authorization
    const user = await this.loadUser(userId);

    // Load quiz
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Quiz not found',
        404
      );
    }

    // Load course to check authorization
    const course = await this.loadCourse(quiz.getCourseId());

    // Validate teacher ownership (Requirement 11.6, 11.7)
    if (!this.authPolicy.canManageAssignments(user, course)) {
      throw new ApplicationError(
        'NOT_OWNER',
        'You do not have permission to modify this quiz',
        403
      );
    }

    // Check if quiz has any submissions (Requirement 11.7)
    const hasSubmissions = await this.quizRepository.hasSubmissions(quizId);

    // Validate quiz can be edited (Requirements 11.6, 11.7)
    if (!quiz.canEdit(hasSubmissions)) {
      if (quiz.isPastDueDate()) {
        throw new ApplicationError(
          'RESOURCE_CLOSED',
          'Cannot update quiz after due date',
          400
        );
      }
      if (hasSubmissions) {
        throw new ApplicationError(
          'RESOURCE_CLOSED',
          'Cannot update quiz after submissions exist',
          400
        );
      }
    }

    // Validate update fields if provided
    this.validateUpdateFields(dto);

    // Apply updates to quiz entity (domain validation will run)
    QuizMapper.applyUpdate(quiz, dto, hasSubmissions);

    // Save updated quiz to repository
    const updatedQuiz = await this.quizRepository.update(quiz);

    // Return quiz DTO
    return QuizMapper.toDTO(updatedQuiz);
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
   * Validate update fields
   * 
   * @param dto - UpdateQuizDTO
   * @throws ApplicationError if validation fails
   * @private
   */
  private validateUpdateFields(dto: UpdateQuizDTO): void {
    // Validate title if provided
    if (dto.title !== undefined) {
      if (!dto.title || dto.title.trim().length === 0) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          'Quiz title cannot be empty',
          400
        );
      }
    }

    // Validate description if provided
    if (dto.description !== undefined) {
      if (!dto.description || dto.description.trim().length === 0) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          'Quiz description cannot be empty',
          400
        );
      }
    }

    // Validate due date if provided (Requirement 11.2)
    if (dto.dueDate !== undefined) {
      if (dto.dueDate <= new Date()) {
        throw new ApplicationError(
          'INVALID_DATE',
          'Quiz due date must be in the future',
          400
        );
      }
    }

    // Validate time limit if provided (Requirement 11.3)
    if (dto.timeLimit !== undefined) {
      if (!Number.isInteger(dto.timeLimit) || dto.timeLimit <= 0) {
        throw new ApplicationError(
          'INVALID_RANGE',
          'Quiz time limit must be a positive integer (in minutes)',
          400
        );
      }
    }

    // Validate questions if provided (Requirements 11.4, 11.5)
    if (dto.questions !== undefined) {
      this.validateQuestions(dto.questions);
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
