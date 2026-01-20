/**
 * Test Setup Verification
 * 
 * Verifies that the testing framework is properly configured.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { emailArbitrary, propertyTestConfig } from '../property-test-utils.js';

describe('Testing Framework Setup', () => {
  describe('Jest Configuration', () => {
    it('should run basic test', () => {
      expect(true).toBe(true);
    });

    it('should support async tests', async () => {
      const result = await Promise.resolve(42);
      expect(result).toBe(42);
    });

    it('should have access to environment variables', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.JWT_ACCESS_SECRET).toBeDefined();
    });
  });

  describe('Fast-check Integration', () => {
    it('should run property-based tests', async () => {
      await fc.assert(
        fc.property(fc.integer(), (n) => {
          return n + 0 === n;
        }),
        propertyTestConfig
      );
    });

    it('should use custom generators', async () => {
      await fc.assert(
        fc.property(emailArbitrary(), (email) => {
          return email.includes('@');
        }),
        propertyTestConfig
      );
    });
  });

  describe('Test Utilities', () => {
    it('should import test utilities', async () => {
      const { mockUser, mockTeacher, mockCourse } = await import('../test-utils.js');
      
      expect(mockUser).toBeDefined();
      expect(mockUser.role).toBe('STUDENT');
      
      expect(mockTeacher).toBeDefined();
      expect(mockTeacher.role).toBe('TEACHER');
      
      expect(mockCourse).toBeDefined();
      expect(mockCourse.status).toBe('ACTIVE');
    });
  });
});
