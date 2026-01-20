/**
 * Login User Use Case
 * 
 * Handles user authentication with credential validation,
 * password verification, and JWT token generation.
 * 
 * Requirements:
 * - 1.1: User authentication with valid credentials
 * - 1.2: Password verification and token generation
 */

import { injectable, inject } from 'tsyringe';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { PasswordService } from '../../../infrastructure/auth/PasswordService';
import { JWTService } from '../../../infrastructure/auth/JWTService';
import { LoginDTO, LoginResponseDTO } from '../../dtos/UserDTO';
import { UserMapper } from '../../mappers/UserMapper';
import { ApplicationError } from '../../errors/ApplicationErrors';

@injectable()
export class LoginUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject(PasswordService) private passwordService: PasswordService,
    @inject(JWTService) private jwtService: JWTService
  ) {}

  /**
   * Execute user login
   * 
   * @param dto - LoginDTO with email and password
   * @returns LoginResponseDTO with user data and tokens
   * @throws Error if credentials are invalid
   * @throws Error if user not found
   */
  async execute(dto: LoginDTO): Promise<LoginResponseDTO> {
    // Validate input
    if (!dto.email || dto.email.trim().length === 0) {
      throw new ApplicationError('VALIDATION_FAILED', 'Email is required', 400);
    }

    if (!dto.password || dto.password.trim().length === 0) {
      throw new ApplicationError('VALIDATION_FAILED', 'Password is required', 400);
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new ApplicationError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password', 400);
    }

    // Verify password (Requirement 1.2)
    const isPasswordValid = await this.passwordService.verify(
      dto.password,
      user.getPasswordHash()
    );

    if (!isPasswordValid) {
      throw new ApplicationError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password', 400);
    }

    // Generate access and refresh tokens (Requirement 1.1, 1.2)
    const tokenPayload = {
      userId: user.getId(),
      email: user.getEmail(),
      role: user.getRole()
    };

    const { accessToken, refreshToken } = this.jwtService.generateTokenPair(tokenPayload);

    // Return user DTO and tokens
    return {
      user: UserMapper.toDTO(user),
      accessToken,
      refreshToken
    };
  }
}
