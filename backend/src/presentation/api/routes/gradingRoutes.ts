/**
 * Grading Routes
 * 
 * Defines routes for grading-related endpoints with validation middleware.
 * 
 * Requirements:
 * - 13.1: Starting to grade closes assignment to prevent further submissions
 * - 13.6: Allow teachers to add text feedback
 * - 13.7: Mark the submission as graded
 * - 13.10: Calculate total score based on manually assigned points per question
 * - 18.4: Input validation
 * - 20.2: Validation and sanitization
 */

import { Router } from 'express';
import { GradingController } from '../controllers/GradingController';
import { validateBody } from '../middleware/ValidationMiddleware';
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import { GradeSubmissionRequestSchema } from '../validators/assignmentSchemas';
import { GradeQuizSubmissionRequestSchema } from '../validators/quizSchemas';

const router = Router();
const gradingController = new GradingController();

/**
 * All grading routes require authentication
 */
router.use(authenticationMiddleware);

/**
 * GET /api/assignments/:id/submissions
 * 
 * List all submissions for an assignment
 * 
 * Protected endpoint (authentication required)
 * Requires teacher role and course ownership (validated by use case)
 * Path parameters: id - Assignment ID (UUID)
 * 
 * Returns list of all submissions for the assignment
 * 
 * Business Rules:
 * - Only teachers can list submissions
 * - Teacher must own the course
 * - Returns all submissions for the assignment
 */
router.get(
  '/assignments/:id/submissions',
  gradingController.listAssignmentSubmissions.bind(gradingController)
);

/**
 * GET /api/submissions/:id
 * 
 * Get submission by ID
 * 
 * Protected endpoint (authentication required)
 * Path parameters: id - Submission ID (UUID)
 * 
 * Returns submission details
 * 
 * Business Rules:
 * - Students: Can view their own submissions
 * - Teachers: Can view all submissions in their courses
 */
router.get(
  '/submissions/:id',
  gradingController.getSubmission.bind(gradingController)
);

/**
 * POST /api/submissions/:id/grade
 * 
 * Grade assignment submission
 * 
 * Protected endpoint (authentication required)
 * Requires teacher role and course ownership (validated by use case)
 * Validates request body with GradeSubmissionRequestSchema
 * Path parameters: id - Submission ID (UUID)
 * 
 * Request body:
 * - grade: number (0-100)
 * - feedback: string (optional)
 * - version: number (optional, for optimistic locking)
 * 
 * Business Rules:
 * - Only teachers can grade submissions
 * - Teacher must own the course
 * - Starting to grade closes assignment (Requirement 13.1)
 * - Grade must be between 0 and 100
 * - Supports optimistic locking for concurrent grading prevention
 */
router.post(
  '/submissions/:id/grade',
  validateBody(GradeSubmissionRequestSchema),
  gradingController.gradeAssignmentSubmission.bind(gradingController)
);

/**
 * PUT /api/submissions/:id/grade
 * 
 * Update assignment submission grade
 * 
 * Protected endpoint (authentication required)
 * Requires teacher role and course ownership (validated by use case)
 * Validates request body with GradeSubmissionRequestSchema
 * Path parameters: id - Submission ID (UUID)
 * 
 * Request body:
 * - grade: number (0-100)
 * - feedback: string (optional)
 * - version: number (optional, for optimistic locking)
 * 
 * Business Rules:
 * - Only teachers can update grades
 * - Teacher must own the course
 * - Submission must already be graded
 * - Grade must be between 0 and 100
 * - Supports optimistic locking for concurrent grading prevention
 */
router.put(
  '/submissions/:id/grade',
  validateBody(GradeSubmissionRequestSchema),
  gradingController.updateAssignmentGrade.bind(gradingController)
);

/**
 * GET /api/quizzes/:id/submissions
 * 
 * List all quiz submissions for a quiz
 * 
 * Protected endpoint (authentication required)
 * Requires teacher role and course ownership (validated by use case)
 * Path parameters: id - Quiz ID (UUID)
 * 
 * Returns list of all submissions for the quiz
 * 
 * Business Rules:
 * - Only teachers can list quiz submissions
 * - Teacher must own the course
 * - Returns all submissions for the quiz
 */
router.get(
  '/quizzes/:id/submissions',
  gradingController.listQuizSubmissions.bind(gradingController)
);

/**
 * POST /api/quiz-submissions/:id/grade
 * 
 * Grade quiz submission
 * 
 * Protected endpoint (authentication required)
 * Requires teacher role and course ownership (validated by use case)
 * Validates request body with GradeQuizSubmissionRequestSchema
 * Path parameters: id - Quiz Submission ID (UUID)
 * 
 * Request body:
 * - questionPoints: number[] (points per question)
 * - feedback: string (optional)
 * 
 * Response:
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
 */
router.post(
  '/quiz-submissions/:id/grade',
  validateBody(GradeQuizSubmissionRequestSchema),
  gradingController.gradeQuizSubmission.bind(gradingController)
);

export default router;
