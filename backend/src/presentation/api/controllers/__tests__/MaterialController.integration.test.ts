/**
 * MaterialController Integration Tests
 * 
 * Tests material management API endpoints with Supertest.
 * These are integration tests that verify the complete request/response cycle
 * including validation middleware, authentication middleware, authorization, file uploads, and error handling.
 * 
 * Requirements:
 * - 7.1: Upload files to courses
 * - 7.2: Add text content to courses
 * - 7.3: Add video links to courses
 * - 7.6: Delete materials
 * - 7.7: Edit existing materials
 * - 8.1: Students view all materials
 * - 8.2: Students download files
 * - 18.1: API endpoints follow REST conventions
 * - 18.2: Consistent error response format
 * - 18.3: Centralized error handling
 */

import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import materialRoutes from '../../routes/materialRoutes';
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
import { PrismaMaterialRepository } from '../../../../infrastructure/persistence/repositories/PrismaMaterialRepository';
import { PrismaEnrollmentRepository } from '../../../../infrastructure/persistence/repositories/PrismaEnrollmentRepository';
import { PasswordService } from '../../../../infrastructure/auth/PasswordService';
import { JWTService } from '../../../../infrastructure/auth/JWTService';
import { LocalFileStorage } from '../../../../infrastructure/storage/LocalFileStorage';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Helper functions to create valid file buffers with proper magic numbers
 * These ensure files pass FileValidator's content validation
 */
const createValidPdfBuffer = (content: string = 'test content'): Buffer => {
  // PDF magic number: %PDF-1.4
  const header = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A]);
  const body = Buffer.from(content);
  return Buffer.concat([header, body]);
};

const createValidDocxBuffer = (): Buffer => {
  // DOCX is a ZIP file, starts with PK magic number
  const header = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
  // Add minimal ZIP structure
  const body = Buffer.alloc(100);
  return Buffer.concat([header, body]);
};

const createValidJpegBuffer = (): Buffer => {
  // JPEG magic number: FF D8 FF E0 (JFIF)
  const header = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
  // Add minimal JPEG structure
  const body = Buffer.alloc(100);
  return Buffer.concat([header, body]);
};

const createValidPngBuffer = (): Buffer => {
  // PNG magic number: 89 50 4E 47 0D 0A 1A 0A
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  // Add minimal PNG structure
  const body = Buffer.alloc(100);
  return Buffer.concat([header, body]);
};

const createValidGifBuffer = (): Buffer => {
  // GIF magic number: GIF89a
  const header = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  // Add minimal GIF structure
  const body = Buffer.alloc(100);
  return Buffer.concat([header, body]);
};

describe('MaterialController Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let teacherToken: string;
  let studentToken: string;
  let teacherId: string;
  let studentId: string;
  let courseId: string;
  let uploadDir: string;

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

    // Setup upload directory for tests
    uploadDir = path.join(process.cwd(), 'uploads', 'test');
    await fs.mkdir(uploadDir, { recursive: true });

    // Register dependencies
    container.registerInstance('PrismaClient', prisma);
    container.registerSingleton('IUserRepository', PrismaUserRepository);
    container.registerSingleton('ICourseRepository', PrismaCourseRepository);
    container.registerSingleton('IMaterialRepository', PrismaMaterialRepository);
    container.registerSingleton('IEnrollmentRepository', PrismaEnrollmentRepository);
    container.registerSingleton(PasswordService);
    container.registerSingleton(JWTService);
    
    // Register file storage with test directory
    // Set environment variable for LocalFileStorage to use test directory
    process.env.UPLOAD_DIR = uploadDir;
    const fileStorage = new LocalFileStorage();
    container.registerInstance('IFileStorage', fileStorage);
    
    // Register authorization policy
    const { AuthorizationPolicy } = await import('../../../../application/policies/AuthorizationPolicy');
    container.registerSingleton('IAuthorizationPolicy', AuthorizationPolicy);

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api', materialRoutes);
    app.use(errorHandler);
  });

  afterAll(async () => {
    // Clean up test upload directory
    try {
      await fs.rm(uploadDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
    
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
        description: 'Test description',
        courseCode: 'TEST123',
        status: 'ACTIVE',
        teacherId: teacherId
      }
    });
    courseId = course.id;
  });

  describe('POST /api/courses/:courseId/materials/file', () => {
    describe('Success Scenarios', () => {
      it('should create a FILE material with valid data (teacher)', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('test file content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Lecture Notes')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'lecture.pdf');

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe('Lecture Notes');
        expect(response.body.type).toBe('FILE');
        expect(response.body.courseId).toBe(courseId);
        expect(response.body).toHaveProperty('filePath');
        expect(response.body.fileName).toBe('lecture.pdf');
        expect(response.body).toHaveProperty('createdAt');
      });

      it('should accept PDF files (Requirement 20.4)', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('test pdf content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'PDF Document')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'document.pdf');

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body.fileName).toBe('document.pdf');
      });

      it('should accept DOCX files (Requirement 20.4)', async () => {
        // Arrange
        const fileBuffer = createValidDocxBuffer();

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Word Document')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'document.docx');

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body.fileName).toBe('document.docx');
      });

      it('should accept JPG files (Requirement 20.4)', async () => {
        // Arrange
        const fileBuffer = createValidJpegBuffer();

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Image JPG')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'image.jpg');

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body.fileName).toBe('image.jpg');
      });

      it('should accept PNG files (Requirement 20.4)', async () => {
        // Arrange
        const fileBuffer = createValidPngBuffer();

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Image PNG')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'image.png');

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body.fileName).toBe('image.png');
      });

      it('should accept GIF files (Requirement 20.4)', async () => {
        // Arrange
        const fileBuffer = createValidGifBuffer();

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Image GIF')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'image.gif');

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body.fileName).toBe('image.gif');
      });

      it('should accept file at size limit (10MB) (Requirement 20.5)', async () => {
        // Arrange - Create slightly under 10MB PDF with valid header
        const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A]);
        const pdfBody = Buffer.alloc(9.5 * 1024 * 1024 - pdfHeader.length);
        const fileBuffer = Buffer.concat([pdfHeader, pdfBody]);

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Max Size File')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'maxsize.pdf');

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body.fileSize).toBeGreaterThan(9 * 1024 * 1024);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when title is missing', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('test file content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'lecture.pdf');

        // Assert
        assertValidationError(response, ['title']);
      });

      it('should return 400 when file is missing', async () => {
        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Lecture Notes')
          .field('type', 'FILE');

        // Assert
        assertErrorResponse(response, 400, 'VALIDATION_FAILED');
      });
    });

    describe('Security Tests - File Type Validation (Requirement 20.4)', () => {
      it('should reject executable files (.exe)', async () => {
        // Arrange
        const fileBuffer = Buffer.from('malicious executable');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Malicious File')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'malware.exe');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
        expect(response.body.message).toContain('not allowed');
      });

      it('should reject script files (.js)', async () => {
        // Arrange
        const fileBuffer = Buffer.from('console.log("malicious")');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Script File')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'script.js');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });

      it('should reject PHP files (.php)', async () => {
        // Arrange
        const fileBuffer = Buffer.from('<?php echo "malicious"; ?>');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'PHP File')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'script.php');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });

      it('should reject shell script files (.sh)', async () => {
        // Arrange
        const fileBuffer = Buffer.from('#!/bin/bash\nrm -rf /');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Shell Script')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'script.sh');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });

      it('should reject batch files (.bat)', async () => {
        // Arrange
        const fileBuffer = Buffer.from('@echo off\ndel /f /s /q *.*');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Batch File')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'script.bat');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });

      it('should reject Python files (.py)', async () => {
        // Arrange
        const fileBuffer = Buffer.from('import os; os.system("rm -rf /")');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Python Script')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'script.py');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });

      it('should reject video files (.mp4)', async () => {
        // Arrange
        const fileBuffer = Buffer.from('fake video content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Video File')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'video.mp4');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });

      it('should reject archive files (.zip)', async () => {
        // Arrange
        const fileBuffer = Buffer.from('fake zip content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Archive File')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'archive.zip');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });

      it('should reject files with no extension', async () => {
        // Arrange
        const fileBuffer = Buffer.from('file without extension');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'No Extension')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'noextension');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });

      it('should reject files with double extensions (.pdf.exe)', async () => {
        // Arrange
        const fileBuffer = Buffer.from('malicious file with double extension');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Double Extension')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'document.pdf.exe');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });
    });

    describe('Security Tests - File Size Limit (Requirement 20.5)', () => {
      it('should reject file exceeding 10MB limit', async () => {
        // Arrange - Create 11MB file
        const fileBuffer = Buffer.alloc(11 * 1024 * 1024);

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Too Large File')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'toolarge.pdf');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_SIZE');
        expect(response.body.message).toContain('10MB');
      });

      it('should reject file significantly exceeding limit (50MB)', async () => {
        // Arrange - Create 50MB file
        const fileBuffer = Buffer.alloc(50 * 1024 * 1024);

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Very Large File')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'verylarge.pdf');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_SIZE');
      });

      it('should reject file slightly exceeding limit (10MB + 1 byte)', async () => {
        // Arrange - Create 10MB + 1 byte file
        const fileBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Slightly Over Limit')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'slightlyover.pdf');

        // Assert
        assertErrorResponse(response, 400, 'INVALID_FILE_SIZE');
      });
    });

    describe('Security Tests - Path Traversal Prevention (Requirement 20.3)', () => {
      it('should reject filename with parent directory traversal (..)', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('malicious content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Path Traversal')
          .field('type', 'FILE')
          .attach('file', fileBuffer, '../../../etc/passwd');

        // Assert
        // The system rejects this because 'passwd' has no valid extension
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });

      it('should safely store files with current directory reference (./)', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('test content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Current Dir Reference')
          .field('type', 'FILE')
          .attach('file', fileBuffer, './sensitive.pdf');

        // Assert
        // System accepts the file and stores it safely with UUID-based name
        assertSuccessResponse(response, 201);
        // The stored path should include directory structure and UUID (with forward or backslashes)
        expect(response.body.filePath).toMatch(/^courses[\\/][0-9a-f-]{36}[\\/]materials[\\/][0-9a-f-]{36}\.pdf$/);
        // Verify no path traversal in stored path
        expect(response.body.filePath).not.toContain('..');
        expect(response.body.filePath).not.toContain('./');
      });

      it('should safely store files with home directory reference (~)', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('test content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Home Dir Reference')
          .field('type', 'FILE')
          .attach('file', fileBuffer, '~/sensitive.pdf');

        // Assert
        // System accepts the file and stores it safely with UUID-based name
        assertSuccessResponse(response, 201);
        // The stored path should include directory structure and UUID (with forward or backslashes)
        expect(response.body.filePath).toMatch(/^courses[\\/][0-9a-f-]{36}[\\/]materials[\\/][0-9a-f-]{36}\.pdf$/);
        // Verify no path traversal in stored path
        expect(response.body.filePath).not.toContain('~');
      });

      it('should accept filename with special characters but sanitize them', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('test content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Special Chars')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'file<>:|?*.pdf');

        // Assert
        // System accepts the file but stores it with a UUID-based name
        // The original filename is preserved in the fileName field
        assertSuccessResponse(response, 201);
        // The stored path should include directory structure and UUID (with forward or backslashes)
        expect(response.body.filePath).toMatch(/^courses[\\/][0-9a-f-]{36}[\\/]materials[\\/][0-9a-f-]{36}\.pdf$/);
        // The original filename is preserved for display purposes
        expect(response.body.fileName).toBe('file<>:|?*.pdf');
      });

      it('should handle absolute path attempts', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('malicious content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Absolute Path')
          .field('type', 'FILE')
          .attach('file', fileBuffer, '/etc/passwd');

        // Assert
        // System rejects this because 'passwd' has no valid extension
        assertErrorResponse(response, 400, 'INVALID_FILE_TYPE');
      });

      it('should safely store files with valid extensions regardless of path', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('test content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .field('title', 'Safe File')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'document.pdf');

        // Assert
        assertSuccessResponse(response, 201);
        // Verify the file is stored with directory structure and UUID-based name (with forward or backslashes)
        expect(response.body.filePath).toMatch(/^courses[\\/][0-9a-f-]{36}[\\/]materials[\\/][0-9a-f-]{36}\.pdf$/);
        // Verify the path doesn't contain any directory traversal
        expect(response.body.filePath).not.toContain('..');
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is a student', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('test file content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .set('Cookie', [`access_token=${studentToken}`])
          .field('title', 'Lecture Notes')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'lecture.pdf');

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Arrange
        const fileBuffer = createValidPdfBuffer('test file content');

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/file`)
          .field('title', 'Lecture Notes')
          .field('type', 'FILE')
          .attach('file', fileBuffer, 'lecture.pdf');

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('POST /api/courses/:courseId/materials/text', () => {
    describe('Success Scenarios', () => {
      it('should create a TEXT material with valid data (teacher)', async () => {
        // Arrange
        const materialData = {
          title: 'Course Introduction',
          type: 'TEXT',
          content: '<p>Welcome to the course!</p>'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/text`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(materialData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe('Course Introduction');
        expect(response.body.type).toBe('TEXT');
        expect(response.body.content).toBe('<p>Welcome to the course!</p>');
        expect(response.body.courseId).toBe(courseId);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when title is missing', async () => {
        // Arrange
        const materialData = {
          type: 'TEXT',
          content: '<p>Content</p>'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/text`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(materialData);

        // Assert
        assertValidationError(response, ['title']);
      });

      it('should return 400 when content is missing', async () => {
        // Arrange
        const materialData = {
          title: 'Title',
          type: 'TEXT'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/text`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(materialData);

        // Assert
        assertValidationError(response, ['content']);
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is a student', async () => {
        // Arrange
        const materialData = {
          title: 'Course Introduction',
          type: 'TEXT',
          content: '<p>Welcome to the course!</p>'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/text`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(materialData);

        // Assert
        assertAuthorizationError(response);
      });
    });
  });

  describe('POST /api/courses/:courseId/materials/video', () => {
    describe('Success Scenarios', () => {
      it('should create a VIDEO_LINK material with valid data (teacher)', async () => {
        // Arrange
        const materialData = {
          title: 'Introduction Video',
          type: 'VIDEO_LINK',
          content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/video`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(materialData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe('Introduction Video');
        expect(response.body.type).toBe('VIDEO_LINK');
        expect(response.body.content).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(response.body.courseId).toBe(courseId);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when content (video URL) is missing', async () => {
        // Arrange
        const materialData = {
          title: 'Introduction Video',
          type: 'VIDEO_LINK'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/video`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(materialData);

        // Assert
        assertValidationError(response, ['content']);
      });

      it('should return 400 when content (video URL) is invalid', async () => {
        // Arrange
        const materialData = {
          title: 'Introduction Video',
          type: 'VIDEO_LINK',
          content: 'not-a-valid-url'
        };

        // Act
        const response = await request(app)
          .post(`/api/courses/${courseId}/materials/video`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(materialData);

        // Assert
        assertValidationError(response, ['content']);
      });
    });
  });

  describe('GET /api/courses/:courseId/materials', () => {
    let fileMaterialId: string;
    let textMaterialId: string;
    let videoMaterialId: string;

    beforeEach(async () => {
      // Create test materials
      const fileMaterial = await prisma.material.create({
        data: {
          title: 'File Material',
          type: 'FILE',
          courseId: courseId,
          filePath: 'test/file.pdf',
          fileName: 'file.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf'
        }
      });
      fileMaterialId = fileMaterial.id;

      const textMaterial = await prisma.material.create({
        data: {
          title: 'Text Material',
          type: 'TEXT',
          courseId: courseId,
          content: '<p>Text content</p>'
        }
      });
      textMaterialId = textMaterial.id;

      const videoMaterial = await prisma.material.create({
        data: {
          title: 'Video Material',
          type: 'VIDEO_LINK',
          courseId: courseId,
          content: 'https://www.youtube.com/watch?v=test'
        }
      });
      videoMaterialId = videoMaterial.id;
    });

    describe('Success Scenarios', () => {
      it('should list all materials for course owner (teacher)', async () => {
        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/materials`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(3);
      });

      it('should return empty array when no materials exist', async () => {
        // Arrange - Delete all materials
        await prisma.material.deleteMany({});

        // Act
        const response = await request(app)
          .get(`/api/courses/${courseId}/materials`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.data).toEqual([]);
      });
    });
  });

  describe('GET /api/materials/:id', () => {
    let materialId: string;

    beforeEach(async () => {
      // Create test material
      const material = await prisma.material.create({
        data: {
          title: 'Test Material',
          type: 'TEXT',
          courseId: courseId,
          content: '<p>Test content</p>'
        }
      });
      materialId = material.id;
    });

    describe('Success Scenarios', () => {
      it('should get material by ID', async () => {
        // Act
        const response = await request(app)
          .get(`/api/materials/${materialId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(materialId);
        expect(response.body.title).toBe('Test Material');
        expect(response.body.type).toBe('TEXT');
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when material does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .get(`/api/materials/${nonExistentId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });
  });

  describe('PUT /api/materials/:id/text', () => {
    let materialId: string;

    beforeEach(async () => {
      // Create test material
      const material = await prisma.material.create({
        data: {
          title: 'Original Title',
          type: 'TEXT',
          courseId: courseId,
          content: '<p>Original content</p>'
        }
      });
      materialId = material.id;
    });

    describe('Success Scenarios', () => {
      it('should update TEXT material', async () => {
        // Arrange
        const updateData = {
          title: 'Updated Title',
          content: '<p>Updated content</p>'
        };

        // Act
        const response = await request(app)
          .put(`/api/materials/${materialId}/text`)
          .set('Cookie', [`access_token=${teacherToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.id).toBe(materialId);
        expect(response.body.title).toBe('Updated Title');
        expect(response.body.content).toBe('<p>Updated content</p>');
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is a student', async () => {
        // Arrange
        const updateData = {
          title: 'Updated Title',
          content: '<p>Updated content</p>'
        };

        // Act
        const response = await request(app)
          .put(`/api/materials/${materialId}/text`)
          .set('Cookie', [`access_token=${studentToken}`])
          .send(updateData);

        // Assert
        assertAuthorizationError(response);
      });
    });
  });

  describe('DELETE /api/materials/:id', () => {
    let materialId: string;

    beforeEach(async () => {
      // Create test material
      const material = await prisma.material.create({
        data: {
          title: 'Material to Delete',
          type: 'TEXT',
          courseId: courseId,
          content: '<p>Content</p>'
        }
      });
      materialId = material.id;
    });

    describe('Success Scenarios', () => {
      it('should delete material', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/materials/${materialId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.message).toBe('Material deleted successfully');

        // Verify material is deleted
        const deletedMaterial = await prisma.material.findUnique({
          where: { id: materialId }
        });
        expect(deletedMaterial).toBeNull();
      });
    });

    describe('Authorization Errors', () => {
      it('should return 403 when user is a student', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/materials/${materialId}`)
          .set('Cookie', [`access_token=${studentToken}`]);

        // Assert
        assertAuthorizationError(response);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 when material does not exist', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const response = await request(app)
          .delete(`/api/materials/${nonExistentId}`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertNotFoundError(response);
      });
    });
  });

  describe('GET /api/materials/:id/download', () => {
    let materialId: string;
    let filePath: string;

    beforeEach(async () => {
      // Create actual file for download first with valid PDF content
      const fileStorage = container.resolve('IFileStorage') as LocalFileStorage;
      const validPdfBuffer = createValidPdfBuffer('test file content');
      const fileMetadata = await fileStorage.upload(validPdfBuffer, {
        originalName: 'download.pdf',
        mimeType: 'application/pdf',
        size: validPdfBuffer.length,
        directory: 'test'
      });
      filePath = fileMetadata.path;

      // Create test file material with the actual file path
      const material = await prisma.material.create({
        data: {
          title: 'Downloadable File',
          type: 'FILE',
          courseId: courseId,
          filePath: filePath,
          fileName: 'download.pdf',
          fileSize: validPdfBuffer.length,
          mimeType: 'application/pdf'
        }
      });
      materialId = material.id;
    });

    describe('Success Scenarios', () => {
      it('should download file material for course owner', async () => {
        // Act
        const response = await request(app)
          .get(`/api/materials/${materialId}/download`)
          .set('Cookie', [`access_token=${teacherToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.headers['content-type']).toBe('application/pdf');
      });
    });
  });

  describe('Middleware Integration', () => {
    describe('Authentication Middleware', () => {
      it('should protect all material endpoints with authentication', async () => {
        // Act - Test multiple endpoints without token
        const listResponse = await request(app).get(`/api/courses/${courseId}/materials`);
        const getResponse = await request(app).get('/api/materials/test-id');
        const postResponse = await request(app).post(`/api/courses/${courseId}/materials/text`).send({});
        const putResponse = await request(app).put('/api/materials/test-id/text').send({});
        const deleteResponse = await request(app).delete('/api/materials/test-id');
        const downloadResponse = await request(app).get('/api/materials/test-id/download');

        // Assert
        expect(listResponse.status).toBe(401);
        expect(getResponse.status).toBe(401);
        expect(postResponse.status).toBe(401);
        expect(putResponse.status).toBe(401);
        expect(deleteResponse.status).toBe(401);
        expect(downloadResponse.status).toBe(401);
      });
    });

    describe('Error Handler Middleware', () => {
      it('should not expose internal error details', async () => {
        // Act - Try to get non-existent material
        const response = await request(app)
          .get('/api/materials/00000000-0000-0000-0000-000000000000')
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
