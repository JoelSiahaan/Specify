/**
 * Get Current User Use Case
 * 
 * Retrieves the current authenticated user's information.
 * 
 * Requirements:
 * - 1.3: Current user retrieval
 */

import { injectable, inject } from 'tsyringe';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { UserDTO } from '../../dtos/UserDTO.js';
import { UserMapper } from '../../mappers/UserMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class GetCurrentUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  /**
   * Execute get current user
   * 
   * @param userId - User ID from JWT token
   * @returns UserDTO of the current user
   * @throws ApplicationError if user not found
   */
  async execute(userId: string): Promise<UserDTO> {
    // Find user by ID
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new ApplicationError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Return user DTO (excludes password hash)
    return UserMapper.toDTO(user);
  }
}
