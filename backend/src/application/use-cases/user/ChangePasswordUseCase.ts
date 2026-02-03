/**
 * Change Password Use Case
 * 
 * Changes the current authenticated user's password after verifying the current password.
 * 
 * Requirements:
 * - 1.3: Change password functionality
 * - 2.3: Password strength validation
 * - 2.4: BCrypt hashing
 * - 2.5: Session remains valid after password change
 * - 4.3: Secure password change flow
 */

import { injectable, inject } from 'tsyringe';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PasswordService } from '../../../infrastructure/auth/PasswordService.js';
import { ChangePasswordDTO, ChangePasswordResultDTO } from '../../dtos/UserDTO.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class ChangePasswordUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject(PasswordService) private passwordService: PasswordService
  ) {}

  /**
   * Execute change password
   * 
   * @param userId - User ID from JWT token
   * @param dto - ChangePasswordDTO containing current, new, and confirm passwords
   * @returns ChangePasswordResultDTO with success status and message
   * @throws ApplicationError if user not found (404), wrong password (400), or validation fails (400)
   */
  async execute(userId: string, dto: ChangePasswordDTO): Promise<ChangePasswordResultDTO> {
    // Validate that new password and confirm password match
    if (dto.newPassword !== dto.confirmPassword) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'New password and confirmation password do not match',
        400
      );
    }

    // Find user by ID
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.verify(
      dto.currentPassword,
      user.getPasswordHash()
    );

    if (!isCurrentPasswordValid) {
      throw new ApplicationError(
        'INVALID_CURRENT_PASSWORD',
        'Current password is incorrect',
        400
      );
    }

    // Validate password strength (minimum 8 characters)
    this.validatePasswordStrength(dto.newPassword);

    // Check that new password is different from current password
    const isSamePassword = await this.passwordService.verify(
      dto.newPassword,
      user.getPasswordHash()
    );

    if (isSamePassword) {
      throw new ApplicationError(
        'PASSWORD_REUSE_NOT_ALLOWED',
        'New password must be different from current password',
        400
      );
    }

    try {
      // Hash new password with BCrypt
      const newPasswordHash = await this.passwordService.hash(dto.newPassword);
      
      // Update password hash in user entity
      user.updatePasswordHash(newPasswordHash);
      
      // Save updated user
      await this.userRepository.save(user);
      
      // Return success result
      // Note: Session remains valid (JWT token not invalidated)
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      // Handle domain validation errors
      if (error instanceof Error) {
        throw new ApplicationError(
          'VALIDATION_FAILED',
          error.message,
          400
        );
      }
      throw error;
    }
  }

  /**
   * Validate password strength
   * 
   * Requirements:
   * - Minimum 8 characters
   * - Maximum 128 characters
   * 
   * @param password - Password to validate
   * @throws ApplicationError if password doesn't meet requirements
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Password must be at least 8 characters long',
        400
      );
    }

    if (password.length > 128) {
      throw new ApplicationError(
        'VALIDATION_FAILED',
        'Password must be 128 characters or less',
        400
      );
    }
  }
}
