/**
 * Quiz Routes
 * 
 * Defines all quiz-related API endpoints.
 * 
 * Routes:
 * - GET    /api/courses/:courseId/quizzes - List quizzes
 * - POST   /api/courses/:courseId/quizzes - Create quiz (teacher)
 * - GET    /api/quizzes/:id - Get quiz details
 * - PUT    /api/quizzes/:id - Update quiz (teacher)
 * - DELETE /api/quizzes/:id - Delete quiz (teacher)
 * - POST   /api/quizzes/:id/start - Start quiz (student)
 * - POST   /api/quizzes/:id/autosave - Auto-save answers (student)
 * - POST   /api/quizzes/:id/submit - Submit quiz (student)
 * - GET    /api/quizzes/:id/submissions - List submissions (teacher)
 */

import { Router } from 'express';
import { QuizController } from '../controllers/QuizController';
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import { validate } from '../middleware/ValidationMiddleware';
import {
  CreateQuizRequestSchema,
  UpdateQuizRequestSchema,
  SubmitQuizRequestSchema,
  AutoSaveQuizRequestSchema
} from '../validators/quizSchemas';

const router = Router();
const quizController = new QuizController();

/**
 * List quizzes for a course
 * GET /api/courses/:courseId/quizzes
 */
router.get(
  '/courses/:courseId/quizzes',
  authenticationMiddleware,
  quizController.list.bind(quizController)
);

/**
 * Create new quiz
 * POST /api/courses/:courseId/quizzes
 */
router.post(
  '/courses/:courseId/quizzes',
  authenticationMiddleware,
  validate(CreateQuizRequestSchema),
  quizController.create.bind(quizController)
);

/**
 * Get quiz by ID
 * GET /api/quizzes/:id
 */
router.get(
  '/quizzes/:id',
  authenticationMiddleware,
  quizController.getById.bind(quizController)
);

/**
 * Update quiz
 * PUT /api/quizzes/:id
 */
router.put(
  '/quizzes/:id',
  authenticationMiddleware,
  validate(UpdateQuizRequestSchema),
  quizController.update.bind(quizController)
);

/**
 * Delete quiz
 * DELETE /api/quizzes/:id
 */
router.delete(
  '/quizzes/:id',
  authenticationMiddleware,
  quizController.delete.bind(quizController)
);

/**
 * Start quiz
 * POST /api/quizzes/:id/start
 */
router.post(
  '/quizzes/:id/start',
  authenticationMiddleware,
  quizController.start.bind(quizController)
);

/**
 * Auto-save quiz answers
 * POST /api/quizzes/:id/autosave
 */
router.post(
  '/quizzes/:id/autosave',
  authenticationMiddleware,
  validate(AutoSaveQuizRequestSchema),
  quizController.autosave.bind(quizController)
);

/**
 * Submit quiz
 * POST /api/quizzes/:id/submit
 */
router.post(
  '/quizzes/:id/submit',
  authenticationMiddleware,
  validate(SubmitQuizRequestSchema),
  quizController.submit.bind(quizController)
);

/**
 * List quiz submissions (teacher only)
 * GET /api/quizzes/:id/submissions
 */
router.get(
  '/quizzes/:id/submissions',
  authenticationMiddleware,
  quizController.listSubmissions.bind(quizController)
);

/**
 * Get quiz submission details by ID
 * GET /api/quiz-submissions/:id
 */
router.get(
  '/quiz-submissions/:id',
  authenticationMiddleware,
  quizController.getSubmissionDetails.bind(quizController)
);

export default router;
