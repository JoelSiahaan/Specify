/**
 * JWT Authentication Service
 * 
 * Handles JWT token generation and validation for authentication.
 * Uses separate secrets for access and refresh tokens.
 * 
 * Requirements:
 * - 1.1: User authentication with JWT tokens
 * - 1.4: Token-based session management
 */

import jwt from 'jsonwebtoken';
import { injectable } from 'tsyringe';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@injectable()
export class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    // Load secrets from environment variables
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    // Validate secrets are configured
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets must be configured in environment variables');
    }

    // Validate secrets are different
    if (this.accessTokenSecret === this.refreshTokenSecret) {
      throw new Error('Access and refresh token secrets must be different');
    }

    // Validate secrets are long enough (minimum 32 characters)
    if (this.accessTokenSecret.length < 32 || this.refreshTokenSecret.length < 32) {
      throw new Error('JWT secrets must be at least 32 characters long');
    }
  }

  /**
   * Generate access and refresh token pair
   */
  generateTokenPair(payload: TokenPayload): TokenPair {
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'lms-api',
      audience: 'lms-client'
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'lms-api',
      audience: 'lms-client'
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * Generate new access token from refresh token
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'lms-api',
      audience: 'lms-client'
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode access token
   * @throws Error if token is invalid or expired
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'lms-api',
        audience: 'lms-client'
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify and decode refresh token
   * @throws Error if token is invalid or expired
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'lms-api',
        audience: 'lms-client'
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging/testing)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}
