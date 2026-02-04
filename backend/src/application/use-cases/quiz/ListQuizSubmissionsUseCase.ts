/**
 * List Quiz Submissions Use Case
 * 
 * Lists all submissions for a quiz with student information.
 * Only accessible by the course teacher.
 * 
 * Requirements:
 * - 14.1: View all quiz submissions
 * - 14.2: View student name and email
 * - 14.3: View submission status
 * - 14.4: View submission date
 * - 14.5: View grade if graded
 */

import { injectable, inject } from 'tsyringe';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository.js';
import { PrismaQuizRepository } from '../../../infrastructure/persistence/repositories/PrismaQuizRepository.js';
import type { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository.js';
import { PrismaQuizSubmissionRepository } from '../../../infrastructure/persistence/repositories/PrismaQuizSubmissionRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { QuizSubmissionListDTO } from '../../dtos/QuizSubmissionDTO.js';
import { QuizSubmissionMapper } from '../../mappers/QuizSubmissionMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class ListQuizSubmissionsUseCase {
  constructor(
    @inject(PrismaQuizRepository) private quizRepository: IQuizRepository,
    @inject(PrismaQuizSubmissionRepository) private quizSubmissionRepository: IQuizSubmissionRepository,
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository
  ) {}

  /**
   * Execute list quiz submissions
   * 
   * Requirements:
   * - 14.1: View all quiz submissions
   * - 14.2: View student name and email
   * - 14.3: View submission status
   * - 14.4: View submission date
   * - 14.5: View grade if graded
   * 
   * @param quizId - Quiz ID
   * @param userId - ID of the user (teacher)
   * @returns Array of QuizSubmissionListDTO
   * @throws ApplicationError if quiz not found
   * @throws ApplicationError if user not authorized
   */
  async execute(quizId: string, userId: string): Promise<{ data: QuizSubmissionListDTO[] }> {
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
    const course = await this.courseRepository.findById(quiz.getCourseId());
    
    if (!course) {
      throw new ApplicationError(
        'RESOURCE_NOT_FOUND',
        'Course not found',
        404
      );
    }

    // Check authorization: only course teacher can view submissions
    if (course.getTeacherId() !== userId) {
      throw new ApplicationError(
        'NOT_OWNER',
        'You do not have permission to view submissions for this quiz',
        403
      );
    }

    // Get all submissions for the quiz
    const submissions = await this.quizSubmissionRepository.findByQuizId(quizId);
    
    // Get student info for each submission
    const studentInfo = new Map<string, { name: string; email: string }>();
    
    for (const submission of submissions) {
      const studentId = submission.getStudentId();
      if (!studentInfo.has(studentId)) {
        const student = await this.userRepository.findById(studentId);
        if (student) {
          studentInfo.set(studentId, {
            name: student.getName(),
            email: student.getEmail()
          });
        }
      }
    }
    
    // Convert to list DTOs with student info
    const submissionDTOs = QuizSubmissionMapper.toListDTOList(submissions, studentInfo);
    
    // Return submissions wrapped in data object
    return { data: submissionDTOs };
  }
}
