/**
 * User Profile Routes
 * 
 * Defines routes for user profile management endpoints with validation middleware.
 * 
 * Requirements:
 * - 1.1: View profile information
 * - 1.2: Edit name
 * - 1.3: Change password
 * - 4.1: API endpoints for profile operations
 * - 18.4: Input validation
 * - 20.2: Validation and sanitization
 */

import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware.js';
import {
  UpdateProfileRequestSchema,
  ChangePasswordRequestSchema
} from '../validators/userSchemas.js';

const router = Router();
const userController = new UserController();

/**
 * GET /api/users/profile
 * 
 * Get current user profile
 * 
 * Protected endpoint (authentication required)
 * Returns profile data (id, name, email, role, createdAt, updatedAt)
 */
router.get(
  '/profile',
  authenticationMiddleware,
  userController.getProfile.bind(userController)
);

/**
 * PUT /api/users/profile
 * 
 * Update user profile (name only)
 * 
 * Protected endpoint (authentication required)
 * Validates request body with UpdateProfileRequestSchema
 * Returns updated profile data
 */
router.put(
  '/profile',
  authenticationMiddleware,
  validateBody(UpdateProfileRequestSchema),
  userController.updateProfile.bind(userController)
);

/**
 * PUT /api/users/password
 * 
 * Change user password
 * 
 * Protected endpoint (authentication required)
 * Validates request body with ChangePasswordRequestSchema
 * Returns success result
 */
router.put(
  '/password',
  authenticationMiddleware,
  validateBody(ChangePasswordRequestSchema),
  userController.changePassword.bind(userController)
);

export default router;
