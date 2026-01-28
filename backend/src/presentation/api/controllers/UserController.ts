/**
 * User Profile Controller
 * 
 * Handles HTTP requests for user profile management endpoints.
 * Delegates business logic to use cases.
 * 
 * Requirements:
 * - 1.1: View profile information
 * - 1.2: Edit name
 * - 1.3: Change password
 * - 4.1: API endpoints for profile operations
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { GetCurrentUserProfileUseCase } from '../../../application/use-cases/user/GetCurrentUserProfileUseCase';
import { UpdateUserProfileUseCase } from '../../../application/use-cases/user/UpdateUserProfileUseCase';
import { ChangePasswordUseCase } from '../../../application/use-cases/user/ChangePasswordUseCase';
import type { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';

/**
 * User Profile Controller
 * 
 * Thin controller that delegates to use cases and manages HTTP concerns.
 */
export class UserController {
  /**
   * Get current user profile
   * 
   * GET /api/users/profile
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Response (200 OK):
   * - profile: UserProfileDTO (id, name, email, role, createdAt, updatedAt)
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 404: User not found
   * - 500: Internal server error
   * 
   * Requirements: 1.1, 4.1
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const getProfileUseCase = container.resolve(GetCurrentUserProfileUseCase);
      const profile = await getProfileUseCase.execute(authenticatedReq.user.userId);
      
      // Return profile (200 OK)
      res.status(200).json({ profile });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Update user profile (name only)
   * 
   * PUT /api/users/profile
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Request body (validated by UpdateProfileRequestSchema):
   * - name: string (1-100 chars after trim)
   * 
   * Response (200 OK):
   * - profile: UserProfileDTO (updated profile)
   * 
   * Errors:
   * - 400: Validation failed (name empty or too long)
   * - 401: Authentication required (handled by middleware)
   * - 404: User not found
   * - 500: Internal server error
   * 
   * Requirements: 1.2, 2.2, 4.1
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const updateProfileUseCase = container.resolve(UpdateUserProfileUseCase);
      const profile = await updateProfileUseCase.execute(
        authenticatedReq.user.userId,
        req.body
      );
      
      // Return updated profile (200 OK)
      res.status(200).json({ profile });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Change user password
   * 
   * PUT /api/users/password
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Request body (validated by ChangePasswordRequestSchema):
   * - currentPassword: string
   * - newPassword: string (8+ chars)
   * - confirmPassword: string (must match newPassword)
   * 
   * Response (200 OK):
   * - result: ChangePasswordResultDTO (success, message)
   * 
   * Errors:
   * - 400: Validation failed or wrong current password
   * - 401: Authentication required (handled by middleware)
   * - 404: User not found
   * - 500: Internal server error
   * 
   * Requirements: 1.3, 2.3, 2.4, 2.5, 4.1
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const changePasswordUseCase = container.resolve(ChangePasswordUseCase);
      const result = await changePasswordUseCase.execute(
        authenticatedReq.user.userId,
        req.body
      );
      
      // Return result (200 OK)
      res.status(200).json({ result });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }
}
