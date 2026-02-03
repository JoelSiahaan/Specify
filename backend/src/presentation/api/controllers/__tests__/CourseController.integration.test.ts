/**
 * CourseController Integration Tests
 * 
 * Tests course management API endpoints with Supertest.
 * These are integration tests that verify the complete request/response cycle
 * including validation middleware, authentication middleware, authorization, and error handling.
 * 
 * Requirements:
 * - 5.1: Create course with name, description, and unique course code
 * - 5.3: Update course details (name and description)
 * - 5.4: Archive course (hide from active lists, prevent new enrollments)
 * - 5.6: Only archived courses can be deleted
 * - 5.7: Cascade delete all related data
 * - 5.10: Teachers view all their created courses (active and archived separately)
 * - 18.1: API endpoints follow REST conventions
 * - 18.2: Consistent error response format
 * - 18.3: Centralized error handling
 * - 18.4: Input validation
 * - 20.2: Input validation and sanitization
 */

import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import courseRoutes from '../../routes/courseRoutes.js';
import { errorHandler } from '../../middleware/ErrorHandlerMiddleware.js';
import { cleanupDatabase, generateTestToken, createTestUsers, generateUniqueEmail } from '../../../../test/test-utils.js';
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
import { PasswordService } from '../../../../infrastructure/auth/PasswordService.js';
import { JWTService } from '../../../../infrastructure/auth/JWTService.js';
import { CourseCodeGenerator } from '../../../../domain/services/CourseCodeGenerator.js';

describe('CourseController Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let teacherToken: string;
  let studentToken: string;
  let teacherId: string;
  let studentId: string;

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

    // Register dependencies (same pattern as AuthController)
    container.registerInstance('PrismaClient', prisma);
    container.registerSingleton('IUserRepository', PrismaUserRepository);
    container.registerSingleton('ICourseRepository', PrismaCourseRepository);
    container.registerSingleton(PasswordService);
    container.registerSingleton(JWTService);
    container.registerSingleton(CourseCodeGenerator);
    
    // Register additional repositories needed for progress and export
    const { PrismaEnrollmentRepository } = await import('../../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository');
    const { PrismaAssignmentRepository } = await import('../../../../infrastructure/persistence/repositories/PrismaAssignmentRepository');
    const { PrismaAssignmentSubmissionRepository } = await import('../../../../infrastructure/persistence/repositories/PrismaAssignmentSubmissionRepository');
    const { PrismaQuizRepository } = await import('../../../../infrastructure/persistence/repositories/PrismaQuizRepository');
    const { PrismaQuizSubmissionRepository } = await import('../../../../infrastructure/persistence/repositories/PrismaQuizSubmissionRepository');
    
    container.registerSingleton('IEnrollmentRepository', PrismaEnrollmentRepository);
    container.registerSingleton('IAssignmentRepository', PrismaAssignmentRepository);
    container.registerSingleton('IAssignmentSubmissionRepository', PrismaAssignmentSubmissionRepository);
    container.registerSingleton('IQuizRepository', PrismaQuizRepository);
    container.registerSingleton('IQuizSubmissionRepository', PrismaQuizSubmissionRepository);
    
    // Register authorization policy
    const { AuthorizationPolicy } = await import('../../../../application/policies/AuthorizationPolicy');
    container.registerSingleton('IAuthorizationPolicy', AuthorizationPolicy);

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/courses', courseRoutes);
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
  });

  describe('POST /api/courses', () => {
    describe('Success Scenarios', () => {
      it('should create a new course with valid data (teacher)', async () => {
        // Arrange
        const courseData = {
          name: 'Introduction to Programming',
          description: 'Learn programming basics with Python'
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(courseData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Introduction to Programming');
        expect(response.body.description).toBe('Learn programming basics with Python');
        expect(response.body).toHaveProperty('courseCode');
        expect(response.body.courseCode).toMatch(/^[A-Z0-9]{6}$/);
        expect(response.body.status).toBe('ACTIVE');
        expect(response.body.teacherId).toBe(teacherId);
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
      });

      it('should generate unique course codes for multiple courses', async () => {
        // Arrange
        const courseData1 = {
          name: 'Course 1',
          description: 'Description 1'
        };
        const courseData2 = {
          name: 'Course 2',
          description: 'Description 2'
        };

        // Act
        const response1 = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(courseData1);

        const response2 = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(courseData2);

        // Assert
        assertSuccessResponse(response1, 201);
        assertSuccessResponse(response2, 201);
        expect(response1.body.courseCode).not.toBe(response2.body.courseCode);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when name is missing', async () => {
        // Arrange
        const courseData = {
          description: 'Description without name'
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(courseData);

        // Assert
        assertValidationError(response, ['name']);
      });

      it('should return 400 when name is too short', async () => {
        // Arrange
        const courseData = {
          name: '',
          description: 'Valid description'
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(courseData);

        // Assert
        assertValidationError(response, ['name']);
      });

      it('should return 400 when name is too long', async () => {
        // Arrange
        const courseData = {
          name: 'A'.repeat(201),
          description: 'Valid description'
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(courseData);

        // Assert
        assertValidationError(response, ['name']);
      });

      it('should return 400 when description is missing', async () => {
        // Arrange
        const courseData = {
          name: 'Valid Course Name'
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(courseData);

        // Assert
        assertValidationError(response, ['description']);
      });

      it('should return 400 when description is too short', async () => {
        // Arrange
        const courseData = {
          name: 'Valid Course Name',
          description: ''
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(courseData);

        // Assert
        assertValidationError(response, ['description']);
      });

      it('should return 400 when description is too long', async () => {
        // Arrange
        const courseData = {
          name: 'Valid Course Name',
          description: 'A'.repeat(5001)
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(courseData);

        // Assert
        assertValidationError(response, ['description']);
      });

      it('should return 400 when multiple fields are invalid', async () => {
        // Arrange
        const courseData = {
          name: '',
          description: ''
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(courseData);

        // Assert
        assertValidationError(response, ['name', 'description']);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Arrange
        const courseData = {
          name: 'Valid Course Name',
          description: 'Valid description'
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .send(courseData);

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when access token is invalid', async () => {
        // Arrange
        const courseData = {
          name: 'Valid Course Name',
          description: 'Valid description'
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', ['access_token=invalid_token'])
          .send(courseData);

        // Assert
        assertAuthenticationError(response);
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is a student', async () => {
        // Arrange
        const courseData = {
          name: 'Valid Course Name',
          description: 'Valid description'
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${studentToken}`])
          .send(courseData);

        // Assert
        assertAuthorizationError(response);
        expect(response.body.code).toBe('FORBIDDEN_ROLE');
      });
    });
  });

  describe('GET /api/courses', () => {
    let teacherCourse1Id: string;
    let teacherCourse2Id: string;
    let archivedCourseId: string;

    beforeEach(async () => {
      // Create test courses
      const course1 = await prisma.course.create({
        data: {
          name: 'Active Course 1',
          description: 'Description 1',
          courseCode: 'ABC123',
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });
      teacherCourse1Id = course1.id;

      const course2 = await prisma.course.create({
        data: {
          name: 'Active Course 2',
          description: 'Description 2',
          courseCode: 'DEF456',
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });
      teacherCourse2Id = course2.id;

      const archivedCourse = await prisma.course.create({
        data: {
          name: 'Archived Course',
          description: 'Archived description',
          courseCode: 'GHI789',
          status: 'ARCHIVED',
          teacherId: teacherId
        }
      });
      archivedCourseId = archivedCourse.id;
    });

    describe('Success Scenarios', () => {
      it('should list all active courses for teacher', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);
        expect(response.body.data.every((c: any) => c.status === 'ACTIVE')).toBe(true);
        expect(response.body.data.every((c: any) => c.teacherId === teacherId)).toBe(true);
      });

      it('should list archived courses when status=ARCHIVED', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses?status=ARCHIVED')
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].status).toBe('ARCHIVED');
        expect(response.body.data[0].id).toBe(archivedCourseId);
      });

      it('should list all active courses for student', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses')
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);
        expect(response.body.data.every((c: any) => c.status === 'ACTIVE')).toBe(true);
      });

      it('should return empty array when no courses exist', async () => {
        // Arrange - Clean all courses
        await prisma.course.deleteMany({});

        // Act
        const response = await request(app)
          .get('/api/courses')
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
          .get('/api/courses');

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when access token is invalid', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses')
          .set('Cookie', ['access_token=invalid_token']);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('GET /api/courses/:id', () => {
    let courseId: string;

    beforeEach(async () => {
      // Create test course
      const course = await prisma.course.create({
        data: {
          name: 'Test Course',
          description: 'Test description',
          courseCode: 'TEST123',
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });
      courseId = course.id;
    });

    describe('Success Scenarios', () => {
      it('should get course by ID', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(courseId);
        expect(response.body.name).toBe('Test Course');
        expect(response.body.description).toBe('Test description');
        expect(response.body.courseCode).toBe('TEST123');
        expect(response.body.status).toBe('ACTIVE');
        expect(response.body.teacherId).toBe(teacherId);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when course does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .get(`/api/courses/${nonExistentId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}`);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('PUT /api/courses/:id', () => {
    let courseId: string;
    let otherTeacherId: string;
    let otherTeacherToken: string;

    beforeEach(async () => {
      // Create test course
      const course = await prisma.course.create({
        data: {
          name: 'Original Course Name',
          description: 'Original description',
          courseCode: 'ORIG123',
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });
      courseId = course.id;

      // Create another teacher with unique email
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');
      const otherTeacherEmail = generateUniqueEmail('other-teacher');
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
      it('should update course name and description', async () => {
        // Arrange
        const updateData = {
          name: 'Updated Course Name',
          description: 'Updated description'
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(courseId);
        expect(response.body.name).toBe('Updated Course Name');
        expect(response.body.description).toBe('Updated description');
        expect(response.body.courseCode).toBe('ORIG123'); // Code should not change
        expect(response.body.status).toBe('ACTIVE');
      });

      it('should update only name', async () => {
        // Arrange
        const updateData = {
          name: 'New Name Only'
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.name).toBe('New Name Only');
        expect(response.body.description).toBe('Original description'); // Should not change
      });

      it('should update only description', async () => {
        // Arrange
        const updateData = {
          description: 'New Description Only'
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.name).toBe('Original Course Name'); // Should not change
        expect(response.body.description).toBe('New Description Only');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when name is too short', async () => {
        // Arrange
        const updateData = {
          name: ''
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['name']);
      });

      it('should return 400 when name is too long', async () => {
        // Arrange
        const updateData = {
          name: 'A'.repeat(201)
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['name']);
      });

      it('should return 400 when description is too short', async () => {
        // Arrange
        const updateData = {
          description: ''
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['description']);
      });

      it('should return 400 when description is too long', async () => {
        // Arrange
        const updateData = {
          description: 'A'.repeat(5001)
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['description']);
      });
    });

    describe('Business Logic Errors', () => {
      it('should return 400 when trying to update archived course', async () => {
        // Arrange - Archive the course first
        await prisma.course.update({
          where: { id: courseId },
          data: { status: 'ARCHIVED' }
        });

        const updateData = {
          name: 'Updated Name'
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertErrorResponse(response, 400, 'RESOURCE_ARCHIVED');
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Arrange
        const updateData = {
          name: 'Updated Name'
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${otherTeacherToken}`])
          .send(updateData);

        // Assert
        assertAuthorizationError(response);
        expect(response.body.code).toBe('NOT_OWNER');
      });

      it('should return 403 when user is a student', async () => {
        // Arrange
        const updateData = {
          name: 'Updated Name'
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(updateData);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when course does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const updateData = {
          name: 'Updated Name'
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${nonExistentId}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertNotFoundError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Arrange
        const updateData = {
          name: 'Updated Name'
        };

        // Act
        const response = await request(app)
          .put(`/api/courses/${courseId}`)
          .send(updateData);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('POST /api/courses/:id/archive', () => {
    let courseId: string;
    let otherTeacherId: string;
    let otherTeacherToken: string;

    beforeEach(async () => {
      // Create test course
      const course = await prisma.course.create({
        data: {
          name: 'Course to Archive',
          description: 'Description',
          courseCode: 'ARCH123',
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });
      courseId = course.id;

      // Create another teacher with unique email
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');
      const otherTeacherEmail = generateUniqueEmail('other-teacher2');
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
      it('should archive an active course', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/archive`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(courseId);
        expect(response.body.status).toBe('ARCHIVED');
        expect(response.body.name).toBe('Course to Archive');
        expect(response.body.courseCode).toBe('ARCH123');
      });
    });

    describe('Business Logic Errors', () => {
      it('should return 400 when trying to archive already archived course', async () => {
        // Arrange - Archive the course first
        await prisma.course.update({
          where: { id: courseId },
          data: { status: 'ARCHIVED' }
        });

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/archive`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertErrorResponse(response, 400, 'RESOURCE_ARCHIVED');
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/archive`)
          .set('Cookie', [`access_token=${otherTeacherToken}`]);

        // Assert
        assertAuthorizationError(response);
        expect(response.body.code).toBe('NOT_OWNER');
      });

      it('should return 403 when user is a student', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/archive`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when course does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .post(`/api/courses/${nonExistentId}/archive`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/archive`);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('DELETE /api/courses/:id', () => {
    let activeCourseId: string;
    let archivedCourseId: string;
    let otherTeacherId: string;
    let otherTeacherToken: string;

    beforeEach(async () => {
      // Create active course
      const activeCourse = await prisma.course.create({
        data: {
          name: 'Active Course',
          description: 'Active description',
          courseCode: 'ACT123',
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });
      activeCourseId = activeCourse.id;

      // Create archived course
      const archivedCourse = await prisma.course.create({
        data: {
          name: 'Archived Course',
          description: 'Archived description',
          courseCode: 'ARC123',
          status: 'ARCHIVED',
          teacherId: teacherId
        }
      });
      archivedCourseId = archivedCourse.id;

      // Create another teacher with unique email
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');
      const otherTeacherEmail = generateUniqueEmail('other-teacher3');
      const otherTeacher = await prisma.user.create({
        data: {
          email: otherTeacherEmail,
          name: 'Other Teacher 3',
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
      it('should delete an archived course', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/courses/${archivedCourseId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.message).toBe('Course deleted successfully');

        // Verify course is deleted
        const deletedCourse = await prisma.course.findUnique({
          where: { id: archivedCourseId }
        });
        expect(deletedCourse).toBeNull();
      });
    });

    describe('Business Logic Errors', () => {
      it('should return 400 when trying to delete active course', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/courses/${activeCourseId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertErrorResponse(response, 400, 'RESOURCE_ACTIVE');
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/courses/${archivedCourseId}`)
          .set('Cookie', [`access_token=${otherTeacherToken}`]);

        // Assert
        assertAuthorizationError(response);
        expect(response.body.code).toBe('NOT_OWNER');
      });

      it('should return 403 when user is a student', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/courses/${archivedCourseId}`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when course does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .delete(`/api/courses/${nonExistentId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/courses/${archivedCourseId}`);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('GET /api/courses/:id/progress', () => {
    let courseId: string;
    let assignmentId: string;
    let quizId: string;
    let otherTeacherId: string;
    let otherTeacherToken: string;

    beforeEach(async () => {
      // Create test course
      const course = await prisma.course.create({
        data: {
          name: 'Progress Test Course',
          description: 'Course for testing progress',
          courseCode: 'PROG123',
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

      // Create assignment
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Test Assignment',
          description: 'Test description',
          courseId: courseId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          submissionType: 'TEXT'
        }
      });
      assignmentId = assignment.id;

      // Create quiz
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Test Quiz',
          description: 'Test quiz description',
          courseId: courseId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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
      quizId = quiz.id;

      // Create another teacher with unique email
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');
      const otherTeacherEmail = generateUniqueEmail('other-teacher-progress');
      const otherTeacher = await prisma.user.create({
        data: {
          email: otherTeacherEmail,
          name: 'Other Teacher Progress',
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
      it('should get student progress for enrolled course', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('courseId');
        expect(response.body.courseId).toBe(courseId);
        expect(response.body).toHaveProperty('courseName');
        expect(response.body).toHaveProperty('assignments');
        expect(response.body).toHaveProperty('quizzes');
        expect(response.body).toHaveProperty('averageGrade');
        expect(Array.isArray(response.body.assignments)).toBe(true);
        expect(Array.isArray(response.body.quizzes)).toBe(true);
      });

      it('should include assignment details in progress', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.assignments.length).toBeGreaterThan(0);
        const assignment = response.body.assignments[0];
        expect(assignment).toHaveProperty('id');
        expect(assignment).toHaveProperty('title');
        expect(assignment).toHaveProperty('dueDate');
        expect(assignment).toHaveProperty('status');
      });

      it('should include quiz details in progress', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.quizzes.length).toBeGreaterThan(0);
        const quiz = response.body.quizzes[0];
        expect(quiz).toHaveProperty('id');
        expect(quiz).toHaveProperty('title');
        expect(quiz).toHaveProperty('dueDate');
        expect(quiz).toHaveProperty('status');
      });

      it('should show null average grade when no items are graded', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.averageGrade).toBeNull();
      });

      it('should calculate average grade when items are graded', async () => {
        // Arrange - Create submission and grade it
        const submission = await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignmentId,
            studentId: studentId,
            submittedAt: new Date(),
            content: 'Test submission',
            status: 'GRADED',
            grade: 85
          }
        });

        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.averageGrade).toBe(85);
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when student is not enrolled', async () => {
        // Arrange - Create another student not enrolled with unique email
        const passwordService = container.resolve(PasswordService);
        const hashedPassword = await passwordService.hash('password123');
        const otherStudentEmail = generateUniqueEmail('other-student');
        const otherStudent = await prisma.user.create({
          data: {
            email: otherStudentEmail,
            name: 'Other Student',
            role: 'STUDENT',
            passwordHash: hashedPassword
          }
        });
        const otherStudentToken = generateTestToken({
          userId: otherStudent.id,
          email: otherStudentEmail,
          role: 'STUDENT'
        });

        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`)
          .set('Cookie', [`access_token=${otherStudentToken}`]);

        // Assert
        assertAuthorizationError(response);
        expect(response.body.code).toBe('NOT_ENROLLED');
      });

      it('should return 403 when teacher is not the course owner', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`)
          .set('Cookie', [`access_token=${otherTeacherToken}`]);

        // Assert
        assertAuthorizationError(response);
        expect(response.body.code).toBe('NOT_OWNER');
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when course does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .get(`/api/courses/${nonExistentId}/progress`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`);

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when access token is invalid', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`)
          .set('Cookie', ['access_token=invalid_token']);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('GET /api/courses/:id/grades/export', () => {
    let courseId: string;
    let assignmentId: string;
    let quizId: string;
    let otherTeacherId: string;
    let otherTeacherToken: string;

    beforeEach(async () => {
      // Create test course
      const course = await prisma.course.create({
        data: {
          name: 'Export Test Course',
          description: 'Course for testing export',
          courseCode: 'EXPORT123',
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

      // Create assignment
      const assignment = await prisma.assignment.create({
        data: {
          title: 'Export Test Assignment',
          description: 'Test description',
          courseId: courseId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          submissionType: 'TEXT'
        }
      });
      assignmentId = assignment.id;

      // Create quiz
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Export Test Quiz',
          description: 'Test quiz description',
          courseId: courseId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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
      quizId = quiz.id;

      // Create another teacher with unique email
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');
      const otherTeacherEmail = generateUniqueEmail('other-teacher-export');
      const otherTeacher = await prisma.user.create({
        data: {
          email: otherTeacherEmail,
          name: 'Other Teacher Export',
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
      it('should export grades as CSV with correct headers', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
        expect(response.headers['content-disposition']).toContain('attachment');
        expect(response.headers['content-disposition']).toContain('grades-');
        expect(response.headers['content-disposition']).toContain('.csv');
        expect(typeof response.text).toBe('string');
        expect(response.text).toContain('Student Name');
        expect(response.text).toContain('Student Email');
        expect(response.text).toContain('Item Type');
        expect(response.text).toContain('Item Name');
        expect(response.text).toContain('Grade');
      });

      it('should include student information in CSV', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.text).toContain('Test Student');
        // Email is unique per test run, so we just verify student name is present
      });

      it('should include assignment information in CSV', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.text).toContain('Export Test Assignment');
        expect(response.text).toContain('Assignment');
      });

      it('should include quiz information in CSV', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.text).toContain('Export Test Quiz');
        expect(response.text).toContain('Quiz');
      });

      it('should show "Not Submitted" for unsubmitted items', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.text).toContain('Not Submitted');
      });

      it('should show "Pending" for submitted but ungraded items', async () => {
        // Arrange - Create ungraded submission
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignmentId,
            studentId: studentId,
            submittedAt: new Date(),
            content: 'Test submission',
            status: 'SUBMITTED'
          }
        });

        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.text).toContain('Pending');
      });

      it('should show grade for graded items', async () => {
        // Arrange - Create graded submission
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignmentId,
            studentId: studentId,
            submittedAt: new Date(),
            content: 'Test submission',
            status: 'GRADED',
            grade: 85
          }
        });

        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.text).toContain('85');
      });

      it('should include student summary with average grade', async () => {
        // Arrange - Create graded submission
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignmentId,
            studentId: studentId,
            submittedAt: new Date(),
            content: 'Test submission',
            status: 'GRADED',
            grade: 90
          }
        });

        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.text).toContain('Average');
        expect(response.text).toContain('90');
      });

      it('should generate filename with course name and date', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        const disposition = response.headers['content-disposition'];
        expect(disposition).toContain('grades-Export-Test-Course-');
        expect(disposition).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format YYYY-MM-DD
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${otherTeacherToken}`]);

        // Assert
        assertAuthorizationError(response);
        expect(response.body.code).toBe('NOT_OWNER');
      });

      it('should return 403 when user is a student', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertAuthorizationError(response);
        expect(response.body.code).toBe('FORBIDDEN_ROLE');
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when course does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .get(`/api/courses/${nonExistentId}/grades/export`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`);

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when access token is invalid', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/grades/export`)
          .set('Cookie', ['access_token=invalid_token']);

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
          name: '',
          description: ''
        };

        // Act
        const response = await request(app)
          .post('/api/courses')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('VALIDATION_FAILED');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('details');
        expect(typeof response.body.details).toBe('object');
      });
    });

    describe('Authentication Middleware', () => {
      it('should protect all course endpoints with authentication', async () => {
        // Act - Test multiple endpoints without token
        const getResponse = await request(app).get('/api/courses');
        const postResponse = await request(app).post('/api/courses').send({});
        const putResponse = await request(app).put('/api/courses/test-id').send({});
        const deleteResponse = await request(app).delete('/api/courses/test-id');

        // Assert
        expect(getResponse.status).toBe(401);
        expect(postResponse.status).toBe(401);
        expect(putResponse.status).toBe(401);
        expect(deleteResponse.status).toBe(401);
      });
    });

    describe('Error Handler Middleware', () => {
      it('should handle domain errors with appropriate status codes', async () => {
        // Arrange - Create archived course
        const course = await prisma.course.create({
          data: {
            name: 'Archived Course',
            description: 'Description',
            courseCode: 'ERR123',
            status: 'ARCHIVED',
            teacherId: teacherId
          }
        });

        // Act - Try to update archived course
        const response = await request(app)
          .put(`/api/courses/${course.id}`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send({ name: 'New Name' });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('code');
        expect(response.body).toHaveProperty('message');
        expect(response.body).not.toHaveProperty('stack');
      });

      it('should not expose internal error details', async () => {
        // Act - Try to get non-existent course
        const response = await request(app)
          .get('/api/courses/00000000-0000-0000-0000-000000000000')
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('originalError');
        expect(response.body.message).not.toContain('prisma');
        expect(response.body.message).not.toContain('database');
      });
    });
  });
});
