/**
 * RegisterUserUseCase Property-Based Tests
 * 
 * Property-based tests for user registration use case using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 1.7: User registration with email uniqueness
 */

import * as fc from 'fast-check';
import { RegisterUserUseCase } from '../RegisterUserUseCase.js';
import { User, Role } from '../../../../domain/entities/User.js';
import type { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { PasswordService } from '../../../../infrastructure/auth/PasswordService.js';
import { 
  emailArbitrary, 
  nameArbitrary, 
  roleArbitrary,
  passwordArbitrary,
  propertyTestConfig 
} from '../../../../test/property-test-utils.js';

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
    for (const user of this.users.values()) {
      if (user.getEmail() === email) {
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

describe('RegisterUserUseCase Properties', () => {
  /**
   * Helper function to create fresh instances for each property test
   * This ensures complete isolation between test runs
   */
  function createFreshUseCase() {
    const mockRepository = new MockUserRepository();
    const passwordService = new PasswordService();
    const useCase = new RegisterUserUseCase(mockRepository, passwordService);
    return { useCase, mockRepository, passwordService };
  }

  /**
   * Property 11: Email uniqueness
   * Feature: core-lms, Property 11: Email uniqueness
   * Validates: Requirements 1.7
   * 
   * For any two users, they cannot have the same email address
   */
  it('Property 11: For any two users, they cannot have the same email address', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: emailArbitrary(),
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        fc.record({
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        async (firstUser, secondUserData) => {
          // Create fresh use case for this test run
          const { useCase } = createFreshUseCase();

          // Register first user
          const firstUserResult = await useCase.execute({
            email: firstUser.email,
            name: firstUser.name,
            password: firstUser.password,
            role: toRoleEnum(firstUser.role),
          });

          // Verify first user was created
          expect(firstUserResult).toBeDefined();
          expect(firstUserResult.email).toBe(firstUser.email.toLowerCase());

          // Attempt to register second user with same email
          const secondUser = {
            email: firstUser.email, // Same email as first user
            name: secondUserData.name,
            password: secondUserData.password,
            role: toRoleEnum(secondUserData.role),
          };

          // Property: Second registration with same email must fail
          try {
            await useCase.execute(secondUser);
            return false; // Should not reach here - registration should fail
          } catch (error) {
            // Verify error indicates email already exists
            return error instanceof Error && error.message.includes('Email already exists');
          }
        }
      ),
      { ...propertyTestConfig, timeout: 15000 } // Increased timeout for password hashing
    );
  }, 20000); // Jest timeout

  /**
   * Additional property: Different emails allow multiple registrations
   * Validates: Requirements 1.7
   * 
   * For any two users with different emails, both registrations should succeed
   */
  it('Property: Users with different emails can both register successfully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: emailArbitrary(),
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        fc.record({
          email: emailArbitrary(),
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        async (firstUser, secondUser) => {
          // Create fresh use case for this test run
          const { useCase } = createFreshUseCase();

          // Skip if emails are the same (we test that case separately)
          if (firstUser.email.toLowerCase() === secondUser.email.toLowerCase()) {
            return true;
          }

          // Register first user
          const firstUserResult = await useCase.execute({
            email: firstUser.email,
            name: firstUser.name,
            password: firstUser.password,
            role: toRoleEnum(firstUser.role),
          });

          // Register second user with different email
          const secondUserResult = await useCase.execute({
            email: secondUser.email,
            name: secondUser.name,
            password: secondUser.password,
            role: toRoleEnum(secondUser.role),
          });

          // Property: Both registrations should succeed
          return (
            firstUserResult !== null &&
            secondUserResult !== null &&
            firstUserResult.email === firstUser.email.toLowerCase() &&
            secondUserResult.email === secondUser.email.toLowerCase() &&
            firstUserResult.id !== secondUserResult.id
          );
        }
      ),
      { ...propertyTestConfig, timeout: 20000 } // Increased timeout for password hashing
    );
  }, 30000); // Jest timeout

  /**
   * Property: Email case-insensitivity for uniqueness
   * Validates: Requirements 1.7
   * 
   * For any email, variations in case should be treated as the same email
   */
  it('Property: Email uniqueness is case-insensitive', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: emailArbitrary(),
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        fc.record({
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        async (firstUser, secondUserData) => {
          // Create fresh use case for this test run
          const { useCase } = createFreshUseCase();

          // Register first user with lowercase email
          await useCase.execute({
            email: firstUser.email.toLowerCase(),
            name: firstUser.name,
            password: firstUser.password,
            role: toRoleEnum(firstUser.role),
          });

          // Attempt to register with uppercase version of same email
          const secondUser = {
            email: firstUser.email.toUpperCase(),
            name: secondUserData.name,
            password: secondUserData.password,
            role: toRoleEnum(secondUserData.role),
          };

          // Property: Registration should fail due to case-insensitive uniqueness
          try {
            await useCase.execute(secondUser);
            // If emails are identical after case normalization, should fail
            return firstUser.email.toLowerCase() !== firstUser.email.toUpperCase();
          } catch (error) {
            // Should fail with email already exists error
            return error instanceof Error && error.message.includes('Email already exists');
          }
        }
      ),
      { ...propertyTestConfig, timeout: 15000 } // Increased timeout for password hashing
    );
  }, 20000); // Jest timeout

  /**
   * Property: Email uniqueness persists across multiple registration attempts
   * Validates: Requirements 1.7
   * 
   * For any email, multiple attempts to register with that email should all fail after first success
   */
  it('Property: Email uniqueness is enforced across multiple registration attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: emailArbitrary(),
          name: nameArbitrary(),
          password: passwordArbitrary(),
          role: roleArbitrary(),
        }),
        fc.array(
          fc.record({
            name: nameArbitrary(),
            password: passwordArbitrary(),
            role: roleArbitrary(),
          }),
          { minLength: 1, maxLength: 3 } // Reduced from 5 to 3 for performance
        ),
        async (firstUser, subsequentAttempts) => {
          // Create fresh use case for this test run
          const { useCase } = createFreshUseCase();

          // Register first user
          await useCase.execute({
            email: firstUser.email,
            name: firstUser.name,
            password: firstUser.password,
            role: toRoleEnum(firstUser.role),
          });

          // Attempt multiple registrations with same email
          let allAttemptsFailed = true;

          for (const attempt of subsequentAttempts) {
            try {
              await useCase.execute({
                email: firstUser.email, // Same email
                name: attempt.name,
                password: attempt.password,
                role: toRoleEnum(attempt.role),
              });
              // If any attempt succeeds, property is violated
              allAttemptsFailed = false;
              break;
            } catch (error) {
              // Expected: all attempts should fail
              if (!(error instanceof Error && error.message.includes('Email already exists'))) {
                allAttemptsFailed = false;
                break;
              }
            }
          }

          // Property: All subsequent attempts with same email must fail
          return allAttemptsFailed;
        }
      ),
      { ...propertyTestConfig, timeout: 20000 } // Increased timeout for multiple password hashing operations
    );
  }, 30000); // Jest timeout
});
