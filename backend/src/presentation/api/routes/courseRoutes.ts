/**
 * Course Routes
 * 
 * Defines routes for course management endpoints with validation middleware.
 * 
 * Requirements:
 * - 5.1: Create course with name, description, and unique course code
 * - 5.3: Update course details
 * - 5.4: Archive course
 * - 5.6: Delete course (only archived courses)
 * - 5.7: Cascade delete all related data
 * - 5.10: Teachers view all their created courses
 * - 18.4: Input validation
 * - 20.2: Validation and sanitization
 */

import { Router } from 'express';
import { CourseController } from '../controllers/CourseController';
import { validateBody, validateQuery } from '../middleware/ValidationMiddleware';
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import {
  CreateCourseRequestSchema,
  UpdateCourseRequestSchema,
  CourseQuerySchema,
  CourseSearchQuerySchema
} from '../validators/courseSchemas';
import { EnrollCourseRequestSchema } from '../validators/enrollmentSchemas';

const router = Router();
const courseController = new CourseController();

/**
 * All course routes require authentication
 */
router.use(authenticationMiddleware);

/**
 * GET /api/courses/search
 * 
 * Search courses
 * 
 * Protected endpoint (authentication required)
 * Query parameters: query (optional) - Search query to filter courses by name
 * 
 * Business Rules:
 * - Only active courses are searchable
 * - Filter by course name if query provided
 * - Indicate enrollment status for each course
 */
router.get(
  '/search',
  validateQuery(CourseSearchQuerySchema),
  courseController.search.bind(courseController)
);

/**
 * POST /api/courses/enroll
 * 
 * Enroll in course
 * 
 * Protected endpoint (authentication required)
 * Requires student role (validated by use case)
 * Validates request body with EnrollCourseRequestSchema
 * 
 * Business Rules:
 * - Only students can enroll in courses
 * - Course must exist and be active
 * - Student cannot enroll in same course twice
 */
router.post(
  '/enroll',
  validateBody(EnrollCourseRequestSchema),
  courseController.enroll.bind(courseController)
);

/**
 * GET /api/courses
 * 
 * List courses
 * 
 * Protected endpoint (authentication required)
 * Query parameters: status (optional) - 'ACTIVE' | 'ARCHIVED'
 * 
 * Business Rules:
 * - Teachers: See only their own courses
 * - Students: See all active courses
 */
router.get(
  '/',
  validateQuery(CourseQuerySchema),
  courseController.list.bind(courseController)
);

/**
 * GET /api/courses/:id
 * 
 * Get course by ID
 * 
 * Protected endpoint (authentication required)
 * Returns course details
 */
router.get(
  '/:id',
  courseController.getById.bind(courseController)
);

/**
 * POST /api/courses
 * 
 * Create new course
 * 
 * Protected endpoint (authentication required)
 * Requires teacher role (validated by use case)
 * Validates request body with CreateCourseRequestSchema
 * Auto-generates unique course code
 */
router.post(
  '/',
  validateBody(CreateCourseRequestSchema),
  courseController.create.bind(courseController)
);

/**
 * PUT /api/courses/:id
 * 
 * Update course
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Validates request body with UpdateCourseRequestSchema
 * Only active courses can be updated
 */
router.put(
  '/:id',
  validateBody(UpdateCourseRequestSchema),
  courseController.update.bind(courseController)
);

/**
 * POST /api/courses/:id/archive
 * 
 * Archive course
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Sets course status to ARCHIVED
 * Prevents new enrollments and closes assignments/quizzes
 */
router.post(
  '/:id/archive',
  courseController.archive.bind(courseController)
);

/**
 * POST /api/courses/:id/unenroll-bulk
 * 
 * Bulk unenroll students
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Only archived courses can have bulk unenrollment
 * Removes all enrollments for the course
 */
router.post(
  '/:id/unenroll-bulk',
  courseController.bulkUnenroll.bind(courseController)
);

/**
 * DELETE /api/courses/:id
 * 
 * Delete course
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Only archived courses can be deleted
 * Cascade deletes all related data (materials, assignments, quizzes, submissions, enrollments)
 */
router.delete(
  '/:id',
  courseController.delete.bind(courseController)
);

export default router;
