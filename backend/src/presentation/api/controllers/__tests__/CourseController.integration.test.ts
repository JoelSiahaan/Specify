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
import courseRoutes from '../../routes/courseRoutes';
import { errorHandler } from '../../middleware/ErrorHandlerMiddleware';
import { cleanupDatabase, generateTestToken } from '../../../../test/test-utils';
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
import { PasswordService } from '../../../../infrastructure/auth/PasswordService';
import { JWTService } from '../../../../infrastructure/auth/JWTService';
import { CourseCodeGenerator } from '../../../../domain/services/CourseCodeGenerator';

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

    // Create test users
    const passwordService = container.resolve(PasswordService);
    const hashedPassword = await passwordService.hash('password123');

    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@test.com',
        name: 'Test Teacher',
        role: 'TEACHER',
        passwordHash: hashedPassword
      }
    });
    teacherId = teacher.id;

    const student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        name: 'Test Student',
        role: 'STUDENT',
        passwordHash: hashedPassword
      }
    });
    studentId = student.id;

    // Generate tokens
    teacherToken = generateTestToken({
      userId: teacherId,
      email: 'teacher@test.com',
      role: 'TEACHER'
    });

    studentToken = generateTestToken({
      userId: studentId,
      email: 'student@test.com',
      role: 'STUDENT'
    });
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

      // Create another teacher
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');
      const otherTeacher = await prisma.user.create({
        data: {
          email: 'other-teacher@test.com',
          name: 'Other Teacher',
          role: 'TEACHER',
          passwordHash: hashedPassword
        }
      });
      otherTeacherId = otherTeacher.id;
      otherTeacherToken = generateTestToken({
        userId: otherTeacherId,
        email: 'other-teacher@test.com',
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

      // Create another teacher
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');
      const otherTeacher = await prisma.user.create({
        data: {
          email: 'other-teacher2@test.com',
          name: 'Other Teacher 2',
          role: 'TEACHER',
          passwordHash: hashedPassword
        }
      });
      otherTeacherId = otherTeacher.id;
      otherTeacherToken = generateTestToken({
        userId: otherTeacherId,
        email: 'other-teacher2@test.com',
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

      // Create another teacher
      const passwordService = container.resolve(PasswordService);
      const hashedPassword = await passwordService.hash('password123');
      const otherTeacher = await prisma.user.create({
        data: {
          email: 'other-teacher3@test.com',
          name: 'Other Teacher 3',
          role: 'TEACHER',
          passwordHash: hashedPassword
        }
      });
      otherTeacherId = otherTeacher.id;
      otherTeacherToken = generateTestToken({
        userId: otherTeacherId,
        email: 'other-teacher3@test.com',
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
