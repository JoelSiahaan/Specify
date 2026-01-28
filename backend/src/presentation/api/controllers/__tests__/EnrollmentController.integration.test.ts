/**
 * Enrollment Controller Integration Tests
 * 
 * Tests enrollment-related API endpoints with Supertest.
 * These are integration tests that verify the complete request/response cycle
 * including validation middleware, authentication middleware, authorization, and error handling.
 * 
 * Requirements:
 * - 6.1: Search active courses by name
 * - 6.2: Display course details in search results
 * - 6.3: Show enrollment status for each course
 * - 6.4: Only active courses appear in search
 * - 6.5: Enroll student in active course using course code
 * - 6.6: Reject enrollment for archived courses
 * - 6.7: Reject enrollment with invalid course code
 * - 6.8: Prevent duplicate enrollment
 * - 5.8: Bulk unenroll students from archived courses
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
import { PrismaEnrollmentRepository } from '../../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository';
import { PasswordService } from '../../../../infrastructure/auth/PasswordService';
import { JWTService } from '../../../../infrastructure/auth/JWTService';
import { CourseCodeGenerator } from '../../../../domain/services/CourseCodeGenerator';

describe('EnrollmentController Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let teacherToken: string;
  let studentToken: string;
  let student2Token: string;
  let teacherId: string;
  let studentId: string;
  let student2Id: string;

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
    container.registerSingleton('IEnrollmentRepository', PrismaEnrollmentRepository);
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

    const student2 = await prisma.user.create({
      data: {
        email: 'student2@test.com',
        name: 'Test Student 2',
        role: 'STUDENT',
        passwordHash: hashedPassword
      }
    });
    student2Id = student2.id;

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

    student2Token = generateTestToken({
      userId: student2Id,
      email: 'student2@test.com',
      role: 'STUDENT'
    });
  });

  describe('GET /api/courses/search', () => {
    let activeCourse1Id: string;
    let activeCourse2Id: string;
    let archivedCourseId: string;

    beforeEach(async () => {
      // Create test courses
      const course1 = await prisma.course.create({
        data: {
          name: 'Introduction to Programming',
          description: 'Learn programming basics',
          courseCode: 'PROG101',
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });
      activeCourse1Id = course1.id;

      const course2 = await prisma.course.create({
        data: {
          name: 'Advanced Programming',
          description: 'Advanced programming concepts',
          courseCode: 'PROG201',
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });
      activeCourse2Id = course2.id;

      const archivedCourse = await prisma.course.create({
        data: {
          name: 'Archived Programming Course',
          description: 'This course is archived',
          courseCode: 'ARCH101',
          status: 'ARCHIVED',
          teacherId: teacherId
        }
      });
      archivedCourseId = archivedCourse.id;

      // Enroll student in course1
      await prisma.enrollment.create({
        data: {
          studentId: studentId,
          courseId: activeCourse1Id
        }
      });
    });

    describe('Success Scenarios', () => {
      it('should search courses by name', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses/search?query=Introduction')
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].name).toBe('Introduction to Programming');
        expect(response.body.data[0].courseCode).toBe('PROG101');
      });

      it('should return all active courses when no query provided', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses/search')
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.data.length).toBe(2);
        expect(response.body.data.every((c: any) => c.status === 'ACTIVE')).toBe(true);
      });

      it('should show enrollment status for each course', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses/search')
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        const enrolledCourse = response.body.data.find((c: any) => c.id === activeCourse1Id);
        const notEnrolledCourse = response.body.data.find((c: any) => c.id === activeCourse2Id);
        
        expect(enrolledCourse).toHaveProperty('isEnrolled', true);
        expect(notEnrolledCourse).toHaveProperty('isEnrolled', false);
      });

      it('should only show active courses (not archived)', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses/search')
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.data.every((c: any) => c.status === 'ACTIVE')).toBe(true);
        expect(response.body.data.find((c: any) => c.id === archivedCourseId)).toBeUndefined();
      });

      it('should display course details in search results', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses/search?query=Introduction')
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        const course = response.body.data[0];
        expect(course).toHaveProperty('id');
        expect(course).toHaveProperty('name');
        expect(course).toHaveProperty('description');
        expect(course).toHaveProperty('courseCode');
        expect(course).toHaveProperty('status');
        expect(course).toHaveProperty('teacherId');
        // Note: teacherName is not included in response (future enhancement)
      });

      it('should return empty array when no courses match search', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses/search?query=NonExistent')
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.data).toEqual([]);
      });

      it('should be case-insensitive search', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses/search?query=introduction')
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].name).toBe('Introduction to Programming');
      });

      it('should search by partial name match', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses/search?query=Programming')
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.data.length).toBe(2);
        expect(response.body.data.every((c: any) => c.name.includes('Programming'))).toBe(true);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses/search');

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when access token is invalid', async () => {
        // Act
        const response = await request(app)
          .get('/api/courses/search')
          .set('Cookie', ['access_token=invalid_token']);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('POST /api/courses/enroll', () => {
    let activeCourseId: string;
    let activeCourseCode: string;
    let archivedCourseId: string;
    let archivedCourseCode: string;

    beforeEach(async () => {
      // Create active course
      const activeCourse = await prisma.course.create({
        data: {
          name: 'Active Course',
          description: 'Active course description',
          courseCode: 'ACT123',
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });
      activeCourseId = activeCourse.id;
      activeCourseCode = activeCourse.courseCode;

      // Create archived course
      const archivedCourse = await prisma.course.create({
        data: {
          name: 'Archived Course',
          description: 'Archived course description',
          courseCode: 'ARC123',
          status: 'ARCHIVED',
          teacherId: teacherId
        }
      });
      archivedCourseId = archivedCourse.id;
      archivedCourseCode = archivedCourse.courseCode;
    });

    describe('Success Scenarios', () => {
      it('should enroll student in active course with valid course code', async () => {
        // Arrange
        const enrollData = {
          courseCode: activeCourseCode
        };

        // Act
        const response = await request(app)
          .post('/api/courses/enroll')
          .set('Cookie', [`access_token=${studentToken}`])
          .send(enrollData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.courseId).toBe(activeCourseId);
        expect(response.body.studentId).toBe(studentId);
        expect(response.body).toHaveProperty('enrolledAt');
        // Note: EnrollmentDTO returns basic fields only (no course details)
      });

      it('should create enrollment record in database', async () => {
        // Arrange
        const enrollData = {
          courseCode: activeCourseCode
        };

        // Act
        await request(app)
          .post('/api/courses/enroll')
          .set('Cookie', [`access_token=${studentToken}`])
          .send(enrollData);

        // Assert - Verify enrollment exists in database
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: studentId,
            courseId: activeCourseId
          }
        });
        expect(enrollment).not.toBeNull();
        expect(enrollment?.studentId).toBe(studentId);
        expect(enrollment?.courseId).toBe(activeCourseId);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when courseCode is missing', async () => {
        // Arrange
        const enrollData = {};

        // Act
        const response = await request(app)
          .post('/api/courses/enroll')
          .set('Cookie', [`access_token=${studentToken}`])
          .send(enrollData);

        // Assert
        assertValidationError(response, ['courseCode']);
      });

      it('should return 400 when courseCode is empty string', async () => {
        // Arrange
        const enrollData = {
          courseCode: ''
        };

        // Act
        const response = await request(app)
          .post('/api/courses/enroll')
          .set('Cookie', [`access_token=${studentToken}`])
          .send(enrollData);

        // Assert
        assertValidationError(response, ['courseCode']);
      });

      it('should return 400 when courseCode format is invalid', async () => {
        // Arrange
        const enrollData = {
          courseCode: 'INVALID'
        };

        // Act
        const response = await request(app)
          .post('/api/courses/enroll')
          .set('Cookie', [`access_token=${studentToken}`])
          .send(enrollData);

        // Assert
        assertValidationError(response, ['courseCode']);
      });
    });

    describe('Business Logic Errors', () => {
      it('should return 404 when course code does not exist', async () => {
        // Arrange
        const enrollData = {
          courseCode: 'NOEXST'
        };

        // Act
        const response = await request(app)
          .post('/api/courses/enroll')
          .set('Cookie', [`access_token=${studentToken}`])
          .send(enrollData);

        // Assert
        assertNotFoundError(response);
        expect(response.body.code).toBe('COURSE_NOT_FOUND');
      });

      it('should return 409 when trying to enroll in archived course', async () => {
        // Arrange
        const enrollData = {
          courseCode: archivedCourseCode
        };

        // Act
        const response = await request(app)
          .post('/api/courses/enroll')
          .set('Cookie', [`access_token=${studentToken}`])
          .send(enrollData);

        // Assert
        assertErrorResponse(response, 409, 'COURSE_ARCHIVED');
      });

      it('should return 409 when student is already enrolled', async () => {
        // Arrange - Enroll student first
        await prisma.enrollment.create({
          data: {
            studentId: studentId,
            courseId: activeCourseId
          }
        });

        const enrollData = {
          courseCode: activeCourseCode
        };

        // Act
        const response = await request(app)
          .post('/api/courses/enroll')
          .set('Cookie', [`access_token=${studentToken}`])
          .send(enrollData);

        // Assert
        assertErrorResponse(response, 409, 'DUPLICATE_ENROLLMENT');
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is a teacher', async () => {
        // Arrange
        const enrollData = {
          courseCode: activeCourseCode
        };

        // Act
        const response = await request(app)
          .post('/api/courses/enroll')
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(enrollData);

        // Assert
        assertAuthorizationError(response);
        expect(response.body.code).toBe('FORBIDDEN_ROLE');
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Arrange
        const enrollData = {
          courseCode: activeCourseCode
        };

        // Act
        const response = await request(app)
          .post('/api/courses/enroll')
          .send(enrollData);

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when access token is invalid', async () => {
        // Arrange
        const enrollData = {
          courseCode: activeCourseCode
        };

        // Act
        const response = await request(app)
          .post('/api/courses/enroll')
          .set('Cookie', ['access_token=invalid_token'])
          .send(enrollData);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('POST /api/courses/:id/unenroll-bulk', () => {
    let activeCourseId: string;
    let archivedCourseId: string;
    let otherTeacherId: string;
    let otherTeacherToken: string;

    beforeEach(async () => {
      // Create active course
      const activeCourse = await prisma.course.create({
        data: {
          name: 'Active Course',
          description: 'Active course description',
          courseCode: 'ACT456',
          status: 'ACTIVE',
          teacherId: teacherId
        }
      });
      activeCourseId = activeCourse.id;

      // Create archived course with enrollments
      const archivedCourse = await prisma.course.create({
        data: {
          name: 'Archived Course',
          description: 'Archived course description',
          courseCode: 'ARC456',
          status: 'ARCHIVED',
          teacherId: teacherId
        }
      });
      archivedCourseId = archivedCourse.id;

      // Enroll students in archived course
      await prisma.enrollment.create({
        data: {
          studentId: studentId,
          courseId: archivedCourseId
        }
      });

      await prisma.enrollment.create({
        data: {
          studentId: student2Id,
          courseId: archivedCourseId
        }
      });

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
      it('should bulk unenroll all students from archived course', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${archivedCourseId}/unenroll-bulk`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('unenrolled');
      });

      it('should remove all enrollment records from database', async () => {
        // Act
        await request(app)
          .post(`/api/courses/${archivedCourseId}/unenroll-bulk`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert - Verify enrollments are deleted
        const enrollments = await prisma.enrollment.findMany({
          where: {
            courseId: archivedCourseId
          }
        });
        expect(enrollments.length).toBe(0);
      });

      it('should return success even when no enrollments exist', async () => {
        // Arrange - Delete all enrollments first
        await prisma.enrollment.deleteMany({
          where: {
            courseId: archivedCourseId
          }
        });

        // Act
        const response = await request(app)
          .post(`/api/courses/${archivedCourseId}/unenroll-bulk`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
      });
    });

    describe('Business Logic Errors', () => {
      it('should return 409 when trying to bulk unenroll from active course', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${activeCourseId}/unenroll-bulk`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        // Note: Returns 409 COURSE_ACTIVE because authorization passes (teacher is owner)
        // but business rule validation fails (course must be archived)
        assertErrorResponse(response, 409, 'COURSE_ACTIVE');
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is not the course owner', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${archivedCourseId}/unenroll-bulk`)
          .set('Cookie', [`access_token=${otherTeacherToken}`]);

        // Assert
        assertAuthorizationError(response);
        expect(response.body.code).toBe('NOT_OWNER');
      });

      it('should return 403 when user is a student', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${archivedCourseId}/unenroll-bulk`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertAuthorizationError(response);
        // Note: Returns NOT_OWNER because authorization check happens before role check
        expect(response.body.code).toBe('NOT_OWNER');
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when course does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .post(`/api/courses/${nonExistentId}/unenroll-bulk`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${archivedCourseId}/unenroll-bulk`);

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when access token is invalid', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${archivedCourseId}/unenroll-bulk`)
          .set('Cookie', ['access_token=invalid_token']);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });
});
