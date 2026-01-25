/**
 * Assignment Routes
 * 
 * Defines routes for assignment management endpoints with validation middleware.
 * 
 * Requirements:
 * - 9.1: Create assignment with title, description, and due date
 * - 9.8: Prevent editing after due date
 * - 9.10: Allow teachers to delete assignments at any time
 * - 9.11: Allow teachers to view all assignments for a course
 * - 10.1: Allow file upload for assignments
 * - 18.4: Input validation
 * - 20.2: Validation and sanitization
 */

import { Router } from 'express';
import { AssignmentController } from '../controllers/AssignmentController';
import { validateBody } from '../middleware/ValidationMiddleware';
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import {
  CreateAssignmentRequestSchema,
  UpdateAssignmentRequestSchema
} from '../validators/assignmentSchemas';

const router = Router();
const assignmentController = new AssignmentController();

/**
 * All assignment routes require authentication
 */
router.use(authenticationMiddleware);

/**
 * GET /api/courses/:courseId/assignments
 * 
 * List assignments for a course
 * 
 * Protected endpoint (authentication required)
 * Path parameters: courseId - Course ID (UUID)
 * 
 * Business Rules:
 * - Students: Can view assignments if enrolled (with submission status)
 * - Teachers: Can view assignments if they own the course
 */
router.get(
  '/courses/:courseId/assignments',
  assignmentController.list.bind(assignmentController)
);

/**
 * POST /api/courses/:courseId/assignments
 * 
 * Create new assignment
 * 
 * Protected endpoint (authentication required)
 * Requires teacher role and course ownership (validated by use case)
 * Validates request body with CreateAssignmentRequestSchema
 * Path parameters: courseId - Course ID (UUID)
 * 
 * Business Rules:
 * - Only course teacher can create assignments
 * - Due date must be in the future
 * - Submission type must be FILE, TEXT, or BOTH
 */
router.post(
  '/courses/:courseId/assignments',
  validateBody(CreateAssignmentRequestSchema),
  assignmentController.create.bind(assignmentController)
);

/**
 * GET /api/assignments/:id
 * 
 * Get assignment by ID
 * 
 * Protected endpoint (authentication required)
 * Path parameters: id - Assignment ID (UUID)
 * 
 * Returns assignment details
 */
router.get(
  '/assignments/:id',
  assignmentController.getById.bind(assignmentController)
);

/**
 * PUT /api/assignments/:id
 * 
 * Update assignment
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Validates request body with UpdateAssignmentRequestSchema
 * Path parameters: id - Assignment ID (UUID)
 * 
 * Business Rules:
 * - Only course teacher can update assignments
 * - Cannot edit after due date
 * - Cannot edit after grading has started
 */
router.put(
  '/assignments/:id',
  validateBody(UpdateAssignmentRequestSchema),
  assignmentController.update.bind(assignmentController)
);

/**
 * DELETE /api/assignments/:id
 * 
 * Delete assignment
 * 
 * Protected endpoint (authentication required)
 * Requires teacher ownership (validated by use case)
 * Path parameters: id - Assignment ID (UUID)
 * 
 * Business Rules:
 * - Only course teacher can delete assignments
 * - Can delete at any time (before or after due date)
 */
router.delete(
  '/assignments/:id',
  assignmentController.delete.bind(assignmentController)
);

/**
 * POST /api/assignments/:id/submit
 * 
 * Submit assignment
 * 
 * Protected endpoint (authentication required)
 * Requires student role and enrollment (validated by use case)
 * Uses Multer middleware for file uploads
 * Path parameters: id - Assignment ID (UUID)
 * 
 * Request body (multipart/form-data or JSON):
 * - submissionType: 'FILE' | 'TEXT' | 'BOTH'
 * - content: string (optional, for TEXT or BOTH submissions)
 * - file: File (optional, for FILE or BOTH submissions)
 * 
 * Business Rules:
 * - Only enrolled students can submit
 * - Cannot submit after grading has started
 * - Can submit late (after due date) until grading starts
 * - Can resubmit before grading starts
 */
router.post(
  '/assignments/:id/submit',
  assignmentController.uploadMiddleware,
  assignmentController.submit.bind(assignmentController)
);

/**
 * GET /api/submissions/:id
 * 
 * Get submission by ID
 * 
 * Protected endpoint (authentication required)
 * Path parameters: id - Submission ID (UUID)
 * 
 * Business Rules:
 * - Students: Can view their own submissions
 * - Teachers: Can view all submissions in their courses
 */
router.get(
  '/submissions/:id',
  assignmentController.getSubmission.bind(assignmentController)
);

/**
 * GET /api/assignments/:id/my-submission
 * 
 * Get my submission for an assignment
 * 
 * Protected endpoint (authentication required)
 * Path parameters: id - Assignment ID (UUID)
 * 
 * Returns the student's submission for the assignment, or null if no submission exists
 * 
 * Business Rules:
 * - Students: Can view their own submission for the assignment
 * - Returns null if no submission exists yet
 */
router.get(
  '/assignments/:id/my-submission',
  assignmentController.getMySubmission.bind(assignmentController)
);

/**
 * GET /api/assignments/:id/submissions
 * 
 * List all submissions for an assignment
 * 
 * Protected endpoint (authentication required)
 * Path parameters: id - Assignment ID (UUID)
 * 
 * Returns list of all submissions for the assignment
 * 
 * Business Rules:
 * - Teachers: Can view all submissions for assignments in their courses
 * - Students: Cannot access this endpoint (403 Forbidden)
 */
router.get(
  '/assignments/:id/submissions',
  assignmentController.listSubmissions.bind(assignmentController)
);

export default router;
