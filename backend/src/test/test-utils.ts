/**
 * Test Utilities
 * 
 * Helper functions and utilities for backend testing.
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

/**
 * Create a test Prisma client instance
 */
export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
      },
    },
  });
}

/**
 * Clean up database after tests
 */
export async function cleanupDatabase(prisma: PrismaClient): Promise<void> {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
}

/**
 * Generate test JWT token
 * 
 * Generates a token with the same format as JWTService for testing.
 * Includes issuer and audience claims to match production tokens.
 */
export function generateTestToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'test-secret', {
    expiresIn: '15m',
    issuer: 'lms-api',
    audience: 'lms-client'
  });
}

/**
 * Generate unique test email to avoid conflicts
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Create test users with unique emails for integration tests
 * 
 * @param prisma - Prisma client instance
 * @param passwordService - Password service for hashing
 * @returns Object with teacher and student data including tokens
 */
export async function createTestUsers(
  prisma: PrismaClient,
  passwordService: { hash: (password: string) => Promise<string> }
): Promise<{
  teacher: { id: string; email: string; token: string };
  student: { id: string; email: string; token: string };
}> {
  const hashedPassword = await passwordService.hash('password123');

  const teacherEmail = generateUniqueEmail('teacher');
  const teacher = await prisma.user.create({
    data: {
      email: teacherEmail,
      name: 'Test Teacher',
      role: 'TEACHER',
      passwordHash: hashedPassword
    }
  });

  const studentEmail = generateUniqueEmail('student');
  const student = await prisma.user.create({
    data: {
      email: studentEmail,
      name: 'Test Student',
      role: 'STUDENT',
      passwordHash: hashedPassword
    }
  });

  const teacherToken = generateTestToken({
    userId: teacher.id,
    email: teacherEmail,
    role: 'TEACHER'
  });

  const studentToken = generateTestToken({
    userId: student.id,
    email: studentEmail,
    role: 'STUDENT'
  });

  return {
    teacher: { id: teacher.id, email: teacherEmail, token: teacherToken },
    student: { id: student.id, email: studentEmail, token: studentToken }
  };
}

/**
 * Generate unique test ID
 */
export function generateUniqueId(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create mock user data with unique email
 * 
 * @param overrides - Optional overrides for user properties
 * @returns Mock user object with unique email
 */
export function createMockUser(overrides?: Partial<typeof mockUser>) {
  return {
    id: generateUniqueId('user'),
    email: generateUniqueEmail('test'),
    name: 'Test User',
    role: 'STUDENT' as const,
    passwordHash: '$2b$10$test.hash.for.testing.only',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock teacher data with unique email
 * 
 * @param overrides - Optional overrides for teacher properties
 * @returns Mock teacher object with unique email
 */
export function createMockTeacher(overrides?: Partial<typeof mockTeacher>) {
  return {
    id: generateUniqueId('teacher'),
    email: generateUniqueEmail('teacher'),
    name: 'Test Teacher',
    role: 'TEACHER' as const,
    passwordHash: '$2b$10$test.hash.for.testing.only',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock user data for testing (deprecated - use createMockUser instead)
 * @deprecated Use createMockUser() to generate unique test data
 */
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'STUDENT' as const,
  passwordHash: '$2b$10$test.hash.for.testing.only',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock teacher data for testing (deprecated - use createMockTeacher instead)
 * @deprecated Use createMockTeacher() to generate unique test data
 */
export const mockTeacher = {
  id: 'test-teacher-id',
  email: 'teacher@example.com',
  name: 'Test Teacher',
  role: 'TEACHER' as const,
  passwordHash: '$2b$10$test.hash.for.testing.only',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock course data for testing
 */
export const mockCourse = {
  id: 'test-course-id',
  name: 'Test Course',
  description: 'Test course description',
  courseCode: 'TEST123',
  status: 'ACTIVE' as const,
  teacherId: 'test-teacher-id',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock assignment data for testing
 */
export const mockAssignment = {
  id: 'test-assignment-id',
  title: 'Test Assignment',
  description: 'Test assignment description',
  dueDate: new Date(Date.now() + 86400000), // Tomorrow
  courseId: 'test-course-id',
  submissionType: 'BOTH' as const,
  allowedFileTypes: ['pdf', 'docx'],
  maxFileSize: 10485760, // 10MB
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Create a delay for testing
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
