/**
 * Submit Quiz Use Case
 * 
 * Handles submitting a quiz with validation for student ownership,
 * quiz not expired, and submission before due date.
 * 
 * Requirements:
 * - 12.5: Accept submission before time limit
 * - 12.6: Prevent submission after due date
 * - 12.7: Prevent multiple submissions
 * - 12.10: Save final answers and set submittedAt timestamp
 */

import { injectable, inject } from 'tsyringe';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository';
import type { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { Quiz } from '../../../domain/entities/Quiz';
import { QuizSubmission } from '../../../domain/entities/QuizSubmission';
import { SubmitQuizDTO, QuizSubmissionDTO } from '../../dtos/QuizSubmissionDTO';
import { QuizSubmissionMapper } from '../../mappers/QuizSubmissionMapper';
import { ApplicationError } from '../../errors/ApplicationErrors';

@injectable()
export class SubmitQuizUseCase {
  constructor(
    @inject('IQuizRepository') private quizRepository: IQuizRepository,
    @inject('IQuizSubmissionRepository') private quizSubmissionRepository: IQuizSubmissionRepository,
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  /**
   * Execute quiz submission
   * 
   * Requirements:
   * - 12.5: Accept submission before time limit
   * - 12.6: Prevent submission after due date
   * - 12.7: Prevent multiple submissions
   * - 12.10: Save final answers and set submittedAt timestamp
   * 
   * @param submissionId - ID of the quiz submission
   * @param userId - ID of the user (student)
   * @param dto - Submit quiz data with final answers
   * @returns QuizSubmissionDTO with submitted status
   * @throws ApplicationError if user is not authorized
   * @throws ApplicationError if quiz time has expired
   * @throws ApplicationError if quiz is past due date
   * @throws ApplicationError if submission is not in progress
   */
  async execute(
    submissionId: string,
    userId: string,
    dto: SubmitQuizDTO
  ): Promise<QuizSubmissionDTO> {
    // Load user to validate authentication
    await this.loadUser(userId);

    // Load submission to validate ownership
    const submission = await this.loadSubmission(submissionId);

    // Requirement 12.7: Validate student owns the submission
    if (submission.getStudentId() !== userId) {
      throw new ApplicationError(
        'FORBIDDEN_RESOURCE',
        'You do not have permission to submit this quiz',
        403
      );
    }

    // Load quiz to check time limit and due date
    const quiz = await this.loadQuiz(submission.getQuizId());

    // Requirement 12.6: Prevent submission after due date
    if (quiz.isPastDueDate()) {
      throw new ApplicationError(
        'RESOURCE_CLOSED',
        'Cannot submit quiz after due date',
        400
      );
    }

    // Requirement 12.5: Check if quiz time has expired
    if (submission.isTimeExpired(quiz.getTimeLimit())) {
      throw new ApplicationError(
        'RESOURCE_CLOSED',
        'Quiz time has expired. The quiz has been auto-submitted.',
        400
      );
    }

    // Prepare answers from DTO
    const answers = dto.answers.map(a => ({
      questionIndex: a.questionIndex,
      answer: a.answer
    }));

    // Requirement 12.10: Submit quiz with final answers and set submittedAt timestamp
    submission.submit(answers, quiz.getTimeLimit(), false);

    // Save submitted submission
    const savedSubmission = await this.quizSubmissionRepository.save(submission);

    // Return submission DTO
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
