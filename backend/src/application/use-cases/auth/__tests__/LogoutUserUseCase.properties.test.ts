/**
 * LogoutUserUseCase Property-Based Tests
 * 
 * Property-based tests for user logout use case using fast-check.
 * Tests universal properties that must hold for all valid inputs.
 * 
 * Feature: core-lms
 * Requirements tested:
 * - 1.6: Logout capability
 */

import * as fc from 'fast-check';
import { LogoutUserUseCase } from '../LogoutUserUseCase.js';
import { propertyTestConfig } from '../../../../test/property-test-utils.js';

describe('LogoutUserUseCase Properties', () => {
  /**
   * Helper function to create fresh instances for each property test
   * This ensures complete isolation between test runs
   */
  function createFreshUseCase() {
    const useCase = new LogoutUserUseCase();
    return { useCase };
  }

  /**
   * Property 6: Logout is idempotent
   * Feature: core-lms, Property 6: Logout is idempotent
   * Validates: Requirements 1.6
   * 
   * For any number of logout calls, the result is always the same success message.
   * Logout can be called multiple times without side effects.
   */
  it('Property 6: Logout is idempotent - multiple calls return same result', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of logout calls
        async (logoutCount) => {
          // Create fresh use case for this test run
          const { useCase } = createFreshUseCase();

          // Property: All logout calls should return the same success message
          const results: Array<{ message: string }> = [];

          for (let i = 0; i < logoutCount; i++) {
            const result = await useCase.execute();
            results.push(result);
          }

          // All results should be identical
          const allSame = results.every(r => r.message === results[0].message);
          const isSuccessMessage = results[0].message === 'Logged out successfully';

          return allSame && isSuccessMessage;
        }
      ),
      propertyTestConfig
    );
  }, 10000); // Jest timeout

  /**
   * Property: Logout always succeeds
   * Validates: Requirements 1.6
   * 
   * For any execution, logout always returns success (no failure cases in stateless approach)
   */
  it('Property: Logout always succeeds with success message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // No input needed
        async () => {
          // Create fresh use case for this test run
          const { useCase } = createFreshUseCase();

          // Property: Logout should always succeed
          const result = await useCase.execute();

          // Verify result structure and message
          return (
            result !== null &&
            typeof result === 'object' &&
            'message' in result &&
            result.message === 'Logged out successfully'
          );
        }
      ),
      propertyTestConfig
    );
  }, 10000); // Jest timeout

  /**
   * Property: Logout response is consistent
   * Validates: Requirements 1.6
   * 
   * For any execution, logout returns the same response structure
   */
  it('Property: Logout response structure is always consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // Multiple executions
        async (executionCount) => {
          // Create fresh use case for this test run
          const { useCase } = createFreshUseCase();

          // Property: All executions should return same structure
          const results: Array<{ message: string }> = [];

          for (let i = 0; i < executionCount; i++) {
            const result = await useCase.execute();
            results.push(result);
          }

          // Check all results have same structure
          const allHaveMessage = results.every(r => 'message' in r);
          const allHaveSameMessage = results.every(r => r.message === 'Logged out successfully');
          const allHaveOnlyOneKey = results.every(r => Object.keys(r).length === 1);

          return allHaveMessage && allHaveSameMessage && allHaveOnlyOneKey;
        }
      ),
      propertyTestConfig
    );
  }, 10000); // Jest timeout

  /**
   * Property: Logout is stateless
   * Validates: Requirements 1.6
   * 
   * For any sequence of logout calls, each call is independent (no state carried over)
   */
  it('Property: Logout is stateless - no state carried between calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constant(null), { minLength: 2, maxLength: 5 }),
        async (calls) => {
          // Create fresh use case for this test run
          const { useCase } = createFreshUseCase();

          // Property: Each call should be independent
          const results: Array<{ message: string }> = [];

          for (const _ of calls) {
            const result = await useCase.execute();
            results.push(result);
          }

          // All results should be identical (proving statelessness)
          const firstResult = JSON.stringify(results[0]);
          const allIdentical = results.every(r => JSON.stringify(r) === firstResult);

          return allIdentical;
        }
      ),
      propertyTestConfig
    );
  }, 10000); // Jest timeout
});
