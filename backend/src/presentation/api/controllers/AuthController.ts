/**
 * Authentication Controller
 * 
 * Handles HTTP requests for authentication endpoints.
 * Delegates business logic to use cases and manages HTTP-only cookies for tokens.
 * 
 * Requirements:
 * - 1.1: User authentication with valid credentials
 * - 1.2: Password verification and token generation
 * - 1.4: Token-based session management with refresh tokens
 * - 1.6: Logout capability
 * - 1.7: User registration with email, password, name, and role selection
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/use-cases/auth/LoginUserUseCase';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/RefreshTokenUseCase';
import { LogoutUserUseCase } from '../../../application/use-cases/auth/LogoutUserUseCase';
import { GetCurrentUserUseCase } from '../../../application/use-cases/auth/GetCurrentUserUseCase';
import type { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';

/**
 * Cookie configuration for JWT tokens
 * 
 * Security features:
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - sameSite: 'lax' in development (allows cookies from localhost/127.0.0.1)
 * - sameSite: 'strict' in production (prevents CSRF attacks)
 * - secure: HTTPS only in production
 * - path: Scoped to /api to limit exposure
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/api'
};

/**
 * Access token expiry: 15 minutes
 */
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Refresh token expiry: 7 days
 */
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Authentication Controller
 * 
 * Thin controller that delegates to use cases and manages HTTP concerns.
 */
export class AuthController {
  /**
   * Register new user
   * 
   * POST /api/auth/register
   * 
   * Request body (validated by RegisterRequestSchema):
   * - email: string (RFC 5322 format, normalized to lowercase)
   * - password: string (min 8 characters)
   * - name: string (min 1 character)
   * - role: 'STUDENT' | 'TEACHER'
   * 
   * Response (201 Created):
   * - user: UserDTO (excludes password hash)
   * 
   * Response format: { user: UserDTO }
   * 
   * Errors:
   * - 400: Validation failed or email already exists
   * - 500: Internal server error
   * 
   * Requirements: 1.7, 20.1
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registerUseCase = container.resolve(RegisterUserUseCase);
      
      // Execute use case
      const user = await registerUseCase.execute(req.body);
      
      // Return created user wrapped in object (consistent with login and me endpoints)
      res.status(201).json({ user });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Login user
   * 
   * POST /api/auth/login
   * 
   * Request body (validated by LoginRequestSchema):
   * - email: string (RFC 5322 format, normalized to lowercase)
   * - password: string
   * 
   * Response (200 OK):
   * - user: UserDTO (excludes password hash)
   * 
   * Sets HTTP-only cookies:
   * - access_token: JWT access token (15 min expiry)
   * - refresh_token: JWT refresh token (7 day expiry)
   * 
   * Errors:
   * - 400: Validation failed or invalid credentials
   * - 500: Internal server error
   * 
   * Requirements: 1.1, 1.2
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginUseCase = container.resolve(LoginUserUseCase);
      
      // Execute use case
      const { user, accessToken, refreshToken } = await loginUseCase.execute(req.body);
      
      // Set HTTP-only cookies for tokens
      res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE
      });
      
      res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: REFRESH_TOKEN_MAX_AGE
      });
      
      // Return user data (200 OK)
      res.status(200).json({ user });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Refresh access token
   * 
   * POST /api/auth/refresh
   * 
   * Reads refresh_token from HTTP-only cookie
   * 
   * Response (200 OK):
   * - message: Success message
   * 
   * Sets HTTP-only cookie:
   * - access_token: New JWT access token (15 min expiry)
   * 
   * Errors:
   * - 401: Refresh token missing, invalid, or expired
   * - 500: Internal server error
   * 
   * Requirements: 1.4
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get refresh token from HTTP-only cookie
      const refreshToken = req.cookies.refresh_token;
      
      if (!refreshToken) {
        res.status(401).json({
          code: 'AUTH_REFRESH_TOKEN_MISSING',
          message: 'Refresh token is required'
        });
        return;
      }
      
      const refreshTokenUseCase = container.resolve(RefreshTokenUseCase);
      
      // Execute use case
      const { accessToken } = await refreshTokenUseCase.execute(refreshToken);
      
      // Set new access token in HTTP-only cookie
      res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE
      });
      
      // Return success message (200 OK)
      res.status(200).json({
        message: 'Access token refreshed successfully'
      });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Logout user
   * 
   * POST /api/auth/logout
   * 
   * Clears HTTP-only cookies for tokens.
   * In stateless JWT approach, logout is client-side (cookie removal).
   * 
   * Response (200 OK):
   * - message: Success message
   * 
   * Requirements: 1.6
   */
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logoutUseCase = new LogoutUserUseCase();
      
      // Execute use case (returns success message)
      const result = await logoutUseCase.execute();
      
      // Clear HTTP-only cookies
      res.clearCookie('access_token', COOKIE_OPTIONS);
      res.clearCookie('refresh_token', COOKIE_OPTIONS);
      
      // Return success message (200 OK)
      res.status(200).json(result);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Get current user
   * 
   * GET /api/auth/me
   * 
   * Requires authentication (AuthenticationMiddleware)
   * 
   * Response (200 OK):
   * - user: UserDTO from authenticated request
   * 
   * Errors:
   * - 401: Authentication required (handled by middleware)
   * - 404: User not found
   * - 500: Internal server error
   * 
   * Requirements: 1.3
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      
      // Fetch full user from repository
      const getCurrentUserUseCase = container.resolve(GetCurrentUserUseCase);
      const user = await getCurrentUserUseCase.execute(authenticatedReq.user.userId);
      
      // Return current user (200 OK)
      res.status(200).json({ user });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }
}
