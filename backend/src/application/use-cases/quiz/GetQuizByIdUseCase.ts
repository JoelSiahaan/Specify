/**
 * Get Quiz By ID Use Case
 * 
 * Retrieves a single quiz by ID with authorization check.
 * 
 * Requirements:
 * - 11.9: View all quizzes for a course
 */

import { injectable, inject } from 'tsyringe';
import type { IQuizRepository } from '../../../domain/repositories/IQuizRepository.js';
import { PrismaQuizRepository } from '../../../infrastructure/persistence/repositories/PrismaQuizRepository.js';
import type { ICourseRepository } from '../../../domain/repositories/ICourseRepository.js';
import { PrismaCourseRepository } from '../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import type { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.js';
import { PrismaEnrollmentRepository } from '../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository.js';
import type { IAuthorizationPolicy } from '../../policies/IAuthorizationPolicy.js';
import { AuthorizationPolicy } from '../../policies/AuthorizationPolicy.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { QuizDTO } from '../../dtos/QuizDTO.js';
import { QuizMapper } from '../../mappers/QuizMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class GetQuizByIdUseCase {
  constructor(
    @inject(PrismaQuizRepository) private quizRepository: IQuizRepository,
    @inject(PrismaCourseRepository) private courseRepository: ICourseRepository,
    @inject(PrismaEnrollmentRepository) private enrollmentRepository: IEnrollmentRepository,
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(AuthorizationPolicy) private authPolicy: IAuthorizationPolicy
  ) {}

  /**
   * Execute get quiz by ID
   * 
   * @param quizId - Quiz ID
   * @param userId - ID of the user requesting the quiz
   * @returns QuizDTO
   * @throws ApplicationError if quiz not found
   * @throws ApplicationError if user not authorized
   */
  async execute(quizId: string, userId: string): Promise<QuizDTO> {
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

    // Load user
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError(
        'AUTH_REQUIRED',
        'User not found',
        401
      );
    }

    // Check authorization: teacher owns course OR student is enrolled
    const isTeacher = this.authPolicy.canAccessCourse(user, course, { isEnrolled: false });
    
    if (!isTeacher) {
      // Check if student is enrolled
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
        userId,
        quiz.getCourseId()
      );
      
      if (!enrollment) {
        throw new ApplicationError(
          'NOT_ENROLLED',
          'You must be enrolled in this course to view quizzes',
          403
        );
      }
    }

    // Convert to DTO
    return QuizMapper.toDTO(quiz);
  }
}
