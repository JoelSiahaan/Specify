/**
 * AssignmentController Integration Tests
 * 
 * Tests assignment management API endpoints with Supertest.
 * These are integration tests that verify the complete request/response cycle
 * including validation middleware, authentication middleware, authorization, and error handling.
 * 
 * Requirements:
 * - 9.1: Create assignment with title, description, and due date
 * - 9.8: Prevent editing after due date
 * - 9.10: Allow teachers to delete assignments at any time
 * - 9.11: Allow teachers to view all assignments for a course
 * - 10.1: Allow file upload for assignments
 * - 18.1: API endpoints follow REST conventions
 * - 18.2: Consistent error response format
 * - 18.3: Centralized error handling
 */

import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import assignmentRoutes from '../../routes/assignmentRoutes';
import { errorHandler } from '../../middleware/ErrorHandlerMiddleware';
import { cleanupDatabase, generateTestToken, createTestUsers } from '../../../../test/test-utils';
import {
  assertErrorResponse,
  assertSuccessResponse,
  assertValidationError,
  assertAuthenticationError,
  assertAuthorizationError,
  assertNotFoundError
} from '../../../../test/api-test-utils';
import { container } from 'tsyringe';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository';
import { PrismaCourseRepository } from '../../../../infrastructure/persistence/repositories/PrismaCourseRepository';
import { PrismaAssignmentRepository } from '../../../../infrastructure/persistence/repositories/PrismaAssignmentRepository';
import { PrismaEnrollmentRepository } from '../../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository';
import { PrismaAssignmentSubmissionRepository } from '../../../../infrastructure/persistence/repositories/PrismaAssignmentSubmissionRepository';
import { PasswordService } from '../../../../infrastructure/auth/PasswordService';
import { JWTService } from '../../../../infrastructure/auth/JWTService';
import { LocalFileStorage } from '../../../../infrastructure/storage/LocalFileStorage';

describe('AssignmentController Integration Tests', () => {
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
    container.registerSingleton('IAssignmentRepository', PrismaAssignmentRepository);
    container.registerSingleton('IEnrollmentRepository', PrismaEnrollmentRepository);
    container.registerSingleton('IAssignmentSubmissionRepository', PrismaAssignmentSubmissionRepository);
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
    app.use('/api', assignmentRoutes);
    app.use(errorHandler);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanupDatabase(prisma);

    // Create test users with unique emails
    const passwordService = container.resolve(PasswordService);
    const users = await createTestUsers(prisma, passwordService);
    
    teacherId = users.teacher.id;
    teacherToken = users.teacher.token;
    studentId = users.student.id;
    studentToken = users.student.token;

    // Create test course
    const course = await prisma.course.create({
      data: {
        name: 'Test Course',
        description: 'Test Description',
        courseCode: 'TEST123',
        status: 'ACTIVE',
        teacherId: teacherId
      }
    });
    courseId = course.id;

    // Enroll student in course
    await prisma.enrollment.create({
      data: {
        studentId: studentId,
        courseId: courseId
      }
    });
  });

  describe('POST /api/courses/:courseId/assignments', () => {
    describe('Success Scenarios', () => {
      it('should create a new assignment with valid data (teacher)', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const assignmentData = {
          title: 'Assignment 1',
          description: 'Complete the programming exercises',
          dueDate: futureDate,
          submissionType: 'FILE',
          acceptedFileFormats: ['pdf', 'docx']
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(assignmentData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe('Assignment 1');
        expect(response.body.description).toBe('Complete the programming exercises');
        expect(response.body.submissionType).toBe('FILE');
        expect(response.body.acceptedFileFormats).toEqual(['pdf', 'docx']);
        expect(response.body.courseId).toBe(courseId);
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
      });

      it('should create assignment with TEXT submission type', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const assignmentData = {
          title: 'Essay Assignment',
          description: 'Write an essay about programming',
          dueDate: futureDate,
          submissionType: 'TEXT'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(assignmentData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body.submissionType).toBe('TEXT');
        expect(response.body.acceptedFileFormats).toEqual([]);
      });

      it('should create assignment with BOTH submission type', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const assignmentData = {
          title: 'Project Assignment',
          description: 'Submit code and documentation',
          dueDate: futureDate,
          submissionType: 'BOTH',
          acceptedFileFormats: ['pdf', 'docx', 'jpg']
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(assignmentData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body.submissionType).toBe('BOTH');
        expect(response.body.acceptedFileFormats).toEqual(['pdf', 'docx', 'jpg']);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when title is missing', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const assignmentData = {
          description: 'Description without title',
          dueDate: futureDate,
          submissionType: 'TEXT'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(assignmentData);

        // Assert
        assertValidationError(response, ['title']);
      });

      it('should return 400 when description is missing', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const assignmentData = {
          title: 'Assignment Title',
          dueDate: futureDate,
          submissionType: 'TEXT'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(assignmentData);

        // Assert
        assertValidationError(response, ['description']);
      });

      it('should return 400 when dueDate is missing', async () => {
        // Arrange
        const assignmentData = {
          title: 'Assignment Title',
          description: 'Assignment Description',
          submissionType: 'TEXT'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(assignmentData);

        // Assert
        assertValidationError(response, ['dueDate']);
      });

      it('should return 400 when dueDate is in the past', async () => {
        // Arrange
        const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const assignmentData = {
          title: 'Assignment Title',
          description: 'Assignment Description',
          dueDate: pastDate,
          submissionType: 'TEXT'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(assignmentData);

        // Assert
        assertValidationError(response, ['dueDate']);
      });

      it('should return 400 when submissionType is invalid', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const assignmentData = {
          title: 'Assignment Title',
          description: 'Assignment Description',
          dueDate: futureDate,
          submissionType: 'INVALID'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(assignmentData);

        // Assert
        assertValidationError(response, ['submissionType']);
      });

      it('should return 400 when acceptedFileFormats is missing for FILE submission', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const assignmentData = {
          title: 'Assignment Title',
          description: 'Assignment Description',
          dueDate: futureDate,
          submissionType: 'FILE'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(assignmentData);

        // Assert
        assertValidationError(response, ['acceptedFileFormats']);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const assignmentData = {
          title: 'Assignment Title',
          description: 'Assignment Description',
          dueDate: futureDate,
          submissionType: 'TEXT'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .send(assignmentData);

        // Assert
        assertAuthenticationError(response);
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is a student', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const assignmentData = {
          title: 'Assignment Title',
          description: 'Assignment Description',
          dueDate: futureDate,
          submissionType: 'TEXT'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(assignmentData);

        // Assert
        assertAuthorizationError(response);
      });
    });
  });

  describe('GET /api/courses/:courseId/assignments', () => {
    let assignmentId: string;

    beforeEach(async () => {
      // Create test assignment
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
    });

    describe('Success Scenarios', () => {
      it('should list assignments for teacher', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].id).toBe(assignmentId);
      });

      it('should list assignments for enrolled student', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
      });

      it('should return empty array when no assignments exist', async () => {
        // Arrange - Delete all assignments
        await prisma.assignment.deleteMany({});

        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/assignments`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.data).toEqual([]);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/assignments`);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('PUT /api/assignments/:id', () => {
    let assignmentId: string;
    let otherTeacherId: string;
    let otherTeacherToken: string;

    beforeEach(async () => {
      // Create test assignment
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Original Title',
          description: 'Original Description',
          dueDate: futureDate,
          submissionType: 'TEXT',
          courseId: courseId
        }
      });
      assignmentId = assignment.id;

      // Create another teacher with unique email
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');
      const otherTeacherEmail = `other-teacher-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
      const otherTeacher = await prisma.user.create({
        data: {
          email: otherTeacherEmail,
          name: 'Other Teacher',
          role: 'TEACHER',
          passwordHash: hashedPassword
        }
      });
      otherTeacherId = otherTeacher.id;
      otherTeacherToken = generateTestToken({
        userId: otherTeacherId,
        email: otherTeacherEmail,
        role: 'TEACHER'
      });
    });

    describe('Success Scenarios', () => {
      it('should update assignment title and description', async () => {
        // Arrange
        const updateData = {
          title: 'Updated Title',
          description: 'Updated Description'
        };

        // Act
        const response = await request(app)
          .put(`/api/assignments/${assignmentId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.title).toBe('Updated Title');
        expect(response.body.description).toBe('Updated Description');
      });

      it('should update only title', async () => {
        // Arrange
        const updateData = {
          title: 'New Title Only'
        };

        // Act
        const response = await request(app)
          .put(`/api/assignments/${assignmentId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.title).toBe('New Title Only');
        expect(response.body.description).toBe('Original Description');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when title is too long', async () => {
        // Arrange
        const updateData = {
          title: 'A'.repeat(201)
        };

        // Act
        const response = await request(app)
          .put(`/api/assignments/${assignmentId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['title']);
      });

      it('should return 400 when dueDate is in the past', async () => {
        // Arrange
        const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const updateData = {
          dueDate: pastDate
        };

        // Act
        const response = await request(app)
          .put(`/api/assignments/${assignmentId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['dueDate']);
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Arrange
        const updateData = {
          title: 'Updated Title'
        };

        // Act
        const response = await request(app)
          .put(`/api/assignments/${assignmentId}`)
          .set('Cookie', [`access_token=${otherTeacherToken}`])
          .send(updateData);

        // Assert
        assertAuthorizationError(response);
      });

      it('should return 403 when user is a student', async () => {
        // Arrange
        const updateData = {
          title: 'Updated Title'
        };

        // Act
        const response = await request(app)
          .put(`/api/assignments/${assignmentId}`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(updateData);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when assignment does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const updateData = {
          title: 'Updated Title'
        };

        // Act
        const response = await request(app)
          .put(`/api/assignments/${nonExistentId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertNotFoundError(response);
      });
    });
  });

  describe('DELETE /api/assignments/:id', () => {
    let assignmentId: string;
    let otherTeacherId: string;
    let otherTeacherToken: string;

    beforeEach(async () => {
      // Create test assignment
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Assignment to Delete',
          description: 'Description',
          dueDate: futureDate,
          submissionType: 'TEXT',
          courseId: courseId
        }
      });
      assignmentId = assignment.id;

      // Create another teacher with unique email
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');
      const otherTeacherEmail = `other-teacher2-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
      const otherTeacher = await prisma.user.create({
        data: {
          email: otherTeacherEmail,
          name: 'Other Teacher 2',
          role: 'TEACHER',
          passwordHash: hashedPassword
        }
      });
      otherTeacherId = otherTeacher.id;
      otherTeacherToken = generateTestToken({
        userId: otherTeacherId,
        email: otherTeacherEmail,
        role: 'TEACHER'
      });
    });

    describe('Success Scenarios', () => {
      it('should delete an assignment', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/assignments/${assignmentId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.message).toBe('Assignment deleted successfully');

        // Verify assignment is deleted
        const deletedAssignment = await prisma.assignment.findUnique({
          where: { id: assignmentId }
        });
        expect(deletedAssignment).toBeNull();
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/assignments/${assignmentId}`)
          .set('Cookie', [`access_token=${otherTeacherToken}`]);

        // Assert
        assertAuthorizationError(response);
      });

      it('should return 403 when user is a student', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/assignments/${assignmentId}`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when assignment does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .delete(`/api/assignments/${nonExistentId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/assignments/${assignmentId}`);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('POST /api/assignments/:id/submit', () => {
    let assignmentId: string;
    let textAssignmentId: string;
    let fileAssignmentId: string;

    beforeEach(async () => {
      // Create TEXT assignment
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const textAssignment = await prisma.assignment.create({
        data: {
          title: 'Text Assignment',
          description: 'Submit text',
          dueDate: futureDate,
          submissionType: 'TEXT',
          courseId: courseId
        }
      });
      textAssignmentId = textAssignment.id;

      // Create FILE assignment
      const fileAssignment = await prisma.assignment.create({
        data: {
          title: 'File Assignment',
          description: 'Submit file',
          dueDate: futureDate,
          submissionType: 'FILE',
          acceptedFileFormats: ['pdf', 'docx'],
          courseId: courseId
        }
      });
      fileAssignmentId = fileAssignment.id;

      // Create BOTH assignment
      const bothAssignment = await prisma.assignment.create({
        data: {
          title: 'Both Assignment',
          description: 'Submit both',
          dueDate: futureDate,
          submissionType: 'BOTH',
          acceptedFileFormats: ['pdf'],
          courseId: courseId
        }
      });
      assignmentId = bothAssignment.id;
    });

    describe('Success Scenarios', () => {
      it('should submit text assignment', async () => {
        // Arrange
        const submissionData = {
          submissionType: 'TEXT',
          content: 'This is my submission text'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignments/${textAssignmentId}/submit`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(submissionData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.assignmentId).toBe(textAssignmentId);
        expect(response.body.studentId).toBe(studentId);
        expect(response.body.content).toBe('This is my submission text');
        expect(response.body.status).toBe('SUBMITTED');
      });

      it('should submit file assignment', async () => {
        // Arrange
        const fileBuffer = Buffer.from('PDF content');

        // Act
        const response = await request(app)
          .post(`/api/assignments/${fileAssignmentId}/submit`)
          .set('Cookie', [`access_token=${studentToken}`])
          .field('submissionType', 'FILE')
          .attach('file', fileBuffer, 'assignment.pdf');

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.assignmentId).toBe(fileAssignmentId);
        expect(response.body).toHaveProperty('filePath');
        expect(response.body).toHaveProperty('fileName');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when content is missing for TEXT submission', async () => {
        // Arrange
        const submissionData = {
          submissionType: 'TEXT'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignments/${textAssignmentId}/submit`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(submissionData);

        // Assert
        assertErrorResponse(response, 400, 'VALIDATION_FAILED');
      });

      it('should return 400 when file is missing for FILE submission', async () => {
        // Arrange
        const submissionData = {
          submissionType: 'FILE'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignments/${fileAssignmentId}/submit`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(submissionData);

        // Assert
        assertErrorResponse(response, 400, 'VALIDATION_FAILED');
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when teacher tries to submit', async () => {
        // Arrange
        const submissionData = {
          submissionType: 'TEXT',
          content: 'Teacher submission'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignments/${textAssignmentId}/submit`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(submissionData);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Arrange
        const submissionData = {
          submissionType: 'TEXT',
          content: 'Submission text'
        };

        // Act
        const response = await request(app)
          .post(`/api/assignments/${textAssignmentId}/submit`)
          .send(submissionData);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('GET /api/submissions/:id', () => {
    let submissionId: string;
    let assignmentId: string;

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
      const submission = await prisma.submission.create({
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
          .get(`/api/submissions/${submissionId}`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(submissionId);
        expect(response.body.assignmentId).toBe(assignmentId);
        expect(response.body.studentId).toBe(studentId);
        expect(response.body.content).toBe('My submission');
      });

      it('should get submission by ID (teacher viewing student submission)', async () => {
        // Act
        const response = await request(app)
          .get(`/api/submissions/${submissionId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(submissionId);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when submission does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .get(`/api/submissions/${nonExistentId}`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .get(`/api/submissions/${submissionId}`);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('Middleware Integration', () => {
    describe('Validation Middleware', () => {
      it('should return consistent validation error format', async () => {
        // Arrange
        const invalidData = {
          title: '',
          description: ''
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/assignments`)
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
      it('should protect all assignment endpoints with authentication', async () => {
        // Act - Test multiple endpoints without token
        const getResponse = await request(app).get(`/api/courses/${courseId}/assignments`);
        const postResponse = await request(app).post(`/api/courses/${courseId}/assignments`).send({});
        const putResponse = await request(app).put('/api/assignments/test-id').send({});
        const deleteResponse = await request(app).delete('/api/assignments/test-id');

        // Assert
        expect(getResponse.status).toBe(401);
        expect(postResponse.status).toBe(401);
        expect(putResponse.status).toBe(401);
        expect(deleteResponse.status).toBe(401);
      });
    });

    describe('Error Handler Middleware', () => {
      it('should not expose internal error details', async () => {
        // Act - Try to get non-existent assignment
        const response = await request(app)
          .get('/api/assignments/00000000-0000-0000-0000-000000000000')
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('originalError');
      });
    });
  });
});
