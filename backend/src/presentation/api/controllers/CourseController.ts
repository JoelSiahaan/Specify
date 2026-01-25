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
import { SearchCoursesUseCase } from '../../../application/use-cases/course/SearchCoursesUseCase';
import { EnrollStudentUseCase } from '../../../application/use-cases/enrollment/EnrollStudentUseCase';
import { BulkUnenrollUseCase } from '../../../application/use-cases/enrollment/BulkUnenrollUseCase';
import { ListCourseEnrollmentsUseCase } from '../../../application/use-cases/enrollment/ListCourseEnrollmentsUseCase';
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
      
      // Get enrolledOnly filter from query parameters (for students)
      const enrolledOnly = req.query.enrolledOnly === 'true';
      
      console.log('[CourseController] List courses request:', {
        userId: authenticatedReq.user.userId,
        status,
        enrolledOnly,
        rawEnrolledOnly: req.query.enrolledOnly
      });
      
      // Execute use case
      const listCoursesUseCase = container.resolve(ListCoursesUseCase);
      const courses = await listCoursesUseCase.execute(
        authenticatedReq.user.userId,
        { status, enrolledOnly }
      );
      
      console.log('[CourseController] Returning courses count:', courses.length);
      
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
   * - CourseListDTO (with teacher name and enrollment count)
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
      
      // Load repositories (same pattern as other controllers)
      const courseRepository = container.resolve('ICourseRepository' as any);
      const userRepository = container.resolve('IUserRepository' as any);
      const enrollmentRepository = container.resolve('IEnrollmentRepository' as any);
      
      // Load course
      const course = await (courseRepository as any).findById(courseId);
      
      if (!course) {
        res.status(404).json({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Course not found'
        });
        return;
      }

      // Load teacher
      const teacher = await (userRepository as any).findById(course.getTeacherId());
      const teacherName = teacher ? teacher.getName() : undefined;

      // Load enrollment count
      const enrollments = await (enrollmentRepository as any).findByCourse(courseId);
      const enrollmentCount = enrollments.length;

      // Convert to DTO with teacher name and enrollment count
      const { CourseMapper } = await import('../../../application/mappers/CourseMapper');
      const courseDTO = CourseMapper.toListDTO(course, teacherName, enrollmentCount);
      
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

  /**
   * Search courses
   * 
   * GET /api/courses/search
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Query parameters:
   * - query: string (optional) - Search query to filter courses by name
   * 
   * Response (200 OK):
   * - data: Array of CourseSearchResultDTO with enrollment status
   * 
   * Business Rules:
   * - Only active courses are searchable
   * - Filter by course name if query provided
   * - Indicate enrollment status for each course
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 500: Internal server error
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Get search query from query parameters
      const query = req.query.query as string | undefined;
      
      // Execute use case
      const searchCoursesUseCase = container.resolve(SearchCoursesUseCase);
      const courses = await searchCoursesUseCase.execute(
        authenticatedReq.user.userId,
        query ? { query } : undefined
      );
      
      // Return courses wrapped in data object (200 OK)
      res.status(200).json({ data: courses });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Enroll in course
   * 
   * POST /api/courses/enroll
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires student role (validated by use case)
   * 
   * Request body (validated by EnrollCourseRequestSchema):
   * - courseCode: string (6-character alphanumeric)
   * 
   * Response (201 Created):
   * - EnrollmentDTO
   * 
   * Errors:
   * - 400: Validation failed
   * - 401: Authentication required (handled by middleware)
   * - 403: Only students can enroll in courses
   * - 404: Invalid course code
   * - 409: Course is archived or student already enrolled
   * - 500: Internal server error
   * 
   * Requirements: 6.5, 6.6, 6.7, 6.8
   */
  async enroll(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const enrollStudentUseCase = container.resolve(EnrollStudentUseCase);
      const enrollment = await enrollStudentUseCase.execute(
        req.body,
        authenticatedReq.user.userId
      );
      
      // Return created enrollment (201 Created)
      res.status(201).json(enrollment);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Bulk unenroll students
   * 
   * POST /api/courses/:id/unenroll-bulk
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Course ID (UUID)
   * 
   * Response (200 OK):
   * - BulkUnenrollResponseDTO with success status and count
   * 
   * Errors:
   * - 400: Course is not archived
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 5.8
   */
  async bulkUnenroll(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const bulkUnenrollUseCase = container.resolve(BulkUnenrollUseCase);
      const result = await bulkUnenrollUseCase.execute(
        courseId,
        authenticatedReq.user.userId
      );
      
      // Return success response (200 OK)
      res.status(200).json(result);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Get course enrollments with student details
   * 
   * GET /api/courses/:id/enrollments
   * 
   * Requires authentication (AuthenticationMiddleware)
   * Requires teacher ownership (validated by use case)
   * 
   * Path parameters:
   * - id: Course ID (UUID)
   * 
   * Response (200 OK):
   * - data: Array of EnrollmentWithStudentDTO
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 403: Not the course owner
   * - 404: Course not found
   * - 500: Internal server error
   * 
   * Requirements: 5.10
   */
  async getEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const listEnrollmentsUseCase = container.resolve(ListCourseEnrollmentsUseCase);
      const enrollments = await listEnrollmentsUseCase.execute(
        courseId,
        authenticatedReq.user.userId
      );

      // Return enrollments wrapped in data object (200 OK)
      res.status(200).json({ data: enrollments });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }
}
