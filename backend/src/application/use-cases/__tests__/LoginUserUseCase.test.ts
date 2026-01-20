/**
 * LoginUserUseCase Unit Tests
 * 
 * Tests the login use case with various scenarios including
 * valid credentials, invalid credentials, and missing user.
 */

import { LoginUserUseCase } from '../LoginUserUseCase';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { PasswordService } from '../../../infrastructure/auth/PasswordService';
import { JWTService } from '../../../infrastructure/auth/JWTService';
import { User, Role } from '../../../domain/entities/User';
import { LoginDTO } from '../../dtos/UserDTO';

describe('LoginUserUseCase', () => {
  let loginUserUseCase: LoginUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockJWTService: jest.Mocked<JWTService>;

  beforeEach(() => {
    // Create mock repository
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IUserRepository>;

    // Create mock password service
    mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn()
    } as unknown as jest.Mocked<PasswordService>;

    // Create mock JWT service
    mockJWTService = {
      generateTokenPair: jest.fn(),
      generateAccessToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      decodeToken: jest.fn()
    } as unknown as jest.Mocked<JWTService>;

    // Create use case with mocks
    loginUserUseCase = new LoginUserUseCase(
      mockUserRepository,
      mockPasswordService,
      mockJWTService
    );
  });

  describe('execute', () => {
    const validLoginDTO: LoginDTO = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockUser = User.create({
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: Role.STUDENT,
      passwordHash: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verify.mockResolvedValue(true);
      mockJWTService.generateTokenPair.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      // Act
      const result = await loginUserUseCase.execute(validLoginDTO);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.verify).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockJWTService.generateTokenPair).toHaveBeenCalledWith({
        userId: 'user-id',
        email: 'test@example.com',
        role: Role.STUDENT
      });
      expect(result).toEqual({
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: Role.STUDENT,
          createdAt: mockUser.getCreatedAt(),
          updatedAt: mockUser.getUpdatedAt()
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
    });

    it('should throw error when email is missing', async () => {
      // Arrange
      const invalidDTO: LoginDTO = {
        email: '',
        password: 'password123'
      };

      // Act & Assert
      await expect(loginUserUseCase.execute(invalidDTO)).rejects.toThrow('Email is required');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error when password is missing', async () => {
      // Arrange
      const invalidDTO: LoginDTO = {
        email: 'test@example.com',
        password: ''
      };

      // Act & Assert
      await expect(loginUserUseCase.execute(invalidDTO)).rejects.toThrow('Password is required');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUserUseCase.execute(validLoginDTO)).rejects.toThrow('Invalid email or password');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.verify).not.toHaveBeenCalled();
    });

    it('should throw error when password is invalid', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(loginUserUseCase.execute(validLoginDTO)).rejects.toThrow('Invalid email or password');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.verify).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockJWTService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should generate tokens with correct payload', async () => {
      // Arrange
      const teacherUser = User.create({
        id: 'teacher-id',
        email: 'teacher@example.com',
        name: 'Teacher User',
        role: Role.TEACHER,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepository.findByEmail.mockResolvedValue(teacherUser);
      mockPasswordService.verify.mockResolvedValue(true);
      mockJWTService.generateTokenPair.mockReturnValue({
        accessToken: 'teacher-access-token',
        refreshToken: 'teacher-refresh-token'
      });

      // Act
      const result = await loginUserUseCase.execute({
        email: 'teacher@example.com',
        password: 'password123'
      });

      // Assert
      expect(mockJWTService.generateTokenPair).toHaveBeenCalledWith({
        userId: 'teacher-id',
        email: 'teacher@example.com',
        role: Role.TEACHER
      });
      expect(result.user.role).toBe(Role.TEACHER);
    });
  });
});
