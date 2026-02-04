/**
 * Get Current User Profile Use Case
 * 
 * Retrieves the current authenticated user's profile information.
 * 
 * Requirements:
 * - 1.1: View profile information
 * - 4.2: Profile data retrieval
 */

import { injectable, inject } from 'tsyringe';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { UserProfileDTO } from '../../dtos/UserDTO.js';
import { UserMapper } from '../../mappers/UserMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class GetCurrentUserProfileUseCase {
  constructor(
    @inject(PrismaUserRepository) private userRepository: IUserRepository
  ) {}

  /**
   * Execute get current user profile
   * 
   * @param userId - User ID from JWT token
   * @returns UserProfileDTO of the current user
   * @throws ApplicationError if user not found (404)
   */
  async execute(userId: string): Promise<UserProfileDTO> {
    // Find user by ID
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Return user profile DTO (excludes password hash)
    return UserMapper.toProfileDTO(user);
  }
}
