/**
 * PrismaQuizSubmissionRepository Integration Tests
 * 
 * Tests the PrismaQuizSubmissionRepository implementation with a real database.
 * These are integration tests that verify database operations work correctly.
 * 
 * Requirements:
 * - 17.1: Data persistence operations
 * - 17.2: Repository pattern implementation
 * - 17.3: Domain-infrastructure mapping
 * - 21.5: Optimistic locking for concurrent updates
 */

import { PrismaClient } from '@prisma/client';
import { PrismaQuizSubmissionRepository } from '../PrismaQuizSubmissionRepository';
import { QuizSubmission, QuizSubmissionStatus } from '../../../../domain/entities/QuizSubmission';
import { randomUUID } from 'crypto';

describe('PrismaQuizSubmissionRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PrismaQuizSubmissionRepository;
  let testQuizId: string;
  let testStudentId: string;
  let testCourseId: string;
  let testTeacherId: string;

  beforeAll(async () => {
    // Create a fresh PrismaClient instance for tests
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    repository = new PrismaQuizSubmissionRepository(prisma);
    
    // Connect to database
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up tables before each test
    await prisma.quizSubmission.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Create a test teacher
    testTeacherId = randomUUID();
    await prisma.user.create({
      data: {
        id: testTeacherId,
        email: 'teacher@example.com',
        name: 'Test Teacher',
        role: 'TEACHER',
        passwordHash: 'hashed_password'
      }
    });

    // Create a test student
    testStudentId = randomUUID();
    await prisma.user.create({
      data: {
        id: testStudentId,
        email: 'student@example.com',
        name: 'Test Student',
        role: 'STUDENT',
        passwordHash: 'hashed_password'
      }
    });

    // Create a test course
    testCourseId = randomUUID();
    await prisma.course.create({
      data: {
        id: testCourseId,
        name: 'Test Course',
        description: 'Test Description',
        courseCode: 'TEST123',
        status: 'ACTIVE',
        teacherId: testTeacherId
      }
    });

    // Create a test quiz
    testQuizId = randomUUID();
    await prisma.quiz.create({
      data: {
        id: testQuizId,
        courseId: testCourseId,
        title: 'Test Quiz',
        description: 'Test Description',
        dueDate: new Date(Date.now() + 86400000), // 1 day in future
        timeLimit: 60,
        questions: [
          {
            type: 'MCQ',
            questionText: 'What is 2+2?',
            options: ['3', '4', '5'],
            correctAnswer: 1
          }
        ]
      }
    });
  });

  describe('save', () => {
    it('should create a new quiz submission', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);

      // Act
      const savedSubmission = await repository.save(submission);

      // Assert
      expect(savedSubmission.getId()).toBe(submission.getId());
      expect(savedSubmission.getQuizId()).toBe(testQuizId);
      expect(savedSubmission.getStudentId()).toBe(testStudentId);
      expect(savedSubmission.getStatus()).toBe(QuizSubmissionStatus.NOT_STARTED);
      expect(savedSubmission.getVersion()).toBe(1);
    });

    it('should update an existing quiz submission', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission);

      // Start the quiz
      const quizDueDate = new Date(Date.now() + 86400000);
      submission.start(quizDueDate);

      // Act
      const updatedSubmission = await repository.save(submission);

      // Assert
      expect(updatedSubmission.getId()).toBe(submission.getId());
      expect(updatedSubmission.getStatus()).toBe(QuizSubmissionStatus.IN_PROGRESS);
      expect(updatedSubmission.getStartedAt()).not.toBeNull();
    });

    it('should throw error when quizId does not exist', async () => {
      // Arrange
      const submission = QuizSubmission.create(randomUUID(), testStudentId);

      // Act & Assert
      await expect(repository.save(submission)).rejects.toThrow('Quiz or student not found');
    });

    it('should throw error when studentId does not exist', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, randomUUID());

      // Act & Assert
      await expect(repository.save(submission)).rejects.toThrow('Quiz or student not found');
    });

    it('should serialize and deserialize answers correctly', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      const quizDueDate = new Date(Date.now() + 86400000);
      submission.start(quizDueDate);
      
      const answers = [
        { questionIndex: 0, answer: 1 },
        { questionIndex: 1, answer: 'Essay answer text' }
      ];
      submission.updateAnswers(answers);

      // Act
      await repository.save(submission);
      const foundSubmission = await repository.findById(submission.getId());

      // Assert
      expect(foundSubmission).not.toBeNull();
      expect(foundSubmission!.getAnswers()).toHaveLength(2);
      expect(foundSubmission!.getAnswers()[0].questionIndex).toBe(0);
      expect(foundSubmission!.getAnswers()[0].answer).toBe(1);
      expect(foundSubmission!.getAnswers()[1].questionIndex).toBe(1);
      expect(foundSubmission!.getAnswers()[1].answer).toBe('Essay answer text');
    });
  });

  describe('findById', () => {
    it('should find quiz submission by ID', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission);

      // Act
      const foundSubmission = await repository.findById(submission.getId());

      // Assert
      expect(foundSubmission).not.toBeNull();
      expect(foundSubmission!.getId()).toBe(submission.getId());
      expect(foundSubmission!.getQuizId()).toBe(testQuizId);
      expect(foundSubmission!.getStudentId()).toBe(testStudentId);
    });

    it('should return null when submission not found', async () => {
      // Act
      const foundSubmission = await repository.findById(randomUUID());

      // Assert
      expect(foundSubmission).toBeNull();
    });
  });

  describe('findByQuizAndStudent', () => {
    it('should find submission by quiz and student', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission);

      // Act
      const foundSubmission = await repository.findByQuizAndStudent(testQuizId, testStudentId);

      // Assert
      expect(foundSubmission).not.toBeNull();
      expect(foundSubmission!.getId()).toBe(submission.getId());
    });

    it('should return null when submission not found', async () => {
      // Act
      const foundSubmission = await repository.findByQuizAndStudent(testQuizId, testStudentId);

      // Assert
      expect(foundSubmission).toBeNull();
    });

    it('should update existing submission when saving with same quiz and student', async () => {
      // Arrange
      const submission1 = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission1);

      // Try to create another submission for same quiz and student
      const submission2 = QuizSubmission.create(testQuizId, testStudentId);
      const quizDueDate = new Date(Date.now() + 86400000);
      submission2.start(quizDueDate);

      // Act - This should update the existing submission (upsert behavior)
      const saved = await repository.save(submission2);

      // Assert - Should have updated the existing submission
      expect(saved.getId()).toBe(submission1.getId()); // Same ID as first submission
      expect(saved.getStatus()).toBe(QuizSubmissionStatus.IN_PROGRESS);
      expect(saved.getStartedAt()).not.toBeNull();

      // Verify only one submission exists
      const submissions = await repository.findByQuizId(testQuizId);
      expect(submissions).toHaveLength(1);
    });
  });

  describe('findByQuizId', () => {
    it('should find all submissions for a quiz', async () => {
      // Arrange
      const student2Id = randomUUID();
      await prisma.user.create({
        data: {
          id: student2Id,
          email: 'student2@example.com',
          name: 'Test Student 2',
          role: 'STUDENT',
          passwordHash: 'hashed_password'
        }
      });

      const submission1 = QuizSubmission.create(testQuizId, testStudentId);
      const submission2 = QuizSubmission.create(testQuizId, student2Id);
      await repository.save(submission1);
      await repository.save(submission2);

      // Act
      const submissions = await repository.findByQuizId(testQuizId);

      // Assert
      expect(submissions).toHaveLength(2);
      expect(submissions.map(s => s.getStudentId())).toContain(testStudentId);
      expect(submissions.map(s => s.getStudentId())).toContain(student2Id);
    });

    it('should return empty array when quiz has no submissions', async () => {
      // Act
      const submissions = await repository.findByQuizId(testQuizId);

      // Assert
      expect(submissions).toHaveLength(0);
    });
  });

  describe('findByStudentAndCourse', () => {
    it('should find all submissions for a student in a course', async () => {
      // Arrange - Create another quiz in the same course
      const quiz2Id = randomUUID();
      await prisma.quiz.create({
        data: {
          id: quiz2Id,
          courseId: testCourseId,
          title: 'Test Quiz 2',
          description: 'Test Description 2',
          dueDate: new Date(Date.now() + 86400000),
          timeLimit: 45,
          questions: [
            {
              type: 'MCQ',
              questionText: 'Question',
              options: ['A', 'B'],
              correctAnswer: 0
            }
          ]
        }
      });

      const submission1 = QuizSubmission.create(testQuizId, testStudentId);
      const submission2 = QuizSubmission.create(quiz2Id, testStudentId);
      await repository.save(submission1);
      await repository.save(submission2);

      // Act
      const submissions = await repository.findByStudentAndCourse(testStudentId, testCourseId);

      // Assert
      expect(submissions).toHaveLength(2);
      expect(submissions.map(s => s.getQuizId())).toContain(testQuizId);
      expect(submissions.map(s => s.getQuizId())).toContain(quiz2Id);
    });

    it('should return empty array when student has no submissions in course', async () => {
      // Act
      const submissions = await repository.findByStudentAndCourse(testStudentId, testCourseId);

      // Assert
      expect(submissions).toHaveLength(0);
    });

    it('should only return submissions for specified course', async () => {
      // Arrange - Create another course and quiz
      const course2Id = randomUUID();
      await prisma.course.create({
        data: {
          id: course2Id,
          name: 'Another Course',
          description: 'Another Description',
          courseCode: 'OTHER123',
          status: 'ACTIVE',
          teacherId: testTeacherId
        }
      });

      const quiz2Id = randomUUID();
      await prisma.quiz.create({
        data: {
          id: quiz2Id,
          courseId: course2Id,
          title: 'Quiz in Another Course',
          description: 'Description',
          dueDate: new Date(Date.now() + 86400000),
          timeLimit: 60,
          questions: [
            {
              type: 'MCQ',
              questionText: 'Question',
              options: ['A', 'B'],
              correctAnswer: 0
            }
          ]
        }
      });

      const submission1 = QuizSubmission.create(testQuizId, testStudentId);
      const submission2 = QuizSubmission.create(quiz2Id, testStudentId);
      await repository.save(submission1);
      await repository.save(submission2);

      // Act
      const submissions = await repository.findByStudentAndCourse(testStudentId, testCourseId);

      // Assert
      expect(submissions).toHaveLength(1);
      expect(submissions[0].getQuizId()).toBe(testQuizId);
    });
  });

  describe('update', () => {
    it('should update an existing submission', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission);

      // Start the quiz
      const quizDueDate = new Date(Date.now() + 86400000);
      submission.start(quizDueDate);

      // Act
      const updatedSubmission = await repository.update(submission);

      // Assert
      expect(updatedSubmission.getId()).toBe(submission.getId());
      expect(updatedSubmission.getStatus()).toBe(QuizSubmissionStatus.IN_PROGRESS);
      expect(updatedSubmission.getStartedAt()).not.toBeNull();
    });

    it('should throw error when updating non-existent submission', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);

      // Act & Assert
      await expect(repository.update(submission)).rejects.toThrow('not found');
    });

    it('should implement optimistic locking', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission);

      // Simulate concurrent update by modifying version in database
      await prisma.quizSubmission.update({
        where: { id: submission.getId() },
        data: { version: 2 }
      });

      // Try to update with old version
      const quizDueDate = new Date(Date.now() + 86400000);
      submission.start(quizDueDate);

      // Act & Assert
      await expect(repository.update(submission)).rejects.toThrow('Concurrent update detected');
    });

    it('should store version correctly', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      console.log('1. Created submission, version:', submission.getVersion());
      
      const saved = await repository.save(submission);
      console.log('2. After save, version:', saved.getVersion());

      // Start the quiz
      const quizDueDate = new Date(Date.now() + 86400000);
      saved.start(quizDueDate);
      console.log('3. After start, entity version:', saved.getVersion());
      
      const afterStart = await repository.update(saved);
      console.log('4. After update (start), returned version:', afterStart.getVersion());

      // Check database
      const dbCheck1 = await prisma.quizSubmission.findUnique({ where: { id: saved.getId() } });
      console.log('5. Database version after start:', dbCheck1?.version);

      // Submit the quiz
      afterStart.submit([], 60, false);
      console.log('6. After submit, entity version:', afterStart.getVersion());
      
      const afterSubmit = await repository.update(afterStart);
      console.log('7. After update (submit), returned version:', afterSubmit.getVersion());

      // Check database
      const dbCheck2 = await prisma.quizSubmission.findUnique({ where: { id: saved.getId() } });
      console.log('8. Database version after submit:', dbCheck2?.version);

      // Grade the submission
      afterSubmit.setGrade(85, 'Good work');
      console.log('9. After setGrade, entity version:', afterSubmit.getVersion());

      // Act
      const afterGrade = await repository.update(afterSubmit);
      console.log('10. After update (grade), returned version:', afterGrade.getVersion());

      // Check database
      const dbCheck3 = await prisma.quizSubmission.findUnique({ where: { id: saved.getId() } });
      console.log('11. Database version after grade:', dbCheck3?.version);

      // Assert
      expect(afterGrade.getVersion()).toBe(2);
    });

    it('should increment version when grading', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      const saved = await repository.save(submission);

      // Start and submit the quiz
      const quizDueDate = new Date(Date.now() + 86400000);
      saved.start(quizDueDate);
      await repository.update(saved);

      saved.submit([], 60, false);
      const submitted = await repository.update(saved);
      expect(submitted.getVersion()).toBe(1);

      // Reload from database to get fresh version
      const reloaded = await repository.findById(submitted.getId());
      expect(reloaded).not.toBeNull();
      expect(reloaded!.getVersion()).toBe(1);

      // Grade the submission (this increments version in entity)
      reloaded!.setGrade(85, 'Good work');
      expect(reloaded!.getVersion()).toBe(2); // Entity version incremented

      // Act - Update in database
      const graded = await repository.update(reloaded!);

      // Assert - Database version should match entity version
      expect(graded.getVersion()).toBe(2);
    });
  });

  describe('delete', () => {
    it('should delete submission by ID', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission);

      // Act
      await repository.delete(submission.getId());

      // Assert
      const foundSubmission = await repository.findById(submission.getId());
      expect(foundSubmission).toBeNull();
    });

    it('should throw error when deleting non-existent submission', async () => {
      // Act & Assert
      await expect(repository.delete(randomUUID())).rejects.toThrow('not found');
    });
  });

  describe('deleteByQuizId', () => {
    it('should delete all submissions for a quiz', async () => {
      // Arrange
      const student2Id = randomUUID();
      await prisma.user.create({
        data: {
          id: student2Id,
          email: 'student2@example.com',
          name: 'Test Student 2',
          role: 'STUDENT',
          passwordHash: 'hashed_password'
        }
      });

      const submission1 = QuizSubmission.create(testQuizId, testStudentId);
      const submission2 = QuizSubmission.create(testQuizId, student2Id);
      await repository.save(submission1);
      await repository.save(submission2);

      // Act
      const deletedCount = await repository.deleteByQuizId(testQuizId);

      // Assert
      expect(deletedCount).toBe(2);
      const submissions = await repository.findByQuizId(testQuizId);
      expect(submissions).toHaveLength(0);
    });

    it('should return 0 when quiz has no submissions', async () => {
      // Act
      const deletedCount = await repository.deleteByQuizId(testQuizId);

      // Assert
      expect(deletedCount).toBe(0);
    });
  });

  describe('deleteByCourseId', () => {
    it('should delete all submissions for a course', async () => {
      // Arrange - Create another quiz in the same course
      const quiz2Id = randomUUID();
      await prisma.quiz.create({
        data: {
          id: quiz2Id,
          courseId: testCourseId,
          title: 'Test Quiz 2',
          description: 'Test Description 2',
          dueDate: new Date(Date.now() + 86400000),
          timeLimit: 45,
          questions: [
            {
              type: 'MCQ',
              questionText: 'Question',
              options: ['A', 'B'],
              correctAnswer: 0
            }
          ]
        }
      });

      const submission1 = QuizSubmission.create(testQuizId, testStudentId);
      const submission2 = QuizSubmission.create(quiz2Id, testStudentId);
      await repository.save(submission1);
      await repository.save(submission2);

      // Act
      const deletedCount = await repository.deleteByCourseId(testCourseId);

      // Assert
      expect(deletedCount).toBe(2);
      const submissions = await repository.findByStudentAndCourse(testStudentId, testCourseId);
      expect(submissions).toHaveLength(0);
    });

    it('should return 0 when course has no submissions', async () => {
      // Act
      const deletedCount = await repository.deleteByCourseId(testCourseId);

      // Assert
      expect(deletedCount).toBe(0);
    });
  });

  describe('countByQuizId', () => {
    it('should count submissions for a quiz', async () => {
      // Arrange
      const student2Id = randomUUID();
      await prisma.user.create({
        data: {
          id: student2Id,
          email: 'student2@example.com',
          name: 'Test Student 2',
          role: 'STUDENT',
          passwordHash: 'hashed_password'
        }
      });

      const submission1 = QuizSubmission.create(testQuizId, testStudentId);
      const submission2 = QuizSubmission.create(testQuizId, student2Id);
      await repository.save(submission1);
      await repository.save(submission2);

      // Act
      const count = await repository.countByQuizId(testQuizId);

      // Assert
      expect(count).toBe(2);
    });

    it('should return 0 when quiz has no submissions', async () => {
      // Act
      const count = await repository.countByQuizId(testQuizId);

      // Assert
      expect(count).toBe(0);
    });
  });

  describe('relationship with Quiz and User', () => {
    it('should maintain foreign key relationship with Quiz', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission);

      // Act - Verify relationship in database
      const dbSubmission = await prisma.quizSubmission.findUnique({
        where: { id: submission.getId() },
        include: { quiz: true }
      });

      // Assert
      expect(dbSubmission).not.toBeNull();
      expect(dbSubmission!.quiz.id).toBe(testQuizId);
      expect(dbSubmission!.quiz.title).toBe('Test Quiz');
    });

    it('should maintain foreign key relationship with User (student)', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission);

      // Act - Verify relationship in database
      const dbSubmission = await prisma.quizSubmission.findUnique({
        where: { id: submission.getId() },
        include: { student: true }
      });

      // Assert
      expect(dbSubmission).not.toBeNull();
      expect(dbSubmission!.student.id).toBe(testStudentId);
      expect(dbSubmission!.student.email).toBe('student@example.com');
    });

    it('should cascade delete submissions when quiz is deleted', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission);

      // Act - Delete quiz (should cascade to submissions)
      await prisma.quiz.delete({
        where: { id: testQuizId }
      });

      // Assert
      const foundSubmission = await repository.findById(submission.getId());
      expect(foundSubmission).toBeNull();
    });

    it('should cascade delete submissions when student is deleted', async () => {
      // Arrange
      const submission = QuizSubmission.create(testQuizId, testStudentId);
      await repository.save(submission);

      // Act - Delete student (should cascade to submissions)
      await prisma.user.delete({
        where: { id: testStudentId }
      });

      // Assert
      const foundSubmission = await repository.findById(submission.getId());
      expect(foundSubmission).toBeNull();
    });
  });
});
