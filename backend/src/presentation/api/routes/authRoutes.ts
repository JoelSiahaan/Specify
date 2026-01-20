/**
 * Authentication Routes
 * 
 * Defines routes for authentication endpoints with validation middleware.
 * 
 * Requirements:
 * - 1.1: User authentication
 * - 1.2: Token generation
 * - 1.4: Token refresh
 * - 1.6: Logout
 * - 1.7: User registration
 * - 18.4: Input validation
 * - 20.2: Validation and sanitization
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateBody } from '../middleware/ValidationMiddleware';
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import {
  RegisterRequestSchema,
  LoginRequestSchema
} from '../validators/authSchemas';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/register
 * 
 * Register new user
 * 
 * Public endpoint (no authentication required)
 * Validates request body with RegisterRequestSchema
 */
router.post(
  '/register',
  validateBody(RegisterRequestSchema),
  authController.register.bind(authController)
);

/**
 * POST /api/auth/login
 * 
 * Login user
 * 
 * Public endpoint (no authentication required)
 * Validates request body with LoginRequestSchema
 * Sets HTTP-only cookies for access and refresh tokens
 */
router.post(
  '/login',
  validateBody(LoginRequestSchema),
  authController.login.bind(authController)
);

/**
 * POST /api/auth/refresh
 * 
 * Refresh access token
 * 
 * Public endpoint (no authentication required)
 * Reads refresh_token from HTTP-only cookie
 * Sets new access_token in HTTP-only cookie
 */
router.post(
  '/refresh',
  authController.refresh.bind(authController)
);

/**
 * POST /api/auth/logout
 * 
 * Logout user
 * 
 * Public endpoint (no authentication required)
 * Clears HTTP-only cookies for tokens
 */
router.post(
  '/logout',
  authController.logout.bind(authController)
);

/**
 * GET /api/auth/me
 * 
 * Get current user
 * 
 * Protected endpoint (authentication required)
 * Returns user data from authenticated request
 */
router.get(
  '/me',
  authenticationMiddleware,
  authController.me.bind(authController)
);

export default router;
