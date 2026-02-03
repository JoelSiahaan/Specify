/**
 * Grade Value Object Tests
 * 
 * Tests for grade validation (0-100 range) and value object behavior
 * 
 * Requirements: 13.3 (Grade validation between 0 and 100)
 */

import { Grade } from '../Grade.js';

describe('Grade Value Object', () => {
  describe('create', () => {
    it('should create grade with valid value at minimum boundary (0)', () => {
      const grade = Grade.create(0);
      expect(grade.getValue()).toBe(0);
    });

    it('should create grade with valid value at maximum boundary (100)', () => {
      const grade = Grade.create(100);
      expect(grade.getValue()).toBe(100);
    });

    it('should create grade with valid value in middle range', () => {
      const grade = Grade.create(85);
      expect(grade.getValue()).toBe(85);
    });

    it('should create grade with decimal value', () => {
      const grade = Grade.create(85.5);
      expect(grade.getValue()).toBe(85.5);
    });

    it('should create grade with value 50', () => {
      const grade = Grade.create(50);
      expect(grade.getValue()).toBe(50);
    });

    it('should create grade with value 1', () => {
      const grade = Grade.create(1);
      expect(grade.getValue()).toBe(1);
    });

    it('should create grade with value 99', () => {
      const grade = Grade.create(99);
      expect(grade.getValue()).toBe(99);
    });

    it('should throw error for null', () => {
      expect(() => Grade.create(null as any)).toThrow('Grade must be a number');
    });

    it('should throw error for undefined', () => {
      expect(() => Grade.create(undefined as any)).toThrow('Grade must be a number');
    });

    it('should throw error for non-number type (string)', () => {
      expect(() => Grade.create('85' as any)).toThrow('Grade must be a number');
    });

    it('should throw error for non-number type (boolean)', () => {
      expect(() => Grade.create(true as any)).toThrow('Grade must be a number');
    });

    it('should throw error for non-number type (object)', () => {
      expect(() => Grade.create({} as any)).toThrow('Grade must be a number');
    });

    it('should throw error for NaN', () => {
      expect(() => Grade.create(NaN)).toThrow('Grade must be a valid number');
    });

    it('should throw error for negative value', () => {
      expect(() => Grade.create(-1)).toThrow('Grade must be between 0 and 100 (inclusive)');
    });

    it('should throw error for value below minimum boundary', () => {
      expect(() => Grade.create(-0.1)).toThrow('Grade must be between 0 and 100 (inclusive)');
    });

    it('should throw error for value above maximum boundary', () => {
      expect(() => Grade.create(100.1)).toThrow('Grade must be between 0 and 100 (inclusive)');
    });

    it('should throw error for value exceeding 100', () => {
      expect(() => Grade.create(101)).toThrow('Grade must be between 0 and 100 (inclusive)');
    });

    it('should throw error for large positive value', () => {
      expect(() => Grade.create(1000)).toThrow('Grade must be between 0 and 100 (inclusive)');
    });

    it('should throw error for large negative value', () => {
      expect(() => Grade.create(-100)).toThrow('Grade must be between 0 and 100 (inclusive)');
    });

    it('should throw error for Infinity', () => {
      expect(() => Grade.create(Infinity)).toThrow('Grade must be between 0 and 100 (inclusive)');
    });

    it('should throw error for negative Infinity', () => {
      expect(() => Grade.create(-Infinity)).toThrow('Grade must be between 0 and 100 (inclusive)');
    });
  });

  describe('getValue', () => {
    it('should return the grade value', () => {
      const grade = Grade.create(85);
      expect(grade.getValue()).toBe(85);
    });

    it('should return decimal grade value', () => {
      const grade = Grade.create(87.5);
      expect(grade.getValue()).toBe(87.5);
    });

    it('should return zero grade value', () => {
      const grade = Grade.create(0);
      expect(grade.getValue()).toBe(0);
    });

    it('should return maximum grade value', () => {
      const grade = Grade.create(100);
      expect(grade.getValue()).toBe(100);
    });
  });

  describe('equals', () => {
    it('should return true for same grade values', () => {
      const grade1 = Grade.create(85);
      const grade2 = Grade.create(85);
      expect(grade1.equals(grade2)).toBe(true);
    });

    it('should return true for same decimal grade values', () => {
      const grade1 = Grade.create(85.5);
      const grade2 = Grade.create(85.5);
      expect(grade1.equals(grade2)).toBe(true);
    });

    it('should return false for different grade values', () => {
      const grade1 = Grade.create(85);
      const grade2 = Grade.create(90);
      expect(grade1.equals(grade2)).toBe(false);
    });

    it('should return false for slightly different decimal values', () => {
      const grade1 = Grade.create(85.5);
      const grade2 = Grade.create(85.6);
      expect(grade1.equals(grade2)).toBe(false);
    });

    it('should return false for non-Grade objects', () => {
      const grade = Grade.create(85);
      expect(grade.equals(85 as any)).toBe(false);
    });

    it('should return false for null', () => {
      const grade = Grade.create(85);
      expect(grade.equals(null as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation of integer grade', () => {
      const grade = Grade.create(85);
      expect(grade.toString()).toBe('85');
    });

    it('should return string representation of decimal grade', () => {
      const grade = Grade.create(85.5);
      expect(grade.toString()).toBe('85.5');
    });

    it('should return string representation of zero', () => {
      const grade = Grade.create(0);
      expect(grade.toString()).toBe('0');
    });

    it('should return string representation of 100', () => {
      const grade = Grade.create(100);
      expect(grade.toString()).toBe('100');
    });
  });

  describe('getLetterGrade', () => {
    it('should return A for grade 90', () => {
      const grade = Grade.create(90);
      expect(grade.getLetterGrade()).toBe('A');
    });

    it('should return A for grade 95', () => {
      const grade = Grade.create(95);
      expect(grade.getLetterGrade()).toBe('A');
    });

    it('should return A for grade 100', () => {
      const grade = Grade.create(100);
      expect(grade.getLetterGrade()).toBe('A');
    });

    it('should return B for grade 80', () => {
      const grade = Grade.create(80);
      expect(grade.getLetterGrade()).toBe('B');
    });

    it('should return B for grade 85', () => {
      const grade = Grade.create(85);
      expect(grade.getLetterGrade()).toBe('B');
    });

    it('should return B for grade 89', () => {
      const grade = Grade.create(89);
      expect(grade.getLetterGrade()).toBe('B');
    });

    it('should return C for grade 70', () => {
      const grade = Grade.create(70);
      expect(grade.getLetterGrade()).toBe('C');
    });

    it('should return C for grade 75', () => {
      const grade = Grade.create(75);
      expect(grade.getLetterGrade()).toBe('C');
    });

    it('should return C for grade 79', () => {
      const grade = Grade.create(79);
      expect(grade.getLetterGrade()).toBe('C');
    });

    it('should return D for grade 60', () => {
      const grade = Grade.create(60);
      expect(grade.getLetterGrade()).toBe('D');
    });

    it('should return D for grade 65', () => {
      const grade = Grade.create(65);
      expect(grade.getLetterGrade()).toBe('D');
    });

    it('should return D for grade 69', () => {
      const grade = Grade.create(69);
      expect(grade.getLetterGrade()).toBe('D');
    });

    it('should return F for grade 59', () => {
      const grade = Grade.create(59);
      expect(grade.getLetterGrade()).toBe('F');
    });

    it('should return F for grade 50', () => {
      const grade = Grade.create(50);
      expect(grade.getLetterGrade()).toBe('F');
    });

    it('should return F for grade 0', () => {
      const grade = Grade.create(0);
      expect(grade.getLetterGrade()).toBe('F');
    });
  });

  describe('isPassing', () => {
    it('should return true for grade 60 (passing threshold)', () => {
      const grade = Grade.create(60);
      expect(grade.isPassing()).toBe(true);
    });

    it('should return true for grade above 60', () => {
      const grade = Grade.create(85);
      expect(grade.isPassing()).toBe(true);
    });

    it('should return true for grade 100', () => {
      const grade = Grade.create(100);
      expect(grade.isPassing()).toBe(true);
    });

    it('should return false for grade 59 (below passing)', () => {
      const grade = Grade.create(59);
      expect(grade.isPassing()).toBe(false);
    });

    it('should return false for grade 50', () => {
      const grade = Grade.create(50);
      expect(grade.isPassing()).toBe(false);
    });

    it('should return false for grade 0', () => {
      const grade = Grade.create(0);
      expect(grade.isPassing()).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const grade = Grade.create(85);
      const value = grade.getValue();
      
      // Attempting to access should not affect the original
      expect(grade.getValue()).toBe(value);
      expect(grade.getValue()).toBe(85);
    });

    it('should maintain value after multiple method calls', () => {
      const grade = Grade.create(85);
      
      grade.getLetterGrade();
      grade.isPassing();
      grade.toString();
      
      expect(grade.getValue()).toBe(85);
    });
  });
});
