/**
 * Authentication Middleware
 * 
 * Validates JWT access tokens and attaches user information to request.
 * Returns 401 Unauthorized for missing, invalid, or expired tokens.
 * 
 * Requirements:
 * - 1.3: Authentication required for protected endpoints
 * - 1.4: JWT token validation
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { JWTService, TokenPayload } from '../../../infrastructure/auth/JWTService.js';

/**
 * Extend Express Request to include user information
 */
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Authentication middleware
 * 
 * Validates JWT access token from HTTP-only cookie or Authorization header.
 * Attaches decoded user information to request.user.
 * Returns 401 for missing, invalid, or expired tokens.
 */
export function authenticationMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from HTTP-only cookie (primary method)
    let token = req.cookies?.access_token;

    // Fallback: Get token from Authorization header (Bearer token)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    // No token found
    if (!token) {
      res.status(401).json({
        code: 'AUTH_TOKEN_MISSING',
        message: 'Authentication token is required'
      });
      return;
    }

    // Verify token
    const jwtService = container.resolve(JWTService);
    const payload = jwtService.verifyAccessToken(token);

    // Attach user to request
    req.user = payload;

    // Continue to next middleware
    next();
  } catch (error) {
    // Handle token validation errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        res.status(401).json({
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Your session has expired. Please log in again.'
        });
        return;
      }

      if (error.message.includes('Invalid')) {
        res.status(401).json({
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid authentication token'
        });
        return;
      }
    }

    // Unexpected error
    res.status(401).json({
      code: 'AUTH_REQUIRED',
      message: 'Authentication required'
    });
  }
}
