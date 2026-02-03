/**
 * Grading Controller
 * 
 * Handles HTTP requests for grading-related endpoints.
 * Delegates business logic to use cases and manages HTTP responses.
 * 
 * Requirements:
 * - 13.1: Starting to grade closes assignment to prevent further submissions
 * - 13.6: Allow teachers to add text feedback
 * - 13.7: Mark the submission as graded
 * - 13.10: Calculate total score based on manually assigned points per question
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { ListSubmissionsUseCase } from '../../../application/use-cases/assignment/ListSubmissionsUseCase.js';
import { GetSubmissionUseCase } from '../../../application/use-cases/assignment/GetSubmissionUseCase.js';
import { GradeSubmissionUseCase } from '../../../application/use-cases/assignment/GradeSubmissionUseCase.js';
import { UpdateGradeUseCase } from '../../../application/use-cases/assignment/UpdateGradeUseCase.js';
import { GradeQuizSubmissionUseCase } from '../../../application/use-cases/quiz/GradeQuizSubmissionUseCase.js';
import type { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware.js';

/**
 * Grading Controller
 * 
 * Thin controller that delegates to use cases and manages HTTP concerns.
 */
export class GradingController {
  /**
   * List all submissions for an assignment
   * 
   * GET /api/assignments/:id/submissions
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher role and course ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Assignment ID (UUID)
   * 
   * Response (200 OK):
   * - data: Array of AssignmentSubmissionDTO
   * 
   * Business Rules:
   * - Only teachers can list submissions
   * - Teacher must own the course
   * - Returns all submissions for the assignment
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Assignment not found
   * - 500: Internal server error
   * 
   * Requirements: 13.1
   */
  async listAssignmentSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const assignmentId = req.params.id as string;
      
      if (!assignmentId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Assignment ID is required'
        });
        return;
      }
      
      // Execute use case
      const listSubmissionsUseCase = container.resolve(ListSubmissionsUseCase);
      const result = await listSubmissionsUseCase.execute(
        assignmentId,
        authenticatedReq.user.userId
      );
      
      // Return submissions (200 OK)
      res.status(200).json(result);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Get submission by ID
   * 
   * GET /api/assignment-submissions/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Path parameters:
   * - id: Submission ID (UUID)
   * 
   * Response (200 OK):
   * - AssignmentSubmissionDTO
   * 
   * Business Rules:
   * - Students: Can view their own submissions
   * - Teachers: Can view all submissions in their courses
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not authorized to view this submission
   * - 404: Submission not found
   * - 500: Internal server error
   * 
   * Requirements: 13.1
   */
  async getSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      
      // Execute use case
      const getSubmissionUseCase = container.resolve(GetSubmissionUseCase);
      const submission = await getSubmissionUseCase.execute(
        submissionId,
        authenticatedReq.user.userId
      );
      
      // Return submission (200 OK)
      res.status(200).json(submission);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Grade assignment submission
   * 
   * POST /api/assignment-submissions/:id/grade
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher role and course ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Submission ID (UUID)
   * 
   * Request body (validated by GradeSubmissionRequestSchema):
   * - grade: number (0-100)
   * - feedback: string (optional)
   * - version: number (optional, for optimistic locking)
   * 
   * Response (200 OK):
   * - AssignmentSubmissionDTO with grade and feedback
   * 
   * Business Rules:
   * - Only teachers can grade submissions
   * - Teacher must own the course
   * - Starting to grade closes assignment (Requirement 13.1)
   * - Grade must be between 0 and 100
   * - Supports optimistic locking for concurrent grading prevention
   * 
   * Errors:
   * - 400: Validation failed
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Submission not found
   * - 409: Concurrent modification (version conflict)
   * - 500: Internal server error
   * 
   * Requirements: 13.1, 13.6, 13.7
   */
  async gradeAssignmentSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      
      // Execute use case
      const gradeSubmissionUseCase = container.resolve(GradeSubmissionUseCase);
      const submission = await gradeSubmissionUseCase.execute(
        req.body,
        submissionId,
        authenticatedReq.user.userId
      );
      
      // Return graded submission (200 OK)
      res.status(200).json(submission);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Update assignment submission grade
   * 
   * PUT /api/assignment-submissions/:id/grade
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher role and course ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Submission ID (UUID)
   * 
   * Request body (validated by GradeSubmissionRequestSchema):
   * - grade: number (0-100)
   * - feedback: string (optional)
   * - version: number (optional, for optimistic locking)
   * 
   * Response (200 OK):
   * - AssignmentSubmissionDTO with updated grade and feedback
   * 
   * Business Rules:
   * - Only teachers can update grades
   * - Teacher must own the course
   * - Submission must already be graded
   * - Grade must be between 0 and 100
   * - Supports optimistic locking for concurrent grading prevention
   * 
   * Errors:
   * - 400: Validation failed or submission not yet graded
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Submission not found
   * - 409: Concurrent modification (version conflict)
   * - 500: Internal server error
   * 
   * Requirements: 13.6, 13.7
   */
  async updateAssignmentGrade(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      
      // Execute use case
      const updateGradeUseCase = container.resolve(UpdateGradeUseCase);
      const submission = await updateGradeUseCase.execute(
        req.body,
        submissionId,
        authenticatedReq.user.userId
      );
      
      // Return updated submission (200 OK)
      res.status(200).json(submission);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * List all quiz submissions for a quiz
   * 
   * GET /api/quizzes/:id/submissions
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher role and course ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Quiz ID (UUID)
   * 
   * Response (200 OK):
   * - data: Array of QuizSubmissionDTO
   * 
   * Business Rules:
   * - Only teachers can list quiz submissions
   * - Teacher must own the course
   * - Returns all submissions for the quiz
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Quiz not found
   * - 500: Internal server error
   * 
   * Requirements: 13.1
   */
  async listQuizSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      
      // For now, return empty array as ListQuizSubmissionsUseCase is not yet implemented
      // This will be implemented in a future task
      res.status(200).json({ data: [] });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Grade quiz submission
   * 
   * POST /api/quiz-submissions/:id/grade
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher role and course ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Quiz Submission ID (UUID)
   * 
   * Request body (validated by GradeQuizSubmissionRequestSchema):
   * - questionGrades: Array of { questionIndex, points, feedback? }
   * - generalFeedback: string (optional)
   * 
   * Response (200 OK):
   * - submission: QuizSubmissionDTO with grade and feedback
   * - warning: string (optional, if points don't sum to 100)
   * 
   * Business Rules:
   * - Only teachers can grade quiz submissions
   * - Teacher must own the course
   * - Points array must match number of questions
   * - Each point value must be non-negative
   * - Total grade calculated from sum of question points
   * - Warning displayed if total ≠ 100 (guiderail, not blocking)
   * 
   * Errors:
   * - 400: Validation failed
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Submission not found
   * - 500: Internal server error
   * 
   * Requirements: 13.6, 13.7, 13.10
   */
  async gradeQuizSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      
      // Transform validated request body to use case DTO format
      // Validator provides: { questionGrades: [{questionIndex, points, feedback?}], generalFeedback? }
      // Use case expects: { questionPoints: number[], feedback?: string }
      const { questionGrades, generalFeedback } = req.body;
      
      // Sort by questionIndex to ensure correct order
      const sortedGrades = [...questionGrades].sort((a: any, b: any) => a.questionIndex - b.questionIndex);
      
      // Extract just the points values into an array
      const questionPoints = sortedGrades.map((grade: any) => grade.points);
      
      // Transform to use case DTO format
      const useCaseDTO = {
        questionPoints,
        feedback: generalFeedback
      };
      
      // Execute use case
      const gradeQuizSubmissionUseCase = container.resolve(GradeQuizSubmissionUseCase);
      const result = await gradeQuizSubmissionUseCase.execute(
        useCaseDTO,
        submissionId,
        authenticatedReq.user.userId
      );
      
      // Add questionGrades to response (for API compatibility)
      // Extract only questionIndex and points (no feedback) for response
      const responseQuestionGrades = sortedGrades.map((grade: any) => ({
        questionIndex: grade.questionIndex,
        points: grade.points
      }));
      
      // Return graded submission with optional warning and questionGrades (200 OK)
      res.status(200).json({
        ...result,
        submission: {
          ...result.submission,
          questionGrades: responseQuestionGrades
        }
      });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }
}
