/**
 * Get Quiz Submission Details Use Case
 * 
 * Retrieves detailed information about a quiz submission.
 * Accessible by the student who owns the submission or the course teacher.
 * 
 * Requirements:
 * - 14.1: View submission details
 * - 17.1: Students view their own submission
 */

import { injectable, inject } from 'tsyringe';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository.js';
import { PrismaQuizRepository } from '../../../infrastructure/persistence/repositories/PrismaQuizRepository.js';
import type { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository.js';
import { PrismaQuizSubmissionRepository } from '../../../infrastructure/persistence/repositories/PrismaQuizSubmissionRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import { QuizSubmissionDTO } from '../../dtos/QuizSubmissionDTO.js';
import { QuizSubmissionMapper } from '../../mappers/QuizSubmissionMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class GetQuizSubmissionDetailsUseCase {
  constructor(
    @inject(PrismaQuizRepository) private quizRepository: IQuizRepository,
    @inject(PrismaQuizSubmissionRepository) private quizSubmissionRepository: IQuizSubmissionRepository,
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository
  ) {}

  /**
   * Execute get quiz submission details
   * 
   * Requirements:
   * - 14.1: View submission details
   * - 17.1: Students view their own submission
   * 
   * @param submissionId - Submission ID
   * @param userId - ID of the user (teacher or student)
   * @returns QuizSubmissionDTO
   * @throws ApplicationError if submission not found
   * @throws ApplicationError if user not authorized
   */
  async execute(submissionId: string, userId: string): Promise<QuizSubmissionDTO> {
    // Load submission
    const submission = await this.quizSubmissionRepository.findById(submissionId);
    
    if (!submission) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Submission not found',
        404
      );
    }

    // Load quiz to get course ID
    const quiz = await this.quizRepository.findById(submission.getQuizId());
    
    if (!quiz) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Quiz not found',
        404
      );
    }

    // Load course to check authorization
    const course = await this.courseRepository.findById(quiz.getCourseId());
    
    if (!course) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Course not found',
        404
      );
    }

    // Check authorization: teacher owns course OR student owns submission
    const isTeacher = course.getTeacherId() === userId;
    const isStudent = submission.getStudentId() === userId;
    
    if (!isTeacher && !isStudent) {
      throw new ApplicationError(
        'NOT_AUTHORIZED',
        'You do not have permission to view this submission',
        403
      );
    }

    // Convert to DTO
    return QuizSubmissionMapper.toDTO(submission);
  }
}
