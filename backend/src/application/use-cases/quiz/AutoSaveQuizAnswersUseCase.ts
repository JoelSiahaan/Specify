/**
 * Auto-Save Quiz Answers Use Case
 * 
 * Handles auto-saving quiz answers during quiz taking to prevent data loss.
 * Validates student ownership, quiz not expired, and submission is in progress.
 * 
 * Requirements:
 * - 12.4: Auto-save during quiz taking
 * - 12.5: Display remaining time
 */

import { injectable, inject } from 'tsyringe';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository.js';
import type { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { User } from '../../../domain/entities/User.js';
import { Quiz } from '../../../domain/entities/Quiz.js';
import { QuizSubmission } from '../../../domain/entities/QuizSubmission.js';
import { AutoSaveQuizDTO, QuizSubmissionDTO } from '../../dtos/QuizSubmissionDTO.js';
import { QuizSubmissionMapper } from '../../mappers/QuizSubmissionMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class AutoSaveQuizAnswersUseCase {
  constructor(
    @inject('IQuizRepository') private quizRepository: IQuizRepository,
    @inject('IQuizSubmissionRepository') private quizSubmissionRepository: IQuizSubmissionRepository,
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  /**
   * Execute auto-save quiz answers
   * 
   * Requirements:
   * - 12.4: Auto-save during quiz taking
   * - 12.5: Display remaining time
   * 
   * @param submissionId - ID of the quiz submission
   * @param userId - ID of the user (student)
   * @param dto - Auto-save data with answers
   * @returns Updated QuizSubmissionDTO
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if quiz time has expired
   * @throws ApplicationError if submission is not in progress
   */
  async execute(
    submissionId: string,
    userId: string,
    dto: AutoSaveQuizDTO
  ): Promise<QuizSubmissionDTO> {
    // Load user to validate authentication
    await this.loadUser(userId);

    // Load submission to validate ownership
    const submission = await this.loadSubmission(submissionId);

    // Validate student owns the submission
    if (submission.getStudentId() !== userId) {
      throw new ApplicationError(
        'FORBIDDEN_RESOURCE',
        'You do not have permission to modify this submission',
        403
      );
    }

    // Load quiz to check time limit
    const quiz = await this.loadQuiz(submission.getQuizId());

    // Requirement 12.4: Check if quiz time has expired
    if (submission.isTimeExpired(quiz.getTimeLimit())) {
      throw new ApplicationError(
        'RESOURCE_CLOSED',
        'Quiz time has expired. Answers cannot be saved.',
        400
      );
    }

    // Update answers in submission
    const answers = dto.answers.map(a => ({
      questionIndex: a.questionIndex,
      answer: a.answer
    }));

    submission.updateAnswers(answers);

    // Save updated submission
    const savedSubmission = await this.quizSubmissionRepository.save(submission);

    // Return updated submission DTO
    return QuizSubmissionMapper.toDTO(savedSubmission);
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
   * Load quiz submission from repository
   * 
   * @param submissionId - Submission ID
   * @returns QuizSubmission entity
   * @throws ApplicationError if submission not found
   * @private
   */
  private async loadSubmission(submissionId: string): Promise<QuizSubmission> {
    const submission = await this.quizSubmissionRepository.findById(submissionId);
    
    if (!submission) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Quiz submission not found',
        404
      );
    }
    
    return submission;
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
}
