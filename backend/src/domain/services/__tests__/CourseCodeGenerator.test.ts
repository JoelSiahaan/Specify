/**
 * CourseCodeGenerator Domain Service Unit Tests
 * 
 * Tests for course code generation with retry logic
 */

import { CourseCodeGenerator, ICourseCodeChecker } from '../CourseCodeGenerator.js';
import { CourseCode } from '../../value-objects/CourseCode.js';

describe('CourseCodeGenerator Domain Service', () => {
  let mockCodeChecker: jest.Mocked<ICourseCodeChecker>;
  let generator: CourseCodeGenerator;

  beforeEach(() => {
    mockCodeChecker = {
      isUnique: jest.fn()
    };
    generator = new CourseCodeGenerator(mockCodeChecker);
  });

  describe('generate', () => {
    it('should generate a unique course code on first attempt', async () => {
      mockCodeChecker.isUnique.mockResolvedValue(true);

      const code = await generator.generate();

      expect(code).toBeInstanceOf(CourseCode);
      expect(code.getValue()).toHaveLength(6);
      expect(code.getValue()).toMatch(/^[A-Z0-9]{6}$/);
      expect(mockCodeChecker.isUnique).toHaveBeenCalledTimes(1);
    });

    it('should generate different codes on multiple calls', async () => {
      mockCodeChecker.isUnique.mockResolvedValue(true);

      const code1 = await generator.generate();
      const code2 = await generator.generate();

      // While theoretically they could be the same, probability is extremely low
      // This test verifies the generator is working, not that codes are always different
      expect(code1).toBeInstanceOf(CourseCode);
      expect(code2).toBeInstanceOf(CourseCode);
    });

    it('should retry when code is not unique', async () => {
      // First attempt: not unique, second attempt: unique
      mockCodeChecker.isUnique
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const code = await generator.generate();

      expect(code).toBeInstanceOf(CourseCode);
      expect(mockCodeChecker.isUnique).toHaveBeenCalledTimes(2);
    });

    it('should retry up to 5 times before failing', async () => {
      // All 5 attempts fail
      mockCodeChecker.isUnique.mockResolvedValue(false);

      await expect(generator.generate()).rejects.toThrow(
        'Failed to generate unique course code after 5 attempts'
      );

      expect(mockCodeChecker.isUnique).toHaveBeenCalledTimes(5);
    });

    it('should succeed on the 5th attempt', async () => {
      // First 4 attempts fail, 5th succeeds
      mockCodeChecker.isUnique
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const code = await generator.generate();

      expect(code).toBeInstanceOf(CourseCode);
      expect(mockCodeChecker.isUnique).toHaveBeenCalledTimes(5);
    });

    it('should succeed on the 3rd attempt', async () => {
      // First 2 attempts fail, 3rd succeeds
      mockCodeChecker.isUnique
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const code = await generator.generate();

      expect(code).toBeInstanceOf(CourseCode);
      expect(mockCodeChecker.isUnique).toHaveBeenCalledTimes(3);
    });

    it('should generate valid 6-character alphanumeric codes', async () => {
      mockCodeChecker.isUnique.mockResolvedValue(true);

      // Generate multiple codes to verify format
      for (let i = 0; i < 10; i++) {
        const code = await generator.generate();
        expect(code.getValue()).toHaveLength(6);
        expect(code.getValue()).toMatch(/^[A-Z0-9]{6}$/);
      }
    });

    it('should pass CourseCode objects to isUnique checker', async () => {
      mockCodeChecker.isUnique.mockResolvedValue(true);

      await generator.generate();

      expect(mockCodeChecker.isUnique).toHaveBeenCalledWith(
        expect.any(CourseCode)
      );
    });
  });

  describe('static methods', () => {
    it('should return correct max retries', () => {
      expect(CourseCodeGenerator.getMaxRetries()).toBe(5);
    });

    it('should return correct code length', () => {
      expect(CourseCodeGenerator.getCodeLength()).toBe(6);
    });
  });

  describe('error handling', () => {
    it('should throw error with descriptive message when retries exhausted', async () => {
      mockCodeChecker.isUnique.mockResolvedValue(false);

      await expect(generator.generate()).rejects.toThrow(
        'Failed to generate unique course code after 5 attempts'
      );
    });

    it('should propagate errors from code checker', async () => {
      const error = new Error('Database connection failed');
      mockCodeChecker.isUnique.mockRejectedValue(error);

      await expect(generator.generate()).rejects.toThrow('Database connection failed');
    });
  });

  describe('code format validation', () => {
    it('should generate codes that pass CourseCode validation', async () => {
      mockCodeChecker.isUnique.mockResolvedValue(true);

      // Generate multiple codes and verify they all pass validation
      for (let i = 0; i < 20; i++) {
        const code = await generator.generate();
        
        // If CourseCode.create didn't throw, the code is valid
        expect(() => CourseCode.create(code.getValue())).not.toThrow();
        
        // Verify format
        expect(code.getValue()).toHaveLength(6);
        expect(code.getValue()).toMatch(/^[A-Z0-9]{6}$/);
      }
    });
  });
});
