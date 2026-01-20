/**
 * Authentication Schemas Unit Tests
 * 
 * Tests for Zod validation schemas.
 * Validates that schemas correctly accept valid input and reject invalid input.
 */

import {
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshTokenRequestSchema,
  RoleSchema,
  EmailSchema,
  PasswordSchema,
  NameSchema
} from '../authSchemas';

describe('Authentication Validation Schemas', () => {
  describe('RoleSchema', () => {
    it('should accept STUDENT role', () => {
      const result = RoleSchema.safeParse('STUDENT');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('STUDENT');
      }
    });

    it('should accept TEACHER role', () => {
      const result = RoleSchema.safeParse('TEACHER');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('TEACHER');
      }
    });

    it('should reject invalid role', () => {
      const result = RoleSchema.safeParse('ADMIN');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('STUDENT or TEACHER');
      }
    });

    it('should reject empty string', () => {
      const result = RoleSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('EmailSchema', () => {
    it('should accept valid email', () => {
      const result = EmailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should normalize email to lowercase', () => {
      const result = EmailSchema.safeParse('TEST@EXAMPLE.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should trim whitespace', () => {
      const result = EmailSchema.safeParse('  test@example.com  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should reject invalid email format', () => {
      const result = EmailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject empty string', () => {
      const result = EmailSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email is required');
      }
    });

    it('should reject email exceeding 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = EmailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('255 characters');
      }
    });
  });

  describe('PasswordSchema', () => {
    it('should accept valid password', () => {
      const result = PasswordSchema.safeParse('password123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('password123');
      }
    });

    it('should accept password with 8 characters', () => {
      const result = PasswordSchema.safeParse('12345678');
      expect(result.success).toBe(true);
    });

    it('should reject password less than 8 characters', () => {
      const result = PasswordSchema.safeParse('1234567');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject empty password', () => {
      const result = PasswordSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject password exceeding 128 characters', () => {
      const longPassword = 'a'.repeat(129);
      const result = PasswordSchema.safeParse(longPassword);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('128 characters');
      }
    });
  });

  describe('NameSchema', () => {
    it('should accept valid name', () => {
      const result = NameSchema.safeParse('John Doe');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('John Doe');
      }
    });

    it('should trim whitespace', () => {
      const result = NameSchema.safeParse('  John Doe  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('John Doe');
      }
    });

    it('should reject empty string', () => {
      const result = NameSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101);
      const result = NameSchema.safeParse(longName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100 characters');
      }
    });
  });

  describe('RegisterRequestSchema', () => {
    const validRegisterRequest = {
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe',
      role: 'STUDENT' as const
    };

    it('should accept valid register request', () => {
      const result = RegisterRequestSchema.safeParse(validRegisterRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.password).toBe('password123');
        expect(result.data.name).toBe('John Doe');
        expect(result.data.role).toBe('STUDENT');
      }
    });

    it('should normalize email to lowercase', () => {
      const request = { ...validRegisterRequest, email: 'TEST@EXAMPLE.COM' };
      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject missing email', () => {
      const request = { ...validRegisterRequest };
      delete (request as any).email;
      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject missing password', () => {
      const request = { ...validRegisterRequest };
      delete (request as any).password;
      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('should reject missing name', () => {
      const request = { ...validRegisterRequest };
      delete (request as any).name;
      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should reject missing role', () => {
      const request = { ...validRegisterRequest };
      delete (request as any).role;
      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('role');
      }
    });

    it('should reject invalid email format', () => {
      const request = { ...validRegisterRequest, email: 'invalid-email' };
      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const request = { ...validRegisterRequest, password: '1234567' };
      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const request = { ...validRegisterRequest, role: 'ADMIN' };
      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginRequestSchema', () => {
    const validLoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should accept valid login request', () => {
      const result = LoginRequestSchema.safeParse(validLoginRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.password).toBe('password123');
      }
    });

    it('should normalize email to lowercase', () => {
      const request = { ...validLoginRequest, email: 'TEST@EXAMPLE.COM' };
      const result = LoginRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject missing email', () => {
      const request = { ...validLoginRequest };
      delete (request as any).email;
      const result = LoginRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject missing password', () => {
      const request = { ...validLoginRequest };
      delete (request as any).password;
      const result = LoginRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('should reject invalid email format', () => {
      const request = { ...validLoginRequest, email: 'invalid-email' };
      const result = LoginRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should accept any password length on login', () => {
      // Login should allow any password to be attempted (even short ones)
      const request = { ...validLoginRequest, password: '123' };
      const result = LoginRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe('RefreshTokenRequestSchema', () => {
    it('should accept valid refresh token request', () => {
      const request = { refreshToken: 'valid.refresh.token' };
      const result = RefreshTokenRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refreshToken).toBe('valid.refresh.token');
      }
    });

    it('should reject missing refresh token', () => {
      const request = {};
      const result = RefreshTokenRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject empty refresh token', () => {
      const request = { refreshToken: '' };
      const result = RefreshTokenRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });
  });
});
