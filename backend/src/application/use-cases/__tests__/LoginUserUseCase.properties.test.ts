/**
 * LoginUserUseCase Property-Based Tests
 * 
 * Property-based tests for user login use case using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 1.1: User authentication with valid credentials
 */

import * as fc from 'fast-check';
import { LoginUserUseCase } from '../LoginUserUseCase';
import { RegisterUserUseCase } from '../RegisterUserUseCase';
import { User, Role } from '../../../domain/entities/User';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { PasswordService } from '../../../infrastructure/auth/PasswordService';
import { JWTService } from '../../../infrastructure/auth/JWTService';
import { 
  emailArbitrary, 
  nameArbitrary, 
  roleArbitrary,
  passwordArbitrary,
  propertyTestConfig 
} from '../../../test/property-test-utils';

// Helper function to convert string role to Role enum
function toRoleEnum(role: string): Role {
  return role === 'STUDENT' ? Role.STUDENT : Role.TEACHER;
}

// Mock repository
class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<User> {
    this.users.set(user.getId(), user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.getEmail().toLowerCase() === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  clear(): void {
    this.users.clear();
  }
}

describe('LoginUserUseCase Properties', () => {
  /**
   * Helper function to create fresh instances for each property test
   * This ensures complete isolation between test runs
   */
  function createFreshUseCases() {
    const mockRepository = new MockUserRepository();
    const passwordService = new PasswordService();
    const jwtService = new JWTService();
    const registerUseCase = new RegisterUserUseCase(mockRepository, passwordService);
    const loginUseCase = new LoginUserUseCase(mockRepository, passwordService, jwtService);
    return { registerUseCase, loginUseCase, mockRepository, passwordService, jwtService };
  }

  /**
   * Property 12: Valid credentials create session
   * Feature: core-lms, Property 12: Valid credentials create session
   * Validates: Requirements 1.1
   * 
   * For any valid user credentials, authentication succeeds and creates tokens
   */
  it('Property 12: For any valid user credentials, authentication succeeds and creates tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: emailArbitrary(),
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        async (userData) => {
          // Create fresh use cases for this test run
          const { registerUseCase, loginUseCase } = createFreshUseCases();

          // Register user first
          const registeredUser = await registerUseCase.execute({
            email: userData.email,
            name: userData.name,
            password: userData.password,
            role: toRoleEnum(userData.role),
          });

          // Property: Login with correct credentials should succeed
          const loginResult = await loginUseCase.execute({
            email: userData.email,
            password: userData.password,
          });

          // Verify login succeeded
          const loginSucceeded = (
            loginResult !== null &&
            loginResult.user !== null &&
            loginResult.accessToken !== null &&
            loginResult.refreshToken !== null &&
            loginResult.user.email === userData.email.toLowerCase() &&
            loginResult.user.id === registeredUser.id
          );

          return loginSucceeded;
        }
      ),
      { ...propertyTestConfig, timeout: 20000 } // Increased timeout for password hashing
    );
  }, 30000); // Jest timeout

  /**
   * Property: Invalid password fails authentication
   * Validates: Requirements 1.1
   * 
   * For any user, login with incorrect password must fail
   */
  it('Property: For any user, login with incorrect password must fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: emailArbitrary(),
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        passwordArbitrary(), // Different password for login attempt
        async (userData, wrongPassword) => {
          // Create fresh use cases for this test run
          const { registerUseCase, loginUseCase } = createFreshUseCases();

          // Skip if passwords are the same (we test that case separately)
          if (userData.password === wrongPassword) {
            return true;
          }

          // Register user first
          await registerUseCase.execute({
            email: userData.email,
            name: userData.name,
            password: userData.password,
            role: toRoleEnum(userData.role),
          });

          // Property: Login with wrong password should fail
          try {
            await loginUseCase.execute({
              email: userData.email,
              password: wrongPassword,
            });
            return false; // Should not reach here - login should fail
          } catch (error) {
            // Verify error indicates invalid credentials
            return error instanceof Error && error.message.includes('Invalid email or password');
          }
        }
      ),
      { ...propertyTestConfig, timeout: 20000 } // Increased timeout for password hashing
    );
  }, 30000); // Jest timeout

  /**
   * Property: Non-existent email fails authentication
   * Validates: Requirements 1.1
   * 
   * For any non-existent email, login must fail
   */
  it('Property: For any non-existent email, login must fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: emailArbitrary(),
          password: passwordArbitrary(),
        }),
        async (loginData) => {
          // Create fresh use cases for this test run (no user registered)
          const { loginUseCase } = createFreshUseCases();

          // Property: Login with non-existent email should fail
          try {
            await loginUseCase.execute({
              email: loginData.email,
              password: loginData.password,
            });
            return false; // Should not reach here - login should fail
          } catch (error) {
            // Verify error indicates invalid credentials
            return error instanceof Error && error.message.includes('Invalid email or password');
          }
        }
      ),
      propertyTestConfig
    );
  }, 10000); // Jest timeout

  /**
   * Property: Login is case-insensitive for email
   * Validates: Requirements 1.1
   * 
   * For any user, login with different email case should succeed
   */
  it('Property: Login is case-insensitive for email', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: emailArbitrary(),
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        async (userData) => {
          // Create fresh use cases for this test run
          const { registerUseCase, loginUseCase } = createFreshUseCases();

          // Register user with lowercase email
          await registerUseCase.execute({
            email: userData.email.toLowerCase(),
            name: userData.name,
            password: userData.password,
            role: toRoleEnum(userData.role),
          });

          // Property: Login with uppercase email should succeed
          const loginResult = await loginUseCase.execute({
            email: userData.email.toUpperCase(),
            password: userData.password,
          });

          // Verify login succeeded
          return (
            loginResult !== null &&
            loginResult.user !== null &&
            loginResult.accessToken !== null &&
            loginResult.refreshToken !== null
          );
        }
      ),
      { ...propertyTestConfig, timeout: 20000 } // Increased timeout for password hashing
    );
  }, 30000); // Jest timeout

  /**
   * Property: Tokens are generated for successful login
   * Validates: Requirements 1.1
   * 
   * For any successful login, both access and refresh tokens must be generated
   */
  it('Property: Successful login generates both access and refresh tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: emailArbitrary(),
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        async (userData) => {
          // Create fresh use cases for this test run
          const { registerUseCase, loginUseCase, jwtService } = createFreshUseCases();

          // Register user first
          await registerUseCase.execute({
            email: userData.email,
            name: userData.name,
            password: userData.password,
            role: toRoleEnum(userData.role),
          });

          // Login
          const loginResult = await loginUseCase.execute({
            email: userData.email,
            password: userData.password,
          });

          // Property: Both tokens should be valid JWT tokens
          const accessTokenValid = jwtService.verifyAccessToken(loginResult.accessToken) !== null;
          const refreshTokenValid = jwtService.verifyRefreshToken(loginResult.refreshToken) !== null;

          return (
            loginResult.accessToken.length > 0 &&
            loginResult.refreshToken.length > 0 &&
            accessTokenValid &&
            refreshTokenValid
          );
        }
      ),
      { ...propertyTestConfig, timeout: 20000 } // Increased timeout for password hashing
    );
  }, 30000); // Jest timeout
});
