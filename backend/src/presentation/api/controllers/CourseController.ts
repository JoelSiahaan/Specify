/**
 * Course Controller
 * 
 * Handles HTTP requests for course management endpoints.
 * Delegates business logic to use cases and manages HTTP responses.
 * 
 * Requirements:
 * - 5.1: Create course with name, description, and unique course code
 * - 5.3: Update course details (name and description)
 * - 5.4: Archive course (hide from active lists, prevent new enrollments)
 * - 5.6: Only archived courses can be deleted
 * - 5.7: Cascade delete all related data
 * - 5.10: Teachers view all their created courses (active and archived separately)
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { CreateCourseUseCase } from '../../../application/use-cases/course/CreateCourseUseCase';
import { UpdateCourseUseCase } from '../../../application/use-cases/course/UpdateCourseUseCase';
import { ArchiveCourseUseCase } from '../../../application/use-cases/course/ArchiveCourseUseCase';
import { DeleteCourseUseCase } from '../../../application/use-cases/course/DeleteCourseUseCase';
import { ListCoursesUseCase } from '../../../application/use-cases/course/ListCoursesUseCase';
import { CourseStatus } from '../../../domain/entities/Course';
import type { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';

/**
 * Course Controller
 * 
 * Thin controller that delegates to use cases and manages HTTP concerns.
 */
export class CourseController {
  /**
   * List courses
   * 
   * GET /api/courses
   * GET /api/courses/archived (with ?status=ARCHIVED)
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Query parameters:
   * - status: 'ACTIVE' | 'ARCHIVED' (optional)
   * 
   * Response (200 OK):
   * - data: Array of CourseListDTO
   * 
   * Business Rules:
   * - Teachers: See only their own courses
   * - Students: See all active courses
   * - Status filter: Optional filter by ACTIVE or ARCHIVED
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 500: Internal server error
   * 
   * Requirements: 5.10, 6.1
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

      // Get status filter from query parameters
      const status = req.query.status as CourseStatus | undefined;
      
      // Execute use case
      const listCoursesUseCase = container.resolve(ListCoursesUseCase);
      const courses = await listCoursesUseCase.execute(
        authenticatedReq.user.userId,
        status ? { status } : undefined
      );
      
      // Return courses wrapped in data object (200 OK)
      res.status(200).json({ data: courses });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Get course by ID
   * 
   * GET /api/courses/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Path parameters:
   * - id: Course ID (UUID)
   * 
   * Response (200 OK):
   * - CourseDTO
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 5.10
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

      const courseId = req.params.id as string;
      
      if (!courseId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Course ID is required'
        });
        return;
      }
      
      // For now, we'll use the repository directly
      // In future, this should be a GetCourseUseCase
      const courseRepository = container.resolve('ICourseRepository' as any);
      const course = await (courseRepository as any).findById(courseId);
      
      if (!course) {
        res.status(404).json({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Course not found'
        });
        return;
      }

      // Convert to DTO
      const { CourseMapper } = await import('../../../application/mappers/CourseMapper');
      const courseDTO = CourseMapper.toDTO(course);
      
      // Return course (200 OK)
      res.status(200).json(courseDTO);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Create new course
   * 
   * POST /api/courses
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher role (validated by use case)
   * 
   * Request body (validated by CreateCourseRequestSchema):
   * - name: string (1-200 characters)
   * - description: string (1-5000 characters)
   * 
   * Response (201 Created):
   * - CourseDTO with auto-generated course code
   * 
   * Errors:
   * - 400: Validation failed
   * - 401: Authentication required (handled by middleware)
   * - 403: Only teachers can create courses
   * - 500: Internal server error
   * 
   * Requirements: 5.1, 5.2, 5.9
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

      // Execute use case
      const createCourseUseCase = container.resolve(CreateCourseUseCase);
      const course = await createCourseUseCase.execute(
        req.body,
        authenticatedReq.user.userId
      );
      
      // Return created course (201 Created)
      res.status(201).json(course);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Update course
   * 
   * PUT /api/courses/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Course ID (UUID)
   * 
   * Request body (validated by UpdateCourseRequestSchema):
   * - name: string (optional, 1-200 characters)
   * - description: string (optional, 1-5000 characters)
   * 
   * Response (200 OK):
   * - CourseDTO with updated data
   * 
   * Errors:
   * - 400: Validation failed or course is archived
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 5.3
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

      const courseId = req.params.id as string;
      
      if (!courseId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Course ID is required'
        });
        return;
      }
      
      // Execute use case
      const updateCourseUseCase = container.resolve(UpdateCourseUseCase);
      const course = await updateCourseUseCase.execute(
        courseId,
        req.body,
        authenticatedReq.user.userId
      );
      
      // Return updated course (200 OK)
      res.status(200).json(course);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Archive course
   * 
   * POST /api/courses/:id/archive
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Course ID (UUID)
   * 
   * Response (200 OK):
   * - CourseDTO with status = ARCHIVED
   * 
   * Errors:
   * - 400: Course is already archived
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 5.4, 5.5
   */
  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const courseId = req.params.id as string;
      
      if (!courseId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Course ID is required'
        });
        return;
      }
      
      // Execute use case
      const archiveCourseUseCase = container.resolve(ArchiveCourseUseCase);
      const course = await archiveCourseUseCase.execute(
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return archived course (200 OK)
      res.status(200).json(course);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Delete course
   * 
   * DELETE /api/courses/:id
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Course ID (UUID)
   * 
   * Response (200 OK):
   * - message: Success message
   * 
   * Errors:
   * - 400: Course is not archived (must archive before delete)
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 5.6, 5.7
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

      const courseId = req.params.id as string;
      
      if (!courseId) {
        res.status(400).json({
          code: 'VALIDATION_FAILED',
          message: 'Course ID is required'
        });
        return;
      }
      
      // Execute use case
      const deleteCourseUseCase = container.resolve(DeleteCourseUseCase);
      await deleteCourseUseCase.execute(
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return success message (200 OK)
      res.status(200).json({
        message: 'Course deleted successfully'
      });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }
}
