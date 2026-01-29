/**
 * PrismaAssignmentRepository Integration Tests
 * 
 * Tests the PrismaAssignmentRepository implementation with a real database.
 * These are integration tests that verify database operations work correctly.
 * 
 * Requirements:
 * - 17.1: Data persistence operations
 * - 17.2: Repository pattern implementation
 * - 17.3: Domain-infrastructure mapping
 */

import { PrismaClient } from '@prisma/client';
import { PrismaAssignmentRepository } from '../PrismaAssignmentRepository';
import { Assignment, SubmissionType } from '../../../../domain/entities/Assignment';
import { randomUUID } from 'crypto';
import { getTestPrismaClient } from '../../../../test/test-utils';

describe('PrismaAssignmentRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaAssignmentRepository;
  let testCourseId: string;
  let testTeacherId: string;
  const createdTeacherIds: string[] = [];
  const createdCourseIds: string[] = [];

  beforeAll(async () => {
    // Create Prisma client for this test suite
    prisma = getTestPrismaClient();
    repository = new PrismaAssignmentRepository(prisma);
  }, 30000);

  afterAll(async () => {
    // Clean up all created data in correct order (children first, then parents)
    try {
      // Delete courses (will cascade delete assignments)
      if (createdCourseIds.length > 0) {
        await prisma.course.deleteMany({
          where: { id: { in: createdCourseIds } }
        });
      }
      
      // Delete teachers
      if (createdTeacherIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdTeacherIds } }
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Disconnect Prisma client after all tests
    await prisma.$disconnect();
  }, 30000);

  beforeEach(async () => {
    // Generate unique IDs for this test to avoid conflicts
    testTeacherId = randomUUID();
    createdTeacherIds.push(testTeacherId);
    
    await prisma.user.create({
      data: {
        id: testTeacherId,
        email: `teacher-${testTeacherId}@example.com`,
        name: 'Test Teacher',
        role: 'TEACHER',
        passwordHash: 'hashed_password'
      }
    });

    testCourseId = randomUUID();
    createdCourseIds.push(testCourseId);
    
    await prisma.course.create({
      data: {
        id: testCourseId,
        name: 'Test Course',
        description: 'Test Description',
        courseCode: `TEST${testCourseId.substring(0, 6).toUpperCase()}`,
        status: 'ACTIVE',
        teacherId: testTeacherId
      }
    });
  });

  describe('save', () => {
    it('should create a new assignment', async () => {
      // Arrange
      const assignmentId = randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment = Assignment.create({
        id: assignmentId,
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Complete the exercises',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        acceptedFileFormats: ['pdf', 'docx'],
        gradingStarted: false
      });

      // Act
      const savedAssignment = await repository.save(assignment);

      // Assert
      expect(savedAssignment.getId()).toBe(assignmentId);
      expect(savedAssignment.getTitle()).toBe('Assignment 1');
      expect(savedAssignment.getDescription()).toBe('Complete the exercises');
      expect(savedAssignment.getCourseId()).toBe(testCourseId);
      expect(savedAssignment.getSubmissionType()).toBe(SubmissionType.FILE);
      expect(savedAssignment.getAcceptedFileFormats()).toEqual(['pdf', 'docx']);
      expect(savedAssignment.getGradingStarted()).toBe(false);
    });


    it('should update an existing assignment', async () => {
      // Arrange
      const assignmentId = randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment = Assignment.create({
        id: assignmentId,
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Complete the exercises',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        acceptedFileFormats: ['pdf'],
        gradingStarted: false
      });
      await repository.save(assignment);

      // Update assignment
      assignment.updateTitle('Updated Assignment 1');
      assignment.updateDescription('Updated description');

      // Act
      const updatedAssignment = await repository.save(assignment);

      // Assert
      expect(updatedAssignment.getId()).toBe(assignmentId);
      expect(updatedAssignment.getTitle()).toBe('Updated Assignment 1');
      expect(updatedAssignment.getDescription()).toBe('Updated description');
    });
  });

  describe('findById', () => {
    it('should find assignment by ID', async () => {
      // Arrange
      const assignmentId = randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment = Assignment.create({
        id: assignmentId,
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Complete the exercises',
        dueDate: futureDate,
        submissionType: SubmissionType.TEXT,
        gradingStarted: false
      });
      await repository.save(assignment);

      // Act
      const foundAssignment = await repository.findById(assignmentId);

      // Assert
      expect(foundAssignment).not.toBeNull();
      expect(foundAssignment!.getId()).toBe(assignmentId);
      expect(foundAssignment!.getTitle()).toBe('Assignment 1');
      expect(foundAssignment!.getSubmissionType()).toBe(SubmissionType.TEXT);
    });

    it('should return null when assignment not found', async () => {
      // Act
      const foundAssignment = await repository.findById(randomUUID());

      // Assert
      expect(foundAssignment).toBeNull();
    });
  });


  describe('findByCourseId', () => {
    it('should find all assignments by course ID', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment1 = Assignment.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Description 1',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        gradingStarted: false
      });
      
      const assignment2 = Assignment.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Assignment 2',
        description: 'Description 2',
        dueDate: futureDate,
        submissionType: SubmissionType.TEXT,
        gradingStarted: false
      });
      
      await repository.save(assignment1);
      await repository.save(assignment2);

      // Act
      const assignments = await repository.findByCourseId(testCourseId);

      // Assert
      expect(assignments).toHaveLength(2);
      expect(assignments.map(a => a.getTitle())).toContain('Assignment 1');
      expect(assignments.map(a => a.getTitle())).toContain('Assignment 2');
    });

    it('should return empty array when course has no assignments', async () => {
      // Act
      const assignments = await repository.findByCourseId(randomUUID());

      // Assert
      expect(assignments).toHaveLength(0);
    });

    it('should only return assignments for specified course', async () => {
      // Arrange - Create another course
      const anotherCourseId = randomUUID();
      await prisma.course.create({
        data: {
          id: anotherCourseId,
          name: 'Another Course',
          description: 'Another Description',
          courseCode: 'TEST456',
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment1 = Assignment.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Description 1',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        gradingStarted: false
      });
      
      const assignment2 = Assignment.create({
        id: randomUUID(),
        courseId: anotherCourseId,
        title: 'Assignment 2',
        description: 'Description 2',
        dueDate: futureDate,
        submissionType: SubmissionType.TEXT,
        gradingStarted: false
      });
      
      await repository.save(assignment1);
      await repository.save(assignment2);

      // Act
      const assignments = await repository.findByCourseId(testCourseId);

      // Assert
      expect(assignments).toHaveLength(1);
      expect(assignments[0].getTitle()).toBe('Assignment 1');
    });
  });


  describe('update', () => {
    it('should update an existing assignment', async () => {
      // Arrange
      const assignmentId = randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment = Assignment.create({
        id: assignmentId,
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Complete the exercises',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        gradingStarted: false
      });
      await repository.save(assignment);

      // Update assignment
      assignment.updateTitle('Updated Assignment');
      assignment.updateDescription('Updated description');

      // Act
      const updatedAssignment = await repository.update(assignment);

      // Assert
      expect(updatedAssignment.getId()).toBe(assignmentId);
      expect(updatedAssignment.getTitle()).toBe('Updated Assignment');
      expect(updatedAssignment.getDescription()).toBe('Updated description');
    });

    it('should update grading status', async () => {
      // Arrange
      const assignmentId = randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment = Assignment.create({
        id: assignmentId,
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Complete the exercises',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        gradingStarted: false
      });
      await repository.save(assignment);

      // Start grading
      assignment.startGrading();

      // Act
      const updatedAssignment = await repository.update(assignment);

      // Assert
      expect(updatedAssignment.getGradingStarted()).toBe(true);
    });

    it('should throw error when updating non-existent assignment', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment = Assignment.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Non-existent Assignment',
        description: 'Description',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        gradingStarted: false
      });

      // Act & Assert
      await expect(repository.update(assignment)).rejects.toThrow('not found');
    });
  });


  describe('delete', () => {
    it('should delete assignment by ID', async () => {
      // Arrange
      const assignmentId = randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment = Assignment.create({
        id: assignmentId,
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Complete the exercises',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        gradingStarted: false
      });
      await repository.save(assignment);

      // Act
      await repository.delete(assignmentId);

      // Assert
      const foundAssignment = await repository.findById(assignmentId);
      expect(foundAssignment).toBeNull();
    });

    it('should throw error when deleting non-existent assignment', async () => {
      // Act & Assert
      await expect(repository.delete(randomUUID())).rejects.toThrow('not found');
    });
  });

  describe('findByCourseIdWithSubmissionCounts', () => {
    it('should find assignments with submission counts', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment = Assignment.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Description',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        gradingStarted: false
      });
      await repository.save(assignment);

      // Act
      const assignments = await repository.findByCourseIdWithSubmissionCounts(testCourseId);

      // Assert
      expect(assignments).toHaveLength(1);
      expect(assignments[0].getTitle()).toBe('Assignment 1');
    });
  });

  describe('closeAllByCourseId', () => {
    it('should close all assignments for a course', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment1 = Assignment.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Description 1',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        gradingStarted: false
      });
      
      const assignment2 = Assignment.create({
        id: randomUUID(),
        courseId: testCourseId,
        title: 'Assignment 2',
        description: 'Description 2',
        dueDate: futureDate,
        submissionType: SubmissionType.TEXT,
        gradingStarted: false
      });
      
      await repository.save(assignment1);
      await repository.save(assignment2);

      // Act
      await repository.closeAllByCourseId(testCourseId);

      // Assert
      const assignments = await repository.findByCourseId(testCourseId);
      expect(assignments).toHaveLength(2);
      expect(assignments[0].getGradingStarted()).toBe(true);
      expect(assignments[1].getGradingStarted()).toBe(true);
    });
  });


  describe('relationship with Course', () => {
    it('should maintain foreign key relationship with Course', async () => {
      // Arrange
      const assignmentId = randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment = Assignment.create({
        id: assignmentId,
        courseId: testCourseId,
        title: 'Assignment 1',
        description: 'Complete the exercises',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        gradingStarted: false
      });
      await repository.save(assignment);

      // Act - Verify relationship in database
      const dbAssignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { course: true }
      });

      // Assert
      expect(dbAssignment).not.toBeNull();
      expect(dbAssignment!.course.id).toBe(testCourseId);
      expect(dbAssignment!.course.name).toBe('Test Course');
      expect(dbAssignment!.course.courseCode).toContain('TEST');
    });

    it('should cascade delete assignments when course is deleted', async () => {
      // Arrange - Create a fresh course for this test
      const cascadeTestCourseId = randomUUID();
      await prisma.course.create({
        data: {
          id: cascadeTestCourseId,
          name: 'Cascade Test Course',
          description: 'Test Description',
          courseCode: `CASC${cascadeTestCourseId.substring(0, 3).toUpperCase()}`,
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });

      const assignmentId = randomUUID();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const assignment = Assignment.create({
        id: assignmentId,
        courseId: cascadeTestCourseId,
        title: 'Assignment 1',
        description: 'Complete the exercises',
        dueDate: futureDate,
        submissionType: SubmissionType.FILE,
        gradingStarted: false
      });
      await repository.save(assignment);

      // Act - Delete course (should cascade to assignments)
      await prisma.course.delete({
        where: { id: cascadeTestCourseId }
      });

      // Assert
      const foundAssignment = await repository.findById(assignmentId);
      expect(foundAssignment).toBeNull();
    });
  });
});
