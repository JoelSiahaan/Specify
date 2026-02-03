/**
 * QuizController Integration Tests
 * 
 * Tests quiz management API endpoints with Supertest.
 * These are integration tests that verify the complete request/response cycle
 * including validation middleware, authentication middleware, authorization, and error handling.
 * 
 * Requirements:
 * - 11.1: Create quizzes with title, description, due date, and time limit
 * - 11.6: Edit quizzes before due date and before any submissions
 * - 11.8: Delete quizzes anytime
 * - 11.9: View all quizzes for a course
 * - 12.1: Start quiz before due date
 * - 12.4: Auto-submit quiz when time limit expires
 * - 12.6: Prevent multiple submissions for the same quiz
 * - 18.1: API endpoints follow REST conventions
 * - 18.2: Consistent error response format
 * - 18.3: Centralized error handling
 */

import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import quizRoutes from '../../routes/quizRoutes.js';
import { errorHandler } from '../../middleware/ErrorHandlerMiddleware.js';
import { cleanupDatabase, generateTestToken } from '../../../../test/test-utils.js';
import {
  assertSuccessResponse,
  assertAuthenticationError,
  assertAuthorizationError,
  assertNotFoundError
} from '../../../../test/api-test-utils.js';
import { container } from 'tsyringe';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { PrismaCourseRepository } from '../../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import { PrismaQuizRepository } from '../../../../infrastructure/persistence/repositories/PrismaQuizRepository.js';
import { PrismaQuizSubmissionRepository } from '../../../../infrastructure/persistence/repositories/PrismaQuizSubmissionRepository.js';
import { PrismaEnrollmentRepository } from '../../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository.js';
import { PasswordService } from '../../../../infrastructure/auth/PasswordService.js';
import { JWTService } from '../../../../infrastructure/auth/JWTService.js';
import { QuizTimingService } from '../../../../domain/services/QuizTimingService.js';

describe('QuizController Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let teacherToken: string;
  let studentToken: string;
  let teacherId: string;
  let studentId: string;
  let courseId: string;

  beforeAll(async () => {
    // Create Prisma client
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    await prisma.$connect();

    // Register dependencies
    container.registerInstance('PrismaClient', prisma);
    container.registerSingleton('IUserRepository', PrismaUserRepository);
    container.registerSingleton('ICourseRepository', PrismaCourseRepository);
    container.registerSingleton('IQuizRepository', PrismaQuizRepository);
    container.registerSingleton('IQuizSubmissionRepository', PrismaQuizSubmissionRepository);
    container.registerSingleton('IEnrollmentRepository', PrismaEnrollmentRepository);
    container.registerSingleton(PasswordService);
    container.registerSingleton(JWTService);
    container.registerSingleton(QuizTimingService);
    
    // Register authorization policy
    const { AuthorizationPolicy } = await import('../../../../application/policies/AuthorizationPolicy');
    container.registerSingleton('IAuthorizationPolicy', AuthorizationPolicy);

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api', quizRoutes);
    app.use(errorHandler);
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await prisma.quizSubmission.deleteMany({});
      await prisma.quiz.deleteMany({});
      await prisma.enrollment.deleteMany({});
      await prisma.course.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      // Ignore cleanup errors
    }
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up only this test's data (ignore errors if already deleted by cascade)
    try {
      if (courseId) {
        await prisma.quiz.deleteMany({ where: { courseId } }).catch(() => {});
        await prisma.enrollment.deleteMany({ where: { courseId } }).catch(() => {});
        await prisma.course.deleteMany({ where: { id: courseId } }).catch(() => {});
      }
      if (teacherId) {
        await prisma.user.deleteMany({ where: { id: teacherId } }).catch(() => {});
      }
      if (studentId) {
        await prisma.user.deleteMany({ where: { id: studentId } }).catch(() => {});
      }
    } catch (error) {
      // Ignore cleanup errors - data might have been cascade deleted
    }
  });

  beforeEach(async () => {
    try {
      // Generate unique IDs for this test
      teacherId = randomUUID();
      studentId = randomUUID();
      courseId = randomUUID();

      // Create test users with unique emails
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');

      await prisma.user.create({
        data: {
          id: teacherId,
          email: `teacher-${teacherId}@test.com`,
          name: 'Test Teacher',
          role: 'TEACHER',
          passwordHash: hashedPassword
        }
      });

      await prisma.user.create({
        data: {
          id: studentId,
          email: `student-${studentId}@test.com`,
          name: 'Test Student',
          role: 'STUDENT',
          passwordHash: hashedPassword
        }
      });

      // Create test course with unique code
      await prisma.course.create({
        data: {
          id: courseId,
          name: 'Test Course',
          description: 'Test Description',
          courseCode: `TEST${courseId.substring(0, 6).toUpperCase()}`,
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });

      // Enroll student in course
      await prisma.enrollment.create({
        data: {
          studentId: studentId,
          courseId: courseId
        }
      });

      // Generate tokens with unique emails
      teacherToken = generateTestToken({
        userId: teacherId,
        email: `teacher-${teacherId}@test.com`,
        role: 'TEACHER'
      });

      studentToken = generateTestToken({
        userId: studentId,
        email: `student-${studentId}@test.com`,
        role: 'STUDENT'
      });
    } catch (error) {
      console.error('Error in beforeEach setup:', error);
      throw error;
    }
  });

  describe('POST /api/courses/:courseId/quizzes', () => {
    it('should create a new quiz with valid data (teacher)', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const quizData = {
        title: 'Midterm Exam',
        description: 'Comprehensive midterm examination',
        dueDate: futureDate,
        timeLimit: 60,
        questions: [
          {
            type: 'MCQ',
            questionText: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1
          },
          {
            type: 'ESSAY',
            questionText: 'Explain the concept of variables.'
          }
        ]
      };

      // Act
      const response = await request(app)
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Cookie', [`access_token=${teacherToken}`])
        .send(quizData);

      // Assert
      assertSuccessResponse(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Midterm Exam');
      expect(response.body.timeLimit).toBe(60);
      expect(response.body.questions).toHaveLength(2);
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const quizData = {
        title: 'Test Quiz',
        description: 'Test',
        dueDate: futureDate,
        timeLimit: 30,
        questions: [
          {
            type: 'MCQ',
            questionText: 'Test?',
            options: ['A', 'B'],
            correctAnswer: 0
          }
        ]
      };

      // Act
      const response = await request(app)
        .post(`/api/courses/${courseId}/quizzes`)
        .send(quizData);

      // Assert
      assertAuthenticationError(response);
    });

    it('should return 403 when student tries to create quiz', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const quizData = {
        title: 'Test Quiz',
        description: 'Test',
        dueDate: futureDate,
        timeLimit: 30,
        questions: [
          {
            type: 'MCQ',
            questionText: 'Test?',
            options: ['A', 'B'],
            correctAnswer: 0
          }
        ]
      };

      // Act
      const response = await request(app)
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Cookie', [`access_token=${studentToken}`])
        .send(quizData);

      // Assert
      assertAuthorizationError(response);
    });
  });

  describe('GET /api/courses/:courseId/quizzes', () => {
    it('should list quizzes for enrolled student', async () => {
      // Arrange - Create a quiz
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.quiz.create({
        data: {
          title: 'Test Quiz',
          description: 'Test Description',
          dueDate: futureDate,
          timeLimit: 30,
          courseId: courseId,
          questions: JSON.stringify([
            {
              id: 'q1',
              type: 'MCQ',
              questionText: 'Test?',
              options: ['A', 'B'],
              correctAnswer: 0
            }
          ])
        }
      });

      // Act
      const response = await request(app)
        .get(`/api/courses/${courseId}/quizzes`)
        .set('Cookie', [`access_token=${studentToken}`]);

      // Assert
      assertSuccessResponse(response, 200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Quiz');
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .get(`/api/courses/${courseId}/quizzes`);

      // Assert
      assertAuthenticationError(response);
    });
  });

  describe('PUT /api/quizzes/:id', () => {
    it('should update quiz before due date and before submissions', async () => {
      // Arrange - Create a quiz
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Original Title',
          description: 'Original Description',
          dueDate: futureDate,
          timeLimit: 30,
          courseId: courseId,
          questions: JSON.stringify([
            {
              id: 'q1',
              type: 'MCQ',
              questionText: 'Test?',
              options: ['A', 'B'],
              correctAnswer: 0
            }
          ])
        }
      });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description'
      };

      // Act
      const response = await request(app)
        .put(`/api/quizzes/${quiz.id}`)
        .set('Cookie', [`access_token=${teacherToken}`])
        .send(updateData);

      // Assert
      assertSuccessResponse(response, 200);
      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe('Updated Description');
    });

    it('should return 403 when non-owner tries to update', async () => {
      // Arrange - Create another teacher and their quiz
      const otherTeacher = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other Teacher',
          role: 'TEACHER',
          passwordHash: 'hash'
        }
      });

      const otherCourse = await prisma.course.create({
        data: {
          name: 'Other Course',
          description: 'Other',
          courseCode: 'OTHER1',
          status: 'ACTIVE',
          teacherId: otherTeacher.id
        }
      });

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Other Quiz',
          description: 'Other',
          dueDate: futureDate,
          timeLimit: 30,
          courseId: otherCourse.id,
          questions: JSON.stringify([{ id: 'q1', type: 'MCQ', questionText: 'Test?', options: ['A', 'B'], correctAnswer: 0 }])
        }
      });

      // Act
      const response = await request(app)
        .put(`/api/quizzes/${quiz.id}`)
        .set('Cookie', [`access_token=${teacherToken}`])
        .send({ title: 'Hacked' });

      // Assert
      assertAuthorizationError(response);
    });
  });

  describe('DELETE /api/quizzes/:id', () => {
    it('should delete quiz (teacher)', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const quiz = await prisma.quiz.create({
        data: {
          title: 'To Delete',
          description: 'Test',
          dueDate: futureDate,
          timeLimit: 30,
          courseId: courseId,
          questions: JSON.stringify([{ id: 'q1', type: 'MCQ', questionText: 'Test?', options: ['A', 'B'], correctAnswer: 0 }])
        }
      });

      // Act
      const response = await request(app)
        .delete(`/api/quizzes/${quiz.id}`)
        .set('Cookie', [`access_token=${teacherToken}`]);

      // Assert
      assertSuccessResponse(response, 200);
      expect(response.body.message).toBe('Quiz deleted successfully');
    });

    it('should return 404 for non-existent quiz', async () => {
      // Act
      const response = await request(app)
        .delete('/api/quizzes/00000000-0000-0000-0000-000000000000')
        .set('Cookie', [`access_token=${teacherToken}`]);

      // Assert
      assertNotFoundError(response);
    });
  });

  describe('POST /api/quizzes/:id/start', () => {
    it('should start quiz for enrolled student', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Test Quiz',
          description: 'Test',
          dueDate: futureDate,
          timeLimit: 30,
          courseId: courseId,
          questions: JSON.stringify([
            {
              id: 'q1',
              type: 'MCQ',
              questionText: 'Test?',
              options: ['A', 'B'],
              correctAnswer: 0
            }
          ])
        }
      });

      // Act
      const response = await request(app)
        .post(`/api/quizzes/${quiz.id}/start`)
        .set('Cookie', [`access_token=${studentToken}`]);

      // Assert
      assertSuccessResponse(response, 201);
      expect(response.body).toHaveProperty('submissionId');
      expect(response.body).toHaveProperty('startedAt');
      expect(response.body.quizId).toBe(quiz.id);
    });

    it('should return 403 when teacher tries to start quiz', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Test Quiz',
          description: 'Test',
          dueDate: futureDate,
          timeLimit: 30,
          courseId: courseId,
          questions: JSON.stringify([{ id: 'q1', type: 'MCQ', questionText: 'Test?', options: ['A', 'B'], correctAnswer: 0 }])
        }
      });

      // Act
      const response = await request(app)
        .post(`/api/quizzes/${quiz.id}/start`)
        .set('Cookie', [`access_token=${teacherToken}`]);

      // Assert
      assertAuthorizationError(response);
    });
  });

  describe('POST /api/quizzes/:id/submit', () => {
    it('should submit quiz with answers', async () => {
      // Arrange - Create quiz and start it
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Test Quiz',
          description: 'Test',
          dueDate: futureDate,
          timeLimit: 30,
          courseId: courseId,
          questions: JSON.stringify([
            {
              id: 'q1',
              type: 'MCQ',
              questionText: 'Test?',
              options: ['A', 'B'],
              correctAnswer: 0
            }
          ])
        }
      });

      await prisma.quizSubmission.create({
        data: {
          quizId: quiz.id,
          studentId: studentId,
          startedAt: new Date(),
          status: 'IN_PROGRESS',
          answers: JSON.stringify([])
        }
      });

      const answers = [
        {
          questionIndex: 0,
          answer: 0
        }
      ];

      // Act
      const response = await request(app)
        .post(`/api/quizzes/${quiz.id}/submit`)
        .set('Cookie', [`access_token=${studentToken}`])
        .send({ answers });

      // Assert
      assertSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('submittedAt');
      expect(response.body.answers).toHaveLength(1);
      expect(response.body.answers[0].questionIndex).toBe(0);
      expect(response.body.answers[0].answer).toBe(0);
    });
  });

  describe('GET /api/quizzes/:id/submissions', () => {
    it('should list submissions for teacher', async () => {
      // Arrange - Create quiz and submission
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Test Quiz',
          description: 'Test',
          dueDate: futureDate,
          timeLimit: 30,
          courseId: courseId,
          questions: JSON.stringify([{ id: 'q1', type: 'MCQ', questionText: 'Test?', options: ['A', 'B'], correctAnswer: 0 }])
        }
      });

      await prisma.quizSubmission.create({
        data: {
          quizId: quiz.id,
          studentId: studentId,
          startedAt: new Date(),
          submittedAt: new Date(),
          answers: JSON.stringify([{ questionIndex: 0, answer: 0 }])
        }
      });

      // Act
      const response = await request(app)
        .get(`/api/quizzes/${quiz.id}/submissions`)
        .set('Cookie', [`access_token=${teacherToken}`]);

      // Assert
      assertSuccessResponse(response, 200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].studentId).toBe(studentId);
    });

    it('should return 403 when student tries to view submissions', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Test Quiz',
          description: 'Test',
          dueDate: futureDate,
          timeLimit: 30,
          courseId: courseId,
          questions: JSON.stringify([{ id: 'q1', type: 'MCQ', questionText: 'Test?', options: ['A', 'B'], correctAnswer: 0 }])
        }
      });

      // Act
      const response = await request(app)
        .get(`/api/quizzes/${quiz.id}/submissions`)
        .set('Cookie', [`access_token=${studentToken}`]);

      // Assert
      assertAuthorizationError(response);
    });
  });
});
