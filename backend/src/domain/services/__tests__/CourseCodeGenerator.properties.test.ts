/**
 * CourseCodeGenerator Property-Based Tests
 * 
 * Tests universal properties of course code generation with retry logic.
 * 
 * Requirements:
 * - 5.1: Generate unique course codes (6-character alphanumeric)
 * - 5.2: Handle code collisions with retry logic (max 5 attempts)
 */

import fc from 'fast-check';
import { CourseCodeGenerator, ICourseCodeChecker } from '../CourseCodeGenerator';
import { CourseCode } from '../../value-objects/CourseCode';

describe('CourseCodeGenerator Property Tests', () => {
  /**
   * Property 7: Code generation retry limit
   * Feature: core-lms, Property 7: For any code generation with collisions, max 5 retries before failure
   * 
   * Validates: Requirements 5.1, 5.2
   * 
   * This property verifies that the generator respects the maximum retry limit
   * and fails gracefully when all retries are exhausted.
   */
  describe('Property 7: Code generation retry limit', () => {
    it('should fail after exactly 5 attempts when all codes are not unique', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), // Arbitrary seed for test variation
          async (seed) => {
            // Create a mock checker that always returns false (code not unique)
            const mockChecker: ICourseCodeChecker = {
              isUnique: jest.fn().mockResolvedValue(false)
            };

            const generator = new CourseCodeGenerator(mockChecker);

            // Attempt to generate code (should fail after 5 retries)
            await expect(generator.generate()).rejects.toThrow(
              'Failed to generate unique course code after 5 attempts'
            );

            // Verify exactly 5 attempts were made
            expect(mockChecker.isUnique).toHaveBeenCalledTimes(5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should succeed on any attempt from 1 to 5 when code becomes unique', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }), // Success on attempt 1-5
          async (successAttempt) => {
            let callCount = 0;
            
            // Create a mock checker that returns false until successAttempt
            const mockChecker: ICourseCodeChecker = {
              isUnique: jest.fn().mockImplementation(async () => {
                callCount++;
                return callCount === successAttempt;
              })
            };

            const generator = new CourseCodeGenerator(mockChecker);

            // Generate code (should succeed on specified attempt)
            const code = await generator.generate();

            // Verify code was generated
            expect(code).toBeInstanceOf(CourseCode);
            expect(code.getValue()).toHaveLength(6);
            expect(code.getValue()).toMatch(/^[A-Z0-9]{6}$/);

            // Verify correct number of attempts
            expect(mockChecker.isUnique).toHaveBeenCalledTimes(successAttempt);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not exceed 5 attempts regardless of collision pattern', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.boolean(), { minLength: 10, maxLength: 20 }), // Random collision pattern
          async (collisionPattern) => {
            let callCount = 0;
            
            // Create a mock checker that follows the collision pattern
            const mockChecker: ICourseCodeChecker = {
              isUnique: jest.fn().mockImplementation(async () => {
                const result = collisionPattern[callCount] || false;
                callCount++;
                return result;
              })
            };

            const generator = new CourseCodeGenerator(mockChecker);

            try {
              await generator.generate();
              // If successful, should have stopped at first true (at most 5 attempts)
              const callsMade = (mockChecker.isUnique as jest.Mock).mock.calls.length;
              expect(callsMade).toBeLessThanOrEqual(5);
              expect(callsMade).toBeGreaterThanOrEqual(1);
              
              // Verify it stopped at the first true value
              const firstTrueIndex = collisionPattern.findIndex(v => v === true);
              if (firstTrueIndex !== -1 && firstTrueIndex < 5) {
                expect(callsMade).toBe(firstTrueIndex + 1);
              }
            } catch (error) {
              // If failed, should have called isUnique exactly 5 times
              expect(mockChecker.isUnique).toHaveBeenCalledTimes(5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Course code uniqueness with retry
   * Feature: core-lms, Property 13: For any code generation with collisions, max 5 retries before failure
   * 
   * Validates: Requirements 5.1, 5.2
   * 
   * This property verifies that the generator always produces unique codes
   * when uniqueness is eventually available within the retry limit.
   */
  describe('Property 13: Course code uniqueness with retry', () => {
    it('should always generate valid 6-character alphanumeric codes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), // Arbitrary seed
          async (seed) => {
            // Create a mock checker that always returns true (code is unique)
            const mockChecker: ICourseCodeChecker = {
              isUnique: jest.fn().mockResolvedValue(true)
            };

            const generator = new CourseCodeGenerator(mockChecker);

            // Generate code
            const code = await generator.generate();

            // Verify code format
            expect(code).toBeInstanceOf(CourseCode);
            expect(code.getValue()).toHaveLength(6);
            expect(code.getValue()).toMatch(/^[A-Z0-9]{6}$/);
            
            // Verify each character is alphanumeric
            const codeValue = code.getValue();
            for (let i = 0; i < codeValue.length; i++) {
              const char = codeValue[i];
              expect('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789').toContain(char);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate unique codes when checker confirms uniqueness', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 4 }), // Collisions before success
          async (collisionCount) => {
            const generatedCodes: string[] = [];
            let callCount = 0;
            
            // Create a mock checker that tracks generated codes
            const mockChecker: ICourseCodeChecker = {
              isUnique: jest.fn().mockImplementation(async (code: CourseCode) => {
                callCount++;
                const codeValue = code.getValue();
                generatedCodes.push(codeValue);
                
                // Return true after specified collisions
                return callCount > collisionCount;
              })
            };

            const generator = new CourseCodeGenerator(mockChecker);

            // Generate code
            const code = await generator.generate();

            // Verify code was generated
            expect(code).toBeInstanceOf(CourseCode);
            
            // Verify correct number of attempts
            expect(mockChecker.isUnique).toHaveBeenCalledTimes(collisionCount + 1);
            
            // Verify all generated codes were valid
            generatedCodes.forEach(codeValue => {
              expect(codeValue).toHaveLength(6);
              expect(codeValue).toMatch(/^[A-Z0-9]{6}$/);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should pass CourseCode objects to uniqueness checker', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), // Arbitrary seed
          async (seed) => {
            const mockChecker: ICourseCodeChecker = {
              isUnique: jest.fn().mockResolvedValue(true)
            };

            const generator = new CourseCodeGenerator(mockChecker);

            // Generate code
            await generator.generate();

            // Verify checker was called with CourseCode instance
            expect(mockChecker.isUnique).toHaveBeenCalledWith(
              expect.any(CourseCode)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle varying collision patterns within retry limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }), // Collision pattern (max 5)
          async (uniquenessPattern) => {
            let callCount = 0;
            
            // Create a mock checker that follows the pattern
            const mockChecker: ICourseCodeChecker = {
              isUnique: jest.fn().mockImplementation(async () => {
                const result = uniquenessPattern[callCount] || false;
                callCount++;
                return result;
              })
            };

            const generator = new CourseCodeGenerator(mockChecker);

            // Find if pattern has a true value within first 5 positions
            const firstTrueIndex = uniquenessPattern.findIndex(v => v === true);
            const hasSuccessWithinLimit = firstTrueIndex !== -1 && firstTrueIndex < 5;

            if (hasSuccessWithinLimit) {
              // Should succeed and stop at first true
              const code = await generator.generate();
              expect(code).toBeInstanceOf(CourseCode);
              expect(mockChecker.isUnique).toHaveBeenCalledTimes(firstTrueIndex + 1);
            } else {
              // Should fail after exactly 5 attempts (no true value in first 5 positions)
              await expect(generator.generate()).rejects.toThrow(
                'Failed to generate unique course code after 5 attempts'
              );
              expect(mockChecker.isUnique).toHaveBeenCalledTimes(5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Code format consistency
   * 
   * Verifies that all generated codes follow the same format regardless
   * of retry attempts or collision patterns.
   */
  describe('Code format consistency', () => {
    it('should generate codes with consistent format across all attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }), // Number of attempts before success
          async (attemptsBeforeSuccess) => {
            const generatedCodes: string[] = [];
            let callCount = 0;
            
            const mockChecker: ICourseCodeChecker = {
              isUnique: jest.fn().mockImplementation(async (code: CourseCode) => {
                callCount++;
                generatedCodes.push(code.getValue());
                return callCount === attemptsBeforeSuccess;
              })
            };

            const generator = new CourseCodeGenerator(mockChecker);
            await generator.generate();

            // Verify all generated codes have consistent format
            generatedCodes.forEach(codeValue => {
              expect(codeValue).toHaveLength(6);
              expect(codeValue).toMatch(/^[A-Z0-9]{6}$/);
              
              // Verify no lowercase letters
              expect(codeValue).toBe(codeValue.toUpperCase());
              
              // Verify no special characters
              expect(codeValue).not.toMatch(/[^A-Z0-9]/);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
