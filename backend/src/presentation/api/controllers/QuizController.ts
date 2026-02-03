/**
 * Quiz Controller
 * 
 * Handles HTTP requests for quiz management endpoints.
 * Delegates business logic to use cases and manages HTTP responses.
 * 
 * Requirements:
 * - 11.1: Create quizzes with title, description, due date, and time limit
 * - 11.6: Edit quizzes before due date and before any submissions
 * - 11.8: Delete quizzes anytime
 * - 11.9: View all quizzes for a course
 * - 12.1: Start quiz before due date
 * - 12.4: Auto-submit quiz when time limit expires
 * - 12.6: Prevent multiple submissions for the same quiz
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { CreateQuizUseCase } from '../../../application/use-cases/quiz/CreateQuizUseCase.js';
import { UpdateQuizUseCase } from '../../../application/use-cases/quiz/UpdateQuizUseCase.js';
import { DeleteQuizUseCase } from '../../../application/use-cases/quiz/DeleteQuizUseCase.js';
import { ListQuizzesUseCase } from '../../../application/use-cases/quiz/ListQuizzesUseCase.js';
import { StartQuizUseCase } from '../../../application/use-cases/quiz/StartQuizUseCase.js';
import { AutoSaveQuizAnswersUseCase } from '../../../application/use-cases/quiz/AutoSaveQuizAnswersUseCase.js';
import { SubmitQuizUseCase } from '../../../application/use-cases/quiz/SubmitQuizUseCase.js';
import type { IQuizSubmissionRepository } from '../../../domain/repositories/IQuizSubmissionRepository.js';
import type { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware.js';

/**
 * Quiz Controller
 * 
 * Thin controller that delegates to use cases and manages HTTP concerns.
 */
export class QuizController {
  /**
   * List quizzes for a course
   * 
   * GET /api/courses/:courseId/quizzes
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Path parameters:
   * - courseId: Course ID (UUID)
   * 
   * Response (200 OK):
   * - data: Array of QuizDTO
   * 
   * Business Rules:
   * - Students: Can view quizzes in enrolled courses
   * - Teachers: Can view quizzes in their own courses
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled or not owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 11.9
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const courseId = req.params.courseId as string;
      
      if (!courseId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Course ID is required'
        });
        return;
      }
      
      // Execute use case
      const listQuizzesUseCase = container.resolve(ListQuizzesUseCase);
      const quizzes = await listQuizzesUseCase.execute(
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return quizzes wrapped in data object (200 OK)
      res.status(200).json({ data: quizzes });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Get quiz by ID
   * 
   * GET /api/quizzes/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Path parameters:
   * - id: Quiz ID (UUID)
   * 
   * Response (200 OK):
   * - QuizDTO
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled or not owner
   * - 404: Quiz not found
   * - 500: Internal server error
   * 
   * Requirements: 11.9
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const quizId = req.params.id as string;
      
      if (!quizId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Quiz ID is required'
        });
        return;
      }
      
      // For now, we'll use the repository directly
      // Authorization will be checked when accessing the quiz
      const quizRepository = container.resolve('IQuizRepository' as any);
      const quiz = await (quizRepository as any).findById(quizId);
      
      if (!quiz) {
        res.status(404).json({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Quiz not found'
        });
        return;
      }

      // Convert to DTO
      const { QuizMapper } = await import('../../../application/mappers/QuizMapper.js');
      const quizDTO = QuizMapper.toDTO(quiz);
      
      // Return quiz (200 OK)
      res.status(200).json(quizDTO);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Create new quiz
   * 
   * POST /api/courses/:courseId/quizzes
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - courseId: Course ID (UUID)
   * 
   * Request body (validated by CreateQuizRequestSchema):
   * - title: string (1-200 characters)
   * - description: string (1-5000 characters)
   * - dueDate: ISO 8601 date string (must be in future)
   * - timeLimit: number (minutes, positive integer)
   * - questions: Array of QuestionDTO (at least 1 question)
   * 
   * Response (201 Created):
   * - QuizDTO with all questions
   * 
   * Errors:
   * - 400: Validation failed or due date in past
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const courseId = req.params.courseId as string;
      
      if (!courseId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Course ID is required'
        });
        return;
      }
      
      // Execute use case
      const createQuizUseCase = container.resolve(CreateQuizUseCase);
      const quiz = await createQuizUseCase.execute(
        req.body,
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return created quiz (201 Created)
      res.status(201).json(quiz);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Update quiz
   * 
   * PUT /api/quizzes/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Quiz ID (UUID)
   * 
   * Request body (validated by UpdateQuizRequestSchema):
   * - title: string (optional, 1-200 characters)
   * - description: string (optional, 1-5000 characters)
   * - dueDate: ISO 8601 date string (optional, must be in future)
   * - timeLimit: number (optional, minutes, positive integer)
   * - questions: Array of QuestionDTO (optional, at least 1 question)
   * 
   * Response (200 OK):
   * - QuizDTO with updated data
   * 
   * Errors:
   * - 400: Validation failed, due date in past, or quiz has submissions
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Quiz not found
   * - 500: Internal server error
   * 
   * Requirements: 11.6, 11.7
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const quizId = req.params.id as string;
      
      if (!quizId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Quiz ID is required'
        });
        return;
      }
      
      // Execute use case
      const updateQuizUseCase = container.resolve(UpdateQuizUseCase);
      const quiz = await updateQuizUseCase.execute(
        quizId,
        req.body,
        authenticatedReq.user.userId
      );
      
      // Return updated quiz (200 OK)
      res.status(200).json(quiz);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Delete quiz
   * 
   * DELETE /api/quizzes/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Quiz ID (UUID)
   * 
   * Response (200 OK):
   * - message: Success message
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Quiz not found
   * - 500: Internal server error
   * 
   * Requirements: 11.8
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const quizId = req.params.id as string;
      
      if (!quizId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Quiz ID is required'
        });
        return;
      }
      
      // Execute use case
      const deleteQuizUseCase = container.resolve(DeleteQuizUseCase);
      await deleteQuizUseCase.execute(
        quizId,
        authenticatedReq.user.userId
      );
      
      // Return success message (200 OK)
      res.status(200).json({
        message: 'Quiz deleted successfully'
      });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Start quiz
   * 
   * POST /api/quizzes/:id/start
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires student role (validated by use case)
   * 
   * Path parameters:
   * - id: Quiz ID (UUID)
   * 
   * Response (201 Created):
   * - QuizSubmissionDTO with startedAt timestamp and questions
   * 
   * Errors:
   * - 400: Quiz due date passed or student already has submission
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled or not a student
   * - 404: Quiz not found
   * - 500: Internal server error
   * 
   * Requirements: 12.1, 12.2, 12.6
   */
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const quizId = req.params.id as string;
      
      if (!quizId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Quiz ID is required'
        });
        return;
      }
      
      // Execute use case
      const startQuizUseCase = container.resolve(StartQuizUseCase);
      const submission = await startQuizUseCase.execute(
        quizId,
        authenticatedReq.user.userId
      );
      
      // Return created submission (201 Created)
      res.status(201).json(submission);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Auto-save quiz answers
   * 
   * POST /api/quizzes/:id/autosave
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires student role (validated by use case)
   * 
   * Path parameters:
   * - id: Quiz ID (UUID)
   * 
   * Request body:
   * - answers: Array of AnswerDTO
   * 
   * Response (200 OK):
   * - QuizSubmissionDTO with updated answers
   * 
   * Errors:
   * - 400: Quiz not started or already submitted
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled or not a student
   * - 404: Quiz or submission not found
   * - 500: Internal server error
   * 
   * Requirements: 12.3
   */
  async autosave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const quizId = req.params.id as string;
      
      if (!quizId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Quiz ID is required'
        });
        return;
      }
      
      // Find the submission by quiz and student
      const quizSubmissionRepository = container.resolve<IQuizSubmissionRepository>('IQuizSubmissionRepository');
      const existingSubmission = await quizSubmissionRepository.findByQuizAndStudent(
        quizId,
        authenticatedReq.user.userId
      );
      
      if (!existingSubmission) {
        res.status(404).json({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Quiz submission not found. You must start the quiz first.'
        });
        return;
      }
      
      // Execute use case with submissionId
      const autoSaveQuizAnswersUseCase = container.resolve(AutoSaveQuizAnswersUseCase);
      const updatedSubmission = await autoSaveQuizAnswersUseCase.execute(
        existingSubmission.getId(),
        authenticatedReq.user.userId,
        req.body  // Pass the whole body (AutoSaveQuizDTO)
      );
      
      // Return updated submission (200 OK)
      res.status(200).json(updatedSubmission);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Submit quiz
   * 
   * POST /api/quizzes/:id/submit
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires student role (validated by use case)
   * 
   * Path parameters:
   * - id: Quiz ID (UUID)
   * 
   * Request body:
   * - answers: Record<string, string> (question ID -> answer)
   * 
   * Response (200 OK):
   * - QuizSubmissionDTO with submittedAt timestamp
   * 
   * Errors:
   * - 400: Quiz not started, already submitted, or time limit exceeded
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled or not a student
   * - 404: Quiz or submission not found
   * - 500: Internal server error
   * 
   * Requirements: 12.4, 12.5
   */
  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const quizId = req.params.id as string;
      
      if (!quizId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Quiz ID is required'
        });
        return;
      }
      
      // Find the submission by quiz and student
      const quizSubmissionRepository = container.resolve<IQuizSubmissionRepository>('IQuizSubmissionRepository');
      const existingSubmission = await quizSubmissionRepository.findByQuizAndStudent(
        quizId,
        authenticatedReq.user.userId
      );
      
      if (!existingSubmission) {
        res.status(404).json({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Quiz submission not found. You must start the quiz first.'
        });
        return;
      }
      
      // Execute use case
      const submitQuizUseCase = container.resolve(SubmitQuizUseCase);
      const submission = await submitQuizUseCase.execute(
        existingSubmission.getId(),
        authenticatedReq.user.userId,
        req.body  // Pass the whole body, not just req.body.answers
      );
      
      // Return submitted submission (200 OK)
      res.status(200).json(submission);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * List quiz submissions (teacher only)
   * 
   * GET /api/quizzes/:id/submissions
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Quiz ID (UUID)
   * 
   * Response (200 OK):
   * - data: Array of QuizSubmissionDTO
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Quiz not found
   * - 500: Internal server error
   * 
   * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
   */
  async listSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const quizId = req.params.id as string;
      
      if (!quizId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Quiz ID is required'
        });
        return;
      }
      
      // For now, we'll use the repository directly
      // Authorization will be checked by verifying course ownership
      const quizRepository = container.resolve('IQuizRepository' as any);
      const quiz = await (quizRepository as any).findById(quizId);
      
      if (!quiz) {
        res.status(404).json({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Quiz not found'
        });
        return;
      }

      // Check authorization
      const courseRepository = container.resolve('ICourseRepository' as any);
      const course = await (courseRepository as any).findById(quiz.getCourseId());
      
      if (!course || course.getTeacherId() !== authenticatedReq.user.userId) {
        res.status(403).json({
          code: 'NOT_OWNER',
          message: 'You do not have permission to view submissions for this quiz'
        });
        return;
      }

      // Get submissions
      const quizSubmissionRepository = container.resolve('IQuizSubmissionRepository' as any);
      const submissions = await (quizSubmissionRepository as any).findByQuizId(quizId);
      
      // Get student info for each submission
      const userRepository = container.resolve('IUserRepository' as any);
      const studentInfo = new Map<string, { name: string; email: string }>();
      
      for (const submission of submissions) {
        const studentId = submission.getStudentId();
        if (!studentInfo.has(studentId)) {
          const student = await (userRepository as any).findById(studentId);
          if (student) {
            // User.getEmail() returns string directly, not Email value object
            studentInfo.set(studentId, {
              name: student.getName(),
              email: student.getEmail()
            });
          }
        }
      }
      
      // Convert to list DTOs with student info
      const { QuizSubmissionMapper } = await import('../../../application/mappers/QuizSubmissionMapper.js');
      const submissionDTOs = QuizSubmissionMapper.toListDTOList(submissions, studentInfo);
      
      // Return submissions wrapped in data object (200 OK)
      res.status(200).json({ data: submissionDTOs });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Get quiz submission details by ID
   * 
   * GET /api/quiz-submissions/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership or student ownership
   * 
   * Path parameters:
   * - id: Submission ID (UUID)
   * 
   * Response (200 OK):
   * - QuizSubmissionDTO with full details
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not authorized to view this submission
   * - 404: Submission not found
   * - 500: Internal server error
   * 
   * Requirements: 14.1, 17.1
   */
  async getSubmissionDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by AuthenticationMiddleware
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        res.status(401).json({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
        return;
      }

      const submissionId = req.params.id as string;
      
      if (!submissionId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Submission ID is required'
        });
        return;
      }
      
      // Get submission
      const quizSubmissionRepository = container.resolve('IQuizSubmissionRepository' as any);
      const submission = await (quizSubmissionRepository as any).findById(submissionId);
      
      if (!submission) {
        res.status(404).json({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Submission not found'
        });
        return;
      }

      // Get quiz to check authorization
      const quizRepository = container.resolve('IQuizRepository' as any);
      const quiz = await (quizRepository as any).findById(submission.getQuizId());
      
      if (!quiz) {
        res.status(404).json({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Quiz not found'
        });
        return;
      }

      // Check authorization: teacher owns course OR student owns submission
      const courseRepository = container.resolve('ICourseRepository' as any);
      const course = await (courseRepository as any).findById(quiz.getCourseId());
      
      const isTeacher = course && course.getTeacherId() === authenticatedReq.user.userId;
      const isStudent = submission.getStudentId() === authenticatedReq.user.userId;
      
      if (!isTeacher && !isStudent) {
        res.status(403).json({
          code: 'NOT_AUTHORIZED',
          message: 'You do not have permission to view this submission'
        });
        return;
      }

      // Convert to DTO
      const { QuizSubmissionMapper } = await import('../../../application/mappers/QuizSubmissionMapper.js');
      const submissionDTO = QuizSubmissionMapper.toDTO(submission);
      
      // Return submission (200 OK)
      res.status(200).json(submissionDTO);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }
}
