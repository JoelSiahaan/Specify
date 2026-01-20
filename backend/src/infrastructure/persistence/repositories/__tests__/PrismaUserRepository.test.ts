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
import { PrismaUserRepository } from '../PrismaUserRepository';
import { User, Role } from '../../../../domain/entities/User';
import { randomUUID } from 'crypto';

describe('PrismaUserRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaUserRepository;

  beforeAll(async () => {
    // Create a fresh PrismaClient instance for tests
    // Explicitly pass DATABASE_URL to ensure correct database connection
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    repository = new PrismaUserRepository(prisma);
    
    // Connect to database
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up users table before each test
    await prisma.user.deleteMany({});
  });

  describe('save', () => {
    it('should create a new user', async () => {
      // Arrange
      const userId = randomUUID();
      const user = User.create({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: Role.STUDENT,
        passwordHash: 'hashed_password'
      });

      // Act
      const savedUser = await repository.save(user);

      // Assert
      expect(savedUser.getId()).toBe(userId);
      expect(savedUser.getEmail()).toBe('test@example.com');
      expect(savedUser.getName()).toBe('Test User');
      expect(savedUser.getRole()).toBe(Role.STUDENT);
      expect(savedUser.getPasswordHash()).toBe('hashed_password');
    });

    it('should update an existing user', async () => {
      // Arrange
      const userId = randomUUID();
      const user = User.create({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: Role.STUDENT,
        passwordHash: 'hashed_password'
      });
      await repository.save(user);

      // Update user
      user.updateName('Updated Name');
      user.updateEmail('updated@example.com');

      // Act
      const updatedUser = await repository.save(user);

      // Assert
      expect(updatedUser.getId()).toBe(userId);
      expect(updatedUser.getEmail()).toBe('updated@example.com');
      expect(updatedUser.getName()).toBe('Updated Name');
    });

    it('should throw error when email already exists', async () => {
      // Arrange
      const user1 = User.create({
        id: randomUUID(),
        email: 'duplicate@example.com',
        name: 'User 1',
        role: Role.STUDENT,
        passwordHash: 'hashed_password'
      });
      await repository.save(user1);

      const user2 = User.create({
        id: randomUUID(),
        email: 'duplicate@example.com',
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
        email: 'test@example.com',
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
      expect(foundUser!.getEmail()).toBe('test@example.com');
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
      const user = User.create({
        id: randomUUID(),
        email: 'test@example.com',
        name: 'Test User',
        role: Role.STUDENT,
        passwordHash: 'hashed_password'
      });
      await repository.save(user);

      // Act
      const foundUser = await repository.findByEmail('test@example.com');

      // Assert
      expect(foundUser).not.toBeNull();
      expect(foundUser!.getEmail()).toBe('test@example.com');
      expect(foundUser!.getName()).toBe('Test User');
    });

    it('should return null when email not found', async () => {
      // Act
      const foundUser = await repository.findByEmail('nonexistent@example.com');

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
        email: 'test@example.com',
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
