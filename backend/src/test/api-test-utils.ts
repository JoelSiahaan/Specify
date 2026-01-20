/**
 * API Test Utilities
 * 
 * Helper functions for testing API endpoints with Supertest.
 */

import request from 'supertest';
import { Express } from 'express';
import { generateTestToken } from './test-utils.js';

/**
 * Create authenticated request helper
 */
export function createAuthenticatedRequest(app: Express, token: string) {
  return {
    get: (url: string) => request(app).get(url).set('Cookie', [`access_token=${token}`]),
    post: (url: string) => request(app).post(url).set('Cookie', [`access_token=${token}`]),
    put: (url: string) => request(app).put(url).set('Cookie', [`access_token=${token}`]),
    delete: (url: string) => request(app).delete(url).set('Cookie', [`access_token=${token}`]),
  };
}

/**
 * Create test user and get authentication token
 */
export function createTestUserToken(userId: string, email: string, role: 'STUDENT' | 'TEACHER'): string {
  return generateTestToken({ userId, email, role });
}

/**
 * Common test user tokens
 */
export const testTokens = {
  student: createTestUserToken('test-student-id', 'student@test.com', 'STUDENT'),
  teacher: createTestUserToken('test-teacher-id', 'teacher@test.com', 'TEACHER'),
};

/**
 * Assert API error response format
 */
export function assertErrorResponse(
  response: request.Response,
  expectedStatus: number,
  expectedCode: string
) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('code', expectedCode);
  expect(response.body).toHaveProperty('message');
  expect(typeof response.body.message).toBe('string');
}

/**
 * Assert API success response format
 */
export function assertSuccessResponse(
  response: request.Response,
  expectedStatus: number
) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
}

/**
 * Assert validation error response
 */
export function assertValidationError(
  response: request.Response,
  expectedFields?: string[]
) {
  expect(response.status).toBe(400);
  expect(response.body.code).toBe('VALIDATION_FAILED');
  expect(response.body).toHaveProperty('message');
  
  if (expectedFields) {
    expect(response.body).toHaveProperty('details');
    expectedFields.forEach(field => {
      expect(response.body.details).toHaveProperty(field);
    });
  }
}

/**
 * Assert authentication error
 */
export function assertAuthenticationError(response: request.Response) {
  expect(response.status).toBe(401);
  expect(response.body.code).toMatch(/^AUTH_/);
}

/**
 * Assert authorization error
 */
export function assertAuthorizationError(response: request.Response) {
  expect(response.status).toBe(403);
  expect(response.body.code).toMatch(/^(FORBIDDEN_|NOT_)/);
}

/**
 * Assert not found error
 */
export function assertNotFoundError(response: request.Response) {
  expect(response.status).toBe(404);
  expect(response.body.code).toMatch(/_NOT_FOUND$/);
}

/**
 * Create multipart form data for file uploads
 */
export function createFormData(fields: Record<string, any>) {
  return fields;
}

/**
 * Mock file for upload testing
 */
export const mockFile = {
  pdf: {
    buffer: Buffer.from('mock pdf content'),
    mimetype: 'application/pdf',
    originalname: 'test.pdf',
    size: 1024,
  },
  image: {
    buffer: Buffer.from('mock image content'),
    mimetype: 'image/jpeg',
    originalname: 'test.jpg',
    size: 2048,
  },
  docx: {
    buffer: Buffer.from('mock docx content'),
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    originalname: 'test.docx',
    size: 3072,
  },
};
