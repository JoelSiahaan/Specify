/**
 * Get Quiz Submission By Quiz And Student Use Case
 * 
 * Retrieves a quiz submission by quiz ID and student ID.
 * Used to find existing submission before autosave or submit operations.
 * 
 * Requirements:
 * - 12.3: Auto-save quiz answers
 * - 12.4: Submit quiz
 */

import { injectable, inject } from 'tsyringe';
import type { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository.js';
import { PrismaQuizSubmissionRepository } from '../../../infrastructure/persistence/repositories/PrismaQuizSubmissionRepository.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class GetQuizSubmissionByQuizAndStudentUseCase {
  constructor(
    @inject(PrismaQuizSubmissionRepository) private quizSubmissionRepository: IQuizSubmissionRepository
  ) {}

  /**
   * Execute get quiz submission by quiz and student
   * 
   * @param quizId - Quiz ID
   * @param studentId - Student ID
   * @returns Submission ID
   * @throws ApplicationError if submission not found
   */
  async execute(quizId: string, studentId: string): Promise<string> {
    // Find submission by quiz and student
    const submission = await this.quizSubmissionRepository.findByQuizAndStudent(
      quizId,
      studentId
    );
    
    if (!submission) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Quiz submission not found. You must start the quiz first.',
        404
      );
    }
    
    // Return submission ID
    return submission.getId();
  }
}
