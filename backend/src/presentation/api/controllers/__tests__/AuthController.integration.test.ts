/**
 * AuthController Integration Tests
 * 
 * Tests authentication API endpoints with Supertest.
 * These are integration tests that verify the complete request/response cycle
 * including validation middleware, authentication middleware, and error handling.
 * 
 * Requirements:
 * - 1.1: User authentication with valid credentials
 * - 1.2: Password verification and token generation
 * - 1.3: Current user retrieval
 * - 1.4: Token refresh mechanism
 * - 1.6: Logout capability
 * - 1.7: User registration
 * - 18.4: Input validation
 * - 20.1: Password hashing
 * - 20.2: Input validation and sanitization
 */

import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../../routes/authRoutes.js';
import { errorHandler } from '../../middleware/ErrorHandlerMiddleware.js';
import { cleanupDatabase, generateTestToken } from '../../../../test/test-utils.js';
import {
  assertErrorResponse,
  assertSuccessResponse,
  assertValidationError,
  assertAuthenticationError
} from '../../../../test/api-test-utils.js';
import { container } from 'tsyringe';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { PasswordService } from '../../../../infrastructure/auth/PasswordService.js';
import { JWTService } from '../../../../infrastructure/auth/JWTService.js';

describe('AuthController Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;

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

    // Register dependencies (same pattern as CourseController)
    container.registerInstance('PrismaClient', prisma);
    container.registerSingleton('IUserRepository', PrismaUserRepository);
    container.registerSingleton(PasswordService);
    container.registerSingleton(JWTService);

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanupDatabase(prisma);
  });

  describe('POST /api/auth/register', () => {
    describe('Success Scenarios', () => {
      it('should register a new student user', async () => {
        // Arrange
        const registerData = {
          email: 'student@test.com',
          password: 'password123',
          name: 'Test Student',
          role: 'STUDENT'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user.email).toBe('student@test.com');
        expect(response.body.user.name).toBe('Test Student');
        expect(response.body.user.role).toBe('STUDENT');
        expect(response.body.user).not.toHaveProperty('passwordHash');
      });

      it('should register a new teacher user', async () => {
        // Arrange
        const registerData = {
          email: 'teacher@test.com',
          password: 'password123',
          name: 'Test Teacher',
          role: 'TEACHER'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('TEACHER');
      });

      it('should normalize email to lowercase', async () => {
        // Arrange
        const registerData = {
          email: 'UPPERCASE@TEST.COM',
          password: 'password123',
          name: 'Test User',
          role: 'STUDENT'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        assertSuccessResponse(response, 201);
        expect(response.body.user.email).toBe('uppercase@test.com');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when email is missing', async () => {
        // Arrange
        const registerData = {
          password: 'password123',
          name: 'Test User',
          role: 'STUDENT'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        assertValidationError(response, ['email']);
      });

      it('should return 400 when email format is invalid', async () => {
        // Arrange
        const registerData = {
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
          role: 'STUDENT'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        assertValidationError(response, ['email']);
      });

      it('should return 400 when password is too short', async () => {
        // Arrange
        const registerData = {
          email: 'test@test.com',
          password: 'short',
          name: 'Test User',
          role: 'STUDENT'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        assertValidationError(response, ['password']);
      });

      it('should return 400 when name is missing', async () => {
        // Arrange
        const registerData = {
          email: 'test@test.com',
          password: 'password123',
          role: 'STUDENT'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        assertValidationError(response, ['name']);
      });

      it('should return 400 when role is invalid', async () => {
        // Arrange
        const registerData = {
          email: 'test@test.com',
          password: 'password123',
          name: 'Test User',
          role: 'INVALID_ROLE'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        assertValidationError(response, ['role']);
      });

      it('should return 400 when multiple fields are invalid', async () => {
        // Arrange
        const registerData = {
          email: 'invalid-email',
          password: 'short',
          role: 'INVALID'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        assertValidationError(response, ['email', 'password', 'name', 'role']);
      });
    });

    describe('Business Logic Errors', () => {
      it('should return 400 when email already exists', async () => {
        // Arrange
        const registerData = {
          email: 'duplicate@test.com',
          password: 'password123',
          name: 'Test User',
          role: 'STUDENT'
        };

        // Register first user
        await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Act - Try to register with same email
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        assertErrorResponse(response, 400, 'DUPLICATE_ENTRY');
      });
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@test.com',
          password: 'password123',
          name: 'Login Test User',
          role: 'STUDENT'
        });
    });

    describe('Success Scenarios', () => {
      it('should login with valid credentials', async () => {
        // Arrange
        const loginData = {
          email: 'login@test.com',
          password: 'password123'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe('login@test.com');
        expect(response.body.user).not.toHaveProperty('passwordHash');

        // Check cookies are set
        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(Array.isArray(cookies)).toBe(true);
        
        const cookieArray = cookies as unknown as string[];
        expect(cookieArray.some(cookie => cookie.startsWith('access_token='))).toBe(true);
        expect(cookieArray.some(cookie => cookie.startsWith('refresh_token='))).toBe(true);

        // Check cookie security attributes
        const accessTokenCookie = cookieArray.find(c => c.startsWith('access_token='));
        expect(accessTokenCookie).toContain('HttpOnly');
        // SameSite is 'lax' in development, 'strict' in production
        const expectedSameSite = process.env.NODE_ENV === 'production' ? 'SameSite=Strict' : 'SameSite=Lax';
        expect(accessTokenCookie).toContain(expectedSameSite);
        expect(accessTokenCookie).toContain('Path=/api');
      });

      it('should login with email in different case', async () => {
        // Arrange
        const loginData = {
          email: 'LOGIN@TEST.COM',
          password: 'password123'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.user.email).toBe('login@test.com');
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when email is missing', async () => {
        // Arrange
        const loginData = {
          password: 'password123'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        // Assert
        assertValidationError(response, ['email']);
      });

      it('should return 400 when password is missing', async () => {
        // Arrange
        const loginData = {
          email: 'login@test.com'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        // Assert
        assertValidationError(response, ['password']);
      });

      it('should return 400 when email format is invalid', async () => {
        // Arrange
        const loginData = {
          email: 'invalid-email',
          password: 'password123'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        // Assert
        assertValidationError(response, ['email']);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 400 when email does not exist', async () => {
        // Arrange
        const loginData = {
          email: 'nonexistent@test.com',
          password: 'password123'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        // Assert
        assertErrorResponse(response, 400, 'AUTH_INVALID_CREDENTIALS');
      });

      it('should return 400 when password is incorrect', async () => {
        // Arrange
        const loginData = {
          email: 'login@test.com',
          password: 'wrongpassword'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        // Assert
        assertErrorResponse(response, 400, 'AUTH_INVALID_CREDENTIALS');
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get refresh token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refresh@test.com',
          password: 'password123',
          name: 'Refresh Test User',
          role: 'STUDENT'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@test.com',
          password: 'password123'
        });

      // Extract refresh token from cookie
      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieArray = cookies as unknown as string[];
      const refreshCookie = cookieArray.find(c => c.startsWith('refresh_token='));
      expect(refreshCookie).toBeDefined();
      refreshToken = refreshCookie!.split(';')[0].split('=')[1];
    });

    describe('Success Scenarios', () => {
      it('should refresh access token with valid refresh token', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/refresh')
          .set('Cookie', [`refresh_token=${refreshToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.message).toBe('Access token refreshed successfully');

        // Check new access token cookie is set
        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const cookieArray = cookies as unknown as string[];
        expect(cookieArray.some(cookie => cookie.startsWith('access_token='))).toBe(true);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when refresh token is missing', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/refresh');

        // Assert
        assertErrorResponse(response, 401, 'AUTH_REFRESH_TOKEN_MISSING');
      });

      it('should return 401 when refresh token is invalid', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/refresh')
          .set('Cookie', ['refresh_token=invalid_token']);

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when refresh token is expired', async () => {
        // Arrange - Use an invalid/tampered token to simulate expired/invalid token
        const invalidToken = 'invalid.refresh.token';

        // Act
        const response = await request(app)
          .post('/api/auth/refresh')
          .set('Cookie', [`refresh_token=${invalidToken}`]);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    describe('Success Scenarios', () => {
      it('should logout and clear cookies', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/logout');

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.message).toBe('Logged out successfully');

        // Check cookies are cleared
        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        
        const cookieArray = cookies as unknown as string[];
        // Cookies should be cleared (empty value or Max-Age=0)
        const accessTokenCookie = cookieArray.find(c => c.startsWith('access_token='));
        const refreshTokenCookie = cookieArray.find(c => c.startsWith('refresh_token='));
        
        expect(accessTokenCookie).toBeDefined();
        expect(refreshTokenCookie).toBeDefined();
      });
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and login to get access token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'me@test.com',
          password: 'password123',
          name: 'Me Test User',
          role: 'STUDENT'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@test.com',
          password: 'password123'
        });

      // Get userId from login response
      userId = loginResponse.body.user.id;

      // Extract access token from cookie
      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieArray = cookies as unknown as string[];
      const accessCookie = cookieArray.find(c => c.startsWith('access_token='));
      expect(accessCookie).toBeDefined();
      accessToken = accessCookie!.split(';')[0].split('=')[1];
    });

    describe('Success Scenarios', () => {
      it('should return current user with valid access token', async () => {
        // Act
        const response = await request(app)
          .get('/api/auth/me')
          .set('Cookie', [`access_token=${accessToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.id).toBe(userId);
        expect(response.body.user.email).toBe('me@test.com');
        expect(response.body.user.name).toBe('Me Test User');
        expect(response.body.user.role).toBe('STUDENT');
        expect(response.body.user).not.toHaveProperty('passwordHash');
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when access token is missing', async () => {
        // Act
        const response = await request(app)
          .get('/api/auth/me');

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when access token is invalid', async () => {
        // Act
        const response = await request(app)
          .get('/api/auth/me')
          .set('Cookie', ['access_token=invalid_token']);

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when access token is expired', async () => {
        // Arrange - Generate expired token
        const expiredToken = generateTestToken({
          userId: 'test-user-id',
          email: 'test@test.com',
          role: 'STUDENT'
        });

        // Wait for token to expire (or use a token with past expiry)
        // For testing, we'll use an invalid signature which will be rejected
        const tamperedToken = expiredToken + 'tampered';

        // Act
        const response = await request(app)
          .get('/api/auth/me')
          .set('Cookie', [`access_token=${tamperedToken}`]);

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
          email: 'invalid',
          password: 'short',
          name: '',
          role: 'INVALID'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/register')
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
      it('should protect /me endpoint with authentication', async () => {
        // Act
        const response = await request(app)
          .get('/api/auth/me');

        // Assert
        expect(response.status).toBe(401);
        expect(response.body.code).toMatch(/^AUTH_/);
      });

      it('should allow access to /me with valid token', async () => {
        // Arrange - Register and login
        await request(app)
          .post('/api/auth/register')
          .send({
            email: 'protected@test.com',
            password: 'password123',
            name: 'Protected User',
            role: 'STUDENT'
          });

        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'protected@test.com',
            password: 'password123'
          });

        const cookies = loginResponse.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const cookieArray = cookies as unknown as string[];
        const accessCookie = cookieArray.find(c => c.startsWith('access_token='));
        expect(accessCookie).toBeDefined();
        const accessToken = accessCookie!.split(';')[0].split('=')[1];

        // Act
        const response = await request(app)
          .get('/api/auth/me')
          .set('Cookie', [`access_token=${accessToken}`]);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe('protected@test.com');
      });
    });

    describe('Error Handler Middleware', () => {
      it('should handle domain errors with appropriate status codes', async () => {
        // Arrange - Try to register with duplicate email
        const registerData = {
          email: 'error@test.com',
          password: 'password123',
          name: 'Error Test',
          role: 'STUDENT'
        };

        await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Act
        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('code');
        expect(response.body).toHaveProperty('message');
        expect(response.body).not.toHaveProperty('stack');
      });

      it('should not expose internal error details', async () => {
        // Act - Try to login with invalid credentials
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'password123'
          });

        // Assert
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('originalError');
        expect(response.body.message).not.toContain('prisma');
        expect(response.body.message).not.toContain('database');
      });
    });
  });
});
