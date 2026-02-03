/**
 * Email Value Object Tests
 * 
 * Tests for RFC 5322 email validation and value object behavior
 */

import { Email } from '../Email.js';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create email with valid format', () => {
      const email = Email.create('user@example.com');
      expect(email.getValue()).toBe('user@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('User@Example.COM');
      expect(email.getValue()).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  user@example.com  ');
      expect(email.getValue()).toBe('user@example.com');
    });

    it('should accept email with dots in local part', () => {
      const email = Email.create('first.last@example.com');
      expect(email.getValue()).toBe('first.last@example.com');
    });

    it('should accept email with plus sign', () => {
      const email = Email.create('user+tag@example.com');
      expect(email.getValue()).toBe('user+tag@example.com');
    });

    it('should accept email with hyphen in domain', () => {
      const email = Email.create('user@my-domain.com');
      expect(email.getValue()).toBe('user@my-domain.com');
    });

    it('should accept email with subdomain', () => {
      const email = Email.create('user@mail.example.com');
      expect(email.getValue()).toBe('user@mail.example.com');
    });

    it('should accept email with numbers', () => {
      const email = Email.create('user123@example456.com');
      expect(email.getValue()).toBe('user123@example456.com');
    });

    it('should accept email with underscore', () => {
      const email = Email.create('user_name@example.com');
      expect(email.getValue()).toBe('user_name@example.com');
    });

    it('should throw error for null or undefined', () => {
      expect(() => Email.create(null as any)).toThrow('Email must be a non-empty string');
      expect(() => Email.create(undefined as any)).toThrow('Email must be a non-empty string');
    });

    it('should throw error for empty string', () => {
      expect(() => Email.create('')).toThrow('Email must be a non-empty string');
    });

    it('should throw error for whitespace only', () => {
      expect(() => Email.create('   ')).toThrow('Email cannot be empty');
    });

    it('should throw error for missing @ symbol', () => {
      expect(() => Email.create('userexample.com')).toThrow('Invalid email format');
    });

    it('should throw error for multiple @ symbols', () => {
      expect(() => Email.create('user@@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for missing local part', () => {
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for missing domain', () => {
      expect(() => Email.create('user@')).toThrow('Invalid email format');
    });

    it('should throw error for consecutive dots in local part', () => {
      expect(() => Email.create('user..name@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for consecutive dots in domain', () => {
      expect(() => Email.create('user@example..com')).toThrow('Invalid email format');
    });

    it('should throw error for leading dot in local part', () => {
      expect(() => Email.create('.user@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for trailing dot in local part', () => {
      expect(() => Email.create('user.@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for email exceeding 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => Email.create(longEmail)).toThrow('Invalid email format');
    });

    it('should throw error for local part exceeding 64 characters', () => {
      const longLocalPart = 'a'.repeat(65) + '@example.com';
      expect(() => Email.create(longLocalPart)).toThrow('Invalid email format');
    });

    it('should throw error for invalid characters', () => {
      expect(() => Email.create('user name@example.com')).toThrow('Invalid email format');
      expect(() => Email.create('user@exam ple.com')).toThrow('Invalid email format');
    });

    it('should throw error for missing TLD', () => {
      expect(() => Email.create('user@example')).toThrow('Invalid email format');
    });
  });

  describe('getValue', () => {
    it('should return the email value', () => {
      const email = Email.create('user@example.com');
      expect(email.getValue()).toBe('user@example.com');
    });
  });

  describe('getLocalPart', () => {
    it('should return the local part of email', () => {
      const email = Email.create('user@example.com');
      expect(email.getLocalPart()).toBe('user');
    });

    it('should return local part with dots', () => {
      const email = Email.create('first.last@example.com');
      expect(email.getLocalPart()).toBe('first.last');
    });
  });

  describe('getDomain', () => {
    it('should return the domain part of email', () => {
      const email = Email.create('user@example.com');
      expect(email.getDomain()).toBe('example.com');
    });

    it('should return domain with subdomain', () => {
      const email = Email.create('user@mail.example.com');
      expect(email.getDomain()).toBe('mail.example.com');
    });
  });

  describe('equals', () => {
    it('should return true for same email values', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('user@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for emails with different casing', () => {
      const email1 = Email.create('User@Example.COM');
      const email2 = Email.create('user@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different email values', () => {
      const email1 = Email.create('user1@example.com');
      const email2 = Email.create('user2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should return false for non-Email objects', () => {
      const email = Email.create('user@example.com');
      expect(email.equals('user@example.com' as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const email = Email.create('user@example.com');
      expect(email.toString()).toBe('user@example.com');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const email = Email.create('user@example.com');
      const value = email.getValue();
      
      // Attempting to modify should not affect the original
      expect(email.getValue()).toBe(value);
      expect(email.getValue()).toBe('user@example.com');
    });
  });
});
