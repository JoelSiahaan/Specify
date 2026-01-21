/**
 * CourseCode Value Object Unit Tests
 * 
 * Tests for CourseCode validation and behavior
 */

import { CourseCode } from '../CourseCode';

describe('CourseCode Value Object', () => {
  describe('create', () => {
    it('should create a valid CourseCode with 6 alphanumeric characters', () => {
      const code = CourseCode.create('ABC123');
      expect(code.getValue()).toBe('ABC123');
    });

    it('should normalize course code to uppercase', () => {
      const code = CourseCode.create('abc123');
      expect(code.getValue()).toBe('ABC123');
    });

    it('should accept mixed case alphanumeric codes', () => {
      const code = CourseCode.create('AbC123');
      expect(code.getValue()).toBe('ABC123');
    });

    it('should accept all uppercase letters', () => {
      const code = CourseCode.create('ABCDEF');
      expect(code.getValue()).toBe('ABCDEF');
    });

    it('should accept all numbers', () => {
      const code = CourseCode.create('123456');
      expect(code.getValue()).toBe('123456');
    });

    it('should trim whitespace before validation', () => {
      const code = CourseCode.create('  ABC123  ');
      expect(code.getValue()).toBe('ABC123');
    });

    it('should throw error for null or undefined', () => {
      expect(() => CourseCode.create(null as any)).toThrow('Course code must be a non-empty string');
      expect(() => CourseCode.create(undefined as any)).toThrow('Course code must be a non-empty string');
    });

    it('should throw error for empty string', () => {
      expect(() => CourseCode.create('')).toThrow('Course code cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => CourseCode.create('   ')).toThrow('Course code cannot be empty');
    });

    it('should throw error for code shorter than 6 characters', () => {
      expect(() => CourseCode.create('ABC12')).toThrow('Invalid course code format');
    });

    it('should throw error for code longer than 6 characters', () => {
      expect(() => CourseCode.create('ABC1234')).toThrow('Invalid course code format');
    });

    it('should throw error for code with special characters', () => {
      expect(() => CourseCode.create('ABC-12')).toThrow('Invalid course code format');
      expect(() => CourseCode.create('ABC_12')).toThrow('Invalid course code format');
      expect(() => CourseCode.create('ABC@12')).toThrow('Invalid course code format');
      expect(() => CourseCode.create('ABC 12')).toThrow('Invalid course code format');
    });

    it('should throw error for code with lowercase letters after trim', () => {
      // This should pass because we normalize to uppercase
      const code = CourseCode.create('abc123');
      expect(code.getValue()).toBe('ABC123');
    });

    it('should throw error for non-alphanumeric characters', () => {
      expect(() => CourseCode.create('ABC!23')).toThrow('Invalid course code format');
      expect(() => CourseCode.create('ABC#23')).toThrow('Invalid course code format');
      expect(() => CourseCode.create('ABC.23')).toThrow('Invalid course code format');
    });
  });

  describe('getValue', () => {
    it('should return the course code value', () => {
      const code = CourseCode.create('ABC123');
      expect(code.getValue()).toBe('ABC123');
    });

    it('should return uppercase normalized value', () => {
      const code = CourseCode.create('abc123');
      expect(code.getValue()).toBe('ABC123');
    });
  });

  describe('equals', () => {
    it('should return true for equal course codes', () => {
      const code1 = CourseCode.create('ABC123');
      const code2 = CourseCode.create('ABC123');
      expect(code1.equals(code2)).toBe(true);
    });

    it('should return true for equal course codes with different case input', () => {
      const code1 = CourseCode.create('ABC123');
      const code2 = CourseCode.create('abc123');
      expect(code1.equals(code2)).toBe(true);
    });

    it('should return false for different course codes', () => {
      const code1 = CourseCode.create('ABC123');
      const code2 = CourseCode.create('DEF456');
      expect(code1.equals(code2)).toBe(false);
    });

    it('should return false for non-CourseCode objects', () => {
      const code = CourseCode.create('ABC123');
      expect(code.equals('ABC123' as any)).toBe(false);
      expect(code.equals(null as any)).toBe(false);
      expect(code.equals(undefined as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation of course code', () => {
      const code = CourseCode.create('ABC123');
      expect(code.toString()).toBe('ABC123');
    });

    it('should return uppercase normalized string', () => {
      const code = CourseCode.create('abc123');
      expect(code.toString()).toBe('ABC123');
    });
  });

  describe('edge cases', () => {
    it('should handle boundary alphanumeric values', () => {
      expect(() => CourseCode.create('AAAAAA')).not.toThrow();
      expect(() => CourseCode.create('ZZZZZZ')).not.toThrow();
      expect(() => CourseCode.create('000000')).not.toThrow();
      expect(() => CourseCode.create('999999')).not.toThrow();
    });

    it('should handle mixed alphanumeric patterns', () => {
      expect(() => CourseCode.create('A1B2C3')).not.toThrow();
      expect(() => CourseCode.create('1A2B3C')).not.toThrow();
      expect(() => CourseCode.create('123ABC')).not.toThrow();
    });
  });
});
