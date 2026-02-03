/**
 * UserController Integration Tests
 * 
 * Tests user profile management API endpoints with Supertest.
 * These are integration tests that verify the complete request/response cycle
 * including validation middleware, authentication middleware, and error handling.
 * 
 * Requirements:
 * - 1.1: View profile information
 * - 1.2: Edit name
 * - 1.3: Change password
 * - 2.2: Name validation (1-100 chars after trim)
 * - 2.3: Password strength validation
 * - 2.4: Current password verification
 * - 4.1: API endpoints for profile operations
 * - 4.2: Authentication required
 */

import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import userRoutes from '../../routes/userRoutes.js';
import authRoutes from '../../routes/authRoutes.js';
import { errorHandler } from '../../middleware/ErrorHandlerMiddleware.js';
import { cleanupDatabase, getTestPrismaClient } from '../../../../test/test-utils.js';
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

/**
 * Helper function to generate unique email for tests
 */
function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@test.com`;
}

describe('UserController Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Create Prisma client for this test suite
    prisma = getTestPrismaClient();

    // Register dependencies
    container.registerInstance('PrismaClient', prisma);
    container.registerSingleton('IUserRepository', PrismaUserRepository);
    container.registerSingleton(PasswordService);
    container.registerSingleton(JWTService);

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use(errorHandler);
  }, 30000);

  afterAll(async () => {
    // Disconnect Prisma client after all tests
    await prisma.$disconnect();
  }, 30000);

  beforeEach(async () => {
    // Clean database before each test
    await cleanupDatabase(prisma);
  }, 30000);

  /**
   * Helper function to register and login a test user
   */
  async function registerAndLogin(email: string, password: string, name: string, role: 'STUDENT' | 'TEACHER' = 'STUDENT') {
    // Register
    await request(app)
      .post('/api/auth/register')
      .send({ email, password, name, role });

    // Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    // Extract access token from cookie
    const cookies = loginResponse.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieArray = cookies as unknown as string[];
    const accessCookie = cookieArray.find(c => c.startsWith('access_token='));
    expect(accessCookie).toBeDefined();
    const accessToken = accessCookie!.split(';')[0].split('=')[1];

    return { accessToken, userId: loginResponse.body.user.id };
  }

  describe('GET /api/users/profile', () => {
    describe('Success Scenarios', () => {
      it('should return current user profile with valid authentication', async () => {
        // Arrange
        const email = uniqueEmail('profile');
        const { accessToken } = await registerAndLogin(
          email,
          'password123',
          'Profile Test User'
        );

        // Act
        const response = await request(app)
          .get('/api/users/profile')
          .set('Cookie', [`access_token=${accessToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('profile');
        expect(response.body.profile).toHaveProperty('id');
        expect(response.body.profile.email).toBe(email);
        expect(response.body.profile.name).toBe('Profile Test User');
        expect(response.body.profile.role).toBe('STUDENT');
        expect(response.body.profile).toHaveProperty('createdAt');
        expect(response.body.profile).toHaveProperty('updatedAt');
        expect(response.body.profile).not.toHaveProperty('passwordHash');
      });

      it('should return teacher profile correctly', async () => {
        // Arrange
        const email = uniqueEmail('teacher');
        const { accessToken } = await registerAndLogin(
          email,
          'password123',
          'Teacher User',
          'TEACHER'
        );

        // Act
        const response = await request(app)
          .get('/api/users/profile')
          .set('Cookie', [`access_token=${accessToken}`]);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.profile.role).toBe('TEACHER');
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when not authenticated', async () => {
        // Act
        const response = await request(app)
          .get('/api/users/profile');

        // Assert
        assertAuthenticationError(response);
      });

      it('should return 401 when access token is invalid', async () => {
        // Act
        const response = await request(app)
          .get('/api/users/profile')
          .set('Cookie', ['access_token=invalid_token']);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('PUT /api/users/profile', () => {
    describe('Success Scenarios', () => {
      it('should update user name successfully', async () => {
        // Arrange
        const email = uniqueEmail('update');
        const { accessToken } = await registerAndLogin(
          email,
          'password123',
          'Original Name'
        );

        const updateData = {
          name: 'Updated Name'
        };

        // Act
        const response = await request(app)
          .put('/api/users/profile')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('profile');
        expect(response.body.profile.name).toBe('Updated Name');
        expect(response.body.profile.email).toBe(email);
      });

      it('should trim whitespace from name', async () => {
        // Arrange
        const email = uniqueEmail('trim');
        const { accessToken } = await registerAndLogin(
          email,
          'password123',
          'Original Name'
        );

        const updateData = {
          name: '  Trimmed Name  '
        };

        // Act
        const response = await request(app)
          .put('/api/users/profile')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.profile.name).toBe('Trimmed Name');
      });

      it('should allow name with maximum length (100 chars)', async () => {
        // Arrange
        const email = uniqueEmail('maxlength');
        const { accessToken } = await registerAndLogin(
          email,
          'password123',
          'Original Name'
        );

        const longName = 'A'.repeat(100);
        const updateData = {
          name: longName
        };

        // Act
        const response = await request(app)
          .put('/api/users/profile')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(updateData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body.profile.name).toBe(longName);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when name is missing', async () => {
        // Arrange
        const email = uniqueEmail('missing');
        const { accessToken } = await registerAndLogin(
          email,
          'password123',
          'Original Name'
        );

        // Act
        const response = await request(app)
          .put('/api/users/profile')
          .set('Cookie', [`access_token=${accessToken}`])
          .send({});

        // Assert
        assertValidationError(response, ['name']);
      });

      it('should return 400 when name is empty after trim', async () => {
        // Arrange
        const email = uniqueEmail('empty');
        const { accessToken } = await registerAndLogin(
          email,
          'password123',
          'Original Name'
        );

        const updateData = {
          name: '   '
        };

        // Act
        const response = await request(app)
          .put('/api/users/profile')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['name']);
      });

      it('should return 400 when name exceeds 100 characters', async () => {
        // Arrange
        const email = uniqueEmail('toolong');
        const { accessToken } = await registerAndLogin(
          email,
          'password123',
          'Original Name'
        );

        const updateData = {
          name: 'A'.repeat(101)
        };

        // Act
        const response = await request(app)
          .put('/api/users/profile')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(updateData);

        // Assert
        assertValidationError(response, ['name']);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when not authenticated', async () => {
        // Arrange
        const updateData = {
          name: 'New Name'
        };

        // Act
        const response = await request(app)
          .put('/api/users/profile')
          .send(updateData);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('PUT /api/users/password', () => {
    describe('Success Scenarios', () => {
      it('should change password successfully with valid current password', async () => {
        // Arrange
        const email = uniqueEmail('changepass');
        const { accessToken } = await registerAndLogin(
          email,
          'OldPassword123!',
          'Change Password User'
        );

        const changePasswordData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        };

        // Act
        const response = await request(app)
          .put('/api/users/password')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(changePasswordData);

        // Assert
        assertSuccessResponse(response, 200);
        expect(response.body).toHaveProperty('result');
        expect(response.body.result.success).toBe(true);
        expect(response.body.result.message).toBe('Password changed successfully');

        // Verify can login with new password
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: email,
            password: 'NewPassword456!'
          });

        assertSuccessResponse(loginResponse, 200);
      });

      it('should not allow login with old password after change', async () => {
        // Arrange
        const email = uniqueEmail('oldpass');
        const { accessToken } = await registerAndLogin(
          email,
          'OldPassword123!',
          'Old Password User'
        );

        const changePasswordData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        };

        await request(app)
          .put('/api/users/password')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(changePasswordData);

        // Act - Try to login with old password
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: email,
            password: 'OldPassword123!'
          });

        // Assert
        assertErrorResponse(loginResponse, 400, 'AUTH_INVALID_CREDENTIALS');
      });

      it('should keep session valid after password change', async () => {
        // Arrange
        const email = uniqueEmail('session');
        const { accessToken } = await registerAndLogin(
          email,
          'OldPassword123!',
          'Session User'
        );

        const changePasswordData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        };

        await request(app)
          .put('/api/users/password')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(changePasswordData);

        // Act - Use same access token to get profile
        const profileResponse = await request(app)
          .get('/api/users/profile')
          .set('Cookie', [`access_token=${accessToken}`]);

        // Assert
        assertSuccessResponse(profileResponse, 200);
        expect(profileResponse.body.profile.email).toBe(email);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when current password is wrong', async () => {
        // Arrange
        const email = uniqueEmail('wrongpass');
        const { accessToken } = await registerAndLogin(
          email,
          'CorrectPassword123!',
          'Wrong Password User'
        );

        const changePasswordData = {
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        };

        // Act
        const response = await request(app)
          .put('/api/users/password')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(changePasswordData);

        // Assert
        assertErrorResponse(response, 400, 'INVALID_CURRENT_PASSWORD');
      });

      it('should return 400 when passwords do not match', async () => {
        // Arrange
        const email = uniqueEmail('mismatch');
        const { accessToken } = await registerAndLogin(
          email,
          'OldPassword123!',
          'Mismatch User'
        );

        const changePasswordData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'DifferentPassword456!'
        };

        // Act
        const response = await request(app)
          .put('/api/users/password')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(changePasswordData);

        // Assert
        assertValidationError(response, ['confirmPassword']);
      });

      it('should return 400 when new password is too short', async () => {
        // Arrange
        const email = uniqueEmail('short');
        const { accessToken } = await registerAndLogin(
          email,
          'OldPassword123!',
          'Short Password User'
        );

        const changePasswordData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'Short1!',
          confirmPassword: 'Short1!'
        };

        // Act
        const response = await request(app)
          .put('/api/users/password')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(changePasswordData);

        // Assert
        assertValidationError(response, ['newPassword']);
      });

      it('should return 400 when new password is same as current password', async () => {
        // Arrange
        const email = uniqueEmail('samepass');
        const { accessToken } = await registerAndLogin(
          email,
          'SamePassword123!',
          'Same Password User'
        );

        const changePasswordData = {
          currentPassword: 'SamePassword123!',
          newPassword: 'SamePassword123!',
          confirmPassword: 'SamePassword123!'
        };

        // Act
        const response = await request(app)
          .put('/api/users/password')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(changePasswordData);

        // Assert
        assertErrorResponse(response, 400, 'PASSWORD_REUSE_NOT_ALLOWED');
      });

      it('should return 400 when required fields are missing', async () => {
        // Arrange
        const email = uniqueEmail('missing');
        const { accessToken } = await registerAndLogin(
          email,
          'OldPassword123!',
          'Missing Fields User'
        );

        // Act
        const response = await request(app)
          .put('/api/users/password')
          .set('Cookie', [`access_token=${accessToken}`])
          .send({});

        // Assert
        assertValidationError(response, ['currentPassword', 'newPassword', 'confirmPassword']);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when not authenticated', async () => {
        // Arrange
        const changePasswordData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        };

        // Act
        const response = await request(app)
          .put('/api/users/password')
          .send(changePasswordData);

        // Assert
        assertAuthenticationError(response);
      });
    });
  });

  describe('Middleware Integration', () => {
    describe('Validation Middleware', () => {
      it('should return consistent validation error format for profile update', async () => {
        // Arrange
        const email = uniqueEmail('validation');
        const { accessToken } = await registerAndLogin(
          email,
          'password123',
          'Validation User'
        );

        const invalidData = {
          name: 'A'.repeat(101)
        };

        // Act
        const response = await request(app)
          .put('/api/users/profile')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('VALIDATION_FAILED');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('details');
        expect(typeof response.body.details).toBe('object');
      });

      it('should return consistent validation error format for password change', async () => {
        // Arrange
        const email = uniqueEmail('passvalidation');
        const { accessToken } = await registerAndLogin(
          email,
          'OldPassword123!',
          'Password Validation User'
        );

        const invalidData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'weak',
          confirmPassword: 'different'
        };

        // Act
        const response = await request(app)
          .put('/api/users/password')
          .set('Cookie', [`access_token=${accessToken}`])
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('VALIDATION_FAILED');
        expect(response.body).toHaveProperty('details');
      });
    });

    describe('Authentication Middleware', () => {
      it('should protect all profile endpoints with authentication', async () => {
        // Act - GET profile
        const getResponse = await request(app)
          .get('/api/users/profile');

        // Act - PUT profile
        const putResponse = await request(app)
          .put('/api/users/profile')
          .send({ name: 'New Name' });

        // Act - PUT password
        const passwordResponse = await request(app)
          .put('/api/users/password')
          .send({
            currentPassword: 'old',
            newPassword: 'new',
            confirmPassword: 'new'
          });

        // Assert
        expect(getResponse.status).toBe(401);
        expect(putResponse.status).toBe(401);
        expect(passwordResponse.status).toBe(401);
      });
    });

    describe('Error Handler Middleware', () => {
      it('should not expose internal error details', async () => {
        // Arrange
        const email = uniqueEmail('error');
        const { accessToken } = await registerAndLogin(
          email,
          'OldPassword123!',
          'Error User'
        );

        // Act - Try to change password with wrong current password
        const response = await request(app)
          .put('/api/users/password')
          .set('Cookie', [`access_token=${accessToken}`])
          .send({
            currentPassword: 'WrongPassword123!',
            newPassword: 'NewPassword456!',
            confirmPassword: 'NewPassword456!'
          });

        // Assert
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('originalError');
        expect(response.body.message).not.toContain('prisma');
        expect(response.body.message).not.toContain('database');
        expect(response.body.message).not.toContain('bcrypt');
      });
    });
  });
});
