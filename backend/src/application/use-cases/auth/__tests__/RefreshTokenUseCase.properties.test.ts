/**
 * RefreshTokenUseCase Property-Based Tests
 * 
 * Property-based tests for token refresh use case using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 1.4: Token-based session management with refresh tokens
 * - 1.6: Refresh token mechanism
 */

import * as fc from 'fast-check';
import { RefreshTokenUseCase } from '../RefreshTokenUseCase';
import { JWTService } from '../../../../infrastructure/auth/JWTService';
import { 
  emailArbitrary, 
  roleArbitrary,
  propertyTestConfig 
} from '../../../../test/property-test-utils';

// Helper to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

describe('RefreshTokenUseCase Properties', () => {
  /**
   * Helper function to create fresh instances for each property test
   * This ensures complete isolation between test runs
   */
  function createFreshUseCase() {
    const jwtService = new JWTService();
    const useCase = new RefreshTokenUseCase(jwtService);
    return { useCase, jwtService };
  }

  /**
   * Property 5: Refresh token mechanism works
   * Feature: core-lms, Property 5: Refresh token mechanism works
   * Validates: Requirements 1.4, 1.6
   * 
   * For any valid refresh token, the system should generate a new access token,
   * and the new token should authorize requests
   */
  it('Property 5: For any valid refresh token, system generates new access token that authorizes requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          email: emailArbitrary(),
          role: roleArbitrary(),
        }),
        async (tokenPayload) => {
          // Create fresh use case for this test run
          const { useCase, jwtService } = createFreshUseCase();

          // Generate initial token pair
          const { refreshToken } = jwtService.generateTokenPair({
            userId: tokenPayload.userId,
            email: tokenPayload.email,
            role: tokenPayload.role
          });

          // Property: Refresh token should generate new access token
          const result = await useCase.execute(refreshToken);

          // Verify new access token is generated
          const accessTokenGenerated = (
            result !== null &&
            result.accessToken !== null &&
            result.accessToken.length > 0
          );

          if (!accessTokenGenerated) {
            return false;
          }

          // Verify new access token is valid and can authorize requests
          try {
            const decodedPayload = jwtService.verifyAccessToken(result.accessToken);
            
            // Verify payload matches original
            const payloadMatches = (
              decodedPayload.userId === tokenPayload.userId &&
              decodedPayload.email === tokenPayload.email &&
              decodedPayload.role === tokenPayload.role
            );

            return payloadMatches;
          } catch (error) {
            // If verification fails, property is violated
            return false;
          }
        }
      ),
      propertyTestConfig
    );
  }, 15000); // Jest timeout

  /**
   * Property: Refresh token can be used multiple times
   * Validates: Requirements 1.4, 1.6
   * 
   * For any valid refresh token, it can be used multiple times to generate new access tokens
   */
  it('Property: Refresh token can be used multiple times to generate new access tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          email: emailArbitrary(),
          role: roleArbitrary(),
        }),
        fc.integer({ min: 2, max: 3 }), // Reduced from 5 to 3 for performance
        async (tokenPayload, refreshCount) => {
          // Create fresh use case for this test run
          const { useCase, jwtService } = createFreshUseCase();

          // Generate initial token pair
          const { refreshToken } = jwtService.generateTokenPair({
            userId: tokenPayload.userId,
            email: tokenPayload.email,
            role: tokenPayload.role
          });

          // Property: Refresh token should work multiple times
          const accessTokens: string[] = [];

          for (let i = 0; i < refreshCount; i++) {
            const result = await useCase.execute(refreshToken);
            accessTokens.push(result.accessToken);

            // Verify each access token is valid
            const decodedPayload = jwtService.verifyAccessToken(result.accessToken);
            if (
              decodedPayload.userId !== tokenPayload.userId ||
              decodedPayload.email !== tokenPayload.email ||
              decodedPayload.role !== tokenPayload.role
            ) {
              return false;
            }

            // No delay needed - tokens will have different iat anyway
          }

          // All refresh attempts should succeed
          return accessTokens.length === refreshCount;
        }
      ),
      { ...propertyTestConfig, timeout: 10000 }
    );
  }, 30000); // Increased Jest timeout

  /**
   * Property: Invalid refresh token always fails
   * Validates: Requirements 1.4, 1.6
   * 
   * For any invalid refresh token, the system should reject it
   */
  it('Property: Invalid refresh token always fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }), // Random invalid token
        async (invalidToken) => {
          // Create fresh use case for this test run
          const { useCase } = createFreshUseCase();

          // Property: Invalid token should always fail
          try {
            await useCase.execute(invalidToken);
            return false; // Should not reach here
          } catch (error) {
            // Should fail with appropriate error
            return error instanceof Error && (
              error.message.includes('Invalid refresh token') ||
              error.message.includes('jwt malformed') ||
              error.message.includes('invalid token')
            );
          }
        }
      ),
      propertyTestConfig
    );
  }, 15000); // Jest timeout

  /**
   * Property: Access token cannot be used as refresh token
   * Validates: Requirements 1.4, 1.6
   * 
   * For any access token, it should not be accepted as a refresh token
   */
  it('Property: Access token cannot be used as refresh token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          email: emailArbitrary(),
          role: roleArbitrary(),
        }),
        async (tokenPayload) => {
          // Create fresh use case for this test run
          const { useCase, jwtService } = createFreshUseCase();

          // Generate token pair
          const { accessToken } = jwtService.generateTokenPair({
            userId: tokenPayload.userId,
            email: tokenPayload.email,
            role: tokenPayload.role
          });

          // Property: Access token should not work as refresh token
          try {
            await useCase.execute(accessToken);
            return false; // Should not reach here
          } catch (error) {
            // Should fail with invalid token error
            return error instanceof Error && error.message.includes('Invalid refresh token');
          }
        }
      ),
      propertyTestConfig
    );
  }, 15000); // Jest timeout

  /**
   * Property: Refresh token preserves user identity
   * Validates: Requirements 1.4, 1.6
   * 
   * For any user, refreshing token preserves their identity (userId, email, role)
   */
  it('Property: Refresh token preserves user identity across refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          email: emailArbitrary(),
          role: roleArbitrary(),
        }),
        async (tokenPayload) => {
          // Create fresh use case for this test run
          const { useCase, jwtService } = createFreshUseCase();

          // Generate initial token pair
          const { refreshToken } = jwtService.generateTokenPair({
            userId: tokenPayload.userId,
            email: tokenPayload.email,
            role: tokenPayload.role
          });

          // Refresh token
          const result = await useCase.execute(refreshToken);

          // Verify identity is preserved
          const decodedPayload = jwtService.verifyAccessToken(result.accessToken);

          // Property: All identity fields must match exactly
          return (
            decodedPayload.userId === tokenPayload.userId &&
            decodedPayload.email === tokenPayload.email &&
            decodedPayload.role === tokenPayload.role
          );
        }
      ),
      propertyTestConfig
    );
  }, 15000); // Jest timeout

  /**
   * Property: Empty or whitespace refresh token always fails
   * Validates: Requirements 1.4, 1.6
   * 
   * For any empty or whitespace-only string, refresh should fail
   */
  it('Property: Empty or whitespace refresh token always fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter(s => s.trim().length === 0), // Empty or whitespace strings
        async (emptyToken) => {
          // Create fresh use case for this test run
          const { useCase } = createFreshUseCase();

          // Property: Empty token should always fail
          try {
            await useCase.execute(emptyToken);
            return false; // Should not reach here
          } catch (error) {
            // Should fail with required error
            return error instanceof Error && error.message.includes('Refresh token is required');
          }
        }
      ),
      propertyTestConfig
    );
  }, 10000); // Jest timeout

  /**
   * Property: Refresh token works for both student and teacher roles
   * Validates: Requirements 1.4, 1.6
   * 
   * For any role (student or teacher), refresh token mechanism should work
   */
  it('Property: Refresh token works for both student and teacher roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          email: emailArbitrary(),
          role: roleArbitrary(), // Will be either STUDENT or TEACHER
        }),
        async (tokenPayload) => {
          // Create fresh use case for this test run
          const { useCase, jwtService } = createFreshUseCase();

          // Generate token pair
          const { refreshToken } = jwtService.generateTokenPair({
            userId: tokenPayload.userId,
            email: tokenPayload.email,
            role: tokenPayload.role
          });

          // Refresh token
          const result = await useCase.execute(refreshToken);

          // Verify new access token is valid
          const decodedPayload = jwtService.verifyAccessToken(result.accessToken);

          // Property: Role should be preserved and valid
          return (
            decodedPayload.role === tokenPayload.role &&
            (decodedPayload.role === 'STUDENT' || decodedPayload.role === 'TEACHER')
          );
        }
      ),
      propertyTestConfig
    );
  }, 15000); // Jest timeout
});
