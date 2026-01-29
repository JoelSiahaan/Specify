/**
 * PrismaEnrollmentRepository Integration Tests
 * 
 * Tests the PrismaEnrollmentRepository implementation with a real database.
 * These are integration tests that verify database operations work correctly.
 * 
 * Requirements:
 * - 17.1: Data persistence operations
 * - 17.2: Repository pattern implementation
 * - 17.3: Domain-infrastructure mapping
 */

import { PrismaClient } from '@prisma/client';
import { PrismaEnrollmentRepository } from '../PrismaEnrollmentRepository';
import { Enrollment } from '../../../../domain/entities/Enrollment';
import { randomUUID } from 'crypto';
import { getTestPrismaClient } from '../../../../test/test-utils';

describe('PrismaEnrollmentRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaEnrollmentRepository;
  let testStudentId: string;
  let testTeacherId: string;
  let testCourseId: string;

  beforeAll(async () => {
    // Create Prisma client for this test suite
    prisma = getTestPrismaClient();
    repository = new PrismaEnrollmentRepository(prisma);
  });

  afterAll(async () => {
    // Disconnect Prisma client after all tests
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Generate unique IDs for this test to avoid conflicts
    testStudentId = randomUUID();
    testTeacherId = randomUUID();
    testCourseId = randomUUID();
    
    // Create test users (student and teacher)
    await prisma.user.create({
      data: {
        id: testStudentId,
        email: `student-${testStudentId}@example.com`,
        name: 'Test Student',
        role: 'STUDENT',
        passwordHash: 'hashed_password'
      }
    });
    
    await prisma.user.create({
      data: {
        id: testTeacherId,
        email: `teacher-${testTeacherId}@example.com`,
        name: 'Test Teacher',
        role: 'TEACHER',
        passwordHash: 'hashed_password'
      }
    });
    
    // Create test course
    await prisma.course.create({
      data: {
        id: testCourseId,
        name: 'Introduction to Programming',
        description: 'Learn programming basics',
        courseCode: `ABC${testCourseId.substring(0, 6).toUpperCase()}`,
        status: 'ACTIVE',
        teacherId: testTeacherId
      }
    });
  });

  describe('save', () => {
    it('should create a new enrollment', async () => {
      // Arrange
      const enrollmentId = randomUUID();
      const enrollment = Enrollment.create({
        id: enrollmentId,
        studentId: testStudentId,
        courseId: testCourseId
      });

      // Act
      const savedEnrollment = await repository.save(enrollment);

      // Assert
      expect(savedEnrollment.getId()).toBe(enrollmentId);
      expect(savedEnrollment.getStudentId()).toBe(testStudentId);
      expect(savedEnrollment.getCourseId()).toBe(testCourseId);
      expect(savedEnrollment.getEnrolledAt()).toBeInstanceOf(Date);
    });

    it('should update an existing enrollment', async () => {
      // Arrange
      const enrollmentId = randomUUID();
      const enrollment = Enrollment.create({
        id: enrollmentId,
        studentId: testStudentId,
        courseId: testCourseId
      });
      await repository.save(enrollment);

      // Create a new enrollment instance with same ID but different timestamp
      const updatedEnrollment = Enrollment.reconstitute({
        id: enrollmentId,
        studentId: testStudentId,
        courseId: testCourseId,
        enrolledAt: new Date('2025-01-01T00:00:00Z')
      });

      // Act
      const savedEnrollment = await repository.save(updatedEnrollment);

      // Assert
      expect(savedEnrollment.getId()).toBe(enrollmentId);
      expect(savedEnrollment.getEnrolledAt().toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should throw error when duplicate enrollment (same student and course)', async () => {
      // Arrange
      const enrollment1 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });
      await repository.save(enrollment1);

      // Try to create another enrollment with same student and course
      const enrollment2 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });

      // Act & Assert
      await expect(repository.save(enrollment2)).rejects.toThrow('Student is already enrolled in this course');
    });
  });

  describe('findByStudentAndCourse', () => {
    it('should find enrollment by student ID and course ID', async () => {
      // Arrange
      const enrollmentId = randomUUID();
      const enrollment = Enrollment.create({
        id: enrollmentId,
        studentId: testStudentId,
        courseId: testCourseId
      });
      await repository.save(enrollment);

      // Act
      const foundEnrollment = await repository.findByStudentAndCourse(testStudentId, testCourseId);

      // Assert
      expect(foundEnrollment).not.toBeNull();
      expect(foundEnrollment!.getId()).toBe(enrollmentId);
      expect(foundEnrollment!.getStudentId()).toBe(testStudentId);
      expect(foundEnrollment!.getCourseId()).toBe(testCourseId);
    });

    it('should return null when enrollment not found', async () => {
      // Act
      const foundEnrollment = await repository.findByStudentAndCourse(randomUUID(), randomUUID());

      // Assert
      expect(foundEnrollment).toBeNull();
    });

    it('should return null when student exists but not enrolled in course', async () => {
      // Arrange - Create another course
      const anotherCourseId = randomUUID();
      await prisma.course.create({
        data: {
          id: anotherCourseId,
          name: 'Advanced Programming',
          description: 'Advanced concepts',
          courseCode: `DEF${anotherCourseId.substring(0, 6).toUpperCase()}`,
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });

      // Act
      const foundEnrollment = await repository.findByStudentAndCourse(testStudentId, anotherCourseId);

      // Assert
      expect(foundEnrollment).toBeNull();
    });
  });

  describe('findByCourse', () => {
    it('should find all enrollments for a course', async () => {
      // Arrange - Create multiple students and enroll them
      const student2Id = randomUUID();
      const student3Id = randomUUID();
      
      await prisma.user.create({
        data: {
          id: student2Id,
          email: `student2-${student2Id}@example.com`,
          name: 'Student 2',
          role: 'STUDENT',
          passwordHash: 'hashed_password'
        }
      });
      
      await prisma.user.create({
        data: {
          id: student3Id,
          email: `student3-${student3Id}@example.com`,
          name: 'Student 3',
          role: 'STUDENT',
          passwordHash: 'hashed_password'
        }
      });

      const enrollment1 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });
      const enrollment2 = Enrollment.create({
        id: randomUUID(),
        studentId: student2Id,
        courseId: testCourseId
      });
      const enrollment3 = Enrollment.create({
        id: randomUUID(),
        studentId: student3Id,
        courseId: testCourseId
      });

      await repository.save(enrollment1);
      await repository.save(enrollment2);
      await repository.save(enrollment3);

      // Act
      const enrollments = await repository.findByCourse(testCourseId);

      // Assert
      expect(enrollments).toHaveLength(3);
      expect(enrollments.map(e => e.getStudentId())).toContain(testStudentId);
      expect(enrollments.map(e => e.getStudentId())).toContain(student2Id);
      expect(enrollments.map(e => e.getStudentId())).toContain(student3Id);
    });

    it('should return empty array when course has no enrollments', async () => {
      // Act
      const enrollments = await repository.findByCourse(testCourseId);

      // Assert
      expect(enrollments).toHaveLength(0);
    });

    it('should only return enrollments for specified course', async () => {
      // Arrange - Create another course
      const anotherCourseId = randomUUID();
      await prisma.course.create({
        data: {
          id: anotherCourseId,
          name: 'Advanced Programming',
          description: 'Advanced concepts',
          courseCode: `DEF${anotherCourseId.substring(0, 6).toUpperCase()}`,
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });

      // Create enrollments for both courses
      const enrollment1 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });
      
      const student2Id = randomUUID();
      await prisma.user.create({
        data: {
          id: student2Id,
          email: `student2-${student2Id}@example.com`,
          name: 'Student 2',
          role: 'STUDENT',
          passwordHash: 'hashed_password'
        }
      });
      
      const enrollment2 = Enrollment.create({
        id: randomUUID(),
        studentId: student2Id,
        courseId: anotherCourseId
      });

      await repository.save(enrollment1);
      await repository.save(enrollment2);

      // Act
      const enrollments = await repository.findByCourse(testCourseId);

      // Assert
      expect(enrollments).toHaveLength(1);
      expect(enrollments[0].getStudentId()).toBe(testStudentId);
      expect(enrollments[0].getCourseId()).toBe(testCourseId);
    });
  });

  describe('findByStudentId', () => {
    it('should find all enrollments for a student', async () => {
      // Arrange - Create multiple courses and enroll student
      const course2Id = randomUUID();
      const course3Id = randomUUID();
      
      await prisma.course.create({
        data: {
          id: course2Id,
          name: 'Advanced Programming',
          description: 'Advanced concepts',
          courseCode: `DEF${course2Id.substring(0, 6).toUpperCase()}`,
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });
      
      await prisma.course.create({
        data: {
          id: course3Id,
          name: 'Data Structures',
          description: 'Learn data structures',
          courseCode: `GHI${course3Id.substring(0, 6).toUpperCase()}`,
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });

      const enrollment1 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });
      const enrollment2 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: course2Id
      });
      const enrollment3 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: course3Id
      });

      await repository.save(enrollment1);
      await repository.save(enrollment2);
      await repository.save(enrollment3);

      // Act
      const enrollments = await repository.findByStudentId(testStudentId);

      // Assert
      expect(enrollments).toHaveLength(3);
      expect(enrollments.map(e => e.getCourseId())).toContain(testCourseId);
      expect(enrollments.map(e => e.getCourseId())).toContain(course2Id);
      expect(enrollments.map(e => e.getCourseId())).toContain(course3Id);
    });

    it('should return empty array when student has no enrollments', async () => {
      // Act
      const enrollments = await repository.findByStudentId(testStudentId);

      // Assert
      expect(enrollments).toHaveLength(0);
    });

    it('should only return enrollments for specified student', async () => {
      // Arrange - Create another student
      const student2Id = randomUUID();
      await prisma.user.create({
        data: {
          id: student2Id,
          email: `student2-${student2Id}@example.com`,
          name: 'Student 2',
          role: 'STUDENT',
          passwordHash: 'hashed_password'
        }
      });

      // Create enrollments for both students
      const enrollment1 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });
      
      const course2Id = randomUUID();
      await prisma.course.create({
        data: {
          id: course2Id,
          name: 'Advanced Programming',
          description: 'Advanced concepts',
          courseCode: `DEF${course2Id.substring(0, 6).toUpperCase()}`,
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });
      
      const enrollment2 = Enrollment.create({
        id: randomUUID(),
        studentId: student2Id,
        courseId: course2Id
      });

      await repository.save(enrollment1);
      await repository.save(enrollment2);

      // Act
      const enrollments = await repository.findByStudentId(testStudentId);

      // Assert
      expect(enrollments).toHaveLength(1);
      expect(enrollments[0].getStudentId()).toBe(testStudentId);
      expect(enrollments[0].getCourseId()).toBe(testCourseId);
    });
  });

  describe('deleteAllByCourse', () => {
    it('should delete all enrollments for a course', async () => {
      // Arrange - Create multiple enrollments
      const student2Id = randomUUID();
      await prisma.user.create({
        data: {
          id: student2Id,
          email: `student2-${student2Id}@example.com`,
          name: 'Student 2',
          role: 'STUDENT',
          passwordHash: 'hashed_password'
        }
      });

      const enrollment1 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });
      const enrollment2 = Enrollment.create({
        id: randomUUID(),
        studentId: student2Id,
        courseId: testCourseId
      });

      await repository.save(enrollment1);
      await repository.save(enrollment2);

      // Act
      await repository.deleteAllByCourse(testCourseId);

      // Assert
      const enrollments = await repository.findByCourse(testCourseId);
      expect(enrollments).toHaveLength(0);
    });

    it('should not affect enrollments in other courses', async () => {
      // Arrange - Create another course
      const anotherCourseId = randomUUID();
      await prisma.course.create({
        data: {
          id: anotherCourseId,
          name: 'Advanced Programming',
          description: 'Advanced concepts',
          courseCode: `DEF${anotherCourseId.substring(0, 6).toUpperCase()}`,
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });

      // Create enrollments for both courses
      const enrollment1 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });
      
      const student2Id = randomUUID();
      await prisma.user.create({
        data: {
          id: student2Id,
          email: `student2-${student2Id}@example.com`,
          name: 'Student 2',
          role: 'STUDENT',
          passwordHash: 'hashed_password'
        }
      });
      
      const enrollment2 = Enrollment.create({
        id: randomUUID(),
        studentId: student2Id,
        courseId: anotherCourseId
      });

      await repository.save(enrollment1);
      await repository.save(enrollment2);

      // Act
      await repository.deleteAllByCourse(testCourseId);

      // Assert
      const enrollments1 = await repository.findByCourse(testCourseId);
      const enrollments2 = await repository.findByCourse(anotherCourseId);
      
      expect(enrollments1).toHaveLength(0);
      expect(enrollments2).toHaveLength(1);
      expect(enrollments2[0].getStudentId()).toBe(student2Id);
    });

    it('should succeed when course has no enrollments', async () => {
      // Act & Assert - Should not throw error
      await expect(repository.deleteAllByCourse(testCourseId)).resolves.not.toThrow();
    });
  });

  describe('unique constraint on (studentId, courseId)', () => {
    it('should enforce unique constraint at database level', async () => {
      // Arrange
      const enrollment1 = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });
      await repository.save(enrollment1);

      // Act - Try to insert duplicate directly via Prisma (bypassing repository)
      const duplicateInsert = prisma.enrollment.create({
        data: {
          id: randomUUID(),
          studentId: testStudentId,
          courseId: testCourseId,
          enrolledAt: new Date()
        }
      });

      // Assert
      await expect(duplicateInsert).rejects.toThrow();
    });
  });

  describe('relationships', () => {
    it('should maintain foreign key relationship with User (student)', async () => {
      // Arrange
      const enrollment = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });
      await repository.save(enrollment);

      // Act - Verify relationship in database
      const dbEnrollment = await prisma.enrollment.findUnique({
        where: { id: enrollment.getId() },
        include: { student: true }
      });

      // Assert
      expect(dbEnrollment).not.toBeNull();
      expect(dbEnrollment!.student.id).toBe(testStudentId);
      expect(dbEnrollment!.student.email).toContain('@example.com');
      expect(dbEnrollment!.student.name).toBe('Test Student');
      expect(dbEnrollment!.student.role).toBe('STUDENT');
    });

    it('should maintain foreign key relationship with Course', async () => {
      // Arrange
      const enrollment = Enrollment.create({
        id: randomUUID(),
        studentId: testStudentId,
        courseId: testCourseId
      });
      await repository.save(enrollment);

      // Act - Verify relationship in database
      const dbEnrollment = await prisma.enrollment.findUnique({
        where: { id: enrollment.getId() },
        include: { course: true }
      });

      // Assert
      expect(dbEnrollment).not.toBeNull();
      expect(dbEnrollment!.course.id).toBe(testCourseId);
      expect(dbEnrollment!.course.name).toBe('Introduction to Programming');
      expect(dbEnrollment!.course.courseCode).toContain('ABC');
    });

    it('should cascade delete enrollments when student is deleted', async () => {
      // Arrange
      const enrollmentId = randomUUID();
      const enrollment = Enrollment.create({
        id: enrollmentId,
        studentId: testStudentId,
        courseId: testCourseId
      });
      await repository.save(enrollment);

      // Act - Delete student (should cascade to enrollments)
      await prisma.user.delete({
        where: { id: testStudentId }
      });

      // Assert
      const foundEnrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId }
      });
      expect(foundEnrollment).toBeNull();
    });

    it('should cascade delete enrollments when course is deleted', async () => {
      // Arrange
      const enrollmentId = randomUUID();
      const enrollment = Enrollment.create({
        id: enrollmentId,
        studentId: testStudentId,
        courseId: testCourseId
      });
      await repository.save(enrollment);

      // Act - Delete course (should cascade to enrollments)
      await prisma.course.delete({
        where: { id: testCourseId }
      });

      // Assert
      const foundEnrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId }
      });
      expect(foundEnrollment).toBeNull();
    });
  });
});
