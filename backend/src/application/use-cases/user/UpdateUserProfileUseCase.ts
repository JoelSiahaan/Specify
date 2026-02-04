/**
 * Update User Profile Use Case
 * 
 * Updates the current authenticated user's profile name.
 * 
 * Requirements:
 * - 1.2: Edit profile name
 * - 2.2: Name validation (1-100 chars after trim)
 * - 4.2: Profile data update
 */

import { injectable, inject } from 'tsyringe';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { UpdateUserProfileDTO, UserProfileDTO } from '../../dtos/UserDTO.js';
import { UserMapper } from '../../mappers/UserMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class UpdateUserProfileUseCase {
  constructor(
    @inject(PrismaUserRepository) private userRepository: IUserRepository
  ) {}

  /**
   * Execute update user profile
   * 
   * @param userId - User ID from JWT token
   * @param dto - UpdateUserProfileDTO containing new name
   * @returns Updated UserProfileDTO
   * @throws ApplicationError if user not found (404) or validation fails (400)
   */
  async execute(userId: string, dto: UpdateUserProfileDTO): Promise<UserProfileDTO> {
    // Find user by ID
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError('USER_NOT_FOUND', 'User not found', 404);
    }

    try {
      // Update name (entity validates: 1-100 chars after trim)
      user.updateName(dto.name);
      
      // Save updated user
      const updatedUser = await this.userRepository.save(user);
      
      // Return updated profile DTO
      return UserMapper.toProfileDTO(updatedUser);
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
}
