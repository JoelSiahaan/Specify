/**
 * User Entity Unit Tests
 * 
 * Tests for User domain entity business logic and validation.
 * 
 * Requirements tested:
 * - 1.5: Role assignment (Student or Teacher only)
 * - 2.1: User identity and role management
 * - 2.2: Role validation
 */

import { User, Role, type UserProps } from '../User';

describe('User Entity', () => {
  const validUserProps: UserProps = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.STUDENT,
    passwordHash: 'hashed_password_123'
  };

  describe('create', () => {
    it('should create a valid user with all required fields', () => {
      const user = User.create(validUserProps);

      expect(user.getId()).toBe(validUserProps.id);
      expect(user.getEmail()).toBe(validUserProps.email);
      expect(user.getName()).toBe(validUserProps.name);
      expect(user.getRole()).toBe(validUserProps.role);
      expect(user.getPasswordHash()).toBe(validUserProps.passwordHash);
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should create a user with STUDENT role', () => {
      const user = User.create({ ...validUserProps, role: Role.STUDENT });

      expect(user.getRole()).toBe(Role.STUDENT);
      expect(user.isStudent()).toBe(true);
      expect(user.isTeacher()).toBe(false);
    });

    it('should create a user with TEACHER role', () => {
      const user = User.create({ ...validUserProps, role: Role.TEACHER });

      expect(user.getRole()).toBe(Role.TEACHER);
      expect(user.isTeacher()).toBe(true);
      expect(user.isStudent()).toBe(false);
    });

    it('should throw error when id is missing', () => {
      const props = { ...validUserProps, id: '' };

      expect(() => User.create(props)).toThrow('User ID is required');
    });

    it('should throw error when email is missing', () => {
      const props = { ...validUserProps, email: '' };

      expect(() => User.create(props)).toThrow('Email is required');
    });

    it('should throw error when name is missing', () => {
      const props = { ...validUserProps, name: '' };

      expect(() => User.create(props)).toThrow('Name is required');
    });

    it('should throw error when password hash is missing', () => {
      const props = { ...validUserProps, passwordHash: '' };

      expect(() => User.create(props)).toThrow('Password hash is required');
    });

    // Requirement 1.5: Role validation (Student or Teacher only)
    it('should throw error for invalid role', () => {
      const props = { ...validUserProps, role: 'ADMIN' as Role };

      expect(() => User.create(props)).toThrow('Invalid role');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute user from persistence with timestamps', () => {
      const createdAt = new Date('2025-01-01');
      const updatedAt = new Date('2025-01-10');
      const props = { ...validUserProps, createdAt, updatedAt };

      const user = User.reconstitute(props);

      expect(user.getId()).toBe(props.id);
      expect(user.getCreatedAt()).toEqual(createdAt);
      expect(user.getUpdatedAt()).toEqual(updatedAt);
    });
  });

  describe('updateEmail', () => {
    it('should update email successfully', () => {
      const user = User.create(validUserProps);
      const newEmail = 'newemail@example.com';
      const beforeUpdate = user.getUpdatedAt();

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        user.updateEmail(newEmail);

        expect(user.getEmail()).toBe(newEmail);
        expect(user.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      }, 10);
    });

    it('should throw error when updating to empty email', () => {
      const user = User.create(validUserProps);

      expect(() => user.updateEmail('')).toThrow('Email is required');
    });
  });

  describe('updateName', () => {
    it('should update name successfully', () => {
      const user = User.create(validUserProps);
      const newName = 'New Name';

      user.updateName(newName);

      expect(user.getName()).toBe(newName);
    });

    it('should throw error when updating to empty name', () => {
      const user = User.create(validUserProps);

      expect(() => user.updateName('')).toThrow('Name is required');
    });
  });

  describe('updatePasswordHash', () => {
    it('should update password hash successfully', () => {
      const user = User.create(validUserProps);
      const newHash = 'new_hashed_password';

      user.updatePasswordHash(newHash);

      expect(user.getPasswordHash()).toBe(newHash);
    });

    it('should throw error when updating to empty password hash', () => {
      const user = User.create(validUserProps);

      expect(() => user.updatePasswordHash('')).toThrow('Password hash is required');
    });
  });

  describe('role checks', () => {
    it('should correctly identify student role', () => {
      const student = User.create({ ...validUserProps, role: Role.STUDENT });

      expect(student.isStudent()).toBe(true);
      expect(student.isTeacher()).toBe(false);
    });

    it('should correctly identify teacher role', () => {
      const teacher = User.create({ ...validUserProps, role: Role.TEACHER });

      expect(teacher.isTeacher()).toBe(true);
      expect(teacher.isStudent()).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should convert entity to plain object', () => {
      const user = User.create(validUserProps);
      const obj = user.toObject();

      expect(obj.id).toBe(validUserProps.id);
      expect(obj.email).toBe(validUserProps.email);
      expect(obj.name).toBe(validUserProps.name);
      expect(obj.role).toBe(validUserProps.role);
      expect(obj.passwordHash).toBe(validUserProps.passwordHash);
      expect(obj.createdAt).toBeInstanceOf(Date);
      expect(obj.updatedAt).toBeInstanceOf(Date);
    });
  });
});
