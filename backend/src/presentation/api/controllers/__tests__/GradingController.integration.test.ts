/**
 * GradingController Integration Tests
 * 
 * Tests grading API endpoints with Supertest.
 * These are integration tests that verify the complete request/response cycle
 * including validation middleware, authentication middleware, authorization, and error handling.
 * 
 * Requirements:
 * - 13.1: Starting to grade closes assignment to prevent further submissions
 * - 13.2: View all submitted content (files, text, or quiz answers)
 * - 13.3: Validate grade is between 0 and 100
 * - 13.4: Store grade with submission
 * - 13.5: Allow teachers to edit grades after saving
 * - 13.6: Allow teachers to add text feedback
 * - 13.7: Mark submission as graded
 * - 13.9: Display warning if quiz points don't sum to 100
 * - 13.10: Calculate total score based on manually assigned points per question
 * - 18.1: API endpoints follow REST conventions
 * - 18.2: Consistent error response format
 * - 18.3: Centralized error handling
 * - 21.5: Handle concurrent user requests without data corruption
 */

import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import gradingRoutes from '../../routes/gradingRoutes.js';
import { errorHandler } from '../../middleware/ErrorHandlerMiddleware.js';
import { cleanupDatabase, generateTestToken } from '../../../../test/test-utils.js';
import {
  assertErrorResponse,
  assertSuccessResponse,
  assertValidationError,
  assertAuthenticationError,
  assertAuthorizationError,
  assertNotFoundError
} from '../../../../test/api-test-utils.js';
import { container } from 'tsyringe';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { PrismaCourseRepository } from '../../../../infrastructure/persistence/repositories/PrismaCourseRepository.js';
import { PrismaAssignmentRepository } from '../../../../infrastructure/persistence/repositories/PrismaAssignmentRepository.js';
import { PrismaEnrollmentRepository } from '../../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository.js';
import { PrismaAssignmentSubmissionRepository } from '../../../../infrastructure/persistence/repositories/PrismaAssignmentSubmissionRepository.js';
import { PrismaQuizRepository } from '../../../../infrastructure/persistence/repositories/PrismaQuizRepository.js';
import { PrismaQuizSubmissionRepository } from '../../../../infrastructure/persistence/repositories/PrismaQuizSubmissionRepository.js';
import { PasswordService } from '../../../../infrastructure/auth/PasswordService.js';
import { JWTService } from '../../../../infrastructure/auth/JWTService.js';
import { LocalFileStorage } from '../../../../infrastructure/storage/LocalFileStorage.js';

describe('GradingController Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let teacherToken: string;
  let studentToken: string;
  let otherTeacherToken: string;
  let teacherId: string;
  let studentId: string;
  let otherTeacherId: string;
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
    container.registerSingleton('IAssignmentRepository', PrismaAssignmentRepository);
    container.registerSingleton('IEnrollmentRepository', PrismaEnrollmentRepository);
    container.registerSingleton('IAssignmentSubmissionRepository', PrismaAssignmentSubmissionRepository);
    container.registerSingleton('IQuizRepository', PrismaQuizRepository);
    container.registerSingleton('IQuizSubmissionRepository', PrismaQuizSubmissionRepository);
    container.registerSingleton(PasswordService);
    container.registerSingleton(JWTService);
    container.registerSingleton('IFileStorage', LocalFileStorage);
    
    // Register authorization policy
    const { AuthorizationPolicy } = await import('../../../../application/policies/AuthorizationPolicy');
    container.registerSingleton('IAuthorizationPolicy', AuthorizationPolicy);

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api', gradingRoutes);
    app.use(errorHandler);
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await prisma.quizSubmission.deleteMany({});
      await prisma.assignmentSubmission.deleteMany({});
      await prisma.quiz.deleteMany({});
      await prisma.assignment.deleteMany({});
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
        await prisma.quizSubmission.deleteMany({ where: { quiz: { courseId } } }).catch(() => {});
        await prisma.assignmentSubmission.deleteMany({ where: { assignment: { courseId } } }).catch(() => {});
        await prisma.quiz.deleteMany({ where: { courseId } }).catch(() => {});
        await prisma.assignment.deleteMany({ where: { courseId } }).catch(() => {});
        await prisma.enrollment.deleteMany({ where: { courseId } }).catch(() => {});
        await prisma.course.deleteMany({ where: { id: courseId } }).catch(() => {});
      }
      if (teacherId) {
        await prisma.user.deleteMany({ where: { id: teacherId } }).catch(() => {});
      }
      if (studentId) {
        await prisma.user.deleteMany({ where: { id: studentId } }).catch(() => {});
      }
      if (otherTeacherId) {
        await prisma.user.deleteMany({ where: { id: otherTeacherId } }).catch(() => {});
      }
    } catch (error) {
      // Ignore cleanup errors - data might have been cascade deleted
    }
  });

  beforeEach(async () => {
    // Generate unique IDs for this test
    teacherId = randomUUID();
    studentId = randomUUID();
    otherTeacherId = randomUUID();
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

    await prisma.user.create({
      data: {
        id: otherTeacherId,
        email: `other-teacher-${otherTeacherId}@test.com`,
        name: 'Other Teacher',
        role: 'TEACHER',
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

    otherTeacherToken = generateTestToken({
      userId: otherTeacherId,
      email: `other-teacher-${otherTeacherId}@test.com`,
      role: 'TEACHER'
    });
  });

  describe('GET /api/assignments/:id/submissions', () => {
    let assignmentId: string;
    let submissionId: string;

    beforeEach(async () => {
      // Create assignment
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Test Assignment',
          description: 'Test Description',
          dueDate: futureDate,
          submissionType: 'TEXT',
          courseId: courseId
        }
      });
      assignmentId = assignment.id;

      // Create submission
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignmentId,
          studentId: studentId,
          content: 'My submission',
          submittedAt: new Date(),
          status: 'SUBMITTED',
          isLate: false
        }
      });
      submissionId = submission.id;
    });

    describe('Success Scenarios', () => {
      it('should list all submissions for an assignment (teacher)', async () => {
        // Act
        const response = await request(app)
          .get(`/api/assignments/${assignmentId}/submissions`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].id).toBe(submissionId);
        expect(response.body.data[0].assignmentId).toBe(assignmentId);
        expect(response.body.data[0].studentId).toBe(studentId);
      });

      it('should return empty array when no submissions exist', async () => {
        // Arrange - Delete all submissions
        await prisma.assignmentSubmission.deleteMany({});

        // Act
        const response = await request(app)
          .get(`/api/assignments/${assignmentId}/submissions`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.data).toEqual([]);
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Act
        const response = await request(app)
          .get(`/api/assignments/${assignmentId}/submissions`)
          .set('Cookie', [`access_token=${otherTeacherToken}`]);

        // Assert
        assertAuthorizationError(response);
      });

      it('should return 403 when user is a student', async () => {
        // Act
        const response = await request(app)
          .get(`/api/assignments/${assignmentId}/submissions`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .get(`/api/assignments/${assignmentId}/submissions`);

        // Assert
        assertAuthenticationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when assignment does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .get(`/api/assignments/${nonExistentId}/submissions`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });
  });

  describe('GET /api/assignment-submissions/:id', () => {
    let assignmentId: string;
    let submissionId: string;

    beforeEach(async () => {
      // Create assignment
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Test Assignment',
          description: 'Test Description',
          dueDate: futureDate,
          submissionType: 'TEXT',
          courseId: courseId
        }
      });
      assignmentId = assignment.id;

      // Create submission
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignmentId,
          studentId: studentId,
          content: 'My submission',
          submittedAt: new Date(),
          status: 'SUBMITTED',
          isLate: false
        }
      });
      submissionId = submission.id;
    });

    describe('Success Scenarios', () => {
      it('should get submission by ID (student viewing own submission)', async () => {
        // Act
        const response = await request(app)
          .get(`/api/assignment-submissions/${submissionId}`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(submissionId);
        expect(response.body.assignmentId).toBe(assignmentId);
        expect(response.body.studentId).toBe(studentId);
        expect(response.body.textContent).toBe('My submission');
        expect(response.body.status).toBe('SUBMITTED');
      });

      it('should get submission by ID (teacher viewing student submission)', async () => {
        // Act
        const response = await request(app)
          .get(`/api/assignment-submissions/${submissionId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(submissionId);
        expect(response.body.assignmentId).toBe(assignmentId);
        expect(response.body.studentId).toBe(studentId);
      });

      it('should get graded submission with grade and feedback', async () => {
        // Arrange - Grade the submission
        await prisma.assignmentSubmission.update({
          where: { id: submissionId },
          data: {
            grade: 85,
            feedback: 'Good work!',
            status: 'GRADED',
            gradedAt: new Date()
          }
        });

        // Act
        const response = await request(app)
          .get(`/api/assignment-submissions/${submissionId}`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.grade).toBe(85);
        expect(response.body.feedback).toBe('Good work!');
        expect(response.body.status).toBe('GRADED');
        expect(response.body).toHaveProperty('gradedAt');
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when student tries to view another student submission', async () => {
        // Arrange - Create another student
        const passwordService = container.resolve(PasswordService);
        const hashedPassword = await passwordService.hash('password123');
        const otherStudentId = randomUUID();
        const otherStudent = await prisma.user.create({
          data: {
            id: otherStudentId,
            email: `other-student-${otherStudentId}@test.com`,
            name: 'Other Student',
            role: 'STUDENT',
            passwordHash: hashedPassword
          }
        });
        const otherStudentToken = generateTestToken({
          userId: otherStudent.id,
          email: `other-student-${otherStudentId}@test.com`,
          role: 'STUDENT'
        });

        // Act
        const response = await request(app)
          .get(`/api/assignment-submissions/${submissionId}`)
          .set('Cookie', [`access_token=${otherStudentToken}`]);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .get(`/api/assignment-submissions/${submissionId}`);

        // Assert
        assertAuthenticationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when submission does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .get(`/api/assignment-submissions/${nonExistentId}`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });
  });

  describe('POST /api/assignment-submissions/:id/grade', () => {
    let assignmentId: string;
    let submissionId: string;

    beforeEach(async () => {
      // Create assignment
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Test Assignment',
          description: 'Test Description',
          dueDate: futureDate,
          submissionType: 'TEXT',
          courseId: courseId
        }
      });
      assignmentId = assignment.id;

      // Create submission
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignmentId,
          studentId: studentId,
          content: 'My submission',
          submittedAt: new Date(),
          status: 'SUBMITTED',
          isLate: false
        }
      });
      submissionId = submission.id;
    });

    describe('Success Scenarios', () => {
      it('should grade a submission with valid grade and feedback (Requirement 13.3, 13.4, 13.6, 13.7)', async () => {
        // Arrange
        const gradeData = {
          grade: 85,
          feedback: 'Good work! Well done.'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(submissionId);
        expect(response.body.grade).toBe(85);
        expect(response.body.feedback).toBe('Good work! Well done.');
        expect(response.body.status).toBe('GRADED');
        expect(response.body).toHaveProperty('gradedAt');

        // Verify assignment is closed (Requirement 13.1)
        const assignment = await prisma.assignment.findUnique({
          where: { id: assignmentId }
        });
        expect(assignment?.gradingStarted).toBe(true);
      });

      it('should grade submission with minimum grade (0)', async () => {
        // Arrange
        const gradeData = {
          grade: 0,
          feedback: 'Needs improvement'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.grade).toBe(0);
      });

      it('should grade submission with maximum grade (100)', async () => {
        // Arrange
        const gradeData = {
          grade: 100,
          feedback: 'Perfect!'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.grade).toBe(100);
      });

      it('should grade submission without feedback (optional)', async () => {
        // Arrange
        const gradeData = {
          grade: 75
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.grade).toBe(75);
        expect(response.body.feedback).toBeNull();
      });

      it('should close assignment after first grading (Requirement 13.1)', async () => {
        // Arrange
        const gradeData = {
          grade: 85,
          feedback: 'Good work'
        };

        // Act
        await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert - Verify assignment is closed
        const assignment = await prisma.assignment.findUnique({
          where: { id: assignmentId }
        });
        expect(assignment?.gradingStarted).toBe(true);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when grade is missing', async () => {
        // Arrange
        const gradeData = {
          feedback: 'Missing grade'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertValidationError(response, ['grade']);
      });

      it('should return 400 when grade is below 0', async () => {
        // Arrange
        const gradeData = {
          grade: -1,
          feedback: 'Invalid grade'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertValidationError(response, ['grade']);
      });

      it('should return 400 when grade is above 100', async () => {
        // Arrange
        const gradeData = {
          grade: 101,
          feedback: 'Invalid grade'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertValidationError(response, ['grade']);
      });

      it('should return 400 when grade is not a number', async () => {
        // Arrange
        const gradeData = {
          grade: 'not-a-number',
          feedback: 'Invalid grade'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertValidationError(response, ['grade']);
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Arrange
        const gradeData = {
          grade: 85,
          feedback: 'Good work'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${otherTeacherToken}`])
          .send(gradeData);

        // Assert
        assertAuthorizationError(response);
      });

      it('should return 403 when user is a student', async () => {
        // Arrange
        const gradeData = {
          grade: 85,
          feedback: 'Good work'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(gradeData);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Arrange
        const gradeData = {
          grade: 85,
          feedback: 'Good work'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .send(gradeData);

        // Assert
        assertAuthenticationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when submission does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const gradeData = {
          grade: 85,
          feedback: 'Good work'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${nonExistentId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertNotFoundError(response);
      });
    });
  });

  describe('PUT /api/assignment-submissions/:id/grade', () => {
    let assignmentId: string;
    let submissionId: string;

    beforeEach(async () => {
      // Create assignment
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Test Assignment',
          description: 'Test Description',
          dueDate: futureDate,
          submissionType: 'TEXT',
          courseId: courseId,
          gradingStarted: true
        }
      });
      assignmentId = assignment.id;

      // Create graded submission
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignmentId,
          studentId: studentId,
          content: 'My submission',
          submittedAt: new Date(),
          status: 'GRADED',
          isLate: false,
          grade: 80,
          feedback: 'Original feedback',
          gradedAt: new Date(),
          version: 1
        }
      });
      submissionId = submission.id;
    });

    describe('Success Scenarios', () => {
      it('should update grade and feedback (Requirement 13.5)', async () => {
        // Arrange
        const updateData = {
          grade: 90,
          feedback: 'Updated feedback - excellent work!',
          version: 1
        };

        // Act
        const response = await request(app)
          .put(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(submissionId);
        expect(response.body.grade).toBe(90);
        expect(response.body.feedback).toBe('Updated feedback - excellent work!');
        expect(response.body.status).toBe('GRADED');
        expect(response.body.version).toBe(2);
      });

      it('should update only grade', async () => {
        // Arrange
        const updateData = {
          grade: 95,
          version: 1
        };

        // Act
        const response = await request(app)
          .put(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.grade).toBe(95);
        expect(response.body.feedback).toBe('Original feedback');
      });

      it('should update only feedback', async () => {
        // Arrange
        const updateData = {
          grade: 80,
          feedback: 'New feedback only',
          version: 1
        };

        // Act
        const response = await request(app)
          .put(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.grade).toBe(80);
        expect(response.body.feedback).toBe('New feedback only');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when grade is missing', async () => {
        // Arrange
        const updateData = {
          feedback: 'Missing grade',
          version: 1
        };

        // Act
        const response = await request(app)
          .put(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['grade']);
      });

      it('should return 400 when grade is below 0', async () => {
        // Arrange
        const updateData = {
          grade: -5,
          version: 1
        };

        // Act
        const response = await request(app)
          .put(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['grade']);
      });

      it('should return 400 when grade is above 100', async () => {
        // Arrange
        const updateData = {
          grade: 105,
          version: 1
        };

        // Act
        const response = await request(app)
          .put(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['grade']);
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Arrange
        const updateData = {
          grade: 90,
          feedback: 'Updated',
          version: 1
        };

        // Act
        const response = await request(app)
          .put(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${otherTeacherToken}`])
          .send(updateData);

        // Assert
        assertAuthorizationError(response);
      });

      it('should return 403 when user is a student', async () => {
        // Arrange
        const updateData = {
          grade: 90,
          feedback: 'Updated',
          version: 1
        };

        // Act
        const response = await request(app)
          .put(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(updateData);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Arrange
        const updateData = {
          grade: 90,
          feedback: 'Updated',
          version: 1
        };

        // Act
        const response = await request(app)
          .put(`/api/assignment-submissions/${submissionId}/grade`)
          .send(updateData);

        // Assert
        assertAuthenticationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when submission does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const updateData = {
          grade: 90,
          feedback: 'Updated',
          version: 1
        };

        // Act
        const response = await request(app)
          .put(`/api/assignment-submissions/${nonExistentId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertNotFoundError(response);
      });
    });
  });

  describe('Optimistic Locking - Concurrent Grading Prevention (Requirement 21.5)', () => {
    let assignmentId: string;
    let submissionId: string;

    beforeEach(async () => {
      // Create assignment
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Test Assignment',
          description: 'Test Description',
          dueDate: futureDate,
          submissionType: 'TEXT',
          courseId: courseId,
          gradingStarted: true
        }
      });
      assignmentId = assignment.id;

      // Create graded submission
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignmentId,
          studentId: studentId,
          content: 'My submission',
          submittedAt: new Date(),
          status: 'GRADED',
          isLate: false,
          grade: 80,
          feedback: 'Original feedback',
          gradedAt: new Date(),
          version: 1
        }
      });
      submissionId = submission.id;
    });

    it('should prevent concurrent grade updates with version conflict (409)', async () => {
      // Arrange
      const updateData1 = {
        grade: 85,
        feedback: 'First update',
        version: 1
      };

      const updateData2 = {
        grade: 90,
        feedback: 'Second update',
        version: 1 // Same version - should conflict
      };

      // Act - First update succeeds
      const response1 = await request(app)
        .put(`/api/assignment-submissions/${submissionId}/grade`)
        .set('Cookie', [`access_token=${teacherToken}`])
        .send(updateData1);

      // Assert first update succeeded
      assertSuccessResponse(response1, 200);
      expect(response1.body.version).toBe(2);

      // Act - Second update with stale version should fail
      const response2 = await request(app)
        .put(`/api/assignment-submissions/${submissionId}/grade`)
        .set('Cookie', [`access_token=${teacherToken}`])
        .send(updateData2);

      // Assert second update failed with conflict
      assertErrorResponse(response2, 409, 'CONCURRENT_MODIFICATION');
      expect(response2.body.message).toContain('modified');
    });

    it('should allow sequential updates with correct version', async () => {
      // Arrange
      const updateData1 = {
        grade: 85,
        feedback: 'First update',
        version: 1
      };

      const updateData2 = {
        grade: 90,
        feedback: 'Second update',
        version: 2 // Correct version after first update
      };

      // Act - First update
      const response1 = await request(app)
        .put(`/api/assignment-submissions/${submissionId}/grade`)
        .set('Cookie', [`access_token=${teacherToken}`])
        .send(updateData1);

      // Assert first update succeeded
      assertSuccessResponse(response1, 200);
      expect(response1.body.version).toBe(2);

      // Act - Second update with correct version
      const response2 = await request(app)
        .put(`/api/assignment-submissions/${submissionId}/grade`)
        .set('Cookie', [`access_token=${teacherToken}`])
        .send(updateData2);

      // Assert second update succeeded
      assertSuccessResponse(response2, 200);
      expect(response2.body.version).toBe(3);
      expect(response2.body.grade).toBe(90);
    });

    it('should work without version for backward compatibility', async () => {
      // Arrange
      const updateData = {
        grade: 95,
        feedback: 'Update without version'
      };

      // Act
      const response = await request(app)
        .put(`/api/assignment-submissions/${submissionId}/grade`)
        .set('Cookie', [`access_token=${teacherToken}`])
        .send(updateData);

      // Assert - Should succeed (optimistic locking is optional)
      assertSuccessResponse(response, 200);
      expect(response.body.grade).toBe(95);
    });
  });

  describe('POST /api/quiz-submissions/:id/grade', () => {
    let quizId: string;
    let quizSubmissionId: string;

    beforeEach(async () => {
      // Create quiz
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Test Quiz',
          description: 'Test Description',
          dueDate: futureDate,
          timeLimit: 60,
          courseId: courseId,
          questions: [
            {
              type: 'MCQ',
              questionText: 'What is 2+2?',
              options: ['3', '4', '5'],
              correctAnswer: 1
            },
            {
              type: 'ESSAY',
              questionText: 'Explain programming'
            }
          ]
        }
      });
      quizId = quiz.id;

      // Create quiz submission
      const quizSubmission = await prisma.quizSubmission.create({
        data: {
          quizId: quizId,
          studentId: studentId,
          startedAt: new Date(),
          submittedAt: new Date(),
          status: 'SUBMITTED',
          answers: [
            { questionIndex: 0, answer: '4' },
            { questionIndex: 1, answer: 'Programming is writing code' }
          ]
        }
      });
      quizSubmissionId = quizSubmission.id;
    });

    describe('Success Scenarios', () => {
      it('should grade quiz submission with manual points (Requirement 13.10)', async () => {
        // Arrange
        const gradeData = {
          questionGrades: [
            { questionIndex: 0, points: 50 },
            { questionIndex: 1, points: 50 }
          ],
          generalFeedback: 'Good answers'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.submission).toBeDefined();
        expect(response.body.submission.id).toBe(quizSubmissionId);
        expect(response.body.submission.grade).toBe(100);
        expect(response.body.submission.feedback).toBe('Good answers');
        expect(response.body.submission.status).toBe('GRADED');
        expect(response.body.submission.questionGrades).toEqual([
          { questionIndex: 0, points: 50 },
          { questionIndex: 1, points: 50 }
        ]);
        expect(response.body.warning).toBeUndefined();
      });

      it('should display warning when points do not sum to 100 (Requirement 13.9)', async () => {
        // Arrange
        const gradeData = {
          questionGrades: [
            { questionIndex: 0, points: 40 },
            { questionIndex: 1, points: 40 }
          ],
          generalFeedback: 'Points do not sum to 100'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.submission.grade).toBe(80);
        expect(response.body.warning).toBeDefined();
        expect(response.body.warning).toContain('80');
        expect(response.body.warning).toContain('100');
      });

      it('should grade with zero points for some questions', async () => {
        // Arrange
        const gradeData = {
          questionGrades: [
            { questionIndex: 0, points: 0 },
            { questionIndex: 1, points: 100 }
          ],
          generalFeedback: 'First answer incorrect'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.submission.grade).toBe(100);
        expect(response.body.submission.questionGrades).toEqual([
          { questionIndex: 0, points: 0 },
          { questionIndex: 1, points: 100 }
        ]);
      });

      it('should grade without feedback (optional)', async () => {
        // Arrange
        const gradeData = {
          questionGrades: [
            { questionIndex: 0, points: 50 },
            { questionIndex: 1, points: 50 }
          ]
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.submission.grade).toBe(100);
        expect(response.body.submission.feedback).toBeNull();
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when questionGrades is missing', async () => {
        // Arrange
        const gradeData = {
          generalFeedback: 'Missing points'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertValidationError(response, ['questionGrades']);
      });

      it('should return 400 when questionGrades is not an array', async () => {
        // Arrange
        const gradeData = {
          questionGrades: 'not-an-array',
          generalFeedback: 'Invalid format'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertValidationError(response, ['questionGrades']);
      });

      it('should return 400 when questionGrades contains negative values', async () => {
        // Arrange
        const gradeData = {
          questionGrades: [
            { questionIndex: 0, points: -10 },
            { questionIndex: 1, points: 50 }
          ],
          generalFeedback: 'Negative points'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('VALIDATION_FAILED');
        // Zod returns validation errors with the full path as a key
        expect(response.body.details['questionGrades.0.points']).toBeDefined();
      });

      it('should return 400 when questionGrades array length does not match questions', async () => {
        // Arrange
        const gradeData = {
          questionGrades: [
            { questionIndex: 0, points: 50 }
          ], // Only 1 grade, but quiz has 2 questions
          generalFeedback: 'Wrong length'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertErrorResponse(response, 400, 'VALIDATION_FAILED');
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Arrange
        const gradeData = {
          questionGrades: [
            { questionIndex: 0, points: 50 },
            { questionIndex: 1, points: 50 }
          ],
          generalFeedback: 'Good work'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .set('Cookie', [`access_token=${otherTeacherToken}`])
          .send(gradeData);

        // Assert
        assertAuthorizationError(response);
      });

      it('should return 403 when user is a student', async () => {
        // Arrange
        const gradeData = {
          questionGrades: [
            { questionIndex: 0, points: 50 },
            { questionIndex: 1, points: 50 }
          ],
          generalFeedback: 'Good work'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(gradeData);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Arrange
        const gradeData = {
          questionGrades: [
            { questionIndex: 0, points: 50 },
            { questionIndex: 1, points: 50 }
          ],
          generalFeedback: 'Good work'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${quizSubmissionId}/grade`)
          .send(gradeData);

        // Assert
        assertAuthenticationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when quiz submission does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const gradeData = {
          questionGrades: [
            { questionIndex: 0, points: 50 },
            { questionIndex: 1, points: 50 }
          ],
          generalFeedback: 'Good work'
        };

        // Act
        const response = await request(app)
          .post(`/api/quiz-submissions/${nonExistentId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(gradeData);

        // Assert
        assertNotFoundError(response);
      });
    });
  });

  describe('Middleware Integration', () => {
    let assignmentId: string;
    let submissionId: string;

    beforeEach(async () => {
      // Create assignment and submission
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Test Assignment',
          description: 'Test Description',
          dueDate: futureDate,
          submissionType: 'TEXT',
          courseId: courseId
        }
      });
      assignmentId = assignment.id;

      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignmentId,
          studentId: studentId,
          content: 'My submission',
          submittedAt: new Date(),
          status: 'SUBMITTED',
          isLate: false
        }
      });
      submissionId = submission.id;
    });

    describe('Validation Middleware', () => {
      it('should return consistent validation error format', async () => {
        // Arrange
        const invalidData = {
          grade: 'not-a-number',
          feedback: 'Invalid grade'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('VALIDATION_FAILED');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('details');
      });
    });

    describe('Authentication Middleware', () => {
      it('should protect all grading endpoints with authentication', async () => {
        // Act - Test multiple endpoints without token
        const listResponse = await request(app).get(`/api/assignments/${assignmentId}/submissions`);
        const getResponse = await request(app).get(`/api/assignment-submissions/${submissionId}`);
        const gradeResponse = await request(app).post(`/api/assignment-submissions/${submissionId}/grade`).send({});
        const updateResponse = await request(app).put(`/api/assignment-submissions/${submissionId}/grade`).send({});

        // Assert
        expect(listResponse.status).toBe(401);
        expect(getResponse.status).toBe(401);
        expect(gradeResponse.status).toBe(401);
        expect(updateResponse.status).toBe(401);
      });
    });

    describe('Error Handler Middleware', () => {
      it('should not expose internal error details', async () => {
        // Act - Try to get non-existent submission
        const response = await request(app)
          .get('/api/assignment-submissions/00000000-0000-0000-0000-000000000000')
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('originalError');
      });

      it('should return consistent error format for all errors', async () => {
        // Act - Multiple error scenarios
        const notFoundResponse = await request(app)
          .get('/api/assignment-submissions/00000000-0000-0000-0000-000000000000')
          .set('Cookie', [`access_token=${teacherToken}`]);

        const validationResponse = await request(app)
          .post(`/api/assignment-submissions/${submissionId}/grade`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send({ grade: -1 });

        const authResponse = await request(app)
          .get(`/api/assignment-submissions/${submissionId}`);

        // Assert - All errors have consistent format
        expect(notFoundResponse.body).toHaveProperty('code');
        expect(notFoundResponse.body).toHaveProperty('message');
        expect(validationResponse.body).toHaveProperty('code');
        expect(validationResponse.body).toHaveProperty('message');
        expect(authResponse.body).toHaveProperty('code');
        expect(authResponse.body).toHaveProperty('message');
      });
    });
  });
});

