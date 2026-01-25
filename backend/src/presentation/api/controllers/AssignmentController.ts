/**
 * Assignment Controller
 * 
 * Handles HTTP requests for assignment management endpoints.
 * Delegates business logic to use cases and manages HTTP responses.
 * Uses Multer for file upload handling.
 * 
 * Requirements:
 * - 9.1: Create assignment with title, description, and due date
 * - 9.8: Prevent editing after due date
 * - 9.10: Allow teachers to delete assignments at any time
 * - 9.11: Allow teachers to view all assignments for a course
 * - 10.1: Allow file upload for assignments
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import multer from 'multer';
import { CreateAssignmentUseCase } from '../../../application/use-cases/assignment/CreateAssignmentUseCase';
import { UpdateAssignmentUseCase } from '../../../application/use-cases/assignment/UpdateAssignmentUseCase';
import { DeleteAssignmentUseCase } from '../../../application/use-cases/assignment/DeleteAssignmentUseCase';
import { ListAssignmentsUseCase } from '../../../application/use-cases/assignment/ListAssignmentsUseCase';
import { SubmitAssignmentUseCase } from '../../../application/use-cases/assignment/SubmitAssignmentUseCase';
import { GetSubmissionUseCase } from '../../../application/use-cases/assignment/GetSubmissionUseCase';
import { GetMySubmissionUseCase } from '../../../application/use-cases/assignment/GetMySubmissionUseCase';
import type { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';

/**
 * Configure Multer for file uploads
 * 
 * Uses memory storage to keep files in memory as Buffer objects.
 * Files are then passed to use case for validation and storage.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Assignment Controller
 * 
 * Thin controller that delegates to use cases and manages HTTP concerns.
 */
export class AssignmentController {
  /**
   * Multer middleware for file uploads
   * 
   * Exported for use in route configuration
   */
  public uploadMiddleware = upload.single('file');

  /**
   * List assignments for a course
   * 
   * GET /api/courses/:courseId/assignments
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Path parameters:
   * - courseId: Course ID (UUID)
   * 
   * Response (200 OK):
   * - data: Array of AssignmentListDTO
   * 
   * Business Rules:
   * - Students: Can view assignments if enrolled (with submission status)
   * - Teachers: Can view assignments if they own the course
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled or not course owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 9.11
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
      const listAssignmentsUseCase = container.resolve(ListAssignmentsUseCase);
      const assignments = await listAssignmentsUseCase.execute(
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return assignments wrapped in data object (200 OK)
      res.status(200).json({ data: assignments });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Get assignment by ID
   * 
   * GET /api/assignments/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Path parameters:
   * - id: Assignment ID (UUID)
   * 
   * Response (200 OK):
   * - AssignmentDTO
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled or not course owner
   * - 404: Assignment not found
   * - 500: Internal server error
   * 
   * Requirements: 9.11
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

      const assignmentId = req.params.id as string;
      
      if (!assignmentId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Assignment ID is required'
        });
        return;
      }
      
      // For now, we'll use the repository directly
      // In future, this should be a GetAssignmentUseCase
      const assignmentRepository = container.resolve('IAssignmentRepository' as any);
      const assignment = await (assignmentRepository as any).findById(assignmentId);
      
      if (!assignment) {
        res.status(404).json({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Assignment not found'
        });
        return;
      }

      // Convert to DTO
      const { AssignmentMapper } = await import('../../../application/mappers/AssignmentMapper');
      const assignmentDTO = AssignmentMapper.toDTO(assignment);
      
      // Return assignment (200 OK)
      res.status(200).json(assignmentDTO);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Create new assignment
   * 
   * POST /api/courses/:courseId/assignments
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher role and course ownership (validated by use case)
   * 
   * Path parameters:
   * - courseId: Course ID (UUID)
   * 
   * Request body (validated by CreateAssignmentRequestSchema):
   * - title: string (1-200 characters)
   * - description: string (1-10000 characters)
   * - dueDate: string (ISO 8601, must be in future)
   * - submissionType: 'FILE' | 'TEXT' | 'BOTH'
   * - acceptedFileFormats: string[] (optional, required if submissionType is FILE or BOTH)
   * 
   * Response (201 Created):
   * - AssignmentDTO
   * 
   * Errors:
   * - 400: Validation failed
   * - 401: Authentication required (handled by middleware)
   * - 403: Only course teacher can create assignments
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 9.1
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
      const createAssignmentUseCase = container.resolve(CreateAssignmentUseCase);
      const assignment = await createAssignmentUseCase.execute(
        req.body,
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return created assignment (201 Created)
      res.status(201).json(assignment);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Update assignment
   * 
   * PUT /api/assignments/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Assignment ID (UUID)
   * 
   * Request body (validated by UpdateAssignmentRequestSchema):
   * - title: string (optional, 1-200 characters)
   * - description: string (optional, 1-10000 characters)
   * - dueDate: string (optional, ISO 8601, must be in future)
   * 
   * Response (200 OK):
   * - AssignmentDTO with updated data
   * 
   * Errors:
   * - 400: Validation failed, assignment past due date, or grading started
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Assignment not found
   * - 500: Internal server error
   * 
   * Requirements: 9.8
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

      const assignmentId = req.params.id as string;
      
      if (!assignmentId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Assignment ID is required'
        });
        return;
      }
      
      // Execute use case
      const updateAssignmentUseCase = container.resolve(UpdateAssignmentUseCase);
      const assignment = await updateAssignmentUseCase.execute(
        req.body,
        assignmentId,
        authenticatedReq.user.userId
      );
      
      // Return updated assignment (200 OK)
      res.status(200).json(assignment);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Delete assignment
   * 
   * DELETE /api/assignments/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Assignment ID (UUID)
   * 
   * Response (200 OK):
   * - message: Success message
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Assignment not found
   * - 500: Internal server error
   * 
   * Requirements: 9.10
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

      const assignmentId = req.params.id as string;
      
      if (!assignmentId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Assignment ID is required'
        });
        return;
      }
      
      // Execute use case
      const deleteAssignmentUseCase = container.resolve(DeleteAssignmentUseCase);
      await deleteAssignmentUseCase.execute(
        assignmentId,
        authenticatedReq.user.userId
      );
      
      // Return success message (200 OK)
      res.status(200).json({
        message: 'Assignment deleted successfully'
      });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Submit assignment
   * 
   * POST /api/assignments/:id/submit
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires student role and enrollment (validated by use case)
   * Uses Multer middleware for file uploads
   * 
   * Path parameters:
   * - id: Assignment ID (UUID)
   * 
   * Request body (multipart/form-data or JSON):
   * - submissionType: 'FILE' | 'TEXT' | 'BOTH' (validated by SubmitAssignmentRequestSchema)
   * - content: string (optional, for TEXT or BOTH submissions)
   * - file: File (optional, for FILE or BOTH submissions)
   * 
   * Response (201 Created):
   * - AssignmentSubmissionDTO
   * 
   * Errors:
   * - 400: Validation failed, assignment closed, or invalid submission type
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled in course
   * - 404: Assignment not found
   * - 500: Internal server error
   * 
   * Requirements: 10.1
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

      const assignmentId = req.params.id as string;
      
      if (!assignmentId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Assignment ID is required'
        });
        return;
      }

      // Get file from multer (if uploaded)
      const file = (req as any).file;
      
      // Prepare submission data
      const submissionData = {
        submissionType: req.body.submissionType,
        content: req.body.content
      };
      
      // Execute use case
      const submitAssignmentUseCase = container.resolve(SubmitAssignmentUseCase);
      const submission = await submitAssignmentUseCase.execute(
        submissionData,
        assignmentId,
        authenticatedReq.user.userId,
        file?.buffer,
        file?.originalname,
        file?.mimetype,
        file?.size
      );
      
      // Return created submission (201 Created)
      res.status(201).json(submission);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Get submission by ID
   * 
   * GET /api/submissions/:id
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
   * Requirements: 10.12
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
   * Get my submission for an assignment
   * 
   * GET /api/assignments/:id/my-submission
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Path parameters:
   * - id: Assignment ID (UUID)
   * 
   * Response (200 OK):
   * - AssignmentSubmissionDTO or null if no submission exists
   * 
   * Business Rules:
   * - Students: Can view their own submission for the assignment
   * - Returns null if no submission exists yet
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not enrolled in course
   * - 404: Assignment not found
   * - 500: Internal server error
   * 
   * Requirements: 10.12
   */
  async getMySubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const getMySubmissionUseCase = container.resolve(GetMySubmissionUseCase);
      const submission = await getMySubmissionUseCase.execute(
        assignmentId,
        authenticatedReq.user.userId
      );
      
      // Return submission or null (200 OK)
      res.status(200).json(submission);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

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
   * - data: Array of AssignmentSubmissionListDTO
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
   * Requirements: 11.1, 11.2, 11.3, 11.4
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

      const assignmentId = req.params.id as string;
      
      if (!assignmentId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Assignment ID is required'
        });
        return;
      }
      
      // Execute use case
      const { ListSubmissionsUseCase } = await import('../../../application/use-cases/assignment/ListSubmissionsUseCase');
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
}
