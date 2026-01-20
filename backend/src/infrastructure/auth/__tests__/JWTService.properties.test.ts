/**
 * JWT Service Property-Based Tests
 * 
 * Tests universal properties of JWT token lifecycle using property-based testing.
 * 
 * Requirements:
 * - 1.1: User authentication with JWT tokens
 * - 1.2: Secure session management
 * - 1.4: Token-based authentication
 */

import fc from 'fast-check';
import { JWTService, TokenPayload } from '../JWTService';

describe('JWTService Property Tests', () => {
  let jwtService: JWTService;

  beforeAll(() => {
    // Set up environment variables for testing
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-minimum-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-minimum-32-characters-long';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';

    jwtService = new JWTService();
  });

  /**
   * Property 8: Token expiration
   * Feature: core-lms, Property 8: For any valid token, it becomes invalid after expiry time
   * 
   * Validates: Requirements 1.1, 1.2
   * 
   * This property verifies that JWT tokens expire correctly and cannot be used
   * after their expiration time. This is critical for security.
   */
  describe('Property 8: Token expiration', () => {
    it('should generate valid tokens that can be verified immediately', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('STUDENT', 'TEACHER')
          }),
          async (payload: TokenPayload) => {
            // Generate token pair
            const { accessToken, refreshToken } = jwtService.generateTokenPair(payload);

            // Verify tokens are valid immediately after generation
            const decodedAccess = jwtService.verifyAccessToken(accessToken);
            const decodedRefresh = jwtService.verifyRefreshToken(refreshToken);

            // Verify payload matches
            expect(decodedAccess.userId).toBe(payload.userId);
            expect(decodedAccess.email).toBe(payload.email);
            expect(decodedAccess.role).toBe(payload.role);

            expect(decodedRefresh.userId).toBe(payload.userId);
            expect(decodedRefresh.email).toBe(payload.email);
            expect(decodedRefresh.role).toBe(payload.role);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject expired access tokens', async () => {
      // Create a JWT service with very short expiry for testing
      const originalExpiry = process.env.JWT_ACCESS_EXPIRY;
      process.env.JWT_ACCESS_EXPIRY = '1ms'; // 1 millisecond

      const shortLivedService = new JWTService();

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('STUDENT', 'TEACHER')
          }),
          async (payload: TokenPayload) => {
            // Generate token
            const { accessToken } = shortLivedService.generateTokenPair(payload);

            // Wait for token to expire (2ms to be safe)
            await new Promise(resolve => setTimeout(resolve, 2));

            // Verify token is now expired
            expect(() => shortLivedService.verifyAccessToken(accessToken))
              .toThrow('Access token has expired');
          }
        ),
        { numRuns: 50 } // Fewer runs due to setTimeout
      );

      // Restore original expiry
      process.env.JWT_ACCESS_EXPIRY = originalExpiry;
    });

    it('should reject expired refresh tokens', async () => {
      // Create a JWT service with very short expiry for testing
      const originalExpiry = process.env.JWT_REFRESH_EXPIRY;
      process.env.JWT_REFRESH_EXPIRY = '1ms'; // 1 millisecond

      const shortLivedService = new JWTService();

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('STUDENT', 'TEACHER')
          }),
          async (payload: TokenPayload) => {
            // Generate token
            const { refreshToken } = shortLivedService.generateTokenPair(payload);

            // Wait for token to expire (2ms to be safe)
            await new Promise(resolve => setTimeout(resolve, 2));

            // Verify token is now expired
            expect(() => shortLivedService.verifyRefreshToken(refreshToken))
              .toThrow('Refresh token has expired');
          }
        ),
        { numRuns: 50 } // Fewer runs due to setTimeout
      );

      // Restore original expiry
      process.env.JWT_REFRESH_EXPIRY = originalExpiry;
    });
  });

  /**
   * Additional Property: Token tampering detection
   * 
   * Verifies that tampered tokens are detected and rejected.
   * This ensures token integrity and prevents unauthorized access.
   */
  describe('Token tampering detection', () => {
    it('should reject tampered access tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('STUDENT', 'TEACHER')
          }),
          async (payload: TokenPayload) => {
            // Generate valid token
            const { accessToken } = jwtService.generateTokenPair(payload);

            // Tamper with token by modifying a character
            const tamperedToken = accessToken.slice(0, -5) + 'XXXXX';

            // Verify tampered token is rejected
            expect(() => jwtService.verifyAccessToken(tamperedToken))
              .toThrow('Invalid access token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject tampered refresh tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('STUDENT', 'TEACHER')
          }),
          async (payload: TokenPayload) => {
            // Generate valid token
            const { refreshToken } = jwtService.generateTokenPair(payload);

            // Tamper with token by modifying a character
            const tamperedToken = refreshToken.slice(0, -5) + 'XXXXX';

            // Verify tampered token is rejected
            expect(() => jwtService.verifyRefreshToken(tamperedToken))
              .toThrow('Invalid refresh token');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Token payload preservation
   * 
   * Verifies that token payload is preserved through encode/decode cycle.
   * This ensures data integrity in the authentication flow.
   */
  describe('Token payload preservation', () => {
    it('should preserve payload data through token lifecycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('STUDENT', 'TEACHER')
          }),
          async (payload: TokenPayload) => {
            // Generate token
            const { accessToken } = jwtService.generateTokenPair(payload);

            // Decode token
            const decoded = jwtService.verifyAccessToken(accessToken);

            // Verify all payload fields are preserved
            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.email).toBe(payload.email);
            expect(decoded.role).toBe(payload.role);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
