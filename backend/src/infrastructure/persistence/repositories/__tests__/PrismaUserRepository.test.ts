/**
 * PrismaUserRepository Integration Tests
 * 
 * Tests the PrismaUserRepository implementation with a real database.
 * These are integration tests that verify database operations work correctly.
 * 
 * Requirements:
 * - 17.1: Data persistence operations
 * - 17.2: Repository pattern implementation
 * - 17.3: Domain-infrastructure mapping
 */

import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from '../PrismaUserRepository.js';
import { User, Role } from '../../../../domain/entities/User.js';
import { randomUUID } from 'crypto';
import { getTestPrismaClient } from '../../../../test/test-utils.js';

describe('PrismaUserRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaUserRepository;

  beforeAll(async () => {
    // Create Prisma client for this test suite
    prisma = getTestPrismaClient();
    repository = new PrismaUserRepository(prisma);
  }, 30000);

  afterAll(async () => {
    // Disconnect Prisma client after all tests
    await prisma.$disconnect();
  }, 30000);

  // No beforeEach cleanup - rely on unique UUIDs for test isolation

  describe('save', () => {
    it('should create a new user', async () => {
      // Arrange
      const userId = randomUUID();
      const user = User.create({
        id: userId,
        email: `test-${userId}@example.com`,
        name: 'Test User',
        role: Role.STUDENT,
        passwordHash: 'hashed_password'
      });

      // Act
      const savedUser = await repository.save(user);

      // Assert
      expect(savedUser.getId()).toBe(userId);
      expect(savedUser.getEmail()).toBe(`test-${userId}@example.com`);
      expect(savedUser.getName()).toBe('Test User');
      expect(savedUser.getRole()).toBe(Role.STUDENT);
      expect(savedUser.getPasswordHash()).toBe('hashed_password');
    });

    it('should update an existing user', async () => {
      // Arrange
      const userId = randomUUID();
      const user = User.create({
        id: userId,
        email: `test-${userId}@example.com`,
        name: 'Test User',
        role: Role.STUDENT,
        passwordHash: 'hashed_password'
      });
      await repository.save(user);

      // Update user
      user.updateName('Updated Name');
      const updatedEmail = `updated-${userId}@example.com`;
      user.updateEmail(updatedEmail);

      // Act
      const updatedUser = await repository.save(user);

      // Assert
      expect(updatedUser.getId()).toBe(userId);
      expect(updatedUser.getEmail()).toBe(updatedEmail);
      expect(updatedUser.getName()).toBe('Updated Name');
    });

    it('should throw error when email already exists', async () => {
      // Arrange
      const duplicateEmail = `duplicate-${randomUUID()}@example.com`;
      const user1 = User.create({
        id: randomUUID(),
        email: duplicateEmail,
        name: 'User 1',
        role: Role.STUDENT,
        passwordHash: 'hashed_password'
      });
      await repository.save(user1);

      const user2 = User.create({
        id: randomUUID(),
        email: duplicateEmail,
        name: 'User 2',
        role: Role.TEACHER,
        passwordHash: 'hashed_password'
      });

      // Act & Assert
      await expect(repository.save(user2)).rejects.toThrow('A user with this email already exists');
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      // Arrange
      const userId = randomUUID();
      const user = User.create({
        id: userId,
        email: `test-${userId}@example.com`,
        name: 'Test User',
        role: Role.STUDENT,
        passwordHash: 'hashed_password'
      });
      await repository.save(user);

      // Act
      const foundUser = await repository.findById(userId);

      // Assert
      expect(foundUser).not.toBeNull();
      expect(foundUser!.getId()).toBe(userId);
      expect(foundUser!.getEmail()).toBe(`test-${userId}@example.com`);
    });

    it('should return null when user not found', async () => {
      // Act
      const foundUser = await repository.findById(randomUUID());

      // Assert
      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const userId = randomUUID();
      const testEmail = `test-${userId}@example.com`;
      const user = User.create({
        id: userId,
        email: testEmail,
        name: 'Test User',
        role: Role.STUDENT,
        passwordHash: 'hashed_password'
      });
      await repository.save(user);

      // Act
      const foundUser = await repository.findByEmail(testEmail);

      // Assert
      expect(foundUser).not.toBeNull();
      expect(foundUser!.getEmail()).toBe(testEmail);
      expect(foundUser!.getName()).toBe('Test User');
    });

    it('should return null when email not found', async () => {
      // Act
      const foundUser = await repository.findByEmail(`nonexistent-${randomUUID()}@example.com`);

      // Assert
      expect(foundUser).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user by ID', async () => {
      // Arrange
      const userId = randomUUID();
      const user = User.create({
        id: userId,
        email: `test-${userId}@example.com`,
        name: 'Test User',
        role: Role.STUDENT,
        passwordHash: 'hashed_password'
      });
      await repository.save(user);

      // Act
      await repository.delete(userId);

      // Assert
      const foundUser = await repository.findById(userId);
      expect(foundUser).toBeNull();
    });

    it('should throw error when deleting non-existent user', async () => {
      // Act & Assert
      await expect(repository.delete(randomUUID())).rejects.toThrow('not found');
    });
  });
});
