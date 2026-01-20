/**
 * Password Service Property-Based Tests
 * 
 * Tests universal properties of password hashing using property-based testing.
 * 
 * Requirements:
 * - 20.1: Password hashing with BCrypt
 */

import fc from 'fast-check';
import { PasswordService } from '../PasswordService';

describe('PasswordService Property Tests', () => {
  let passwordService: PasswordService;

  beforeAll(() => {
    passwordService = new PasswordService();
  });

  /**
   * Property 9: Password hash uniqueness
   * Feature: core-lms, Property 9: For any password, hashing twice produces different hashes (due to salt)
   * 
   * Validates: Requirements 20.1
   * 
   * This property verifies that BCrypt generates unique hashes for the same password
   * due to random salt generation. This prevents rainbow table attacks.
   * 
   * Note: Reduced to 20 runs due to BCrypt's computational cost (10 salt rounds)
   */
  describe('Property 9: Password hash uniqueness', () => {
    it('should generate different hashes for the same password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 128 }),
          async (password: string) => {
            // Hash the same password twice
            const hash1 = await passwordService.hash(password);
            const hash2 = await passwordService.hash(password);

            // Hashes should be different due to random salt
            expect(hash1).not.toBe(hash2);

            // But both should verify against the original password
            const isValid1 = await passwordService.verify(password, hash1);
            const isValid2 = await passwordService.verify(password, hash2);

            expect(isValid1).toBe(true);
            expect(isValid2).toBe(true);
          }
        ),
        { numRuns: 20 } // Reduced from 100 due to BCrypt computational cost
      );
    });
  });

  /**
   * Additional Property: Password verification correctness
   * 
   * Verifies that correct passwords always verify successfully,
   * and incorrect passwords always fail verification.
   * 
   * Note: Reduced to 20 runs due to BCrypt's computational cost (10 salt rounds)
   */
  describe('Password verification correctness', () => {
    it('should verify correct passwords', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 128 }),
          async (password: string) => {
            // Hash password
            const hash = await passwordService.hash(password);

            // Verify with correct password
            const isValid = await passwordService.verify(password, hash);

            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 20 } // Reduced from 100 due to BCrypt computational cost
      );
    });

    it('should reject incorrect passwords', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 128 }),
          fc.string({ minLength: 8, maxLength: 128 }),
          async (password: string, wrongPassword: string) => {
            // Skip if passwords are the same
            fc.pre(password !== wrongPassword);

            // Hash correct password
            const hash = await passwordService.hash(password);

            // Verify with wrong password
            const isValid = await passwordService.verify(wrongPassword, hash);

            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 20 } // Reduced from 100 due to BCrypt computational cost
      );
    });
  });

  /**
   * Additional Property: Hash format consistency
   * 
   * Verifies that all generated hashes follow BCrypt format.
   * 
   * Note: Reduced to 20 runs due to BCrypt's computational cost (10 salt rounds)
   */
  describe('Hash format consistency', () => {
    it('should generate BCrypt-formatted hashes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 128 }),
          async (password: string) => {
            // Hash password
            const hash = await passwordService.hash(password);

            // BCrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
            // Format: $2a$10$... (where 10 is the cost factor)
            expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);

            // BCrypt hashes are 60 characters long
            expect(hash.length).toBe(60);
          }
        ),
        { numRuns: 20 } // Reduced from 100 due to BCrypt computational cost
      );
    });
  });

  /**
   * Additional Property: Error handling
   * 
   * Verifies that empty passwords are rejected.
   */
  describe('Error handling', () => {
    it('should reject empty passwords for hashing', async () => {
      await expect(passwordService.hash('')).rejects.toThrow('Password cannot be empty');
    });

    it('should reject empty passwords for verification', async () => {
      const hash = await passwordService.hash('validPassword123');
      await expect(passwordService.verify('', hash)).rejects.toThrow('Password cannot be empty');
    });

    it('should reject empty hashes for verification', async () => {
      await expect(passwordService.verify('validPassword123', '')).rejects.toThrow('Hashed password cannot be empty');
    });
  });
});
