/**
 * PrismaCourseRepository Integration Tests
 * 
 * Tests the PrismaCourseRepository implementation with a real database.
 * These are integration tests that verify database operations work correctly.
 * 
 * Requirements:
 * - 17.1: Data persistence operations
 * - 17.2: Repository pattern implementation
 * - 17.3: Domain-infrastructure mapping
 */

import { PrismaClient } from '@prisma/client';
import { PrismaCourseRepository } from '../PrismaCourseRepository';
import { Course, CourseStatus } from '../../../../domain/entities/Course';
import { User, Role } from '../../../../domain/entities/User';
import { randomUUID } from 'crypto';
import { getTestPrismaClient } from '../../../../test/test-utils';

describe('PrismaCourseRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaCourseRepository;
  let testTeacherId: string;

  beforeAll(async () => {
    // Create Prisma client for this test suite
    prisma = getTestPrismaClient();
    repository = new PrismaCourseRepository(prisma);
  }, 30000);

  afterAll(async () => {
    // Disconnect Prisma client after all tests
    await prisma.$disconnect();
  }, 30000);

  beforeEach(async () => {
    // Clean up courses and users tables before each test
    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Create a test teacher for course relationships with unique email
    testTeacherId = randomUUID();
    await prisma.user.create({
      data: {
        id: testTeacherId,
        email: `teacher-${testTeacherId}@example.com`,
        name: 'Test Teacher',
        role: 'TEACHER',
        passwordHash: 'hashed_password'
      }
    });
  }, 30000);

  describe('save', () => {
    it('should create a new course', async () => {
      // Arrange
      const courseId = randomUUID();
      const course = Course.create({
        id: courseId,
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });

      // Act
      const savedCourse = await repository.save(course);

      // Assert
      expect(savedCourse.getId()).toBe(courseId);
      expect(savedCourse.getName()).toBe('Introduction to Programming');
      expect(savedCourse.getDescription()).toBe('Learn programming basics');
      expect(savedCourse.getCourseCode()).toBe('ABC123');
      expect(savedCourse.getStatus()).toBe(CourseStatus.ACTIVE);
      expect(savedCourse.getTeacherId()).toBe(testTeacherId);
    });

    it('should update an existing course', async () => {
      // Arrange
      const courseId = randomUUID();
      const course = Course.create({
        id: courseId,
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      await repository.save(course);

      // Update course
      course.updateName('Advanced Programming');
      course.updateDescription('Advanced programming concepts');

      // Act
      const updatedCourse = await repository.save(course);

      // Assert
      expect(updatedCourse.getId()).toBe(courseId);
      expect(updatedCourse.getName()).toBe('Advanced Programming');
      expect(updatedCourse.getDescription()).toBe('Advanced programming concepts');
      expect(updatedCourse.getCourseCode()).toBe('ABC123'); // Code should not change
    });

    it('should throw error when courseCode already exists', async () => {
      // Arrange
      const course1 = Course.create({
        id: randomUUID(),
        name: 'Course 1',
        description: 'Description 1',
        courseCode: 'DUP123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      await repository.save(course1);

      const course2 = Course.create({
        id: randomUUID(),
        name: 'Course 2',
        description: 'Description 2',
        courseCode: 'DUP123', // Duplicate code
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });

      // Act & Assert
      await expect(repository.save(course2)).rejects.toThrow('A course with this course code already exists');
    });
  });

  describe('findById', () => {
    it('should find course by ID', async () => {
      // Arrange
      const courseId = randomUUID();
      const course = Course.create({
        id: courseId,
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      await repository.save(course);

      // Act
      const foundCourse = await repository.findById(courseId);

      // Assert
      expect(foundCourse).not.toBeNull();
      expect(foundCourse!.getId()).toBe(courseId);
      expect(foundCourse!.getName()).toBe('Introduction to Programming');
      expect(foundCourse!.getCourseCode()).toBe('ABC123');
    });

    it('should return null when course not found', async () => {
      // Act
      const foundCourse = await repository.findById(randomUUID());

      // Assert
      expect(foundCourse).toBeNull();
    });
  });

  describe('findByTeacherId', () => {
    it('should find all courses by teacher ID', async () => {
      // Arrange
      const course1 = Course.create({
        id: randomUUID(),
        name: 'Course 1',
        description: 'Description 1',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      const course2 = Course.create({
        id: randomUUID(),
        name: 'Course 2',
        description: 'Description 2',
        courseCode: 'DEF456',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      await repository.save(course1);
      await repository.save(course2);

      // Act
      const courses = await repository.findByTeacherId(testTeacherId);

      // Assert
      expect(courses).toHaveLength(2);
      expect(courses.map(c => c.getName())).toContain('Course 1');
      expect(courses.map(c => c.getName())).toContain('Course 2');
    });

    it('should return empty array when teacher has no courses', async () => {
      // Act
      const courses = await repository.findByTeacherId(randomUUID());

      // Assert
      expect(courses).toHaveLength(0);
    });

    it('should only return courses for specified teacher', async () => {
      // Arrange - Create another teacher with unique email
      const anotherTeacherId = randomUUID();
      await prisma.user.create({
        data: {
          id: anotherTeacherId,
          email: `teacher-${anotherTeacherId}@example.com`,
          name: 'Another Teacher',
          role: 'TEACHER',
          passwordHash: 'hashed_password'
        }
      });

      // Create courses for both teachers
      const course1 = Course.create({
        id: randomUUID(),
        name: 'Course 1',
        description: 'Description 1',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      const course2 = Course.create({
        id: randomUUID(),
        name: 'Course 2',
        description: 'Description 2',
        courseCode: 'DEF456',
        status: CourseStatus.ACTIVE,
        teacherId: anotherTeacherId
      });
      await repository.save(course1);
      await repository.save(course2);

      // Act
      const courses = await repository.findByTeacherId(testTeacherId);

      // Assert
      expect(courses).toHaveLength(1);
      expect(courses[0].getName()).toBe('Course 1');
    });
  });

  describe('findByCode', () => {
    it('should find course by course code', async () => {
      // Arrange
      const course = Course.create({
        id: randomUUID(),
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      await repository.save(course);

      // Act
      const foundCourse = await repository.findByCode('ABC123');

      // Assert
      expect(foundCourse).not.toBeNull();
      expect(foundCourse!.getCourseCode()).toBe('ABC123');
      expect(foundCourse!.getName()).toBe('Introduction to Programming');
    });

    it('should return null when course code not found', async () => {
      // Act
      const foundCourse = await repository.findByCode('NOTFOUND');

      // Assert
      expect(foundCourse).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing course', async () => {
      // Arrange
      const courseId = randomUUID();
      const course = Course.create({
        id: courseId,
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      await repository.save(course);

      // Update course
      course.updateName('Advanced Programming');
      course.updateDescription('Advanced programming concepts');

      // Act
      const updatedCourse = await repository.update(course);

      // Assert
      expect(updatedCourse.getId()).toBe(courseId);
      expect(updatedCourse.getName()).toBe('Advanced Programming');
      expect(updatedCourse.getDescription()).toBe('Advanced programming concepts');
    });

    it('should update course status when archived', async () => {
      // Arrange
      const courseId = randomUUID();
      const course = Course.create({
        id: courseId,
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      await repository.save(course);

      // Archive course
      course.archive();

      // Act
      const updatedCourse = await repository.update(course);

      // Assert
      expect(updatedCourse.getStatus()).toBe(CourseStatus.ARCHIVED);
    });

    it('should throw error when updating non-existent course', async () => {
      // Arrange
      const course = Course.create({
        id: randomUUID(),
        name: 'Non-existent Course',
        description: 'Description',
        courseCode: 'XYZ999',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });

      // Act & Assert
      await expect(repository.update(course)).rejects.toThrow('not found');
    });
  });

  describe('delete', () => {
    it('should delete course by ID', async () => {
      // Arrange
      const courseId = randomUUID();
      const course = Course.create({
        id: courseId,
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ARCHIVED, // Must be archived to delete
        teacherId: testTeacherId
      });
      await repository.save(course);

      // Act
      await repository.delete(courseId);

      // Assert
      const foundCourse = await repository.findById(courseId);
      expect(foundCourse).toBeNull();
    });

    it('should throw error when deleting non-existent course', async () => {
      // Act & Assert
      await expect(repository.delete(randomUUID())).rejects.toThrow('not found');
    });
  });

  describe('relationship with User', () => {
    it('should maintain foreign key relationship with User', async () => {
      // Arrange
      const course = Course.create({
        id: randomUUID(),
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      await repository.save(course);

      // Act - Verify relationship in database
      const dbCourse = await prisma.course.findUnique({
        where: { id: course.getId() },
        include: { teacher: true }
      });

      // Assert
      expect(dbCourse).not.toBeNull();
      expect(dbCourse!.teacher.id).toBe(testTeacherId);
      expect(dbCourse!.teacher.email).toBe(`teacher-${testTeacherId}@example.com`);
      expect(dbCourse!.teacher.name).toBe('Test Teacher');
    });

    it('should cascade delete courses when teacher is deleted', async () => {
      // Arrange
      const courseId = randomUUID();
      const course = Course.create({
        id: courseId,
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: 'ABC123',
        status: CourseStatus.ACTIVE,
        teacherId: testTeacherId
      });
      await repository.save(course);

      // Act - Delete teacher (should cascade to courses)
      await prisma.user.delete({
        where: { id: testTeacherId }
      });

      // Assert
      const foundCourse = await repository.findById(courseId);
      expect(foundCourse).toBeNull();
    });
  });
});
