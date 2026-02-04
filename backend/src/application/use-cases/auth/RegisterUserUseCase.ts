/**
 * Register User Use Case
 * 
 * Handles user registration with email validation, password hashing,
 * and role assignment.
 * 
 * Requirements:
 * - 1.7: User registration with email, password, name, and role selection
 * - 20.1: Password hashing before storage
 */

import { injectable, inject } from 'tsyringe';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { PrismaUserRepository } from '../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { PasswordService } from '../../../infrastructure/auth/PasswordService.js';
import { Email } from '../../../domain/value-objects/Email.js';
import { CreateUserDTO, UserDTO } from '../../dtos/UserDTO.js';
import { UserMapper } from '../../mappers/UserMapper.js';
import { ApplicationError } from '../../errors/ApplicationErrors.js';

@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject(PrismaUserRepository) private userRepository: IUserRepository,
    @inject(PasswordService) private passwordService: PasswordService
  ) {}

  /**
   * Execute user registration
   * 
   * @param dto - CreateUserDTO with user registration data
   * @returns UserDTO of the created user
   * @throws Error if email is invalid or already exists
   * @throws Error if password is empty
   * @throws Error if role is invalid
   */
  async execute(dto: CreateUserDTO): Promise<UserDTO> {
    // Validate email format using Email value object
    const email = Email.create(dto.email);

    // Check email uniqueness
    const existingUser = await this.userRepository.findByEmail(email.getValue());
    if (existingUser) {
      throw new ApplicationError('DUPLICATE_ENTRY', 'Email already exists', 400);
    }

    // Validate password is provided
    if (!dto.password || dto.password.trim().length === 0) {
      throw new ApplicationError('VALIDATION_FAILED', 'Password is required', 400);
    }

    // Hash password before storage (Requirement 20.1)
    const passwordHash = await this.passwordService.hash(dto.password);

    // Create user entity with hashed password
    const user = UserMapper.toDomain(dto, passwordHash);

    // Save user to repository
    const savedUser = await this.userRepository.save(user);

    // Return user DTO (excludes password hash)
    return UserMapper.toDTO(savedUser);
  }
}
