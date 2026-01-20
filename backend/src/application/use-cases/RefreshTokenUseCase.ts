/**
 * Refresh Token Use Case
 * 
 * Handles token refresh by validating refresh token
 * and generating a new access token.
 * 
 * Requirements:
 * - 1.4: Token-based session management with refresh tokens
 */

import { injectable, inject } from 'tsyringe';
import { JWTService } from '../../infrastructure/auth/JWTService';
import { RefreshTokenResponseDTO } from '../dtos/UserDTO';

@injectable()
export class RefreshTokenUseCase {
  constructor(
    @inject(JWTService) private jwtService: JWTService
  ) {}

  /**
   * Execute token refresh
   * 
   * @param refreshToken - Valid refresh token
   * @returns RefreshTokenResponseDTO with new access token
   * @throws Error if refresh token is invalid or expired
   */
  async execute(refreshToken: string): Promise<RefreshTokenResponseDTO> {
    // Validate input
    if (!refreshToken || refreshToken.trim().length === 0) {
      throw new Error('Refresh token is required');
    }

    // Verify refresh token (Requirement 1.4)
    // This will throw an error if token is invalid or expired
    const payload = this.jwtService.verifyRefreshToken(refreshToken);

    // Generate new access token with same payload
    const accessToken = this.jwtService.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });

    // Return new access token
    return {
      accessToken
    };
  }
}
